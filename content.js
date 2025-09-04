//★追加、GSAPの読み込み用
(function ensureGSAP() {
  if (typeof gsap === "undefined") {
    console.warn("[dice-mission] GSAPが未ロードです。manifestのjs順序を確認してください。");
  }
})();

// ★追加: 商品キーを作る関数（/dp/ASIN を優先、無ければパスで代用）
const getProductKey = (url) => {
  try {
    const m = url.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m) return m[1];
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
};

// ★追加: クリア済みチェック（chrome.storage.local）。使えない場合は旧sessionStorageへフォールバック
function isProductCleared(url) {
  const key = getProductKey(url);
  return new Promise((resolve) => {
    try {
      if (!chrome?.storage?.local) throw new Error("no chrome.storage");
      chrome.storage.local.get({ cleared: {} }, ({ cleared }) => {
        resolve(!!cleared[key]);
      });
    } catch (e) {
      resolve(sessionStorage.getItem("clearedUrl") === url);
    }
  });
}

// ----- スタイル -----
const style = document.createElement("style");
style.textContent = `
/* ★追加: 3D感を強める */
#dice-overlay { perspective: 800px; }

.speech-bubble {
  position: absolute;
  background: #fff;
  border-radius: .4em;
  padding: 1em;
  max-width: 250px;
  font-size: 14px;
  text-align: center;
  z-index: 10001;
}
#dice-overlay button {
  margin: 5px;
  padding: 5px 10px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}
#dice-overlay button:hover {
  background-color: #eee;
}
.dice {
  width: 120px;
  height: 120px;
  background: #fff;
  border: 2px solid #ccc;
  border-radius: 8px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform-style: preserve-3d;
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 10000;
}
.dice-face {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #999;
  border-radius: 8px;
  overflow: hidden;
}
.dice-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: white; /* 貧乏神の余白だけ白く */
}
/* メーターのスタイル */
.savings-meter-container {
  display: none; /* デフォルトで非表示 */
  flex-direction: column;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黒色 */
  border-radius: 10px;
  padding: 10px 15px;
  color: white;
  font-family: sans-serif;
  width: 250px; /* ポップアップの幅に合わせる */
  z-index: 10002; /* 吹き出しよりZ-indexを高く */
  position: absolute; /* absoluteで配置 */
}
.meter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 5px;
}
.meter-title {
    font-size: 14px;
    font-weight: bold;
}
.meter-icon {
    width: 30px;
    height: 30px;
    margin-left: 10px;
}
.meter-bar {
    width: 100%;
    height: 15px;
    display: flex;
    border-radius: 5px;
    overflow: hidden;
    background-color: #ccc;
}
.meter-segment {
    flex-grow: 1;
    height: 100%;
}
`;
document.head.appendChild(style);

// ----- キャラ定義 -----
const characters = [
  { name: "大貧乏神", face: chrome.runtime.getURL("images/face_strong.jpg"), lines: ["我が現れし時、汝の運命は決した！","ククク…愚かなる挑戦者よ、覚悟はあるか？","よかろう、我を倒してみよ！"] },
  { name: "小貧乏神1", face: chrome.runtime.getURL("images/face_mid1.jpg"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "小貧乏神2", face: chrome.runtime.getURL("images/face_mid2.jpg"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "見習い貧乏神1", face: chrome.runtime.getURL("images/face_weak1.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "見習い貧乏神2", face: chrome.runtime.getURL("images/face_weak2.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "見習い貧乏神3", face: chrome.runtime.getURL("images/face_weak3.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  // ★追加: キングボンビーの定義
  { name: "キングボンビー", face: chrome.runtime.getURL("images/face_strong.jpg"), lines: ["買い物カゴは、お前の欲望の墓場じゃ！罰として、200文字で今日買ったものの必要性を説明し、反省文を提出するんじゃな！ワッハッハ！"] }
];

// ----- オーバーレイ作成 -----
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "dice-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 9999;
  document.body.appendChild(overlay);
  return overlay;
}

// ----- サイコロ作成 -----
function createDice(overlay) {
  const dice = document.createElement("div");
  dice.className = "dice";

  const t = 60; // サイコロ半分サイズ
  // キングボンビーはサイコロの面から除外するため、characters.slice(0, 6)を使用
  characters.slice(0, 6).forEach((char, i) => {
    const face = document.createElement("div");
    face.className = "dice-face";
    const img = document.createElement("img");
    img.src = char.face;
    face.appendChild(img);

    switch(i) {
      case 0: face.style.transform = `rotateY(0deg) translateZ(${t}px)`; break;
      case 1: face.style.transform = `rotateY(90deg) translateZ(${t}px)`; break;
      case 2: face.style.transform = `rotateY(180deg) translateZ(${t}px)`; break;
      case 3: face.style.transform = `rotateY(-90deg) translateZ(${t}px)`; break;
      case 4: face.style.transform = `rotateX(90deg) translateZ(${t}px)`; break;
      case 5: face.style.transform = `rotateX(-90deg) translateZ(${t}px)`; break;
    }

    dice.appendChild(face);
  });

  overlay.appendChild(dice);
  return dice;
}

// ----- サイコロ振るアニメーション -----
function rollDiceAnimation(dice, overlay) {
  const roll = Math.floor(Math.random() * 6);
  const finalRot = [
    {x: 0,   y: 0},
    {x: 0,   y: 90},
    {x: 0,   y: 180},
    {x: 0,   y: -90},
    {x: -90, y: 0},
    {x: 90,  y: 0},
  ];
  const target = finalRot[roll];

  const randSpinX = Math.floor(Math.random() * 4 + 1) * 360;
  const randSpinY = Math.floor(Math.random() * 4 + 1) * 360;

  gsap.to(dice, {
    rotationX: "+=" + (randSpinX + target.x),
    rotationY: "+=" + (randSpinY + target.y),
    duration: 3,
    ease: "back.out(2)",
    onComplete: () => {
      showCharacterFace(overlay, roll);
      gsap.to(dice, { opacity: 0, scale: 0, duration: 0.5, delay: 0.5, onComplete: () => dice.remove() });
    }
  });
}

// ----- キャラ登場 -----
function showCharacterFace(overlay, roll) {
  const character = characters[roll];

  const img = document.createElement("img");
  img.src = character.face;
  img.style.position = "absolute";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%, -50%)";
  img.style.width = "250px";
  img.style.zIndex = 10000;
  img.style.opacity = 0;

  overlay.appendChild(img);

  gsap.fromTo(img,
    { scale: 0, opacity: 0 },
    { scale: 1.2, opacity: 1, duration: 0.8, ease: "back.out(2)" }
  );

  setTimeout(() => showCharacterDialog(overlay, character, img, roll), 1000);
}

// ★修正: showCharacterDialogにrollを追加して、キングボンビーの吹き出しを表示
function showCharacterDialog(overlay, character, imgElement, roll) {
  const dialog = document.createElement("div");
  dialog.className = "speech-bubble";
  const line = character.lines[Math.floor(Math.random() * character.lines.length)];
  dialog.textContent = `${character.name}: ${line}`;

  const imgRect = imgElement.getBoundingClientRect();
  dialog.style.left = imgRect.right + 20 + "px";
  dialog.style.top = imgRect.top + "px";

  // キングボンビーの場合は、ボタンのテキストと動作を変更
  if (character.name === "キングボンビー") {
    const okBtn = document.createElement("button");
    okBtn.textContent = "わかった！";
    okBtn.onclick = () => {
      overlay.remove();
    };
    dialog.appendChild(document.createElement("br"));
    dialog.appendChild(okBtn);
  } else {
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "はい";
    yesBtn.onclick = () => {
      chrome.storage.local.get(['meterLevel'], (result) => {
        let currentLevel = result.meterLevel || 0;
        currentLevel++;
        chrome.storage.local.set({ meterLevel: currentLevel }, () => {
          updateSavingsMeter(currentLevel);
          
          if (currentLevel >= 4) { // 4回目でキングボンビー
              checkKingBonbi(overlay, currentLevel);
          } else {
              const productUrl = window.location.href;
              window.location.href = chrome.runtime.getURL(`index.html?product=${encodeURIComponent(productUrl)}`);
          }
        });
      });
    };

    const noBtn = document.createElement("button");
    noBtn.textContent = "いいえ";
    noBtn.onclick = () => { 
      chrome.storage.local.get(['meterLevel'], (result) => {
        let currentLevel = result.meterLevel || 0;
        currentLevel++;
        chrome.storage.local.set({ meterLevel: currentLevel }, () => {
          updateSavingsMeter(currentLevel); 
          
          if (currentLevel >= 4) { // 4回目でキングボンビー
              checkKingBonbi(overlay, currentLevel);
          } else {
              overlay.remove();
          }
        });
      });
    };

    dialog.appendChild(document.createElement("br"));
    dialog.appendChild(yesBtn);
    dialog.appendChild(noBtn);
  }

  overlay.appendChild(dialog);
  gsap.fromTo(dialog, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });

  const meterContainer = document.getElementById('savings-meter-container');
  chrome.storage.local.get(['meterLevel'], (result) => {
    const currentLevel = result.meterLevel || 0;
    if (currentLevel > 0) {
      meterContainer.style.display = 'flex';
      const dialogRect = dialog.getBoundingClientRect();
      meterContainer.style.left = dialogRect.left + "px";
      meterContainer.style.top = (dialogRect.bottom + 10) + "px";
    } else {
        meterContainer.style.display = 'none';
    }
    updateSavingsMeter(currentLevel);
  });
}

// ★追加: キングボンビー登場をチェックする関数
function checkKingBonbi(overlay, level) {
  if (level >= 4) {
    chrome.storage.local.set({ meterLevel: 0 }, () => {
      updateSavingsMeter(0); // メーターをリセット
      const kingBonbi = characters[6]; // キングボンビー
      const img = document.createElement("img");
      img.src = kingBonbi.face;
      img.style.position = "absolute";
      img.style.top = "50%";
      img.style.left = "50%";
      img.style.transform = "translate(-50%, -50%)";
      img.style.width = "250px";
      img.style.zIndex = 10000;
      img.style.opacity = 0;
      overlay.appendChild(img);
      gsap.fromTo(img,
          { scale: 0, opacity: 0 },
          { scale: 1.2, opacity: 1, duration: 0.8, ease: "back.out(2)" }
      );
      setTimeout(() => showCharacterDialog(overlay, kingBonbi, img), 1000);
    });
  }
}

// 節約メーター作成関数
function createSavingsMeter() {
    let popup = document.getElementById('savings-meter-container');
    if (popup) return popup;

    popup = document.createElement('div');
    popup.className = 'savings-meter-container';
    popup.id = 'savings-meter-container';

    const header = document.createElement('div');
    header.className = 'meter-header';

    const title = document.createElement('div');
    title.className = 'meter-title';
    title.textContent = '浪費額メーター';

    const icon = document.createElement('img');
    icon.className = 'meter-icon';
    icon.src = chrome.runtime.getURL('images/face_weak1.jpg');

    header.appendChild(title);
    header.appendChild(icon);

    const meterBar = document.createElement('div');
    meterBar.className = 'meter-bar';
    meterBar.id = 'savings-meter-bar';

    for (let i = 0; i < 4; i++) {
        const segment = document.createElement('div');
        segment.className = 'meter-segment';
        segment.id = `segment-${i + 1}`;
        meterBar.appendChild(segment);
    }

    popup.appendChild(header);
    popup.appendChild(meterBar);

    document.body.appendChild(popup);
    return popup;
}

// メーター更新関数
function updateSavingsMeter(level) {
    const segments = document.querySelectorAll('.meter-segment');
    segments.forEach((segment, index) => {
        if (index < level) {
            switch(index) {
                case 0:
                    segment.style.backgroundColor = 'rgba(152, 251, 152, 0.8)';
                    break;
                case 1:
                    segment.style.backgroundColor = 'rgba(255, 255, 153, 0.8)';
                    break;
                case 2:
                    segment.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
                    break;
                case 3:
                    segment.style.backgroundColor = 'rgba(255, 102, 102, 0.8)';
                    break;
            }
        } else {
            segment.style.backgroundColor = 'rgba(204, 204, 204, 0.8)';
        }
    });
}

// ----- 流れ開始 ----
function initDiceFlow() {
  const overlay = createOverlay();
  const dice = createDice(overlay);
  rollDiceAnimation(dice, overlay);
}

// ----- ボタン監視 ----
function attachListeners() {
  createSavingsMeter(); 
  
  const observer = new MutationObserver(() => {
    // 両方のボタンを監視するようにセレクターを修正
    const cartBtn = document.querySelector("#add-to-cart-button, #desktop-buybox-add-to-cart-button");
    const buyBtn = document.querySelector("#buy-now-button");

    [cartBtn, buyBtn].forEach(btn => {
      if (btn && !btn.dataset.diceAttached) {
        btn.dataset.diceAttached = "true";
        const productUrl = window.location.href;

        isProductCleared(productUrl).then((cleared) => {
          if (!cleared) {
            btn.addEventListener("click", (e) => {
              e.preventDefault(); // デフォルトの動作をキャンセル
              initDiceFlow(); // ミッションを開始
            });
          } else {
            // クリア済みなら何もせず通常動作
          }
        });
      }
    });
  });
  // ページ全体を監視
  observer.observe(document.body, { childList: true, subtree: true });
}

attachListeners();