import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "AlienBlogBot/1.0" }
});

const FEEDS = [

  // STOCK MARKET
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EDJI,%5EIXIC&region=US&lang=en-US",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",

  // CRYPTO
  "https://cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",

  // POLITICS
  "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
  "https://feeds.bbci.co.uk/news/politics/rss.xml",

  // WORLD / SOCIAL ISSUES
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",

  // EDUCATION
  "https://www.edutopia.org/rss.xml",

  // TECH / VIRAL
  "https://feeds.arstechnica.com/arstechnica/index",
  "https://www.theverge.com/rss/index.xml"

];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function alienInterpretation(title) {

  const probability = (Math.random() * 100).toFixed(2);

  return `
<h2>Alien Intelligence Assessment</h2>

<p>Human civilization shows significant activity shift related to:</p>

<p><strong>${title}</strong></p>

<p>Pattern analysis indicates increasing instability and rapid change across economic, political, and social systems.</p>

<p>Observed probability of global structural transformation: ${probability}%</p>

<p>Monitoring continues.</p>
`;
}
  return `
<h2>Alien Interpretation</h2>
<p>Human space activity continues to evolve. The recent development titled "<strong>${title}</strong>" indicates acceleration in planetary exploration.</p>

<p>Probability of human expansion beyond Earth increasing.</p>

<p>Observed pattern suggests sustained technological momentum.</p>
`;
}

(async () => {
  let items = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      items = items.concat(feed.items.slice(0, 3));
    } catch (e) {
      console.log("Feed error:", url);
    }
  }

  if (!items.length) {
    console.log("No RSS items found.");
    return;
  }

  const shuffled = items.sort(() => 0.5 - Math.random());
  const topItems = shuffled.slice(0, 5);

  const today = getToday();
  const title = `Alien Intelligence Briefing - ${today}`;

  let body = `<h2>Latest Human Space Developments</h2>`;

  topItems.forEach((item, index) => {
    body += `
<h3>${item.title}</h3>
<p>${item.contentSnippet || "No summary available."}</p>
<p><a href="${item.link}" target="_blank">Source</a></p>
`;
  });

  body += alienInterpretation(topItems[0].title);

  const slug = slugify(`${today}-alien-briefing`, { lower: true });

  const content = `---
title: "${title}"
layout: layout.njk
date: "${today}"
---

${body}
`;

  if (!fs.existsSync("src/posts")) {
  fs.mkdirSync("src/posts", { recursive: true });
}

fs.writeFileSync(`src/posts/${slug}.md`, content);

  console.log("✅ Free RSS-based post created.");
})();