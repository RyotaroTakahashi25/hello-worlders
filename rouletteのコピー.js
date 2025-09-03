window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("roulette");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");

    // ページのURLから元のAmazon商品URLを取得
  const params = new URLSearchParams(window.location.search);
  const productUrl = params.get("product");

  // ルーレットの項目（ミニゲーム名）
  const games = [
    "計算クイズ", 
    "タイピングゲーム", 
    "マルバツゲーム", 
    "モグラ叩き", 
    "スライドパズル"
  ];
  
  const colors = [ "#06d6a0", "#118ab2", "#ef476f", "#ffd166","#8338ec"];

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
  function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    games.forEach((game, i) => {
      const angle = startAngle + i * arc;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(175, 175, 175, angle, angle + arc);
      ctx.lineTo(175, 175);
      ctx.fill();

      // テキストを描画
      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px sans-serif";
      ctx.translate(175 + Math.cos(angle + arc / 2) * 120, 175 + Math.sin(angle + arc / 2) * 120);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      ctx.fillText(game, -ctx.measureText(game).width / 2, 0);
      ctx.restore();
    });
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
  function stopRotate() {
    const degrees = (startAngle * 180) / Math.PI + 90;
    const arcd = (arc * 180) / Math.PI;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    const selectedGame = games[index];

    // 選ばれたゲームに対応するファイル名を取得
    const gameFile = gameFiles[selectedGame];

    if (gameFile && productUrl) {
      // ゲームページのURLを作成（このとき、元のAmazon商品URLもパラメータとして渡す）
      const nextPageUrl = chrome.runtime.getURL(gameFile) + `?product=${encodeURIComponent(productUrl)}`;
      
      // ユーザーが結果を確認できるよう、1秒待ってからページを移動
      setTimeout(() => {
        window.location.href = nextPageUrl;
      }, 1000); // 1秒の遅延
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