// HTML要素の取得
const puzzleBoard = document.getElementById('puzzle-board');
const messageDisplay = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

// ゲームの状態管理
const BOARD_SIZE = 9;
const emptyPieceIndex = 8;
let pieces = [];
let gameActive = false;

// ★ もとのAmazon商品URLを取得（index.html?product=... で渡される）
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');

// ★追加: 難易度（boss）を取得
const boss = (params.get('boss') || 'weak').toLowerCase();

// ★追加: 難易度プリセット（最小改修）
// - timeLimitSec: 制限時間（小さくほど難しい）
// - shuffleSwaps: シャッフルで行う入れ替え回数（大きいほど難しい）
const DIFF = {
  weak:   { label: '小ボス', timeLimitSec: 90, shuffleSwaps: 20 },
  mid:    { label: '中ボス', timeLimitSec: 60, shuffleSwaps: 40 },
  strong: { label: '大ボス', timeLimitSec: 40, shuffleSwaps: 60 },
}[boss] || { label: '小ボス', timeLimitSec: 90, shuffleSwaps: 20 };

// ★追加: タイマー用
let timeRemaining = DIFF.timeLimitSec;
let timerId = null;

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

// パズルのピースを生成
const createPieces = () => {
  puzzleBoard.innerHTML = '';
  pieces = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    const piece = document.createElement('div');
    piece.classList.add('puzzle-piece');
    piece.dataset.index = i;
    if (i === emptyPieceIndex) {
      piece.classList.add('empty');
    } else {
      const row = Math.floor(i / 3);
      const col = i % 3;
      piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
    }
    pieces.push(piece);
    puzzleBoard.appendChild(piece);
  }
};

// ★変更: ピースをシャッフル（難易度に応じた入れ替え回数）
// 既存の完全シャッフルをやめ、解法可能・不可能は気にせず「入れ替え回数」を増減させる簡易方式
const shufflePieces = (array, swaps = DIFF.shuffleSwaps) => {
  // 空きマスは最後に維持したいので、空以外の範囲で入れ替え
  const candidates = array.filter(p => !p.classList.contains('empty'));
  const n = candidates.length;
  for (let s = 0; s < swaps; s++) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (i === j) continue;
    // pieces 配列内のインデックスを入れ替える
    const pi = pieces.indexOf(candidates[i]);
    const pj = pieces.indexOf(candidates[j]);
    [pieces[pi], pieces[pj]] = [pieces[pj], pieces[pi]];
  }
  // 空きマスを最後尾に寄せる（見た目を揃えるだけ）
  const emptyIdx = pieces.findIndex(p => p.classList.contains('empty'));
  if (emptyIdx !== pieces.length - 1) {
    const emptyPiece = pieces.splice(emptyIdx, 1)[0];
    pieces.push(emptyPiece);
  }
  return pieces;
};

// ピースの移動
const movePiece = (clickedPiece) => {
  if (!gameActive) return;

  const emptyPiece = document.querySelector('.puzzle-piece.empty');
  const clickedIndex = pieces.indexOf(clickedPiece);
  const emptyIndex = pieces.indexOf(emptyPiece);

  // 隣接判定
  const isAdjacent = (index1, index2) => {
    const row1 = Math.floor(index1 / 3);
    const col1 = index1 % 3;
    const row2 = Math.floor(index2 / 3);
    const col2 = index2 % 3;
    return (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1);
  };

  if (isAdjacent(clickedIndex, emptyIndex)) {
    [pieces[clickedIndex], pieces[emptyIndex]] = [pieces[emptyIndex], pieces[clickedIndex]];
    updateBoard();
    checkWin();
  }
};

// クリア判定
const checkWin = () => {
  const isSolved = pieces.every((piece, index) => {
    return parseInt(piece.dataset.index) === index;
  });

  if (isSolved) {
    gameActive = false;
    // ★追加: タイマー停止
    if (timerId) clearInterval(timerId);

    messageDisplay.textContent = '🎉 クリアおめでとうございます！ 🎉';
    document.querySelector('.puzzle-piece.empty').style.backgroundImage = `url('good_binbougami.png')`;
    document.querySelector('.puzzle-piece.empty').classList.remove('empty');

    setTimeout(saveClearedAndReturn, 1200);
  }
};

// ゲーム開始
const startGame = () => {
  gameActive = true;
  // ★追加: タイマー初期化
  timeRemaining = DIFF.timeLimitSec;
  messageDisplay.textContent = `${DIFF.label}｜パズルを完成させよう！ 残り ${timeRemaining} 秒`;
  createPieces();
  pieces = shufflePieces(pieces); // ★変更: 難易度反映シャッフル
  updateBoard();

  // ★追加: カウントダウン開始（簡単な失敗条件）
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    if (!gameActive) return;
    timeRemaining--;
    if (timeRemaining <= 0) {
      clearInterval(timerId);
      gameActive = false;
      messageDisplay.textContent = '時間切れ…残念！';
      // 少し待ってから再スタート可能に
      setTimeout(() => {
        restartButton.disabled = false;
      }, 200);
    } else {
      messageDisplay.textContent = `${DIFF.label}｜パズルを完成させよう！ 残り ${timeRemaining} 秒`;
    }
  }, 1000);
};

// パズルボードの更新
const updateBoard = () => {
  puzzleBoard.innerHTML = '';
  pieces.forEach(piece => {
    puzzleBoard.appendChild(piece);
  });
};

// イベントリスナー
restartButton.addEventListener('click', startGame);
puzzleBoard.addEventListener('click', (e) => {
  if (e.target.classList.contains('puzzle-piece') && !e.target.classList.contains('empty')) {
    movePiece(e.target);
  }
});

// 初期表示
startGame();

