async function updateDashboard() {

  try {

    // Fetch VIX
    const vixRes = await fetch(
      "https://query2.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX"
    );

    const vixData = await vixRes.json();

    const vix =
      vixData.quoteResponse.result[0].regularMarketPrice;

    // Fetch BTC volatility
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin"
    );

    const btcData = await btcRes.json();

    const btcVol =
      btcData.market_data.price_change_percentage_24h;

    // Calculate stability
    const stability =
      Math.max(5, Math.min(100, Math.round(100 - vix)));

    let risk = "LOW";

    if (vix > 25) risk = "HIGH";
    else if (vix > 18) risk = "MODERATE";

    // Update UI
    document.getElementById("stability").innerText =
      stability + "%";

    document.getElementById("risk").innerText =
      risk;

    document.getElementById("stockVol").innerText =
      vix.toFixed(2);

    document.getElementById("cryptoVol").innerText =
      Math.abs(btcVol).toFixed(2);

    document.getElementById("updated").innerText =
      new Date().toLocaleString();

  } catch (err) {

    console.log("Live update failed:", err);

  }

}

// Run immediately
updateDashboard();

// Refresh every 15 minutes
setInterval(updateDashboard, 900000);