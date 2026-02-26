import axios from "axios";
import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";


async function generateDashboardMetrics(selectedNews) {

  async function generateDashboardMetrics(selectedNews) {

  let vix = 18;
  let btcVol = 3.5;

  try {

    const vixRes = await axios.get(
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX",
      { timeout: 10000 }
    );

    if (vixRes.data?.quoteResponse?.result?.length > 0) {
      vix = vixRes.data.quoteResponse.result[0].regularMarketPrice;
    }

  } catch (e) {
    console.log("VIX fetch failed, using fallback");
  }

  try {

    const btcRes = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { timeout: 10000 }
    );

    if (btcRes.data?.bitcoin?.usd_24h_change !== undefined) {
      btcVol = Math.abs(btcRes.data.bitcoin.usd_24h_change);
    }

  } catch (e) {
    console.log("BTC fetch failed, using fallback");
  }

  const globalStability = Math.max(100 - vix, 10).toFixed(0);

  let marketRisk = "LOW";

  if (vix > 25) marketRisk = "HIGH";
  else if (vix > 18) marketRisk = "MODERATE";

  return {

    globalStability,
    marketRisk,
    stockVolatility: vix.toFixed(2),
    cryptoVolatility: btcVol.toFixed(2),
    latestAlert: selectedNews?.[0]?.title || "No alert available"

  };

}

const parser = new Parser({ timeout: 10000 });

const FEEDS = [

  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EDJI,%5EIXIC&region=US&lang=en-US", category: "Markets" },
  { url: "https://cointelegraph.com/rss", category: "Crypto" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", category: "Politics" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", category: "Technology" }

];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function generateAnalysis(item, category) {

  const impactScore = (Math.random() * 100).toFixed(0);
  const volatility = (Math.random() * 10).toFixed(2);

  return `
<div class="intel-card">

<div class="intel-header">
<span class="intel-category">${category}</span>
<h3>${item.title}</h3>
</div>

<div class="intel-summary">
<p>${item.contentSnippet || "No summary available."}</p>
</div>

<div class="intel-analysis">

<h4>Human Intelligence Analysis</h4>

<p>
This event indicates structural movement within the ${category.toLowerCase()} domain.
Patterns suggest increasing acceleration in global system dynamics.
</p>

<p>
Impact Score: <strong>${impactScore}/100</strong><br>
Volatility Index: <strong>${volatility}</strong>
</p>

</div>

<a href="${item.link}" target="_blank">View Source</a>

</div>
`;
}

function alienAssessment(items) {

  const threatLevel = (Math.random() * 100).toFixed(0);

  return `
<div class="alien-assessment">

<h2>Alien Intelligence Assessment</h2>

<p>
Human civilization entering accelerated transition phase.
Observed increase in economic and technological instability.
</p>

<p>
Threat Level: <strong>${threatLevel}%</strong>
</p>

<p>
Probability of major global structural shift rising.
Monitoring continues.
</p>

</div>
`;
}

(async () => {

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

    } catch {}

  }

  if (!collected.length) return;

  const shuffled = collected.sort(() => 0.5 - Math.random());

  const selected = shuffled.slice(0, 6);

const dashboard = generateDashboardMetrics(selected);

if (!fs.existsSync("src/_data")) {
  fs.mkdirSync("src/_data", { recursive: true });
}

fs.writeFileSync(
  "src/_data/dashboard.json",
  JSON.stringify(dashboard, null, 2)
);

  let body = `<h2>Global Intelligence Briefing</h2>`;

  selected.forEach(item => {

    body += generateAnalysis(item, item.category);

  });

  body += alienAssessment(selected);

  const today = getToday();

  const slug = slugify(`${today}-global-intelligence`, { lower: true });

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

const existing = fs.readdirSync("src/posts");

if (existing.length > 0) {

  const latest = existing[existing.length - 1];

  if (latest.includes(today)) {

    console.log("Post already exists today");

    return;

  }

}

  fs.writeFileSync(`src/posts/${slug}.md`, content);

  console.log("Intelligence briefing created");

})();