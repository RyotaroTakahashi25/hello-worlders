
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
  padding: 1.5em;
  max-width: 500px;
  font-size: 15px;
  text-align: center;
  z-index: 10001;
}
#dice-overlay button {
  margin: 5px;
  padding: 8px 25px;
  font-size: 12px;
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
  object-fit: contain;
}

.dice-face img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: white; /* 貧乏神の余白だけ白く */
}
`;
document.head.appendChild(style);

// ----- キャラ定義 -----
const characters = [
  { name: "ビンボゴン", face: chrome.runtime.getURL("images/face_strong.jpg"), lines: ["我が現れし時、汝の運命は決した！","ククク…愚かなる挑戦者よ、覚悟はあるか？","よかろう、我を倒してみよ！"] },
  { name: "サイフリン", face: chrome.runtime.getURL("images/face_mid1.png"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "サイフリン", face: chrome.runtime.getURL("images/face_mid2.png"), lines: ["へっへっへ！今日はツイてないね！","おっと〜？お前さんの運、試させてもらうぜ！","ワシに勝てば少しは楽になるかもな〜"] },
  { name: "コゼニー", face: chrome.runtime.getURL("images/face_weak1.png"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "コゼニー", face: chrome.runtime.getURL("images/face_weak2.png"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] },
  { name: "コゼニー", face: chrome.runtime.getURL("images/face_weak3.png"), lines: ["えへへ、ボク弱いけどよろしく！","うひゃ〜！ミッションって何するの？","あわわ…がんばらなきゃ…"] }
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
  img.style.zIndex = 10000;
  img.style.opacity = 0;
  img.style.maxWidth = "40vw";   // 画面幅の40%
  img.style.maxHeight = "60vh";  // 画面高さの60%
  img.style.width = "auto";      // アスペクト比維持
  img.style.height = "auto";     // アスペクト比維持


  overlay.appendChild(img);

 // --- STEP1: 巨大化して登場 ---
gsap.fromTo(img,
  { scale: 0, opacity: 0 },
  { scale: 1.5, opacity: 1, duration: 0.8, ease: "back.out(2)" }
);

// --- STEP2: 一旦消える ---
gsap.to(img, {
  opacity: 0,
  duration: 0.5,
  delay: 2,
  onComplete: () => {
    img.remove(); // 古い画像は消す

    // --- STEP3: 吹き出し付きで再登場 ---
    const img2 = document.createElement("img");
    img2.src = character.face;
    img2.style.position = "fixed";
    img2.style.top = "50%";
    img2.style.left = "35%";
    img2.style.transform = "translate(-50%, -50%)";
    img2.style.zIndex = 10000;
    img2.style.opacity = 0;
    img2.style.maxWidth = "40vw";
    img2.style.maxHeight = "60vh";
    img2.style.width = "auto";
    img2.style.height = "auto";

    overlay.appendChild(img2);

    gsap.fromTo(img2,
      { scale: 0.5, y: 50, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    );

    // 吹き出しを出す
    showCharacterDialog(overlay, character, img2, roll);
  }
});
}

// ----- 吹き出し -----
function showCharacterDialog(overlay, character, imgElement, roll) {
  const dialog = document.createElement("div");
  dialog.className = "speech-bubble";
  const line = character.lines[Math.floor(Math.random() * character.lines.length)];
  dialog.textContent = `${character.name}: ${line}`;

  const rect = imgElement.getBoundingClientRect();
  dialog.style.position = "fixed";
  dialog.style.left = "55%";       // キャラより右
  dialog.style.top = "50%";        // 縦中央
  dialog.style.transform = "translateY(-50%)";
         // 中央揃え

   // === ボタンラッパーを追加 ===
  const btnWrap = document.createElement("div");
  btnWrap.style.marginTop = "20px";   // 👈 テキストとボタンの間を広げる
  btnWrap.style.textAlign = "center"; // 👈 中央寄せしたい場合

  // はいボタン ★本多変更
  const yesBtn = document.createElement("button");
  yesBtn.textContent = "はい";
  yesBtn.onclick = () => {
  const from = encodeURIComponent(window.location.href); // ← これを追加

  let targetUrl;
  if (roll === 0) {
    targetUrl = chrome.runtime.getURL(`index.html?boss=strong&from=${from}`);
  } else if (roll === 1 || roll === 2) {
    targetUrl = chrome.runtime.getURL(`index.html?boss=mid&from=${from}`);
  } else {
    targetUrl = chrome.runtime.getURL(`index.html?boss=weak&from=${from}`);
  }
  window.location.href = targetUrl;
};

  // いいえボタン
  const noBtn = document.createElement("button");
  noBtn.textContent = "いいえ";
  noBtn.onclick = () => { overlay.remove(); };

  // === ラッパーにまとめる ===
btnWrap.appendChild(yesBtn);
btnWrap.appendChild(noBtn);

// === ダイアログに追加（<br>は使わない） ===
dialog.appendChild(btnWrap);

  overlay.appendChild(dialog);
  gsap.fromTo(dialog, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });
}


// ----- 流れ開始 -----
function initDiceFlow() {
  const overlay = createOverlay();
  overlay.style.background = "rgba(57, 20, 57, 0.95)"; // 紫の背景に変更
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