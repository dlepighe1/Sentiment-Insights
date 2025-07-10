// static/js/analyze.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("analyze-container");
  const sidebar   = document.getElementById("sidebar");
  const content   = document.getElementById("content-area");
  let   resultSec = null;

  const isMobile = () => window.innerWidth < 768;

  // 1) Initial GSAP entrance
  gsap.set([sidebar, content], { opacity: 0, y: -20 });
  gsap.to(sidebar,  { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.2 });
  gsap.to(content,  { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.4 });

  // 2) Tab switcher
  window.loadSection = sec => {
    document.querySelectorAll(".form-section").forEach(f => f.classList.add("hidden"));
    document.getElementById(`${sec}-form`).classList.remove("hidden");

    if (resultSec) {
      // smoothly hide & remove existing panel
      gsap.to(resultSec, {
        duration: 0.5,
        width: 0,
        autoAlpha: 0,
        ease: "power2.inOut",
        onComplete: () => {
          resultSec.remove();
          resultSec = null;
          // restore content width
          gsap.to(content, {
            duration: 0.5,
            width: isMobile() ? "100%" : "20rem",
            ease: "power2.inOut"
          });
        }
      });
    }

    if (sec === "scrape") {
      document.getElementById("scrape-output").innerHTML = "";
    }
  };
  loadSection("text");

  // 3) Create right-hand panel
  function createResultPanel() {
    if (resultSec) return;
    resultSec = document.createElement("div");
    resultSec.id = "result-section";
    resultSec.className = [
      "bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl",
      "border border-white/30",
      "overflow-auto hide-scrollbar max-h-[calc(100vh-4rem)] text-white",
      "flex-shrink-0 w-full md:w-[40vw] max-w-[400px]"
    ].join(" ");
    gsap.set(resultSec, { width: 0, autoAlpha: 0 });
    container.appendChild(resultSec);
  }

  // 4) Reveal & animate
  function revealResults() {
    createResultPanel();
    // lock middle width
    gsap.to(content, {
      duration: 0.4,
      width: isMobile() ? "100%" : "20rem",
      ease: "power2.out"
    });
    // expand & fade in right panel
    gsap.to(resultSec, {
      duration: 0.7,
      width: isMobile() ? "100%" : "40vw",
      autoAlpha: 1,
      ease: "power4.out"
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
              <div class="h-2 rounded" style="width:${[85,10,5][i]}%"></div>
            </div>
          </div>`).join("")}
      </div>
      <h3 class="text-xl font-semibold mt-6">Sentiment distribution</h3>
      <canvas id="pie-chart" class="w-full h-40 mb-4"></canvas>
    `;
    new Chart(document.getElementById("pie-chart"), {
      type: "pie",
      data: { labels: ["Pos","Neu","Neg"], datasets: [{ data: [85,10,5] }] }
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
          <thead class="bg-white/20">
            <tr>
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
      <canvas id="pie-chart-bulk" class="w-full h-40"></canvas>
    `;
    const counts = { Positive:1, Neutral:1, Negative:1 };
    new Chart(document.getElementById("pie-chart-bulk"), {
      type: "pie",
      data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts) }] }
    });
    revealResults();
  });

  // 7) Web Scraper — only show panel when “Predict Scraped” clicked
  document.getElementById("scrape-form").addEventListener("submit", e => {
    e.preventDefault();
    const out = document.getElementById("scrape-output");
    out.innerHTML = `<div class="animate-spin mx-auto w-6 h-6 border-4 rounded-full border-white border-t-transparent"></div>`;
    setTimeout(() => {
      const reviews = ["Good","Okay","Bad","Loved it","Hated it","Nice","Poor","Excellent","Fair","Terrible"];
      out.innerHTML = `
        <div class="overflow-x-auto hide-scrollbar mb-4">
          <table class="w-full table-auto border-collapse border border-white/30">
            <thead class="bg-white/20">
              <tr>
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
        // trigger the bulk predictor logic
        document.getElementById("bulk-form").dispatchEvent(new Event("submit"));
      };
    }, 1000);
  });

  // 8) Handle window resize
  window.addEventListener("resize", () => {
    if (resultSec) {
      gsap.set(content,    { width: isMobile() ? "100%" : "20rem" });
      gsap.set(resultSec,  { width: isMobile() ? "100%" : "40vw" });
    }
  });
});
