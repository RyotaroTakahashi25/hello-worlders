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
  // 節約額メーター機能 (ここから追加)
  // ----------------------------
  let totalSavings = 0;

  // 節約額をchrome.storageから取得
  chrome.storage.local.get(['totalSavings'], function(result) {
    if (result.totalSavings) {
      totalSavings = result.totalSavings;
    }
    displaySavingsMeter();
  });

  // 貧乏神アイコンと節約額メーターのUIを作成し、ページに追加
  function displaySavingsMeter() {
    const existingMeter = document.getElementById('binbougami-meter');
    if (existingMeter) {
      existingMeter.remove();
    }

    const meterContainer = document.createElement('div');
    meterContainer.id = 'binbougami-meter';
    meterContainer.className = 'binbougami-meter';

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('images/binbougami_icon.png');
    icon.className = 'binbougami-icon';
    icon.alt = '貧乏神';

    const counter = document.createElement('span');
    counter.id = 'savings-counter';
    counter.className = 'savings-counter';
    counter.textContent = `節約額: ¥${totalSavings.toLocaleString()}`;

    meterContainer.appendChild(icon);
    meterContainer.appendChild(counter);
    document.body.appendChild(meterContainer);
  }

  // 節約額を更新し、メーター表示も更新
  function updateSavings(amount) {
    totalSavings += amount;
    chrome.storage.local.set({ 'totalSavings': totalSavings }, function() {
      const counter = document.getElementById('savings-counter');
      if (counter) {
        counter.textContent = `節約額: ¥${totalSavings.toLocaleString()}`;
      }
    });
  }

  // 商品の金額を取得する関数
  function getProductPrice() {
    const priceElement = document.querySelector('.a-price-whole');
    if (priceElement) {
      const priceText = priceElement.textContent.replace(/[^0-9]/g, '');
      return parseInt(priceText, 10);
    }
    return 0;
  }

  // ----------------------------
  // 通常時のボタン監視 (既存のコードを修正)
  // ----------------------------
  function interceptClick(selector, action) {
    waitForButton(selector, (btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        createPopup("ミッションに挑戦しますか？",
          () => {
            const missionUrl = chrome.runtime.getURL("index.html") +
              `?action=${action}&product=${encodeURIComponent(location.href)}`;
            window.location.href = missionUrl;
          },
          () => {
            // ここに「いいえ」が押された時の節約額更新ロジックを追加
            const productPrice = getProductPrice();
            if (productPrice > 0) {
              updateSavings(productPrice);
            }
          });
      });
    });
  }

  // 購入ボタンを監視
  interceptClick("#add-to-cart-button", "cart");
  interceptClick("#buy-now-button", "buy");

});