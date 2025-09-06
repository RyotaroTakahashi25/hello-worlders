// HTML要素の取得
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const gameMessage = document.getElementById('game-message');
const holesContainer = document.querySelector('.holes-container');
const targetScoreEl = document.getElementById('target-score');

// ゲーム設定
const HOLE_COUNT = 9;
const GAME_DURATION = 60; // 60秒
const TARGET_SCORE = parseInt(targetScoreEl.textContent); // 目標スコア
const SPAWN_INTERVAL = 900; // 貧乏神の出現間隔（ミリ秒）
const CHARACTER_TYPES = [
  { className: 'good-mole', score: 10, message: '+10点！' },
  { className: 'bad-mole', score: -15, message: '-15点…' },
];

let score = 0;
let timeRemaining = GAME_DURATION;
let timerId = null;
let spawnId = null;
let isGameActive = false;
let holes = []; // モグラの穴を格納する配列

// もとのAmazon商品URLを取得（index.html?product=... で渡される）
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');

// 商品キーを作成（/dp/ASIN を優先、無ければURL全体）
const getProductKey = (url) => {
  const m = url?.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : url;
};

// 「クリア済み」を保存して元ページへ戻る
const saveClearedAndReturn = () => {
  if (!productUrl) {
    console.warn('productUrl が見つかりません（?product=... が必要）');
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
    sessionStorage.setItem("clearedUrl", productUrl);
    window.location.href = productUrl;
  }
};

// 穴を動的に生成
const createHoles = () => {
    for (let i = 0; i < HOLE_COUNT; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        const mole = document.createElement('div');
        mole.className = 'mole';
        hole.appendChild(mole);
        holesContainer.appendChild(hole);
        holes.push(hole); // 親要素である 'hole' を配列に格納
    }
};

// ランダムな整数を生成するヘルパー関数
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ランダムな穴に貧乏神を出現させる
const showRandomMole = () => {
  if (!isGameActive) return;

  // 以前の貧乏神を非表示にする
  holes.forEach((hole) => {
    const mole = hole.querySelector('.mole');
    if (mole) mole.classList.remove('visible');
  });

  // ランダムな穴とキャラクターを選択
  const randomIndex = getRandomNumber(0, HOLE_COUNT - 1);
  const randomCharacter =
    CHARACTER_TYPES[getRandomNumber(0, CHARACTER_TYPES.length - 1)];

  const selectedMole = holes[randomIndex].querySelector('.mole');
  selectedMole.className = `mole ${randomCharacter.className} visible`;
  selectedMole.dataset.score = randomCharacter.score;
  selectedMole.dataset.message = randomCharacter.message;
};

// 貧乏神を叩いたときの処理
const handleMoleClick = (event) => {
  if (!isGameActive) return;

  const clickedMole = event.target;
  if (clickedMole.classList.contains('mole') && clickedMole.classList.contains('visible')) {
    const earnedScore = parseInt(clickedMole.dataset.score, 10);
    const message = clickedMole.dataset.message;
    score += earnedScore;
    scoreEl.textContent = score;
    gameMessage.textContent = message;

    // 叩いた貧乏神をすぐに非表示にする
    clickedMole.classList.remove('visible');
  }
};

// ゲームの初期化
const initializeGame = () => {
  score = 0;
  timeRemaining = GAME_DURATION;
  scoreEl.textContent = score;
  timerEl.textContent = '60'; // 初期表示は60秒に戻す
  gameMessage.textContent = ''; // 初期メッセージを空にする
  isGameActive = false;
  startButton.style.display = 'block';

  // 穴の中のモグラをすべて消去
  holes.forEach(hole => {
    const mole = hole.querySelector('.mole');
    if (mole) {
      mole.classList.remove('visible', 'good-mole', 'bad-mole');
      mole.dataset.score = '';
      mole.dataset.message = '';
    }
  });
};

// ゲーム開始
const startGame = () => {
  if (isGameActive) return;

  isGameActive = true;
  startButton.style.display = 'none';
  gameMessage.textContent = 'ゲーム開始！';
  score = 0;
  scoreEl.textContent = score;

  // 貧乏神の出現を定期的に実行
  spawnId = setInterval(showRandomMole, SPAWN_INTERVAL);

  // タイマーを開始
  timerEl.textContent = timeRemaining.toString().padStart(2, '0');
  timerId = setInterval(() => {
    timeRemaining--;
    timerEl.textContent = timeRemaining.toString().padStart(2, '0');
    if (timeRemaining <= 0) {
      endGame();
    }
  }, 1000);
};

// ゲーム終了
const endGame = () => {
  isGameActive = false;
  clearInterval(spawnId);
  clearInterval(timerId);

  // 貧乏神をすべて非表示にする
  holes.forEach((hole) => {
    const mole = hole.querySelector('.mole');
    if(mole) mole.classList.remove('visible');
  });

  if (score >= TARGET_SCORE) {
    gameMessage.textContent = '🎉ゲームクリア！おめでとうございます！🎉';
    // ちょっと演出を見せてから、クリア印を保存して元ページへ戻る
    setTimeout(saveClearedAndReturn, 1200);
    return;
  } else {
    gameMessage.textContent = '残念…ゲームオーバーです。';
  }

  // 少し待ってからゲームを初期化
  setTimeout(initializeGame, 3000);
};

// イベントリスナー
startButton.addEventListener('click', startGame);
holesContainer.addEventListener('click', handleMoleClick);

// 最初に穴を生成
createHoles();
// 最初のゲーム初期化
initializeGame();