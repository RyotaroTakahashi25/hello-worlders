const buyButton = document.getElementById("buy-now-button")
    || document.getElementById("add-to-cart-button");

if (buyButton) {
    buyButton.addEventListener("click", (e) => {
        e.preventDefault(); // 通常の購入を止める

        // オーバーレイ作成
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        });

        // コンテンツ作成
        const content = document.createElement("div");
        Object.assign(content.style, {
            color: "white",
            fontSize: "24px",
            textAlign: "center",
        });

        //ここにホップ作成のHTMLを挿入
        content.innerHTML =


            overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Yes ボタン　ここにララ作成のサイトURLを挿入
        content.querySelector("#yesButton").addEventListener("click", () => {
            alert("正解！試練サイトへ移動します");
            chrome.storage.local.set({ returnUrl: window.location.href }, () => {
                window.location.href = "https://your-mission-site.example.com";
            });
        });

        // No ボタン
        content.querySelector("#noButton").addEventListener("click", () => {
            alert("購入キャンセルしました");
            document.body.removeChild(overlay); // オーバーレイを閉じる
        });
    });
}