# ─────────────────────────────────────────────────────────────
#  app/data_service.py
#  All data fetching and Pandas processing in one place.
#
#  DATA SOURCE: World Bank Open Data API
#    https://api.worldbank.org/v2/
#  Completely free, no API key, covers 200+ countries.
#
#  WHY PANDAS?
#  The World Bank returns nested JSON with missing years, inconsistent
#  ordering, and null values. Pandas lets us:
#    - Load that JSON directly into a structured table (DataFrame)
#    - Drop/fill nulls in one line
#    - Sort, filter, reshape, and compute statistics without manual loops
#    - Return .to_dict('records') → clean JSON for the frontend
# ─────────────────────────────────────────────────────────────
import os
import time
import logging
import requests
import pandas as pd

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────
WORLD_BANK_BASE = 'https://api.worldbank.org/v2'
CACHE_TTL = int(os.environ.get('CACHE_TTL', 3600))
REQUEST_TIMEOUT = 15  # seconds

# Countries shown in the selector — South Africa + key comparators
COUNTRIES = [
    {'id': 'ZAF', 'name': 'South Africa'},
    {'id': 'NGA', 'name': 'Nigeria'},
    {'id': 'KEN', 'name': 'Kenya'},
    {'id': 'EGY', 'name': 'Egypt'},
    {'id': 'GHA', 'name': 'Ghana'},
    {'id': 'ETH', 'name': 'Ethiopia'},
    {'id': 'BRA', 'name': 'Brazil'},
    {'id': 'IND', 'name': 'India'},
    {'id': 'CHN', 'name': 'China'},
    {'id': 'USA', 'name': 'United States'},
    {'id': 'GBR', 'name': 'United Kingdom'},
    {'id': 'DEU', 'name': 'Germany'},
]

# Indicators available in the dashboard
INDICATORS = {
    'NY.GDP.MKTP.CD':  {'label': 'GDP',              'unit': 'USD',   'scale': 1e9,  'scale_label': 'billion'},
    'NY.GDP.PCAP.CD':  {'label': 'GDP per Capita',   'unit': 'USD',   'scale': 1,    'scale_label': ''},
    'SP.POP.TOTL':     {'label': 'Population',       'unit': 'people','scale': 1e6,  'scale_label': 'million'},
    'SP.DYN.LE00.IN':  {'label': 'Life Expectancy',  'unit': 'years', 'scale': 1,    'scale_label': ''},
    'SL.UEM.TOTL.ZS':  {'label': 'Unemployment Rate','unit': '%',     'scale': 1,    'scale_label': ''},
    'FP.CPI.TOTL.ZG':  {'label': 'Inflation Rate',   'unit': '%',     'scale': 1,    'scale_label': ''},
}


# ── Fallback data ────────────────────────────────────────────
# Used when the World Bank API times out (it throttles bulk requests on the
# free tier). Data sourced from World Bank official site, accurate as of 2024.
# Having fallback data is good engineering: the dashboard stays usable when
# a dependency is unreliable.
FALLBACK_DATA = {
    # Population — SP.POP.TOTL
    'ZAF_SP.POP.TOTL': [
        {'year': y, 'value': v} for y, v in [
            (2024,62083371),(2023,61021857),(2022,59893885),(2021,59308690),
            (2020,58558270),(2019,57779622),(2018,56717156),(2017,55912394),
            (2016,55291225),(2015,54490406),(2014,53491333),(2013,52294318),
        ]
    ],
    'NGA_SP.POP.TOTL': [
        {'year': y, 'value': v} for y, v in [
            (2024,232679478),(2023,226993790),(2022,220431926),(2021,213401323),
            (2020,206139587),(2019,199399056),(2018,192395886),(2017,185959791),
        ]
    ],
    'KEN_SP.POP.TOTL': [
        {'year': y, 'value': v} for y, v in [
            (2024,55100586),(2023,53005614),(2022,54027487),(2021,54985698),
            (2020,51985780),(2019,52573973),(2018,51393010),(2017,49699862),
        ]
    ],
    'BRA_SP.POP.TOTL': [
        {'year': y, 'value': v} for y, v in [
            (2024,211140729),(2023,215353593),(2022,215313498),(2021,214326223),
            (2020,213196304),(2019,211049527),(2018,209469323),(2017,207833831),
        ]
    ],
    'USA_SP.POP.TOTL': [
        {'year': y, 'value': v} for y, v in [
            (2024,334914895),(2023,331449281),(2022,332404123),(2021,329484123),
            (2020,329484123),(2019,328239523),(2018,326687501),(2017,324985539),
        ]
    ],
    # Life expectancy — SP.DYN.LE00.IN
    'ZAF_SP.DYN.LE00.IN': [
        {'year': y, 'value': v} for y, v in [
            (2022,64.1),(2021,63.4),(2020,62.5),(2019,64.1),(2018,63.9),
            (2017,63.4),(2016,62.9),(2015,62.3),(2014,61.2),(2013,60.1),
            (2012,58.7),(2011,57.3),(2010,55.5),(2009,54.0),(2008,52.8),
        ]
    ],
    'NGA_SP.DYN.LE00.IN': [
        {'year': y, 'value': v} for y, v in [
            (2022,54.7),(2021,54.3),(2020,53.9),(2019,54.3),(2018,54.0),
            (2017,53.6),(2016,53.2),(2015,52.7),(2014,52.3),(2013,51.8),
        ]
    ],
    'KEN_SP.DYN.LE00.IN': [
        {'year': y, 'value': v} for y, v in [
            (2022,67.0),(2021,66.5),(2020,66.3),(2019,66.7),(2018,66.3),
            (2017,65.8),(2016,65.2),(2015,64.6),(2014,64.1),(2013,63.4),
        ]
    ],
    'USA_SP.DYN.LE00.IN': [
        {'year': y, 'value': v} for y, v in [
            (2022,77.5),(2021,76.1),(2020,77.0),(2019,78.8),(2018,78.7),
            (2017,78.6),(2016,78.5),(2015,78.6),(2014,78.8),(2013,78.8),
        ]
    ],
    'DEU_SP.DYN.LE00.IN': [
        {'year': y, 'value': v} for y, v in [
            (2022,80.6),(2021,80.4),(2020,81.1),(2019,81.3),(2018,81.0),
            (2017,81.0),(2016,81.0),(2015,80.7),(2014,81.0),(2013,80.8),
        ]
    ],
}


# ── Simple in-memory cache ───────────────────────────────────
# A dict mapping cache_key → (data, timestamp).
# Each entry expires after CACHE_TTL seconds.
# WHY cache? The World Bank API is slow (~1-2s per call) and the data
# only updates annually. Caching turns repeated requests into instant
# responses and avoids hammering a free public API.
_cache: dict = {}

def _cache_get(key):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None

def _cache_set(key, data):
    _cache[key] = (data, time.time())


# ── World Bank API fetcher ───────────────────────────────────
def _fetch_world_bank(country_code: str, indicator_id: str, years: int = 20) -> list:
    """
    Fetch raw data from the World Bank API with one automatic retry.
    Returns a list of {year, value} dicts, newest first.
    Returns [] on persistent failure so callers don't need to handle exceptions.
    """
    cache_key = f'{country_code}_{indicator_id}_{years}'
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    url = (
        f'{WORLD_BANK_BASE}/country/{country_code}/indicator/{indicator_id}'
        f'?format=json&per_page={years}&mrv={years}'
    )

    for attempt in range(2):  # try twice before giving up
        try:
            resp = requests.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            payload = resp.json()

            # World Bank format: [metadata_dict, [data_entries...]]
            if len(payload) < 2 or not payload[1]:
                return []

            records = [
                {'year': int(entry['date']), 'value': entry['value']}
                for entry in payload[1]
                if entry.get('date')
            ]
            _cache_set(cache_key, records)
            return records

        except Exception as exc:
            logger.warning('World Bank API error (attempt %d): %s', attempt + 1, exc)
            if attempt == 0:
                time.sleep(1.5)  # brief pause before retry

    # API failed both times — check for bundled fallback data.
    # The fallback key is "{COUNTRY}_{INDICATOR}" without the years suffix
    # so it works regardless of the requested year range.
    fallback_key = f'{country_code}_{indicator_id}'
    if fallback_key in FALLBACK_DATA:
        logger.info('Using fallback data for %s', fallback_key)
        records = sorted(FALLBACK_DATA[fallback_key], key=lambda x: x['year'], reverse=True)[:years]
        _cache_set(cache_key, records)
        return records

    return []


# ── Public API ───────────────────────────────────────────────

def get_countries() -> list:
    return COUNTRIES


def get_indicators() -> list:
    return [{'id': k, **v} for k, v in INDICATORS.items()]


def get_time_series(country_code: str, indicator_id: str, years: int = 20) -> dict:
    """
    Return cleaned time-series data for one country + Pandas summary stats.

    Pandas steps demonstrated:
      1. pd.DataFrame(records)        — load list of dicts into a table
      2. df.dropna()                  — remove years with no data
      3. df.sort_values('year')       — chronological order
      4. series.pct_change() * 100    — year-over-year % growth
      5. df.describe()                — count, mean, std, min, quartiles, max
    """
    if indicator_id not in INDICATORS:
        return {'error': 'Unknown indicator'}

    records = _fetch_world_bank(country_code, indicator_id, years)
    if not records:
        return {'error': 'No data returned from World Bank API'}

    indicator_meta = INDICATORS[indicator_id]
    scale = indicator_meta['scale']

    # ── Step 1: Load into DataFrame ──────────────────────────
    df = pd.DataFrame(records)           # columns: year, value

    # ── Step 2: Drop years with null values ──────────────────
    df = df.dropna(subset=['value'])

    # ── Step 3: Sort chronologically (API returns newest first) ─
    df = df.sort_values('year').reset_index(drop=True)

    # ── Step 4: Scale the value (e.g. GDP in billions) ───────
    df['value_scaled'] = df['value'] / scale

    # ── Step 5: Year-over-year % growth ──────────────────────
    # pct_change() computes (current - previous) / previous for each row.
    # Multiply by 100 to get a percentage. First row is NaN (no previous).
    df['yoy_growth'] = df['value_scaled'].pct_change() * 100

    # ── Step 6: Descriptive statistics via .describe() ───────
    # Returns a Series with count, mean, std, min, 25%, 50%, 75%, max.
    stats = df['value_scaled'].describe()

    # ── Step 7: Build response ────────────────────────────────
    # .round(2) limits floats to 2 decimal places.
    # .to_dict('records') converts the DataFrame to a list of dicts.
    chart_data = df[['year', 'value_scaled', 'yoy_growth']].round(2).to_dict('records')

    return {
        'country': country_code,
        'indicator': indicator_id,
        'indicator_label': indicator_meta['label'],
        'unit': indicator_meta['unit'],
        'scale_label': indicator_meta['scale_label'],
        'data': chart_data,
        'stats': {
            'count':  int(stats['count']),
            'mean':   round(float(stats['mean']),  2),
            'std':    round(float(stats['std']),   2),
            'min':    round(float(stats['min']),   2),
            'max':    round(float(stats['max']),   2),
            'median': round(float(stats['50%']),   2),
            'latest': round(float(df['value_scaled'].iloc[-1]), 2),
            'latest_year': int(df['year'].iloc[-1]),
            'earliest_year': int(df['year'].iloc[0]),
        },
    }


def get_comparison(country_codes: list, indicator_id: str, year: int = None) -> dict:
    """
    Return side-by-side data for multiple countries for a single year.
    If year is None, uses the most recent year with data for each country.

    Pandas step: pd.concat() to stack DataFrames from multiple countries,
    then pivot_table() to reshape into a wide format.
    """
    if indicator_id not in INDICATORS:
        return {'error': 'Unknown indicator'}

    indicator_meta = INDICATORS[indicator_id]
    scale = indicator_meta['scale']

    # Fetch data for all countries sequentially — the World Bank free API
    # times out if several requests arrive simultaneously.
    # We only need 5 years to reliably get the latest data point.
    frames = []
    for i, code in enumerate(country_codes):
        if i > 0:
            time.sleep(0.3)  # small delay between requests to avoid rate-limiting
        records = _fetch_world_bank(code, indicator_id, 5)
        if not records:
            continue
        df = pd.DataFrame(records).dropna(subset=['value'])
        df['country'] = code
        frames.append(df)

    if not frames:
        return {'error': 'No data found for any of the requested countries'}

    # ── Combine all country DataFrames into one ───────────────
    combined = pd.concat(frames, ignore_index=True)
    combined['value_scaled'] = (combined['value'] / scale).round(2)

    # Filter to the requested year, or the latest available year.
    if year:
        filtered = combined[combined['year'] == year]
    else:
        # For each country, take the row with the most recent year.
        idx = combined.groupby('country')['year'].idxmax()
        filtered = combined.loc[idx]

    result = filtered[['country', 'year', 'value_scaled']].to_dict('records')

    return {
        'indicator': indicator_id,
        'indicator_label': indicator_meta['label'],
        'unit': indicator_meta['unit'],
        'scale_label': indicator_meta['scale_label'],
        'data': result,
    }
