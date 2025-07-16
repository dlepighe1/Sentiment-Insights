// static/js/analyze.js

// Full implementation with aligned top contributor labels and bars
// Sidebar selector with Tailwind, GSAP animations, and responsive layout

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("analyze-container");
  const sidebar   = document.getElementById("sidebar");
  const content   = document.getElementById("content-area");
  let resultSec   = null;
  const isMobile  = () => window.innerWidth < 768;

  // 1) Initial GSAP entrance
  gsap.set([sidebar, content], { opacity: 0, y: -20 });
  gsap.to(sidebar, { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.2 });
  gsap.to(content, { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.4 });

  // 2) Section loader & sidebar highlight
  window.loadSection = sec => {
    document.querySelectorAll(".form-section").forEach(f => f.classList.add("hidden"));
    document.getElementById(`${sec}-form`).classList.remove("hidden");

    // teardown existing result panel
    if (resultSec) {
      gsap.to(resultSec, {
        duration: 0.5,
        width: 0,
        autoAlpha: 0,
        ease: "power2.inOut",
        onComplete: () => {
          resultSec.remove();
          resultSec = null;
          gsap.to(content, {
            duration: 0.5,
            width: isMobile() ? "100%" : "20rem",
            ease: "power2.inOut"
          });
        }
      });
    }
    if (sec === "scrape") document.getElementById("scrape-output").innerHTML = "";

    // update sidebar buttons
    document.querySelectorAll(".option-btn").forEach(btn => {
      const selected = btn.dataset.sec === sec;
      btn.classList.toggle("scale-105", selected);
      btn.classList.toggle("opacity-100", selected);
      btn.classList.toggle("font-semibold", selected);
      btn.classList.toggle("bg-opacity-30", selected);
      btn.classList.toggle("border-l-4", selected);
      btn.classList.toggle("border-blue-400", selected);
      btn.classList.toggle("scale-95", !selected);
      btn.classList.toggle("opacity-80", !selected);
      btn.classList.toggle("border-transparent", !selected);
    });
  };
  loadSection("text");

  // 3) Create result panel wrapper
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

  // 4) Reveal panel
  function revealResults() {
    createResultPanel();
    gsap.to(content, {
      duration: 0.4,
      width: isMobile() ? "100%" : "20rem",
      ease: "power2.out"
    });
    gsap.to(resultSec, {
      duration: 0.7,
      width: isMobile() ? "100%" : "40vw",
      autoAlpha: 1,
      ease: "power4.out"
    });
  }

  // 5) Text Prediction
  document.getElementById("text-form").addEventListener("submit", async e => {
    e.preventDefault();
    const model = document.getElementById("text-model-select").value;
    const text  = document.getElementById("text-input").value.trim();
    if (!text) return;

    const res = await fetch("/predict_text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, text })
    });
    const { prediction, probabilities, top_features } = await res.json();

    createResultPanel();
    const colorMap = { positive: "#4ade80", neutral: "#fbbf24", negative: "#f87171" };

    // build HTML
    let html = `<h3 class="text-xl font-semibold mb-4">Prediction: <span class="uppercase">${prediction}</span></h3>`;
    html += `<div id="prob-container" class="space-y-3">`;
    Object.entries(probabilities).forEach(([label,p], i) => {
      html += `
        <div class="flex items-center space-x-3">
          <span class="w-24 text-white leading-none capitalize">${label}</span>
          <div class="relative flex-1 h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div class="bar h-3 rounded-full absolute left-0"
                 style="width:0; top:50%; transform: translateY(-50%);
                        background:${colorMap[label]}; box-shadow:0 0 8px ${colorMap[label]}; backdrop-filter:blur(4px);"
                 data-perc="${(p*100).toFixed(1)}"></div>
          </div>
          <span class="w-12 text-right text-white leading-none">${(p*100).toFixed(1)}%</span>
        </div>`;
    });
    html += `</div>`;

    // top contributors with same label alignment
    html += `<h4 class="text-lg font-medium mt-6 mb-2">Top contributors</h4>`;
    html += `<div id="feat-container" class="space-y-3">`;
    top_features.forEach((tf,i) => {
      html += `
        <div class="flex items-center space-x-3">
          <span class="w-24 text-white truncate">${tf.feature}</span>
          <div class="relative flex-1 h-3 bg-white bg-opacity-10 border border-white/50 rounded-full overflow-hidden">
            <div class="feature-bar h-3 rounded-full absolute left-0"
                 style="width:0; top:50%; transform: translateY(-50%);
                        background:rgba(255,255,255,0.9); box-shadow:inset 0 0 8px rgba(255,255,255,0.9); backdrop-filter:blur(4px);"
                 data-perc="${(tf.contribution*100).toFixed(1)}"></div>
          </div>
          <span class="w-12 text-right text-white leading-none">${tf.contribution.toFixed(3)}</span>
        </div>`;
    });
    html += `</div>`;

    resultSec.innerHTML = html;
    revealResults();

    // animate probability bars
    document.querySelectorAll("#prob-container .bar").forEach((bar,idx) => {
      gsap.to(bar, { duration:0.8, width:bar.dataset.perc + '%', ease:'power2.out', delay:idx*0.1 });
    });
    // animate feature bars
    document.querySelectorAll("#feat-container .feature-bar").forEach((bar,idx) => {
      gsap.to(bar, { duration:0.8, width:bar.dataset.perc + '%', ease:'power2.out', delay:idx*0.1 });
    });
  });

  // 6) Bulk Prediction
  document.getElementById("bulk-form").addEventListener("submit", e => {
    e.preventDefault();
    createResultPanel();
    const dummy = [
      { text:"This is great!", sentiment:"Positive", score:0.92 },
      { text:"Not bad, could improve.", sentiment:"Neutral", score:0.45 },
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
            ${dummy.map((r,i) => `
              <tr class="odd:bg-white/10 even:bg-transparent">
                <td class="border px-2 py-1">${i+1}</td>
                <td class="border px-2 py-1">${r.text}</td>
                <td class="border px-2 py-1">${r.sentiment}</td>
                <td class="border px-2 py-1">${r.score.toFixed(2)}</td>
              </tr>`).join('')}
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

  // 7) Web Scraper
  document.getElementById("scrape-form").addEventListener("submit", e => {
    e.preventDefault();
    const out = document.getElementById("scrape-output");
    out.className = "mt-4 overflow-auto hide-scrollbar max-h-[60vh] text-white";
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
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <button id="scrape-predict-btn" class="w-full py-2 rounded bg-blue-600">Predict Scraped</button>
      `;
      document.getElementById("scrape-predict-btn").onclick = () => document.getElementById("bulk-form").dispatchEvent(new Event("submit"));
      revealResults();
    }, 1000);
  });

  // 8) Resize handler
  window.addEventListener("resize", () => {
    if (resultSec) {
      gsap.set(content,    { width: isMobile() ? "100%" : "20rem" });
      gsap.set(resultSec,  { width: isMobile() ? "100%" : "40vw" });
    }
  });
});
