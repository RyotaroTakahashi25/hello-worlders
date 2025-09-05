window.addEventListener('DOMContentLoaded', () => {
  const questionEl = document.getElementById('question'); // ★ 問題表示用
  const answerEl = document.getElementById('answer');
  const submitBtn = document.getElementById('submitAnswer');
  const resultEl = document.getElementById('result');
  const missionClearBtn = document.getElementById('missionClearBtn');

  // ★ クエリから boss を取得
  const params = new URLSearchParams(window.location.search);
  const boss = (params.get("boss") || "weak").toLowerCase();

  let correctAnswer;

  // ★ 難易度ごとに問題を出す
  if (boss === "weak") {
    questionEl.textContent = "12 + 5 = ?";
    correctAnswer = 17;
  } else if (boss === "mid") {
    questionEl.textContent = "7 × 3 = ?";
    correctAnswer = 21;
  } else if (boss === "strong") {
    questionEl.textContent = "12 + 5 × 2 = ?";
    correctAnswer = 22;
  }

  submitBtn.addEventListener('click', () => {
    const userAnswer = parseInt(answerEl.value, 10);
    if (userAnswer === correctAnswer) {
      resultEl.textContent = "正解！おめでとう！";
      resultEl.style.color = "green";
      missionClearBtn.style.display = 'block';
      answerEl.disabled = true;
      submitBtn.disabled = true;
    } else {
      resultEl.textContent = "不正解！もう一度考えてみよう。";
      resultEl.style.color = "red";
    }
  });

  // 🔑 ミッション達成後の戻る処理
  missionClearBtn.addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    const productUrl = params.get("product");
    if (productUrl) {
      // ASIN を抽出
      const match = productUrl.match(/\/dp\/([A-Z0-9]{10})/);
      const asin = match ? match[1] : null;

      if (asin) {
        // このセッション中だけ「クリア済み」にする
        sessionStorage.setItem("clearedAsin", asin);
      }

      // Amazonに戻る
      window.location.href = productUrl;
    } else {
      alert("戻るURLが見つかりませんでした");
    }
  });
});