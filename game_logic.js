//★変更
window.addEventListener('DOMContentLoaded', () => {
  const missionClearBtn = document.getElementById('missionClearBtn');
  if (!missionClearBtn) return;

  const params = new URLSearchParams(location.search);
  const productUrl = params.get('product');        // 元のAmazon URL

  // 商品ごとのキー（/dp/ASIN を優先）
  const getProductKey = (url) => {
    const m = url?.match(/\/dp\/([A-Z0-9]{10})/i);
    return m ? m[1] : url; // 見つからなければURL全体をキーに
  };
  const productKey = getProductKey(productUrl);

  missionClearBtn.addEventListener('click', () => {
    if (!productUrl) {
      alert('元のAmazonページが見つかりませんでした。');
      return;
    }
    // { cleared: { [productKey]: timestamp } } という形で保存
    chrome.storage.local.get({ cleared: {} }, (store) => {
      const cleared = store.cleared;
      cleared[productKey] = Date.now();
      chrome.storage.local.set({ cleared }, () => {
        // 元のページへ戻る
        location.href = productUrl;
      });
    });
  });
});