async function updateDashboard() {

  try {

    const res = await fetch("/_data/dashboard.json");

    const data = await res.json();

    document.getElementById("stability").innerText =
      data.globalStability + "%";

    document.getElementById("risk").innerText =
      data.marketRisk;

    document.getElementById("stockVol").innerText =
      data.stockVolatility;

    document.getElementById("cryptoVol").innerText =
      data.cryptoVolatility;

    document.getElementById("updated").innerText =
      new Date(data.updated).toLocaleString();

  }
  catch(err) {

    console.log("Dashboard load error:", err);

  }

}

updateDashboard();

setInterval(updateDashboard, 900000);