import fs from "fs";
import Parser from "rss-parser";
import slugify from "slugify";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "AlienBlogBot/1.0" }
});

const FEEDS = [
  "https://www.nasa.gov/rss/dyn/breaking_news.rss",
  "https://www.space.com/feeds/all"
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function alienInterpretation(title) {
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

  const topItems = items.slice(0, 3);

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