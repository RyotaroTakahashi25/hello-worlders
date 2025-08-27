window.addEventListener('DOMContentLoaded', () => {
  const missionClearBtn = document.getElementById('missionClearBtn');

  // 1. このページのURLから、元のAmazon商品ページのURLを取得します
  const params = new URLSearchParams(window.location.search);
  const productUrl = params.get('product');

  missionClearBtn.addEventListener('click', () => {
    if (!productUrl) {
      alert('元のAmazonページが見つかりませんでした。');
      return;
    }

    // 2. 拡張機能が再度ポップアップを出さないように「ミッション完了」の目印を保存します
    chrome.storage.local.set({ afterMission: true }, () => {
      // 3. 元のAmazon商品ページに戻ります
      window.location.href = productUrl;
    });
  });
});