// HTML要素の取得
const puzzleBoard = document.getElementById('puzzle-board');
const messageDisplay = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

// ゲームの状態管理
const BOARD_SIZE = 9;
const emptyPieceIndex = 8;
let pieces = [];
let gameActive = false;

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

// ピースをシャッフル
const shufflePieces = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    // 空きマスを最後に移動
    const emptyPiece = array.splice(array.findIndex(p => p.classList.contains('empty')), 1)[0];
    array.push(emptyPiece);
    return array;
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
        // pieces配列内の要素を交換
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
        messageDisplay.textContent = '🎉 クリアおめでとうございます！ 🎉';
        document.querySelector('.puzzle-piece.empty').style.backgroundImage = `url('good_binbougami.png')`;
        document.querySelector('.puzzle-piece.empty').classList.remove('empty');
    }
};

// ゲーム開始
const startGame = () => {
    gameActive = true;
    messageDisplay.textContent = 'パズルを完成させよう！';
    createPieces();
    pieces = shufflePieces(pieces);
    updateBoard();
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