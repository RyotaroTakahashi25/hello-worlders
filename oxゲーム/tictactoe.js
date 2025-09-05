// HTML要素の取得
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const restartButton = document.getElementById('restart-button');

// ゲームの状態管理
let gameActive = true;
let currentPlayer = 'o';
let board = ['', '', '', '', '', '', '', '', ''];

// ★ クエリ取得
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('product');
const boss = (params.get("boss") || "mid").toLowerCase(); // weak/mid/strong

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

  if (chrome?.storage?.local) {
    chrome.storage.local.get({ cleared: {} }, ({ cleared }) => {
      cleared[key] = Date.now();
      chrome.storage.local.set({ cleared }, () => {
        window.location.href = productUrl;
      });
    });
  } else {
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
        if (currentPlayer === 'x') {
            handleStatusDisplay(`貧乏神の勝ち！🎉`);
        } else {
            handleStatusDisplay(`あなたの勝ち！🎉`);
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
        // setTimeout(saveClearedAndReturn, 1200); // 引き分けでもクリア扱いにしたい場合
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
    handleStatusDisplay('貧乏神の番です (✕)');
    setTimeout(handleAITurn, 800); // AIは0.8秒後に動く
};

// ★ AIのターン（難易度調整付き）
const handleAITurn = () => {
    if (!gameActive) return;

    let move;
    if (boss === "weak") {
        // 弱いAI: ランダム
        const emptyCells = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (boss === "mid") {
        // 中くらいAI: 50%ランダム / 50%最適
        if (Math.random() < 0.5) {
            const emptyCells = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
            move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            move = getBestMove();
        }
    } else {
        // 強いAI: 常に最適
        move = getBestMove();
    }

    board[move] = 'x';
    cells[move].textContent = 'X';
    cells[move].classList.add('player-x');

    if (checkResult()) return;

    currentPlayer = 'o';
    handleStatusDisplay('あなたの番です (〇)');
};

// 最適手の計算
const getBestMove = () => {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'x';
            let score = minimax(board, 0, false);
            board[i] = '';
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
        return 0;
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
    handleStatusDisplay('あなたの番です (〇)');
    restartButton.classList.add('hidden');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('player-o', 'player-x');
    });
});
