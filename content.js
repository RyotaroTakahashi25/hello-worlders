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
`;
document.head.appendChild(style);

// ----- キャラ定義 -----
const characters = [
  { name: "大貧乏神", face: chrome.runtime.getURL("images/face_strong.jpg"), lines: ["我が現れし時、汝の運命は決した！","ククク…愚かなる挑戦者よ、覚悟はあるか？","よかろう、我を倒してみよ！"] },
  { name: "小貧乏神1", face: chrome.runtime.getURL("images/face_mid1.jpg"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "小貧乏神2", face: chrome.runtime.getURL("images/face_mid2.jpg"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "見習い貧乏神1", face: chrome.runtime.getURL("images/face_weak1.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "見習い貧乏神2", face: chrome.runtime.getURL("images/face_weak2.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "見習い貧乏神3", face: chrome.runtime.getURL("images/face_weak3.jpg"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] }
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
  overlay.style.flexDirection = "column";
  overlay.style.zIndex = 9999;
  document.body.appendChild(overlay);
  return overlay;
}

// ----- サイコロ作成 -----
function createDice(overlay) {
  const dice = document.createElement("div");
  dice.className = "dice";

  const t = 60; // サイコロ半分サイズ
  characters.forEach((char, i) => {
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
    {x: 0,   y: -90},
    {x: 0,   y: 180},
    {x: 0,   y: 90},
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
  img.style.position = "fixed";
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

  setTimeout(() => showCharacterDialog(overlay, character, img), 1000);
}

// ----- 吹き出し -----
function showCharacterDialog(overlay, character, imgElement) {
  const dialog = document.createElement("div");
  dialog.className = "speech-bubble";
  const line = character.lines[Math.floor(Math.random() * character.lines.length)];
  dialog.textContent = `${character.name}: ${line}`;

  const rect = imgElement.getBoundingClientRect();
  dialog.style.left = rect.right + 20 + "px";
  dialog.style.top = rect.top + "px";

  const yesBtn = document.createElement("button");
  yesBtn.textContent = "はい";
  yesBtn.onclick = () => { 
    const productUrl = window.location.href;
    window.location.href = chrome.runtime.getURL(`index.html?product=${encodeURIComponent(productUrl)}`);
  };

  const noBtn = document.createElement("button");
  noBtn.textContent = "いいえ";
  noBtn.onclick = () => { overlay.remove(); };

  dialog.appendChild(document.createElement("br"));
  dialog.appendChild(yesBtn);
  dialog.appendChild(noBtn);

  overlay.appendChild(dialog);
  gsap.fromTo(dialog, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });
}

// ----- 流れ開始 -----
function initDiceFlow() {
  const overlay = createOverlay();
  const dice = createDice(overlay);
  rollDiceAnimation(dice, overlay);
}

// ----- ボタン監視 -----
function attachListeners() {
  const observer = new MutationObserver(() => {
    const cartBtn = document.getElementById("add-to-cart-button");
    const buyBtn = document.getElementById("buy-now-button");

    // ★変更: ここから（クリア済み判定を chrome.storage.local で行う）
    [cartBtn, buyBtn].forEach(btn => {
      if (btn && !btn.dataset.diceAttached) {
        btn.dataset.diceAttached = "true";
        const productUrl = window.location.href;

        // 旧: sessionStorage 直接比較 → 新: 非同期でストレージ確認
        isProductCleared(productUrl).then((cleared) => {
          if (!cleared) {
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              initDiceFlow();
            });
          } else {
            // クリア済みなら何もせず通常動作
          }
        });
      }
    });
    // ★変更: ここまで

  });
  observer.observe(document.body, { childList: true, subtree: true });
}

attachListeners();