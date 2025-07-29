
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("analyze-container");
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content-area");
  let resultSec = null;
  const isMobile = () => window.innerWidth < 768;

  // Bulk drag‑drop setup (unchanged) …
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");
  ;["dragenter", "dragover"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      dropArea.classList.add("border-blue-600", "bg-blue-100", "bg-opacity-30");
    })
  );
  ;["dragleave", "dragend", "drop"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
      e.preventDefault();
      dropArea.classList.remove("border-blue-600", "bg-blue-100", "bg-opacity-30");
    })
  );
  dropArea.addEventListener("drop", e => {
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      dropArea.querySelector("p").textContent = files[0].name;
    }
  });
  dropArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      dropArea.querySelector("p").textContent = fileInput.files[0].name;
    }
  });

  // Initial GSAP entrance (unchanged) …
  gsap.set([sidebar, content], { opacity: 0, y: -20 });
  gsap.to(sidebar, { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.2 });
  gsap.to(content, { duration: 0.6, opacity: 1, y: 0, ease: "power2.out", delay: 0.4 });

  // Show/hide forms + sidebar highlight
  window.loadSection = sec => {
    // 1) hide any result panel
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

    // 2) sidebar styling
    document.querySelectorAll(".option-btn").forEach(btn => {
      const sel = btn.dataset.sec === sec;
      btn.classList.remove("border-blue-400", "border-yellow-400");
      if (sel) {
        btn.classList.add("border-l-4",
          sec === "scrape" ? "border-yellow-400" : "border-blue-400"
        );
      }
      btn.classList.toggle("scale-105", sel);
      btn.classList.toggle("opacity-100", sel);
      btn.classList.toggle("font-semibold", sel);
      btn.classList.toggle("bg-opacity-30", sel);
      btn.classList.toggle("scale-95", !sel);
      btn.classList.toggle("opacity-80", !sel);
      btn.classList.toggle("border-transparent", !sel);
    });

    // 3) hide all sections, then show the one matching `sec`
    document.querySelectorAll(".form-section").forEach(f => f.classList.add("hidden"));
    document.getElementById(`${sec}-form`).classList.remove("hidden");
  };
  loadSection("text");  // startup

  // Result‐panel helpers (unchanged) …
  function createResultPanel() {
    if (resultSec) return;
    resultSec = document.createElement("div");
    resultSec.id = "result-section";
    resultSec.className = [
      "bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-2xl",
      "border border-white/30",
      "overflow-auto hide-scrollbar max-h-[calc(100vh-4rem)] text-white",
      "flex-shrink-0 w-full md:w-[60vw] max-w-[600px]"
    ].join(" ");
    gsap.set(resultSec, { width: 0, autoAlpha: 0 });
    container.appendChild(resultSec);
  }
  function revealResults() {
    createResultPanel();
    gsap.to(content, { duration: 0.4, width: isMobile() ? "100%" : "20rem", ease: "power2.out" });
    gsap.to(resultSec, { duration: 0.7, width: isMobile() ? "100%" : "40vw", autoAlpha: 1, ease: "power4.out" });
  }

  // 5) Text Prediction (unchanged)
  document.getElementById("text-form").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = document.querySelector('#text-form button[type="submit"]');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Predicting...`;

    const model = document.getElementById("text-model-select").value;
    const text = document.getElementById("text-input").value.trim();
    if (!text) { btn.disabled = false; btn.innerHTML = orig; return; }

    try {
      const res = await fetch("/predict_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, text })
      });
      if (!res.ok) throw new Error(await res.text());
      const { prediction, probabilities, top_features, explanation } = await res.json();

      createResultPanel();
      const colorMap = { positive: "#4ade80", neutral: "#fbbf24", negative: "#f87171" };
      let html = `<h3 class="text-xl font-semibold mb-4">Prediction: <span class="uppercase">${prediction}</span></h3>`;
      html += `<div id="prob-container" class="space-y-3">`;
      Object.entries(probabilities).forEach(([lbl, p], i) => {
        html += `
          <div class="flex items-center space-x-3">
            <span class="w-24 text-white capitalize">${lbl}</span>
            <div class="relative flex-1 h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div class="bar h-3 rounded-full absolute left-0"
                   style="width:0;top:50%;transform:translateY(-50%);
                          background:${colorMap[lbl]};box-shadow:0 0 8px ${colorMap[lbl]};"
                   data-perc="${(p * 100).toFixed(1)}%"></div>
            </div>
            <span class="w-12 text-right text-white">${(p * 100).toFixed(1)}%</span>
          </div>`;
      });
      html += `</div>`;

      html += `<h4 class="text-lg font-medium mt-6 mb-2">Top contributors</h4>`;
      html += `<div id="feat-container" class="space-y-3">`;
      top_features.forEach(tf => {
        html += `
          <div class="flex items-center space-x-3">
            <span class="w-24 text-white truncate">${tf.feature}</span>
            <div class="relative flex-1 h-3 bg-white bg-opacity-10 border border-white/50 rounded-full overflow-hidden">
              <div class="feature-bar h-3 rounded-full absolute left-0"
                   style="width:0;top:50%;transform:translateY(-50%);
                          background:rgba(255,255,255,0.9);box-shadow:inset 0 0 8px rgba(255,255,255,0.9);"
                   data-perc="${(tf.contribution * 100).toFixed(1)}%"></div>
            </div>
            <span class="w-12 text-right text-white">${tf.contribution.toFixed(3)}</span>
          </div>`;
      });
      if (model === "Meta Llama 3.3" && explanation) {
        html += `<h4 class="text-lg font-medium mt-6 mb-2">Explanation</h4>`;
        html += `<p class="text-white text-opacity-90">${explanation}</p>`;
      }
      html += `</div>`;

      resultSec.innerHTML = html;
      revealResults();
      gsap.utils.toArray("#prob-container .bar").forEach((bar, i) => {
        gsap.to(bar, { duration: 0.8, width: bar.dataset.perc, ease: "power2.out", delay: i * 0.1 });
      });
      gsap.utils.toArray("#feat-container .feature-bar").forEach((bar, i) => {
        gsap.to(bar, { duration: 0.8, width: bar.dataset.perc, ease: "power2.out", delay: i * 0.1 });
      });

    } catch (err) {
      console.error(err);
      alert("Text prediction failed: " + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  // 6) Bulk Prediction 
  const bulkForm = document.getElementById("bulk-form");
  const bulkModel = document.getElementById("bulk-model-select");

  bulkForm.addEventListener("submit", e => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) { alert("Select a CSV/TXT first"); return; }

    const btn = bulkForm.querySelector("button[type=submit]");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Predicting...`;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/predict_bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: bulkModel.value,
            filename: file.name,
            file_text: reader.result
          })
        });
        if (!res.ok) throw new Error(await res.text());
        const { data } = await res.json();
        displayBulkResults(data);
      } catch (err) {
        console.error(err);
        alert("Bulk prediction failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    };
    reader.readAsText(file);
  });

  function displayBulkResults(data) {
    createResultPanel();
    resultSec.innerHTML = `
    <h3 class="text-xl font-semibold mb-4">Bulk Results</h3>
    <div class="overflow-x-auto mb-6">
      <div class="min-w-full bg-white bg-opacity-10 rounded-lg shadow-lg">
        <table class="min-w-full divide-y divide-white/20 overflow-hidden rounded-lg">
          <thead class="bg-white bg-opacity-20">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">#</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Text</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Sentiment</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wide">Score</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/20">
            ${data.map((r, i) => `
              <tr class="hover:bg-white hover:bg-opacity-10 transition-colors duration-150">
                <td class="px-4 py-2 text-sm text-white">${i + 1}</td>
                <td class="px-4 py-2 text-sm text-white">${r.text}</td>
                <td class="px-4 py-2 text-sm text-white">${r.sentiment}</td>
                <td class="px-4 py-2 text-sm text-white text-right">${(r.score * 100).toFixed(1)}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <h3 class="text-xl font-semibold mb-4">Sentiment Distribution</h3>
    <canvas id="pie-chart-bulk" class="w-full h-40 rounded-lg shadow-lg"></canvas>
  `;
    revealResults();

    // build counts for pie chart
    const counts = data.reduce((acc, row) => {
      acc[row.sentiment] = (acc[row.sentiment] || 0) + 1;
      return acc;
    }, {});

    new Chart(document.getElementById("pie-chart-bulk"), {
      type: "pie",
      data: {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts) }]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: "#fff"    // <-- makes the legend labels white
            }
          }
        }
      }
    });
  }

  // 8) Resize
  window.addEventListener("resize", () => {
    if (resultSec) {
      gsap.set(content, { width: isMobile() ? "100%" : "20rem" });
      gsap.set(resultSec, { width: isMobile() ? "100%" : "40vw" });
    }
  });
});
