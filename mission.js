window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("clearMission");
  btn.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const product = params.get("product");

    // ミッションクリア → 元ページに戻るときは拡張機能をスキップさせるフラグ
    chrome.storage.local.set({ afterMission: true }, () => {
      window.location.href = product; // 元ページに戻る
    });
  });
});