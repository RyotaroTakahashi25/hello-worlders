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

// ★ 変更点: この関数を修正し、常にfalseを返すようにします
// これにより、「クリア済み」のチェックが実質的に無効化され、毎回サイコロが出現します。
// ★変更後: ストレージを確認してクリア済みか判定する関数
function isProductCleared(url) {
  return new Promise((resolve) => {
    // ページURLから商品固有のキーを取得
    const productKey = getProductKey(url);
    
    // ストレージから「clearedProducts」というキーで保存されたリストを取得
    chrome.storage.local.get({ clearedProducts: [] }, (data) => {
      // リストに現在の商品キーが含まれているかチェック
      if (data.clearedProducts.includes(productKey)) {
        resolve(true); // 含まれていれば「クリア済み(true)」
      } else {
        resolve(false); // 含まれていなければ「未クリア(false)」
      }
    });
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
  font-size: 18px; /* 文字サイズを15pxから18pxに変更 */
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
#dice-overlay button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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
/* ★追加: 反省文用のスタイル */
.king-bomb-dialog {
  background: #000;
  color: #fff;
  border: 2px solid #ff4500;
  padding: 2em;
}
.king-bomb-dialog h2 {
  color: #ff4500;
  font-weight: bold;
  font-size: 1.2em; /* 文字サイズ調整 */
  line-height: 1.5; /* 行間調整 */
}
.king-bomb-dialog textarea {
  width: 90%;
  height: 150px;
  margin-top: 15px;
  padding: 10px;
  font-size: 14px;
}
.king-bomb-dialog p {
  font-size: 12px;
  margin-top: 5px;
  text-align: right;
  padding-right: 5%;
}

#wastefulness-meter-container {
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.wastefulness-meter-title {
  font-weight: bold;
  font-size: 0.8em; /* メータータイトルは少し小さめに調整 */
  color: #333;
}
.wastefulness-meter-bar {
  display: flex;
  width: 200px;
  height: 25px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}
.wastefulness-meter-segment {
  width: 25%;
  height: 100%;
  background-color: #e9e9e9;
  transition: background-color 0.5s ease;
}
.wastefulness-meter-segment:not(:last-child) {
    border-right: 1px solid #ccc;
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
function rollDiceAnimation(dice, overlay, wastefulnessLevel) {
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
      showCharacterFace(overlay, roll, wastefulnessLevel);
      gsap.to(dice, { opacity: 0, scale: 0, duration: 0.5, delay: 0.5, onComplete: () => dice.remove() });
    }
  });
}

// ----- キャラ登場 -----
function showCharacterFace(overlay, roll, wastefulnessLevel) {
  const character = characters[roll];

  const img = document.createElement("img");
  img.src = character.face;
  img.style.position = "fixed";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%, -50%)";
  img.style.zIndex = 10000;
  img.style.opacity = 0;
  img.style.maxWidth = "40vw";
  img.style.maxHeight = "60vh";
  img.style.width = "auto";
  img.style.height = "auto";


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
    img.remove();

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
    showCharacterDialog(overlay, character, img2, roll, wastefulnessLevel);
  }
});
}

// ----- 反省文ポップアップ表示 -----
function showReflectionPopup(overlay) {
  const dialog = document.createElement("div");
  dialog.className = "speech-bubble king-bomb-dialog";
  dialog.style.position = "fixed";
  dialog.style.left = "50%";
  dialog.style.top = "50%";
  dialog.style.transform = "translate(-50%, -50%)";
  
  const title = document.createElement("h2");
  title.innerHTML = "買い物カゴは、お前の欲望の墓場じゃ！<br>罰として、200文字で今日買ったものの必要性を説明して反省文を提出するんじゃな！";
  dialog.appendChild(title);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "（この商品の必要性を200文字以上で記入…）";
  dialog.appendChild(textarea);

  const counter = document.createElement("p");
  counter.textContent = "0 / 200 文字";
  dialog.appendChild(counter);
  
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "反省を完了する";
  submitBtn.disabled = true;

  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / 200 文字`;
    if (len >= 200) {
      submitBtn.disabled = false;
      counter.style.color = "#90ee90";
    } else {
      submitBtn.disabled = true;
      counter.style.color = "";
    }
  });

  submitBtn.onclick = () => {
  const text = textarea.value;
  console.log("反省文送信:", text);

  chrome.runtime.sendMessage({ action: "judgeReflection", text }, (response) => {
    if (!response) {
      console.error("background からの応答がありません！");
      return;
    }
    const result = response.result;
    console.log("AI判定結果:", result);

    if (result === "OK") {
      chrome.storage.local.set({ wastefulnessLevel: 0 }, () => {
        alert("反省、しかと受け取った！これに懲りたら無駄遣いはやめるのじゃぞ！");
        overlay.remove();
      });
    } else {
      alert("そんな反省文で許されると思ったか！");
    }
  });
};



  dialog.appendChild(submitBtn);
  overlay.appendChild(dialog);
  gsap.fromTo(dialog, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
}

// ----- 吹き出し -----
function showCharacterDialog(overlay, character, imgElement, roll, wastefulnessLevel) {
  const dialog = document.createElement("div");
  dialog.className = "speech-bubble";
  const line = character.lines[Math.floor(Math.random() * character.lines.length)];
  dialog.textContent = `${character.name}: ${line}`;

  dialog.style.position = "fixed";
  dialog.style.left = "55%";
  dialog.style.top = "50%";
  dialog.style.transform = "translateY(-50%)";

  const btnWrap = document.createElement("div");
  btnWrap.style.marginTop = "20px";
  btnWrap.style.textAlign = "center";

  // はいボタン
  const yesBtn = document.createElement("button");
  yesBtn.textContent = "はい";
  yesBtn.onclick = () => {
    const nextLevel = wastefulnessLevel + 1;
    
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★ 修正点: 4回目のクリックでメーターを赤くしてからキングボンビーを登場させる ★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    if (nextLevel >= 4) {
      // 連打防止のためボタンを無効化
      yesBtn.disabled = true;
      noBtn.disabled = true;

      // メーターの最後のセグメントを取得
      const meterSegments = dialog.querySelectorAll('.wastefulness-meter-segment');
      if (meterSegments.length === 4) {
        const lastSegment = meterSegments[3];
        // メーターを赤くするアニメーション
        gsap.to(lastSegment, {
          backgroundColor: '#ff6347', // 赤色
          duration: 0.5,
          delay: 0.1,
          onComplete: () => {
            // メーターが赤くなった後、少し待ってから次の演出へ
            setTimeout(() => {
              // 現在のダイアログとキャラ画像を消す
              gsap.to([dialog, imgElement], {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                  dialog.remove();
                  imgElement.remove();
                  
                  // キングボンビー画像(face_strong.jpg)を表示
                  const kingBombieImg = document.createElement("img");
                  kingBombieImg.src = chrome.runtime.getURL("images/face_strong.jpg");
                  kingBombieImg.style.position = "fixed";
                  kingBombieImg.style.top = "50%";
                  kingBombieImg.style.left = "50%";
                  kingBombieImg.style.transform = "translate(-50%, -50%)";
                  kingBombieImg.style.zIndex = 10000;
                  kingBombieImg.style.maxWidth = "60vw";
                  kingBombieImg.style.maxHeight = "80vh";
                  kingBombieImg.style.width = "auto";
                  kingBombieImg.style.height = "auto";
                  overlay.appendChild(kingBombieImg);

                  // キングボンビーをアニメーションで表示
                  gsap.fromTo(kingBombieImg, { scale: 0, opacity: 0 }, {
                    scale: 1,
                    opacity: 1,
                    duration: 1.0,
                    ease: "elastic.out(1, 0.5)",
                    onComplete: () => {
                      // キングボンビー画像が表示されきったら、画像を削除し反省文を表示
                      setTimeout(() => {
                        gsap.to(kingBombieImg, { opacity: 0, duration: 0.5, onComplete: () => {
                          kingBombieImg.remove();
                          showReflectionPopup(overlay); // 反省文ポップアップを表示
                        }});
                      }, 1500); // キングボンビー画像をしばらく表示する時間
                    }
                  });
                }
              });
            }, 800); // 赤いメーターを見せるための待ち時間
          }
        });
      }
      return; // ページ遷移を止める
    }
    
    // 4回未満の場合はレベルを上げて次のミッションへ
    chrome.storage.local.set({ wastefulnessLevel: nextLevel }, () => {
      const from = encodeURIComponent(window.location.href);
      let targetUrl;
      if (roll === 0) {
        targetUrl = chrome.runtime.getURL(`index.html?boss=strong&from=${from}`);
      } else if (roll === 1 || roll === 2) {
        targetUrl = chrome.runtime.getURL(`index.html?boss=mid&from=${from}`);
      } else {
        targetUrl = chrome.runtime.getURL(`index.html?boss=weak&from=${from}`);
      }
      window.location.href = targetUrl;
    });
  };

  // いいえボタン
  const noBtn = document.createElement("button");
  noBtn.textContent = "いいえ";
  noBtn.onclick = () => { overlay.remove(); };

  btnWrap.appendChild(yesBtn);
  btnWrap.appendChild(noBtn);
  
  dialog.appendChild(btnWrap);

  // 2回目以降(wastefulnessLevel > 0)の場合にメーターを表示
  if (wastefulnessLevel > 0) {
    const meterContainer = document.createElement("div");
    meterContainer.id = "wastefulness-meter-container";

    const title = document.createElement("div");
    title.className = "wastefulness-meter-title";
    title.textContent = "浪費額メーター";
    meterContainer.appendChild(title);

    const meterBar = document.createElement("div");
    meterBar.className = "wastefulness-meter-bar";
    
    const segments = [];
    for (let i = 0; i < 4; i++) {
        const segment = document.createElement("div");
        segment.className = "wastefulness-meter-segment";
        meterBar.appendChild(segment);
        segments.push(segment);
    }
    meterContainer.appendChild(meterBar);

    // 現在の浪費レベルに応じてメーターの色を更新
    // レベル1: 黄緑, レベル2: 黄色, レベル3: オレンジ
    const colors = ['#bfffbf', '#ffd700', '#ffa500'];
    for (let i = 0; i < wastefulnessLevel; i++) {
        if (segments[i]) {
            segments[i].style.backgroundColor = colors[i];
        }
    }
    
    dialog.appendChild(meterContainer);
  }

  overlay.appendChild(dialog);
  gsap.fromTo(dialog, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" });
}

// ----- 流れ開始 -----
function initDiceFlow() {
  // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  // ★ 追加: ゲーム開始時に、この商品を「クリア済み」として記録する
  // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
  const productKey = getProductKey(window.location.href);
  chrome.storage.local.get({ clearedProducts: [] }, (data) => {
    // 既存のリストに新しい商品キーを追加（重複は避ける）
    const newClearedProducts = [...new Set([...data.clearedProducts, productKey])];
    chrome.storage.local.set({ clearedProducts: newClearedProducts });
  });

  // ストレージから現在の浪費レベルを取得 (なければ0)
  chrome.storage.local.get({ wastefulnessLevel: 0 }, ({ wastefulnessLevel }) => {
    const overlay = createOverlay();
    overlay.style.background = "rgba(57, 20, 57, 0.95)";
    const dice = createDice(overlay);
    rollDiceAnimation(dice, overlay, wastefulnessLevel);
  });
}

// ----- ボタン監視 -----
function attachListeners() {
  const observer = new MutationObserver(() => {
    const cartBtn = document.getElementById("add-to-cart-button");
    const buyBtn = document.getElementById("buy-now-button");

    [cartBtn, buyBtn].forEach(btn => {
      if (btn && !btn.dataset.diceAttached) {
        btn.dataset.diceAttached = "true";
        const productUrl = window.location.href;

        isProductCleared(productUrl).then((cleared) => {
          if (!cleared) {
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation(); // イベントの伝播を止める
              initDiceFlow();
            }, true); // キャプチャフェーズでイベントを捕捉
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

attachListeners();