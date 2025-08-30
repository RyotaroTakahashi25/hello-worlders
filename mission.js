window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("missionClearBtn"); // ←ボタンのID修正
  if (!btn) return; // ボタンが無ければ終了

  btn.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");

    if (product) {
      // 🔑 ミッションクリア → 元ページ戻るときはフラグを保存
      chrome.storage.local.set({ afterMission: true }, () => {
        window.location.href = product; // 元ページに戻る
      });
    } else {
      alert("元のページURLが見つかりません！");
    }
  });
});