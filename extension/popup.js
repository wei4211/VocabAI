const API_URL_DEFAULT = "https://vocabai-backend.onrender.com";

let apiUrl = API_URL_DEFAULT;
let token = null;
let userData = null;

// 初始化
async function init() {
  const stored = await chrome.storage.local.get(["token", "apiUrl", "user"]);
  apiUrl = stored.apiUrl || API_URL_DEFAULT;
  token = stored.token || null;
  userData = stored.user || null;

  document.getElementById("api-url").value = apiUrl;

  if (token && userData) {
    showMain();
  } else {
    showLogin();
  }

  // 監聽背景傳來的訊息（右鍵新增成功）
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "WORD_SAVED") {
      showStatus("main-status", msg.message, "success");
    }
  });
}

function showLogin() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("main-section").style.display = "none";
}

function showMain() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("main-section").style.display = "block";

  if (userData) {
    document.getElementById("username").textContent = userData.username;
    document.getElementById("user-email").textContent = userData.email;
    document.getElementById("avatar").textContent = userData.username[0].toUpperCase();
  }
}

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `status ${type}`;
  setTimeout(() => { el.className = "status"; }, 3000);
}

// 登入
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  apiUrl = document.getElementById("api-url").value.trim() || API_URL_DEFAULT;

  if (!email || !password) {
    showStatus("login-status", "請輸入 Email 和密碼", "error");
    return;
  }

  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "登入中...";

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      token = data.access_token;
      userData = data.user;
      await chrome.storage.local.set({ token, apiUrl, user: userData });
      showMain();
    } else {
      showStatus("login-status", data.detail || "登入失敗", "error");
    }
  } catch (e) {
    showStatus("login-status", "無法連線到 VocabAI，請確認 API 位址", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "登入";
  }
});

// 手動新增單字
document.getElementById("add-btn").addEventListener("click", async () => {
  const word = document.getElementById("word-input").value.trim();
  if (!word) return;

  const btn = document.getElementById("add-btn");
  btn.disabled = true;
  btn.textContent = "...";

  try {
    const res = await fetch(`${apiUrl}/api/extensions/save-word`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ word: word.toLowerCase(), context: "" }),
    });

    const data = await res.json();

    if (res.ok) {
      const msg = data.message === "Word already exists"
        ? `「${word}」已在單字庫中`
        : `「${word}」已加入單字庫 ✓`;
      showStatus("main-status", msg, "success");
      document.getElementById("word-input").value = "";
    } else if (res.status === 401) {
      showStatus("main-status", "登入已過期，請重新登入", "error");
      await chrome.storage.local.clear();
      showLogin();
    } else {
      showStatus("main-status", data.detail || "新增失敗", "error");
    }
  } catch (e) {
    showStatus("main-status", "連線失敗", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "新增";
  }
});

// Enter 鍵送出
document.getElementById("word-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add-btn").click();
});

document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("login-btn").click();
});

// 登出
document.getElementById("logout-btn").addEventListener("click", async () => {
  await chrome.storage.local.clear();
  token = null;
  userData = null;
  showLogin();
});

init();
