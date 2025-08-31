// HTML要素の取得
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const restartButton = document.getElementById('restart-button');

// ゲームの状態管理
let gameActive = true;
let currentPlayer = 'o';
let board = ['', '', '', '', '', '', '', '', ''];

// ★ もとのAmazon商品URLを取得（index.html?product=... で渡される想定）
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');

// ★ 商品キーを作成（/dp/ASIN を優先、無ければURL全体）
const getProductKey = (url) => {
  const m = url?.match(/\/dp\/([A-Z0-9]{10})/i);
  return m ? m[1] : url;
};

// ★ 「クリア済み」を保存して元ページに戻る
const saveClearedAndReturn = () => {
  if (!productUrl) {
    console.warn('★ productUrl が見つかりません（クエリ ?product=... が必要）');
    return;
  }
  const key = getProductKey(productUrl);

  // chrome.storage.local に「商品ごとのクリア印」を保存（要 manifest: "permissions": ["storage"]）
  if (chrome?.storage?.local) {
    chrome.storage.local.get({ cleared: {} }, ({ cleared }) => {
      cleared[key] = Date.now();
      chrome.storage.local.set({ cleared }, () => {
        // 元のAmazon商品ページへ戻る
        window.location.href = productUrl;
      });
    });
  } else {
    // フォールバック（そのまま戻るだけ）
    window.location.href = productUrl;
  }
};

// 勝利条件
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// メッセージ表示
const handleStatusDisplay = (message) => {
    statusDisplay.textContent = message;
};

// 勝敗判定ロジック
const checkResult = () => {
    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        const a = board[winCondition[0]];
        const b = board[winCondition[1]];
        const c = board[winCondition[2]];
        
        if (a === '' || b === '' || c === '') {
            continue;
        }

        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        // 貧乏神が勝った場合のメッセージ
        if (currentPlayer === 'x') {
            handleStatusDisplay(`貧乏神の勝ち！🎉`);
        } else {
            handleStatusDisplay(`あなたの勝ち！🎉`);
            // ★ 「あなたの勝ち！」ならクリア扱い → 少し演出を見せてから戻る
            setTimeout(saveClearedAndReturn, 1200);
        }
        gameActive = false;
        restartButton.classList.remove('hidden');
        return true;
    }

    const isDraw = !board.includes('');
    if (isDraw) {
        handleStatusDisplay('引き分けです。');
        gameActive = false;
        restartButton.classList.remove('hidden');

        // ★（任意）引き分けでもクリア扱いにしたい場合は下の行を有効化
        // setTimeout(saveClearedAndReturn, 1200);

        return true;
    }

    return false;
};

// プレイヤーのターン
const handlePlayerTurn = (clickedCell, clickedCellIndex) => {
    board[clickedCellIndex] = 'o';
    clickedCell.textContent = 'O';
    clickedCell.classList.add('player-o');
    
    if (checkResult()) return;

    currentPlayer = 'x';
    // ここを変更
    handleStatusDisplay('貧乏神の番です (✕)');
    setTimeout(handleAITurn, 1000); // 1秒後にAIを動作させる
};

// AIのターン（ミニマックス法）
const handleAITurn = () => {
    if (!gameActive) return;

    const bestMove = getBestMove();
    
    board[bestMove] = 'x';
    cells[bestMove].textContent = 'X';
    cells[bestMove].classList.add('player-x');

    if (checkResult()) return;

    currentPlayer = 'o';
    handleStatusDisplay('あなたの番です (〇)');
};

// ミニマックス法を実装
const getBestMove = () => {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'x';
            let score = minimax(board, 0, false);
            board[i] = ''; // 元に戻す
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
};

const minimax = (board, depth, isMaximizingPlayer) => {
    const winner = checkWinner(board);
    if (winner !== null) {
        if (winner === 'x') return 10 - depth;
        if (winner === 'o') return depth - 10;
        return 0; // 引き分け
    }

    if (isMaximizingPlayer) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'x';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'o';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
};

const checkWinner = (currentBoard) => {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
            return currentBoard[a];
        }
    }
    if (!currentBoard.includes('')) {
        return 'draw';
    }
    return null;
};

// イベントリスナー
cells.forEach(cell => cell.addEventListener('click', (event) => {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] === '' && gameActive && currentPlayer === 'o') {
        handlePlayerTurn(clickedCell, clickedCellIndex);
    }
}));

restartButton.addEventListener('click', () => {
    gameActive = true;
    currentPlayer = 'o';
    board = ['', '', '', '', '', '', '', '', ''];
    // ここを変更
    handleStatusDisplay('あなたの番です (〇)');
    restartButton.classList.add('hidden');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('player-o', 'player-x');
    });
});
