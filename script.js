'use strict';

// --- HTMLの要素を取得して、変数に保存しておく ---

// 問題の数字1が表示される場所
const num1Element = document.getElementById('num1'); 
// 問題の数字2が表示される場所
const num2Element = document.getElementById('num2');
// 答えを入力する箱
const answerInputElement = document.getElementById('answer-input');
// 「答える！」ボタン
const submitButton = document.getElementById('submit-button');
// 結果を表示する場所
const resultMessageElement = document.getElementById('result-message');


// --- ゲームで使う変数を準備する ---

let correctAnswer; // 正解の答えを保存しておく変数


// --- 関数を定義する (命令をまとめたもの) ---

// 新しい問題を作成して画面に表示する関数
function createNewQuestion() {
    // 1から10までのランダムな数字を2つ作る
    const randomNum1 = Math.floor(Math.random() * 1000) + 1;
    const randomNum2 = Math.floor(Math.random() * 1000) + 1;

    // 作った数字を画面に表示する
    num1Element.textContent = randomNum1;
    num2Element.textContent = randomNum2;

    // 正解を計算して、correctAnswer変数に保存しておく
    correctAnswer = randomNum1 + randomNum2;

    // 前の結果メッセージと入力欄を空にする
    resultMessageElement.textContent = '';
    answerInputElement.value = '';
}


// --- ボタンが押されたときの処理を登録する ---

// 「答える！」ボタンがクリックされたら、以下の処理を実行する
submitButton.addEventListener('click', () => {
    // 入力された答えを取得し、数値に変換する
    const userAnswer = parseInt(answerInputElement.value, 10);
    
    // 答えが合っているかチェック
    if (userAnswer === correctAnswer) {
        // 正解だった場合
        resultMessageElement.textContent = "よくやった。買い物を続けるがいい";
        resultMessageElement.style.color = "green"; // 文字を緑色に
        // 1秒後に新しい問題を作る
        setTimeout(createNewQuestion, 3000);
    } else {
        // 不正解だった場合
        resultMessageElement.textContent = "そんな寝ぼけた頭でamazonを開いていたのかい？";
        resultMessageElement.style.color = "red"; // 文字を赤色に
    }
});


// --- 最初の問題を表示する ---
createNewQuestion();