import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";
import axios from "axios";

process.on("unhandledRejection", err => {
  console.log("Unhandled rejection:", err.message);
});

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "Markets" },
  { url: "https://cointelegraph.com/rss", category: "Crypto" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World" }
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function generateDashboardMetrics(selectedNews) {

  let vix = null;
  let btcVol = null;

  try {

   const vixRes = await axios.get(
  "https://query2.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX",
  {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json"
     }
   }
  );

    vix = vixRes.data.quoteResponse.result[0].regularMarketPrice;

    console.log("REAL VIX:", vix);

  } catch (err) {

    console.log("VIX error:", err.message);

    // fallback ONLY if API fails
    vix = 20 + Math.random() * 5;

  }

  try {

    const btcRes = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin",
      { timeout: 15000 }
    );

    btcVol =
      btcRes.data.market_data.price_change_percentage_24h;

    console.log("REAL BTC VOL:", btcVol);

  } catch (err) {

    console.log("BTC error:", err.message);

    btcVol = 3 + Math.random() * 5;

  }

  const globalStability = Math.max(100 - vix, 5).toFixed(0);

  let marketRisk = "LOW";

  if (vix > 25) marketRisk = "HIGH";
  else if (vix > 18) marketRisk = "MODERATE";

  return {

    globalStability,
    marketRisk,
    stockVolatility: vix.toFixed(2),
    cryptoVolatility: Math.abs(btcVol).toFixed(2),
    latestAlert: selectedNews?.[0]?.title || "No alert"

  };

}

(async () => {

  try {

    let collected = [];

    for (const feed of FEEDS) {

      try {
        const result = await parser.parseURL(feed.url);

        result.items.slice(0, 2).forEach(item => {
          collected.push({
            ...item,
            category: feed.category
          });
        });

      } catch {
        console.log("Feed failed:", feed.url);
      }

    }

    if (!collected.length) {
      console.log("No news items found.");
      return;
    }

    const shuffled = collected.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    const dashboard = await generateDashboardMetrics(selected);

if (!fs.existsSync("src/_data")) {
  fs.mkdirSync("src/_data", { recursive: true });
}

// FORCE update with timestamp and runId

const dashboardWithTimestamp = {

  ...dashboard,

  updated: new Date().toISOString(),

  runId: Date.now()

};

fs.writeFileSync(
  "src/_data/dashboard.json",
  JSON.stringify(dashboardWithTimestamp, null, 2)
);

console.log("Dashboard updated:", dashboardWithTimestamp);

    let body = `<h2>Global Intelligence Briefing</h2>`;

    selected.forEach(item => {
      body += `
<h3>${item.title}</h3>
<p>${item.contentSnippet || ""}</p>
<p><a href="${item.link}" target="_blank">Source</a></p>
<hr>
`;
    });

    const today = getToday();
    const slug = slugify(`${today}-briefing`, { lower: true });

    if (!fs.existsSync("src/posts")) {
      fs.mkdirSync("src/posts", { recursive: true });
    }

    const content = `---
title: "Global Intelligence Briefing - ${today}"
layout: layout.njk
date: "${today}"
---

${body}
`;

    fs.writeFileSync(`src/posts/${slug}.md`, content);

    console.log("Post created successfully");

  } catch (err) {
    console.log("Main script error:", err.message);
  }

})();