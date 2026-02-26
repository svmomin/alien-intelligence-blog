import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";

const parser = new Parser();

const FEEDS = [

  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EDJI,%5EIXIC&region=US&lang=en-US",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",

  "https://cointelegraph.com/rss",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",

  "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
  "https://feeds.bbci.co.uk/news/world/rss.xml",

  "https://feeds.arstechnica.com/arstechnica/index",
  "https://www.theverge.com/rss/index.xml"

];

function alienInterpretation(title) {

  const probability = (Math.random() * 100).toFixed(2);

  return `
<h2>Alien Intelligence Assessment</h2>

<p>Monitoring human activity related to:</p>

<p><strong>${title}</strong></p>

<p>Global instability probability increased to ${probability}%</p>

<p>Surveillance continues.</p>
`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

(async () => {

  let items = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      items = items.concat(feed.items.slice(0, 2));
    } catch {}
  }

  if (!items.length) return;

  const shuffled = items.sort(() => 0.5 - Math.random());
  const topItems = shuffled.slice(0, 5);

  const today = getToday();

  const title = `Alien Intelligence Briefing - ${today}`;

  let body = `<h2>Global Intelligence Summary</h2>`;

  topItems.forEach(item => {

    body += `
<h3>${item.title}</h3>

<p>${item.contentSnippet || ""}</p>

<p><a href="${item.link}">Source</a></p>
`;

  });

  body += alienInterpretation(topItems[0].title);

  const slug = slugify(`${today}-alien-briefing`, { lower: true });

  if (!fs.existsSync("src/posts")) {
    fs.mkdirSync("src/posts", { recursive: true });
  }

  const content = `---
title: "${title}"
layout: layout.njk
date: "${today}"
---

${body}
`;

  fs.writeFileSync(`src/posts/${slug}.md`, content);

  console.log("Post created");

})();