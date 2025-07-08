// static/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // Nav Pill Indicator with GSAP + smooth slide + delayed navigation
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const indicator = document.getElementById('nav-indicator');

  function moveIndicator(el, onComplete) {
    const left = el.offsetLeft;
    const width = el.offsetWidth;
    // animate position & width, then call onComplete
    gsap.to(indicator, {
      duration: 0.3,
      ease: "power1.out",
      x: left,
      width: width,
      onComplete: onComplete
    });
    // adjust opacities
    links.forEach(l => l.classList.replace('opacity-100','opacity-60'));
    el.classList.replace('opacity-60','opacity-100');
  }

  // initialize indicator under current route (no animation)
  const current = links.find(l => l.getAttribute('href') === window.location.pathname) || links[0];
  gsap.set(indicator, {
    x: current.offsetLeft,
    width: current.offsetWidth
  });
  current.classList.replace('opacity-60','opacity-100');

  // click handler: slide then navigate
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetHref = link.getAttribute('href');
      moveIndicator(link, () => {
        window.location.href = targetHref;
      });
    });
  });

  // --- Sentiment Analysis UI Logic ---
  const forms = document.querySelectorAll(".form-section");
  const resultSec = document.getElementById("result-section");
  const tableBody = document.getElementById("result-table-body");
  const pieCanvas = document.getElementById("pie-chart");
  const pieCtx = pieCanvas ? pieCanvas.getContext("2d") : null;
  let pieChart;

  window.loadSection = (sec) => {
    forms.forEach(f => f.classList.add("hidden"));
    document.getElementById(`${sec}-form`).classList.remove("hidden");
    if (resultSec) resultSec.classList.add("hidden");
  };
  loadSection("text");

  async function handleSubmit(formId, endpoint, payloadBuilder) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = payloadBuilder();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const { data } = await res.json();
      showResults(data);
    });
  }

  handleSubmit("text-form", "/predict_text", () => ({
    text: document.getElementById("text-input").value
  }));
  handleSubmit("bulk-form", "/predict_bulk", () => ({}));
  handleSubmit("scrape-form", "/scrape_predict", () => ({
    url: document.getElementById("url-input").value
  }));

  function showResults(data) {
    tableBody.innerHTML = "";
    data.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-1">${i+1}</td>
        <td class="py-1">${row.text}</td>
        <td class="py-1">${row.sentiment}</td>
        <td class="py-1">${row.score}</td>`;
      tableBody.appendChild(tr);
    });

    const counts = data.reduce((acc, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(counts);
    const values = labels.map(l => counts[l]);

    if (pieChart) pieChart.destroy();
    if (pieCtx) {
      pieChart = new Chart(pieCtx, {
        type: "pie",
        data: { labels, datasets: [{ data: values }] },
        options: { responsive: true }
      });
    }

    if (resultSec) resultSec.classList.remove("hidden");
  }

  // --- Download Buttons ---
  document.getElementById("download-csv")?.addEventListener("click", () => {
    const rows = Array.from(tableBody.querySelectorAll("tr")).map(tr => {
      const [i, t, s, c] = tr.querySelectorAll("td");
      return `${i.innerText},"${t.innerText}",${s.innerText},${c.innerText}`;
    });
    const csv = ["Index,Text,Sentiment,Score", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("download-json")?.addEventListener("click", () => {
    const items = Array.from(tableBody.querySelectorAll("tr")).map(tr => {
      const [i, t, s, c] = tr.querySelectorAll("td");
      return {
        index: i.innerText,
        text: t.innerText,
        sentiment: s.innerText,
        score: c.innerText
      };
    });
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("download-pdf")?.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.autoTable({ html: "#result-table" });
    doc.save("results.pdf");
  });
});
