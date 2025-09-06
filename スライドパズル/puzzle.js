// HTML要素の取得
const puzzleBoard = document.getElementById('puzzle-board');
const messageDisplay = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

// ゲームの状態管理
const BOARD_SIZE = 9;
const emptyPieceIndex = 8;
let pieces = [];
let gameActive = false;

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
        piece.className = 'puzzle-piece';
        piece.dataset.index = i;
        
        if (i === emptyPieceIndex) {
            piece.classList.add('empty');
        } else {
            const col = i % 3;
            const row = Math.floor(i / 3);
            piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
        }
        
        pieces.push(piece);
    }
};

// ピースをシャッフル
const shufflePieces = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// パズルボードの更新
const updateBoard = () => {
    puzzleBoard.innerHTML = '';
    pieces.forEach(piece => {
        puzzleBoard.appendChild(piece);
    });
};

// ピースの移動
const handlePieceClick = (e) => {
    if (!gameActive) return;

    const clickedPiece = e.target;
    if (!clickedPiece.classList.contains('puzzle-piece') || clickedPiece.classList.contains('empty')) {
        return;
    }

    const clickedIndex = pieces.indexOf(clickedPiece);
    const emptyPiece = document.querySelector('.puzzle-piece.empty');
    const emptyIndex = pieces.indexOf(emptyPiece);

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
        document.querySelector('.puzzle-piece.empty').style.backgroundImage = `url('background-image.jpeg')`;
        document.querySelector('.puzzle-piece.empty').classList.remove('empty');

        // ちょっと演出を見せてから元ページへ戻る
        setTimeout(saveClearedAndReturn, 1200);
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

// イベントリスナー
restartButton.addEventListener('click', startGame);
puzzleBoard.addEventListener('click', handlePieceClick);

// 最初のゲーム開始
startGame();