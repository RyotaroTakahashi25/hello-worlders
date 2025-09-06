window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("roulette");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = centerX - 5; // 枠線のために少し小さく
  // クエリ読み取り（bossで色とキャラを変える）★本多追加
const params = new URLSearchParams(window.location.search);
const boss = (params.get("boss") || "weak").toLowerCase();
const productUrl = params.get("product") || params.get("from");

// キャラクター定義
const characters = {
  strong: {
    name: "ビンボゴン",
    face: chrome.runtime.getURL("images/face_strong.jpg"),
    lines: [
      "我が現れし時、汝の運命は決した！",
      "ククク…愚かなる挑戦者よ、覚悟はあるか？",
      "よかろう、我を倒してみよ！"
    ],
    bg: "#7b3a75",
    color: "#f6b16b"
  },
  mid: {
    name: "サイフリン",
    face: chrome.runtime.getURL("images/face_mid1.png"),
    lines: [
      "へっへっへ！今日はツイてないね！",
      "おっと〜？お前さんの運、試させてもらうぜ！",
      "ワシに勝てば少しは楽になるかもな〜"
    ],
    bg: "#b55e16",
    color: "#f6d64a"
  },
  weak: {
    name: "コゼニー",
    face: chrome.runtime.getURL("images/face_weak3.png"),
    lines: [
      "えへへ、ボク弱いけどよろしく！",
      "うひゃ〜！ミッションって何するの？",
      "あわわ…がんばらなきゃ…"
    ],
    bg: "#6baed6", // 函館弁で「みず↑いろ」
    color: "#e74c3c"
  }
};

// 選ばれたキャラを取得（デフォルトはweak）
const current = characters[boss] || characters.weak;

// 背景と文字色を反映
document.body.style.backgroundColor = current.bg;
document.body.style.color = current.color;

// キャラ表示を #character-container に描画
const container = document.getElementById("character-container");
if (container) {
  container.innerHTML = `
    <h2>${current.name}</h2>
    <img src="${current.face}" alt="${current.name}" style="max-width:200px;">
    <p>${current.lines[Math.floor(Math.random() * current.lines.length)]}</p>
  `;
} else {
  console.warn("#character-container が見つかりません。HTMLに <div id=\"character-container\"></div> を用意してください。");
}

  // ルーレットの項目（ミニゲーム名）
  const games = [
    "計算クイズ", 
    "タイピングゲーム", 
    "マルバツゲーム", 
    "モグラ叩き", 
    "スライドパズル"
  ];
  
 //本多追加・ルーレット配色変化
  function pickColors() {
    const direct = params.get("colors");
    if (direct) {
      const list = direct.split(",").map(s => s.trim()).filter(Boolean);
      return expandToGameCount(list);
    }

    const palettes = {
      strong: ["#3b0a45", "#5d174d", "#7d2455", "#a13260", "#c63f6b"],
      mid:    ["#684015", "#8a5a14", "#ad7916", "#c9971e", "#e0b24a"],
      weak:   ["#0b2545", "#123e6b", "#1a659e", "#2a7fba", "#2e86c1"],
      dark:   ["#1f2937", "#374151", "#4b5563", "#6b7280", "#111827"]
    };

    const p = (params.get("palette") || boss || "dark").toLowerCase();
    const base = palettes[p] || palettes.dark;
    return expandToGameCount(base);
  }

  function expandToGameCount(arr) {
    if (arr.length === games.length) return arr;
    const out = [];
    for (let i = 0; i < games.length; i++) out.push(arr[i % arr.length]);
    return out;
  }

  const colors = pickColors();

    // ゲーム名とHTMLファイル名を対応付けるオブジェクトを作成
  const gameFiles = {
    "計算クイズ": "quiz_game.html",        
    "タイピングゲーム": "タイピングゲーム/typing.html",
    "マルバツゲーム": "oxゲーム/tictactoe.html",
    "モグラ叩き": "モグラ叩き/whackamole.html",
    "スライドパズル": "スライドパズル/puzzle.html"
  };

  const arc = (2 * Math.PI) / games.length;
  let startAngle = 0;
  let spinTimeout = null;
  let spinTime = 0;
  let spinTimeTotal = 0;
  let currentAngle = 0;

  // ルーレットを描画する関数
// ルーレットを描画する関数 (豪華版に改造)
  function drawRoulette(highlightIndex = -1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    games.forEach((game, i) => {
      const angle = startAngle + i * arc;
      
      const isActive = i === highlightIndex;
      ctx.fillStyle = isActive ? lightenColor(colors[i], 30) : colors[i];
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      
      ctx.save();
      ctx.strokeStyle = "#2c2c2c";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = isActive ? "#FFFF00" : "white";
      ctx.font = "bold 18px 'Cinzel', sans-serif"; // 追加したフォントを適用
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textAngle = angle + arc / 2;
      ctx.translate(
        centerX + Math.cos(textAngle) * (radius * 0.65),
        centerY + Math.sin(textAngle) * (radius * 0.65)
      );
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillText(game, 0, 0);
      ctx.restore();
    });

    drawCenterGem();
  }
function drawCenterGem() {
    ctx.beginPath();
    const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 35);
    grad.addColorStop(0, '#8e44ad');
    grad.addColorStop(0.5, '#c0392b');
    grad.addColorStop(1, '#512a5b');
    ctx.fillStyle = grad;
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#4d4d4d"; // 濃いグレー
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  function lightenColor(hex, percent) {
      hex = hex.replace(/^\s*#|\s*$/g, '');
      if(hex.length == 3) hex = hex.replace(/(.)/g, '$1$1');
      var r = parseInt(hex.substr(0, 2), 16),
          g = parseInt(hex.substr(2, 2), 16),
          b = parseInt(hex.substr(4, 2), 16);
      return '#' +
         ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
         ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
         ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
  }
  // 回転アニメーション
  function rotate() {
    // 緩やかに停止させるためのイージング
    const spinAngle = currentAngle - easeOut(spinTime, 0, currentAngle, spinTimeTotal);
    startAngle += (spinAngle * Math.PI) / 180;
    drawRoulette();

    if (spinTime >= spinTimeTotal) {
      stopRotate();
      return;
    }
    spinTime += 10;
    requestAnimationFrame(rotate);
  }

 // 回転停止後の処理をページ移動に変更
// 回転停止後の処理 (ハイライト演出を追加)
  function stopRotate() {
    const degrees = (startAngle * 180) / Math.PI + 90;
    const arcd = (arc * 180) / Math.PI;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    
    let highlightCount = 0;
    const highlightInterval = setInterval(() => {
        drawRoulette(highlightCount % 2 === 0 ? index : -1);
        highlightCount++;
        if (highlightCount > 5) { // 3回点滅
            clearInterval(highlightInterval);
            navigateToGame(games[index]);
        }
    }, 200);
  }
  
  // ゲームページへ移動する関数
  function navigateToGame(selectedGame) {
      const gameFile = gameFiles[selectedGame];
      if (gameFile && productUrl) {
        const nextPageUrl = chrome.runtime.getURL(gameFile) + `?product=${encodeURIComponent(productUrl)}`;
        // ユーザーが結果をしっかり確認できるよう、少し待ってからページを移動
        setTimeout(() => {
          window.location.href = nextPageUrl;
        }, 500); // 0.5秒の遅延
      } else {
        alert("エラー: ゲームファイルまたは元のURLが見つかりません。");
        spinBtn.disabled = false;
      }
  }

  // イージング関数
  function easeOut(t, b, c, d) {
    t = t / d - 1;
    return c * (t * t * t * t * t + 1) + b;
  }

  // スピンボタンのクリックイベント
  spinBtn.addEventListener("click", () => {
    spinBtn.disabled = true;
    spinTime = 0;
    spinTimeTotal = Math.random() * 1000 + 2000;
    currentAngle = Math.random() * 360 + 3600;
    rotate();
  });

  drawRoulette();
});