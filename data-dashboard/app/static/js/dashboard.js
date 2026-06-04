// ─────────────────────────────────────────────────────────────
//  static/js/dashboard.js
//  Fetches data from the Flask API and renders Chart.js charts.
//
//  Chart.js key concept: every chart needs a "config" object:
//    { type, data: { labels, datasets }, options }
//  To UPDATE a chart, mutate chart.data.labels and .datasets,
//  then call chart.update() — don't destroy and recreate.
// ─────────────────────────────────────────────────────────────

// ── Chart.js global defaults ──────────────────────────────────
Chart.defaults.color = '#a0a0b8';
Chart.defaults.borderColor = '#2e2e3a';
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

// Palette — used for datasets consistently across charts.
const PALETTE = [
  '#7c6af7', '#38bdf8', '#fb923c', '#4ade80',
  '#f472b6', '#facc15', '#a78bfa', '#34d399',
];

// ── Chart instances (module-level so we can call .update()) ───
let lineChart   = null;
let barChart    = null;
let growthChart = null;

// ── DOM helpers ───────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showSpinner(id) { $(id).classList.remove('hidden'); }
function hideSpinner(id) { $(id).classList.add('hidden');    }
function showBanner(msg, isError = false) {
  const b = $('statusBanner');
  b.textContent = msg;
  b.className = 'status-banner' + (isError ? ' banner-error' : ' banner-info');
}
function hideBanner() { $('statusBanner').className = 'status-banner hidden'; }

function formatValue(val, scaleLabel, unit) {
  if (val === null || val === undefined) return '—';
  const num = Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (unit === '%') return `${num}%`;
  if (scaleLabel) return `${num} ${scaleLabel} ${unit}`;
  return `${num} ${unit}`;
}

// ── Chart factories ───────────────────────────────────────────
function makeLineChart(ctx) {
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { color: '#2e2e3a' } },
        y: { grid: { color: '#2e2e3a' }, beginAtZero: false },
      },
    },
  });
}

function makeBarChart(ctx) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2e2e3a' } },
        y: { grid: { color: '#2e2e3a' }, beginAtZero: true },
      },
    },
  });
}

function makeGrowthChart(ctx) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` ${Number(c.raw).toFixed(2)}%` } } },
      scales: {
        x: { grid: { color: '#2e2e3a' } },
        y: { grid: { color: '#2e2e3a' }, ticks: { callback: (v) => `${v}%` } },
      },
    },
  });
}

// ── Stat cards ────────────────────────────────────────────────
function updateStats(stats, scaleLabel, unit) {
  const fmt = (v) => formatValue(v, scaleLabel, unit);
  $('statsSection').classList.remove('hidden');
  $('statLatestVal').textContent  = fmt(stats.latest);
  $('statLatestYear').textContent = `as of ${stats.latest_year}`;
  $('statMeanVal').textContent    = fmt(stats.mean);
  $('statMinVal').textContent     = fmt(stats.min);
  $('statMaxVal').textContent     = fmt(stats.max);
}

// ── Data table ────────────────────────────────────────────────
function updateTable(data, scaleLabel, unit, indicatorLabel) {
  $('tableValueHeader').textContent =
    scaleLabel ? `${indicatorLabel} (${scaleLabel} ${unit})` : `${indicatorLabel} (${unit})`;

  const rows = [...data].reverse().map((row) => `
    <tr>
      <td>${row.year}</td>
      <td>${row.value_scaled ?? '—'}</td>
      <td class="${row.yoy_growth > 0 ? 'positive' : row.yoy_growth < 0 ? 'negative' : ''}">
        ${row.yoy_growth != null ? Number(row.yoy_growth).toFixed(2) + '%' : '—'}
      </td>
    </tr>`).join('');

  $('tableBody').innerHTML = rows || '<tr><td colspan="3" class="table-empty">No data</td></tr>';
}

// ── Main load function ────────────────────────────────────────
async function loadDashboard() {
  const country   = $('countrySelect').value;
  const indicator = $('indicatorSelect').value;
  const years     = $('yearsSelect').value;

  // Collect compare countries (checked boxes, max 3, excluding primary)
  const compareCountries = [...document.querySelectorAll('.compare-check:checked')]
    .map((cb) => cb.value)
    .filter((c) => c !== country)
    .slice(0, 3);

  hideBanner();
  showSpinner('lineSpinner');
  showSpinner('barSpinner');
  showSpinner('growthSpinner');
  $('loadBtn').disabled = true;

  try {
    // Fetch time-series and comparison in parallel.
    const allCountries = [country, ...compareCountries];
    const [tsRes, cmpRes] = await Promise.all([
      fetch(`/api/timeseries?country=${country}&indicator=${indicator}&years=${years}`),
      fetch(`/api/compare?countries=${allCountries.join(',')}&indicator=${indicator}`),
    ]);

    if (!tsRes.ok || !cmpRes.ok) {
      const err = await (tsRes.ok ? cmpRes : tsRes).json();
      showBanner(err.error || 'API error', true);
      return;
    }

    const ts  = await tsRes.json();
    const cmp = await cmpRes.json();

    const { scale_label, unit, indicator_label } = ts;

    // ── Line chart: time series of primary country ─────────
    const labels = ts.data.map((d) => d.year);
    const values = ts.data.map((d) => d.value_scaled);

    $('lineTitle').textContent = `${indicator_label} — ${country} (${years} years)`;

    lineChart.data.labels = labels;
    lineChart.data.datasets = [{
      label: country,
      data: values,
      borderColor: PALETTE[0],
      backgroundColor: PALETTE[0] + '22',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }];
    lineChart.options.scales.y.title = {
      display: true,
      text: scale_label ? `${scale_label} ${unit}` : unit,
    };
    lineChart.update();

    // ── Bar chart: country comparison (latest year) ─────────
    const cmpLabels = cmp.data.map((d) => d.country);
    const cmpValues = cmp.data.map((d) => d.value_scaled);
    const cmpYear   = cmp.data[0]?.year ?? '';

    $('barTitle').textContent =
      `${indicator_label} — Country Comparison (${cmpYear})`;

    barChart.data.labels = cmpLabels;
    barChart.data.datasets = [{
      data: cmpValues,
      backgroundColor: cmpLabels.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
      borderColor:     cmpLabels.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 1,
    }];
    barChart.options.scales.y.title = {
      display: true,
      text: scale_label ? `${scale_label} ${unit}` : unit,
    };
    barChart.update();

    // ── Growth chart: YoY growth rate ──────────────────────
    const growthData   = ts.data.filter((d) => d.yoy_growth != null);
    const growthLabels = growthData.map((d) => d.year);
    const growthValues = growthData.map((d) => d.yoy_growth);

    $('growthTitle').textContent =
      `${indicator_label} — Year-over-Year Growth (${country})`;

    growthChart.data.labels = growthLabels;
    growthChart.data.datasets = [{
      data: growthValues,
      backgroundColor: growthValues.map((v) => v >= 0 ? '#4ade8066' : '#f8717166'),
      borderColor:     growthValues.map((v) => v >= 0 ? '#4ade80'   : '#f87171'),
      borderWidth: 1,
    }];
    growthChart.update();

    // ── Stats + table ───────────────────────────────────────
    updateStats(ts.stats, scale_label, unit);
    updateTable(ts.data, scale_label, unit, indicator_label);

  } catch (err) {
    showBanner('Network error — is the Flask server running?', true);
    console.error(err);
  } finally {
    hideSpinner('lineSpinner');
    hideSpinner('barSpinner');
    hideSpinner('growthSpinner');
    $('loadBtn').disabled = false;
  }
}

// ── Initialise on page load ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  lineChart   = makeLineChart($('lineChart'));
  barChart    = makeBarChart($('barChart'));
  growthChart = makeGrowthChart($('growthChart'));

  $('loadBtn').addEventListener('click', loadDashboard);

  // Auto-load on first visit.
  loadDashboard();
});
