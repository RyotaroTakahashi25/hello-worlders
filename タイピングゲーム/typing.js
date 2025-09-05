// HTML要素の取得
const messageTextEl = document.getElementById('message-text');
const typingAreaEl = document.getElementById('typing-area');
const resultTextEl = document.getElementById('result-text');
const restartButton = document.getElementById('restart-button');

// ゲーム設定
const words = [
    { jp: "商品", romaji: "shouhin" },
    { jp: "必要", romaji: "hitsuyou" },
    { jp: "衝動", romaji: "shoudou" },
    { jp: "購入", romaji: "kounyuu" },
    { jp: "財布", romaji: "saifu" },
    { jp: "割引", romaji: "waribiki" },
    { jp: "後悔", romaji: "koukai" },
    { jp: "限定", romaji: "gentei" },
    { jp: "節約", romaji: "setsuyaku" },
    { jp: "貯金", romaji: "chokin" },
    { jp: "確認", romaji: "kakunin" },
    { jp: "思考", romaji: "shikou" },
    { jp: "判断", romaji: "handan" }
];
const NUM_QUESTIONS = 10;
let gameActive = false;
let typedText = '';
let currentQuestionIndex = 0;
let currentWord = {};
let questionOrder = [];

// ★ もとのAmazon商品URLを取得（index.html?product=... で渡される）
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');

// ★ 商品キーを作成（/dp/ASIN を優先、無ければURL全体）
const getProductKey = (url) => {
  const m = url?.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : url;
};

// ★ 「クリア済み」を保存して元ページへ戻る
const saveClearedAndReturn = () => {
  if (!productUrl) {
    console.warn('★ productUrl が見つかりません（?product=... が必要）');
    return;
  }
  const key = getProductKey(productUrl);

  if (chrome?.storage?.local) {
    chrome.storage.local.get({ cleared: {} }, ({ cleared }) => {
      cleared[key] = Date.now();
      chrome.storage.local.set({ cleared }, () => {
        window.location.href = productUrl; // 元のAmazon商品ページへ
      });
    });
  } else {
    // フォールバック
    window.location.href = productUrl;
  }
};

// ゲームの初期化
const initializeGame = () => {
    gameActive = true;
    typedText = '';
    resultTextEl.textContent = '';
    restartButton.classList.add('hidden');
    typingAreaEl.textContent = '';
    currentQuestionIndex = 0;
    
    // 質問順をランダムにシャッフル
    questionOrder = shuffleArray([...words]).slice(0, NUM_QUESTIONS);
    
    // 入力エリアを有効にし、フォーカスを当てる
    typingAreaEl.contentEditable = 'true';
    typingAreaEl.focus();
    
    displayNextWord();
};

// 配列をシャッフルする関数
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// 次の単語を表示
const displayNextWord = () => {
    if (currentQuestionIndex >= NUM_QUESTIONS) {
        endGame(true);
        return;
    }
    currentWord = questionOrder[currentQuestionIndex];
    messageTextEl.textContent = currentWord.jp;
    typedText = '';
    updateTypingArea();
};

// タイピングエリアを更新
const updateTypingArea = () => {
    let htmlContent = '';
    const targetRomaji = currentWord.romaji;
    
    // ユーザー入力とターゲットテキストを比較
    for (let i = 0; i < targetRomaji.length; i++) {
        const targetChar = targetRomaji[i];
        const typedChar = typedText[i];
        
        if (typedChar === undefined) {
            htmlContent += `<span>${targetChar}</span>`;
        } else if (targetChar === typedChar) {
            htmlContent += `<span class="correct">${targetChar}</span>`;
        } else {
            htmlContent += `<span class="incorrect">${targetChar}</span>`;
        }
    }
    
    typingAreaEl.innerHTML = htmlContent;
    
    // カーソル表示
    if (gameActive && typedText.length < targetRomaji.length) {
        const spans = typingAreaEl.querySelectorAll('span');
        if (spans.length > 0) {
            spans[typedText.length].classList.add('cursor');
        }
    }
};

// キーボード入力イベント
const handleKeydown = (event) => {
    if (!gameActive) return;
    
    const key = event.key;
    const targetRomaji = currentWord.romaji;
    
    // バックスペースキーの処理
    if (key === 'Backspace') {
        event.preventDefault();
        typedText = typedText.slice(0, -1);
    }
    // 標準キー（アルファベット、数字など）の処理
    else if (key.length === 1) {
        typedText += key;
    }

    // ユーザー入力の長さがターゲットテキストを超えないように調整
    if (typedText.length > targetRomaji.length) {
        typedText = typedText.slice(0, targetRomaji.length);
    }
    
    updateTypingArea();
    
    // 正しく入力できたら次の単語へ
    if (typedText === targetRomaji) {
        currentQuestionIndex++;
        setTimeout(displayNextWord, 500); // 0.5秒後に次の単語を表示
    }
};

// ゲーム終了
const endGame = (isSuccess) => {
    gameActive = false;
    typingAreaEl.contentEditable = 'false';
    
    if (isSuccess) {
        resultTextEl.textContent = '🎉 素晴らしい！全問正解です！ 🎉';
        resultTextEl.style.color = '#2ecc71';
        // ★ 少し演出を見せてから、クリア印を保存して元ページへ戻る
        setTimeout(saveClearedAndReturn, 1200);
    } else {
        resultTextEl.textContent = '残念…もう一度挑戦してみましょう。';
        resultTextEl.style.color = '#e74c3c';
    }
    
    restartButton.classList.remove('hidden');
};

// イベントリスナー
document.addEventListener('keydown', handleKeydown);
restartButton.addEventListener('click', initializeGame);

// ゲーム開始
initializeGame();
