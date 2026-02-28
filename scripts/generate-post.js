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

/*
  REAL MARKET METRICS ENGINE
  Pulls live volatility and risk indicators
*/
async function generateDashboardMetrics(selectedNews) {

  let vix = 0;
  let btcVol = 0;

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

    console.log("LIVE VIX:", vix);

  } catch (err) {

    console.log("VIX fetch failed:", err.message);

    vix = 20; // neutral fallback

  }

  try {

    const btcRes = await axios.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin",
      { timeout: 15000 }
    );

    btcVol =
      btcRes.data.market_data.price_change_percentage_24h;

    console.log("LIVE BTC VOL:", btcVol);

  } catch (err) {

    console.log("BTC fetch failed:", err.message);

    btcVol = 3;

  }

  const globalStability =
    Math.max(5, Math.min(100, Math.round(100 - vix)));

  let marketRisk = "LOW";

  if (vix > 25) marketRisk = "HIGH";
  else if (vix > 18) marketRisk = "MODERATE";

  let alert = "Markets stable";

  if (vix > 25)
    alert = "Extreme volatility detected in global markets";

  else if (btcVol > 6)
    alert = "Crypto market experiencing elevated volatility";

  else if (selectedNews?.length)
    alert = selectedNews[0].title;

  return {

    globalStability,
    marketRisk,
    stockVolatility: Number(vix).toFixed(2),
    cryptoVolatility: Math.abs(btcVol).toFixed(2),
    latestAlert: alert,

    updated: new Date().toISOString(),
    runId: Date.now()

  };

}

/*
  MAIN EXECUTION ENGINE
*/
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

      } catch (err) {

        console.log("Feed failed:", feed.url);

      }

    }

    if (!collected.length) {

      console.log("No news collected");

      return;

    }

    const shuffled =
      collected.sort(() => 0.5 - Math.random());

    const selected = shuffled.slice(0, 5);

    /*
      UPDATE DASHBOARD DATA
    */
    const dashboard =
      await generateDashboardMetrics(selected);

    if (!fs.existsSync("src/_data")) {

      fs.mkdirSync("src/_data", { recursive: true });

    }

    fs.writeFileSync(

      "src/_data/dashboard.json",

      JSON.stringify(dashboard, null, 2)

    );

    fs.writeFileSync(
    "src/assets/dashboard.json",
    JSON.stringify(dashboardWithTimestamp, null, 2)
   );

    console.log("Dashboard updated:", dashboard);

    /*
      CREATE BLOG POST
    */
    let body = `
<h2>Global Intelligence Briefing</h2>
<p>Automated intelligence assessment of global markets, crypto, and geopolitical stability.</p>
<hr>
`;

    selected.forEach(item => {

      body += `
<div class="intel-card">

<span class="intel-category">
${item.category}
</span>

<h3>${item.title}</h3>

<p>
${item.contentSnippet}
</p>

<p>
<a href="${item.link}" target="_blank">
View Source →
</a>
</p>

</div>
`;

    });

    const today = getToday();

    const slug =
      slugify(`${today}-briefing`, { lower: true });

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

    fs.writeFileSync(

      `src/posts/${slug}.md`,
      content

    );

    console.log("Intelligence post created:", slug);

  } catch (err) {

    console.log("Fatal error:", err.message);

  }

})();