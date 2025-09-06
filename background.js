const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "judgeReflection") {
    (async () => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + YOUR_OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "あなたは厳しい裁判官です。文章が真剣に購入理由を説明しているかを判定します。返答はOKかNGだけ。" },
            { role: "user", content: msg.text }
          ]
        })
      });
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      sendResponse({ result });
    })();
    return true; // 非同期レスポンスを使うため
  }
});
const YOUR_OPENAI_API_KEY = "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";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "judgeReflection") {
    (async () => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + YOUR_OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "あなたは厳しい裁判官です。文章が真剣に購入理由を説明しているかを判定します。返答はOKかNGだけ。" },
            { role: "user", content: msg.text }
          ]
        })
      });
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      sendResponse({ result });
    })();
    return true; // 非同期レスポンスを使うため
  }
});