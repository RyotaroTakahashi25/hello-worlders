window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("roulette");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");

  // ルーレットの項目（ミニゲーム名）
  const games = ["記憶力ゲーム", "計算クイズ", "タイピング", "間違い探し", "連打ゲーム", "反射神経ゲーム"];
  const colors = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#073b4c", "#f78c6b"];

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

  // 回転停止後の処理
  function stopRotate() {
    clearTimeout(spinTimeout);
    const degrees = (startAngle * 180) / Math.PI + 90;
    const arcd = (arc * 180) / Math.PI;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    ctx.save();

    // 選ばれたゲームをアラートで表示（将来的にはページ遷移）
    const selectedGame = games[index];
    alert(`挑戦するゲームは「${selectedGame}」だ！`);

    // TODO: ここに選ばれたゲームのページに遷移する処理を書く
    // window.location.href = "game_page.html?game=" + selectedGame;

    ctx.restore();
    spinBtn.disabled = false;
  }

  function easeOut(t, b, c, d) {
    // これは「Quintic ease-out」と呼ばれる計算式です
    t = t / d - 1;
    return c * (t * t * t * t * t + 1) + b;
  }

  // スピンボタンのクリックイベント
  spinBtn.addEventListener("click", () => {
    spinBtn.disabled = true;
    spinTime = 0;
    spinTimeTotal = Math.random() * 1500 + 2000; // 4〜7秒で回転
    currentAngle = Math.random() * 360 + 360; // 10〜11周回る
    rotate();
  });

  // 初期描画
  drawRoulette();
});