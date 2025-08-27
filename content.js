// ----------------------------
// ボタン動的生成対応
// ----------------------------
function waitForButton(selector, callback) {
  const btn = document.querySelector(selector);
  if (btn) return callback(btn);

  const observer = new MutationObserver(() => {
    const btn = document.querySelector(selector);
    if (btn) {
      callback(btn);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ----------------------------
// ポップアップ表示関数
// ----------------------------
function createPopup(message, yesCallback, noCallback) {
  const popup = document.createElement("div");
  popup.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 2px solid #333;
    padding: 12px;
    border-radius: 8px;
    z-index: 9999;
    font-family: sans-serif;
    text-align: center;
  `;
  popup.innerHTML = `
    <p>${message}</p>
    <button id="yes">はい</button>
    <button id="no">いいえ</button>
  `;
  document.body.appendChild(popup);

  document.getElementById("yes").addEventListener("click", () => {
    yesCallback && yesCallback();
    popup.remove();
  });

  document.getElementById("no").addEventListener("click", () => {
    noCallback && noCallback();
    popup.remove();
  });
}

// ----------------------------
// ミッション後フラグ
chrome.storage.local.get("afterMission", (data) => {
  const isAfterMission = data.afterMission;

  // 元ページでafterMissionフラグがあれば監視しない
  if (isAfterMission) {
    chrome.storage.local.remove("afterMission");
    return;
  }

  // ----------------------------
  // 通常時のボタン監視
  function interceptClick(selector, action) {
    waitForButton(selector, (btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        createPopup("ミッションに挑戦しますか？",
          () => {
            const missionUrl = chrome.runtime.getURL("mission.html") +
              `?action=${action}&product=${encodeURIComponent(location.href)}`;
            window.location.href = missionUrl;
          },
          () => {
            // 「いいえ」の場合、元ボタンのデフォルト動作を手動で発火
            btn.click();
          }
        );
      });
    });
  }

  interceptClick("#add-to-cart-button", "cart");
  interceptClick("#buy-now-button", "buy");
});