# ─────────────────────────────────────────────────────────────
#  app/routes.py
#  A Flask Blueprint — the equivalent of an Express Router.
#  Contains one HTML route (the dashboard page) and three JSON
#  API endpoints the frontend's JavaScript calls.
# ─────────────────────────────────────────────────────────────
from flask import Blueprint, jsonify, render_template, request
from .data_service import (
    get_countries,
    get_indicators,
    get_time_series,
    get_comparison,
)

# Blueprint name is 'main'; it has no URL prefix so it mounts at root.
main = Blueprint('main', __name__)


# ── HTML route ───────────────────────────────────────────────

@main.route('/')
def index():
    """
    Serve the dashboard page. We pass the country and indicator lists
    directly from Python into the Jinja2 template so the selectors are
    rendered on the server — no extra API call needed on page load.
    """
    return render_template(
        'index.html',
        countries=get_countries(),
        indicators=get_indicators(),
    )


# ── JSON API endpoints ───────────────────────────────────────

@main.route('/api/countries')
def api_countries():
    """Return the list of available countries."""
    return jsonify(get_countries())


@main.route('/api/indicators')
def api_indicators():
    """Return the list of available indicators with metadata."""
    return jsonify(get_indicators())


@main.route('/api/timeseries')
def api_timeseries():
    """
    Return time-series data for one country + Pandas summary stats.

    Query params:
      country   (required) e.g. ZAF
      indicator (required) e.g. NY.GDP.MKTP.CD
      years     (optional, default 20)

    Example: /api/timeseries?country=ZAF&indicator=NY.GDP.MKTP.CD&years=20
    """
    country   = request.args.get('country', '').upper()
    indicator = request.args.get('indicator', '')
    years     = int(request.args.get('years', 20))

    if not country or not indicator:
        return jsonify({'error': 'country and indicator are required'}), 400

    result = get_time_series(country, indicator, years)

    if 'error' in result:
        return jsonify(result), 404

    return jsonify(result)


@main.route('/api/compare')
def api_compare():
    """
    Return comparison data for multiple countries for a single year.

    Query params:
      countries (required) comma-separated e.g. ZAF,NGA,KEN
      indicator (required)
      year      (optional) defaults to most-recent year with data

    Example: /api/compare?countries=ZAF,NGA,KEN&indicator=NY.GDP.PCAP.CD
    """
    countries_raw = request.args.get('countries', '')
    indicator     = request.args.get('indicator', '')
    year_raw      = request.args.get('year')

    if not countries_raw or not indicator:
        return jsonify({'error': 'countries and indicator are required'}), 400

    country_codes = [c.strip().upper() for c in countries_raw.split(',') if c.strip()]
    year = int(year_raw) if year_raw else None

    result = get_comparison(country_codes, indicator, year)

    if 'error' in result:
        return jsonify(result), 404

    return jsonify(result)
