// 建立右鍵選單
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToVocabAI",
    title: '加入 VocabAI：「%s」',
    contexts: ["selection"],
  });
});

// 右鍵點擊事件
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "addToVocabAI") return;

  const word = info.selectionText.trim();
  if (!word) return;

  const { token, apiUrl } = await chrome.storage.local.get(["token", "apiUrl"]);

  if (!token) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
    return;
  }

  const url = (apiUrl || "http://localhost:8080") + "/api/extensions/save-word";

  try {
    const res = await fetch(url, {
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

      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);

      // 通知 popup 更新
      chrome.runtime.sendMessage({ type: "WORD_SAVED", word, message: msg }).catch(() => {});
    } else {
      chrome.action.setBadgeText({ text: "✗" });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
    }
  } catch (e) {
    console.error("VocabAI error:", e);
  }
});
