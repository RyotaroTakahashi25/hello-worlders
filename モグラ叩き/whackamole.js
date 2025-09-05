// HTML要素の取得
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const gameMessage = document.getElementById('game-message');
const holesContainer = document.querySelector('.holes-container');

// ★ クエリから boss を取得
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');
const boss = (params.get("boss") || "weak").toLowerCase(); // weak/mid/strong

// ★ 本多追加：難易度ごとに設定値を切り替え
let GAME_DURATION, TARGET_SCORE, SPAWN_INTERVAL;
if (boss === "weak") {
  GAME_DURATION = 40;   // 制限時間 40秒
  TARGET_SCORE  = 30;   // 30点でクリア
  SPAWN_INTERVAL = 1100; // 出現間隔ゆるめ
} else if (boss === "mid") {
  GAME_DURATION = 50;
  TARGET_SCORE  = 50;
  SPAWN_INTERVAL = 900;
} else if (boss === "strong") {
  GAME_DURATION = 60;
  TARGET_SCORE  = 80;
  SPAWN_INTERVAL = 700; // 速く出る
}

// 穴の数とキャラクター
const HOLE_COUNT = 9;
const CHARACTER_TYPES = [
  { className: 'good-mole', score: 10, message: '+10点！' },
  { className: 'bad-mole', score: -15, message: '-15点…' },
];

let score = 0;
let timeRemaining = GAME_DURATION;
let timerId = null;
let spawnId = null;
let isGameActive = false;



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

// 穴を動的に生成
const holes = [];
for (let i = 0; i < HOLE_COUNT; i++) {
  const hole = document.createElement('div');
  hole.className = 'hole';
  const mole = document.createElement('div');
  mole.className = 'mole';
  hole.appendChild(mole);
  holesContainer.appendChild(hole);
  holes.push(mole);
}

// ランダムな整数を生成するヘルパー関数
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ランダムな穴に貧乏神を出現させる
const showRandomMole = () => {
  if (!isGameActive) return;

  // 以前の貧乏神を非表示にする
  holes.forEach((mole) => mole.classList.remove('visible'));

  // ランダムな穴とキャラクターを選択
  const randomIndex = getRandomNumber(0, HOLE_COUNT - 1);
  const randomCharacter =
    CHARACTER_TYPES[getRandomNumber(0, CHARACTER_TYPES.length - 1)];

  const selectedMole = holes[randomIndex];
  selectedMole.className = `mole ${randomCharacter.className} visible`;
  selectedMole.dataset.score = randomCharacter.score;
  selectedMole.dataset.message = randomCharacter.message;
};

// 貧乏神を叩いたときの処理
const handleMoleClick = (event) => {
  if (!isGameActive) return;

  const clickedMole = event.target;
  if (clickedMole.classList.contains('visible')) {
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
  timerEl.textContent = timeRemaining;
  gameMessage.textContent = '目標スコア ' + TARGET_SCORE + ' 点';
  isGameActive = false;
  startButton.style.display = 'block';
};

// ゲーム開始
const startGame = () => {
  if (isGameActive) return;

  isGameActive = true;
  startButton.style.display = 'none';
  gameMessage.textContent = 'ゲーム開始！';

  // 貧乏神の出現を定期的に実行
  spawnId = setInterval(showRandomMole, SPAWN_INTERVAL);

  // タイマーを開始
  timerId = setInterval(() => {
    timeRemaining--;
    timerEl.textContent = timeRemaining;
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
  holes.forEach((mole) => mole.classList.remove('visible'));

  if (score >= TARGET_SCORE) {
    gameMessage.textContent = '🎉ゲームクリア！おめでとうございます！🎉';
    // ★ ちょっと演出を見せてから、クリア印を保存して元ページへ戻る
    setTimeout(saveClearedAndReturn, 1200);
    return; // ★ 戻る前に再初期化しない
  } else {
    gameMessage.textContent = '残念…ゲームオーバーです。';
  }

  // 少し待ってからゲームを初期化
  setTimeout(initializeGame, 3000);
};

// イベントリスナー
startButton.addEventListener('click', startGame);
holesContainer.addEventListener('click', handleMoleClick);

// 最初のゲーム初期化
initializeGame();
