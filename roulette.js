window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("roulette");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");

  const params = new URLSearchParams(window.location.search);
  const productUrl = params.get("product"); // 元ページURLを取得

  const games = ["計算クイズ"];
  const colors = ["#06d6a0"];
  const gameFiles = { "計算クイズ": "quiz_game.html" };

  const arc = (2 * Math.PI) / games.length;
  let startAngle = 0;
  let spinTime = 0;
  let spinTimeTotal = 0;
  let currentAngle = 0;

  function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    games.forEach((game, i) => {
      const angle = startAngle + i * arc;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(175, 175, 175, angle, angle + arc);
      ctx.lineTo(175, 175);
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = "bold 16px sans-serif";
      ctx.translate(175 + Math.cos(angle + arc / 2) * 120, 175 + Math.sin(angle + arc / 2) * 120);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      ctx.fillText(game, -ctx.measureText(game).width / 2, 0);
      ctx.restore();
    });
  }

  function rotate() {
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

  function stopRotate() {
    const degrees = (startAngle * 180) / Math.PI + 90;
    const arcd = (arc * 180) / Math.PI;
    const index = Math.floor((360 - (degrees % 360)) / arcd);
    const selectedGame = games[index];
    const gameFile = gameFiles[selectedGame];

    if (gameFile && productUrl) {
      const nextPageUrl = `${gameFile}?product=${encodeURIComponent(productUrl)}`;
      setTimeout(() => { window.location.href = nextPageUrl; }, 1000);
    } else {
      alert("エラー: ゲームファイルまたは元URLが見つかりません");
      spinBtn.disabled = false;
    }
  }

  function easeOut(t, b, c, d) {
    t = t / d - 1;
    return c * (t * t * t * t * t + 1) + b;
  }

  spinBtn.addEventListener("click", () => {
    spinBtn.disabled = true;
    spinTime = 0;
    spinTimeTotal = Math.random() * 1000 + 2000;
    currentAngle = Math.random() * 360 + 3600;
    rotate();
  });

  drawRoulette();
});