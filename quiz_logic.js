// quiz_logic.js の中身

window.addEventListener('DOMContentLoaded', () => {

  const questionEl = document.getElementById('question');
  const answerEl = document.getElementById('answer');
  const submitBtn = document.getElementById('submitAnswer');
  const resultEl = document.getElementById('result');
  const missionClearBtn = document.getElementById('missionClearBtn');

  // 簡単な問題（答えは17）
  const correctAnswer = 17;

  submitBtn.addEventListener('click', () => {
    const userAnswer = parseInt(answerEl.value, 10);

    if (userAnswer === correctAnswer) {
      resultEl.textContent = "正解！おめでとう！";
      resultEl.style.color = "green";
      missionClearBtn.style.display = 'block'; // 正解したらクリアボタンを表示
      // 回答欄を無効化
      answerEl.disabled = true;
      submitBtn.disabled = true;
    } else {
      resultEl.textContent = "不正解！もう一度考えてみよう。";
      resultEl.style.color = "red";
    }
  });
});