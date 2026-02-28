import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";
import axios from "axios";

process.on("unhandledRejection", err => {
  console.log("Unhandled rejection:", err.message);
});

const parser = new Parser({ timeout: 15000 });

const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "Markets" },
  { url: "https://cointelegraph.com/rss", category: "Crypto" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World" }
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function generateDashboardMetrics(selectedNews) {

  let vix = 20;
  let btcVol = 3;

  try {

    const vixRes = await axios.get(
      "https://query2.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX",
      {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    vix = vixRes.data.quoteResponse.result[0].regularMarketPrice;

  } catch (err) {

    console.log("VIX fetch failed:", err.message);

  }

  try {

    const btcRes = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin",
      { timeout: 15000 }
    );

    btcVol =
      btcRes.data.market_data.price_change_percentage_24h;

  } catch (err) {

    console.log("BTC fetch failed:", err.message);

  }

  const globalStability =
    Math.max(5, Math.min(100, Math.round(100 - vix)));

  let marketRisk = "LOW";

  if (vix > 25) marketRisk = "HIGH";
  else if (vix > 18) marketRisk = "MODERATE";

  return {

    globalStability,
    marketRisk,
    stockVolatility: Number(vix).toFixed(2),
    cryptoVolatility: Math.abs(btcVol).toFixed(2),
    latestAlert: selectedNews?.[0]?.title || "Markets stable",
    updated: new Date().toISOString(),
    runId: Date.now()

  };

}

(async () => {

  try {

    let collected = [];

    for (const feed of FEEDS) {

      try {

        const result = await parser.parseURL(feed.url);

        result.items.slice(0, 3).forEach(item => {

          collected.push({

            title: item.title,
            link: item.link,
            contentSnippet: item.contentSnippet || "",
            category: feed.category

          });

        });

      } catch {

        console.log("Feed failed:", feed.url);

      }

    }

    if (!collected.length) {

      console.log("No news collected");

      return;

    }

    const selected =
      collected.sort(() => 0.5 - Math.random()).slice(0, 5);

    const dashboard =
      await generateDashboardMetrics(selected);

    // ensure folders exist
    if (!fs.existsSync("src/_data"))
      fs.mkdirSync("src/_data", { recursive: true });

    if (!fs.existsSync("src"))
      fs.mkdirSync("src", { recursive: true });

    // write dashboard files (THIS FIXES EVERYTHING)
    fs.writeFileSync(
      "src/_data/dashboard.json",
      JSON.stringify(dashboard, null, 2)
    );

    fs.writeFileSync(
      "src/dashboard.json",
      JSON.stringify(dashboard, null, 2)
    );

    console.log("Dashboard.json created");

    // create blog post
    let body = `
<h2>Global Intelligence Briefing</h2>
<hr>
`;

    selected.forEach(item => {

      body += `
<div class="intel-card">
<span class="intel-category">${item.category}</span>
<h3>${item.title}</h3>
<p>${item.contentSnippet}</p>
<a href="${item.link}" target="_blank">Source →</a>
</div>
`;

    });

    const today = getToday();

    const slug =
      slugify(`${today}-briefing`, { lower: true });

    if (!fs.existsSync("src/posts"))
      fs.mkdirSync("src/posts", { recursive: true });

    fs.writeFileSync(

      `src/posts/${slug}.md`,

      `---
title: "Global Intelligence Briefing - ${today}"
layout: layout.njk
date: "${today}"
---

${body}
`

    );

    console.log("Post created");

  } catch (err) {

    console.log("Fatal error:", err.message);

  }

})();