// static/js/analyze.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("analyze-container");
  const sidebar   = document.getElementById("sidebar");
  const content   = document.getElementById("content-area");
  let   resultSec = null;

  // 1) Initial GSAP setup & entrance
  gsap.set(sidebar, { x: -100, opacity: 0 });
  gsap.set(content, { x:  100, opacity: 0 });
  gsap.to(sidebar,  { duration: 0.8, x: 0,   opacity: 1, ease: "power2.out", delay: 0.2 });
  gsap.to(content,  { duration: 0.8, x: 0,   opacity: 1, ease: "power2.out", delay: 0.5 });

  // 2) Tab switcher: hide forms, collapse result, reset widths
  window.loadSection = sec => {
    document.querySelectorAll(".form-section").forEach(f => f.classList.add("hidden"));
    document.getElementById(`${sec}-form`).classList.remove("hidden");

    if (resultSec) {
      // collapse right panel and reset flex
      gsap.to(resultSec, { duration: 0.4, flexGrow: 0, autoAlpha: 0, ease: "power2.out" });
    }
    // restore content fixed width
    gsap.to(content, { duration: 0.4, flexGrow: 0, width: "20rem", ease: "power2.out" });

    if (sec === "scrape") document.getElementById("scrape-output").innerHTML = "";
  };
  loadSection("text");

  // 3) Create the dynamic right panel
  function createResultPanel() {
    if (resultSec) return;
    resultSec = document.createElement("div");
    resultSec.id = "result-section";
    resultSec.className = [
      "bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl",
      "overflow-auto hide-scrollbar max-h-[calc(100vh-4rem)]",
      "flex-shrink-0 min-w-[20rem] flex-grow-0 text-white"
    ].join(" ");
    // start hidden and no flex
    gsap.set(resultSec, { autoAlpha: 0, flexGrow: 0 });
    container.appendChild(resultSec);
  }

  // 4) Reveal & flex-grow the right panel
  function revealResults() {
    createResultPanel();
    // animate flexGrow from 0 → 1, content stays at its width
    gsap.to(resultSec, {
      duration: 0.8,
      flexGrow: 1,
      autoAlpha: 1,
      ease: "power3.out"
    });
  }

  // 5) Dummy Text Prediction
  document.getElementById("text-form").addEventListener("submit", e => {
    e.preventDefault();
    createResultPanel();
    resultSec.innerHTML = `
      <h3 class="text-xl font-semibold mb-4">Prediction for Text</h3>
      <div class="space-y-4">
        ${["positive","neutral","negative"].map((k,i)=>`
          <div>${k}: ${[85,10,5][i]}%
            <div class="w-full bg-white bg-opacity-20 h-2 rounded mt-1">
              <div class="h-2 rounded" style="width:${[85,10,5][i]}%;background:${["#4ade80","#fbbf24","#f87171"][i]}"></div>
            </div>
          </div>`).join("")}
      </div>
      <h3 class="text-xl font-semibold mt-6">Sentiment distribution</h3>
      <canvas id="pie-chart" class="w-full h-40 mb-4"></canvas>
    `;
    new Chart(document.getElementById("pie-chart"), {
      type: "pie",
      data:{ labels:["Pos","Neu","Neg"], datasets:[{ data:[85,10,5] }] }
    });
    revealResults();
  });

  // 6) Dummy Bulk Prediction
  document.getElementById("bulk-form").addEventListener("submit", e => {
    e.preventDefault();
    createResultPanel();
    const dummy = [
      { text:"This is great!", sentiment:"Positive", score:0.92 },
      { text:"Not bad, could improve.", sentiment:"Neutral",  score:0.45 },
      { text:"Terrible experience.", sentiment:"Negative", score:0.10 }
    ];
    resultSec.innerHTML = `
      <h3 class="text-xl font-semibold mb-4">Prediction for Bulk Upload</h3>
      <div class="overflow-x-auto hide-scrollbar mb-4">
        <table class="w-full table-auto border-collapse border border-white/30">
          <thead>
            <tr class="bg-white/20">
              <th class="border px-2 py-1">#</th>
              <th class="border px-2 py-1">Text</th>
              <th class="border px-2 py-1">Sentiment</th>
              <th class="border px-2 py-1">Score</th>
            </tr>
          </thead>
          <tbody>
            ${dummy.map((r,i)=>`
              <tr class="odd:bg-white/10 even:bg-transparent">
                <td class="border px-2 py-1">${i+1}</td>
                <td class="border px-2 py-1">${r.text}</td>
                <td class="border px-2 py-1">${r.sentiment}</td>
                <td class="border px-2 py-1">${r.score.toFixed(2)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <h3 class="text-xl font-semibold mb-2">Sentiment distribution</h3>
      <canvas id="pie-chart" class="w-full h-40"></canvas>
    `;
    const counts = { Positive:1, Neutral:1, Negative:1 };
    new Chart(document.getElementById("pie-chart"), {
      type: "pie",
      data:{ labels:Object.keys(counts), datasets:[{ data:Object.values(counts) }] }
    });
    revealResults();
  });

  // 7) Dummy Web Scraper
  document.getElementById("scrape-form").addEventListener("submit", e => {
    e.preventDefault();
    const w = Math.min(window.innerWidth * 0.4, 400) + "px";
    gsap.to(content, { duration:0.5, width:w, ease:"power2.out" });

    const out = document.getElementById("scrape-output");
    out.className = "mt-4 overflow-auto hide-scrollbar max-h-[60vh] text-white";
    out.innerHTML = `<div class="animate-spin mx-auto w-6 h-6 border-4 rounded-full border-white border-t-transparent"></div>`;

    setTimeout(() => {
      const reviews = ["Good","Okay","Bad","Loved it","Hated it","Nice","Poor","Excellent","Fair","Terrible"];
      out.innerHTML = `
        <div class="overflow-x-auto hide-scrollbar mb-4">
          <table class="w-full table-auto border-collapse border border-white/30">
            <thead>
              <tr class="bg-white/20">
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Review</th>
              </tr>
            </thead>
            <tbody>
              ${reviews.map((t,i)=>`
                <tr class="odd:bg-white/10 even:bg-transparent">
                  <td class="border px-2 py-1">${i+1}</td>
                  <td class="border px-2 py-1">${t}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <button id="scrape-predict-btn" class="w-full py-2 rounded bg-blue-600">Predict Scraped</button>
      `;
      document.getElementById("scrape-predict-btn").onclick = () => {
        document.getElementById("bulk-form").dispatchEvent(new Event("submit"));
      };
    }, 1000);
  });
});
