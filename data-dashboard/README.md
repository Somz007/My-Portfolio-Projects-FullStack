# Data Dashboard

An interactive data dashboard that pulls live global economic data, processes it with **Pandas**, and visualises it with **Chart.js**. Built with **Flask**, **Pandas**, and **Chart.js**.

Explore GDP, population, life expectancy, unemployment, and inflation for 12 countries (with a South Africa focus), with time-series trends, country comparisons, and year-over-year growth.

---

## ✨ Features

- 📈 **Time-series charts** — track any indicator over 10/20/30 years
- 📊 **Country comparison** — compare a primary country against up to 3 others
- 📉 **Year-over-year growth** — computed with Pandas `pct_change`
- 🔢 **Summary statistics** — latest, average, min, max via Pandas `describe()`
- 🌍 **Live data** — pulled from the free World Bank Open Data API (no API key)
- ⚡ **In-memory caching** — repeated requests are instant and don't hammer the public API
- 🛡️ **Resilient** — automatic retry + bundled fallback data when the API is throttled
- 🗂️ **6 indicators × 12 countries** — GDP, GDP per capita, population, life expectancy, unemployment, inflation

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Flask | Python web framework (app-factory + Blueprint) |
| Pandas | Data loading, cleaning, transformation & statistics |
| requests | Fetching data from the World Bank API |
| Chart.js | Frontend charts (line + bar), loaded via CDN |
| Jinja2 | Server-side HTML templating |
| python-dotenv | Environment variables |

---

## 📁 Project Structure

```
data-dashboard/
├── app/
│   ├── __init__.py            # App factory (Flask's recommended pattern)
│   ├── routes.py              # HTML route + JSON API endpoints (Blueprint)
│   ├── data_service.py        # All World Bank fetching + Pandas processing
│   ├── templates/
│   │   ├── base.html          # Shared layout (Jinja2)
│   │   └── index.html         # Dashboard page
│   └── static/
│       ├── js/dashboard.js    # Chart.js rendering + fetch calls
│       └── css/styles.css
├── run.py                     # Entry point
├── requirements.txt
└── .env.example
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Python 3](https://www.python.org/downloads/) installed (`python --version`)
- No API key and no database required — data comes from the free World Bank API

### 2. Set up a Python environment & install dependencies
```bash
cd data-dashboard
python -m venv venv

# Activate the virtual environment:
venv\Scripts\activate          # Windows
source venv/bin/activate        # macOS / Linux

pip install -r requirements.txt
```
> 💡 This project **requires a Python environment** — always activate the `venv` before installing or running, so dependencies stay isolated from your system Python.

### 3. (Optional) configure environment variables
```bash
cp .env.example .env
```
```ini
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5001
CACHE_TTL=3600                  # cache World Bank responses for 1 hour
```

### 4. Run the dashboard
```bash
python run.py                   # http://localhost:5001
```
Open <http://localhost:5001>, choose an indicator and countries, and click **Refresh Charts**.

---

## 📡 API Endpoints

Base URL: `http://localhost:5001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | The dashboard HTML page |
| GET | `/api/health` | Health check |
| GET | `/api/countries` | List of available countries |
| GET | `/api/indicators` | List of indicators with metadata |
| GET | `/api/timeseries` | Time series + stats for one country (`?country`, `?indicator`, `?years`) |
| GET | `/api/compare` | Comparison across countries (`?countries`, `?indicator`, `?year`) |

Example: `GET /api/timeseries?country=ZAF&indicator=NY.GDP.MKTP.CD&years=20`

---

## 🐼 The Pandas Pipeline

`data_service.py` turns messy nested API JSON into clean, chart-ready data:

```python
df = pd.DataFrame(records)                    # 1. load JSON into a DataFrame
df = df.dropna(subset=['value'])              # 2. drop years with no data
df = df.sort_values('year')                   # 3. chronological order
df['value_scaled'] = df['value'] / scale      # 4. scale (e.g. GDP in billions)
df['yoy_growth'] = df['value_scaled'].pct_change() * 100   # 5. year-over-year %
stats = df['value_scaled'].describe()         # 6. count/mean/std/min/quartiles/max
```

For comparisons, `pd.concat()` stacks multiple countries' DataFrames into one, then groups to find each country's most recent value.

> **Resilience note:** the free World Bank API throttles bulk requests. The service caches responses (TTL), retries once on failure, and falls back to bundled authoritative data for slow indicators — so the dashboard never shows an empty chart on first load.

---

## 📝 What I Learned

- Building a Flask app with the **application-factory pattern** and Blueprints
- Loading, cleaning, and transforming real-world data with **Pandas** (`dropna`, `sort_values`, `pct_change`, `describe`, `concat`)
- Consuming a public REST API and reshaping nested JSON into chart-ready records
- Rendering interactive **Chart.js** visualisations driven by `fetch` calls
- **Caching** API responses in memory with a TTL to improve performance and avoid rate limits
- Designing a **resilience strategy** (retry + fallback data) for an unreliable third-party dependency
- Server-side templating with Jinja2 and clean separation between data, routes, and views

---

## 📄 License

MIT — part of my full-stack portfolio (Phase 3).
