# app/__init__.py
# ─────────────────────────────────────────────────────────────
# The "application factory" pattern. Instead of creating the Flask
# app at module level (app = Flask(__name__) at the top of a file),
# we wrap it in a function. Benefits:
#   - Lets us create multiple app instances with different configs
#     (useful for testing)
#   - Avoids circular imports (routes import from app; app imports routes)
# This is the Flask equivalent of Express's `createApp()` pattern.
# ─────────────────────────────────────────────────────────────
from flask import Flask


def create_app():
    app = Flask(__name__)

    # Register the Blueprint (Flask's equivalent of an Express Router).
    # A Blueprint groups related routes; you can mount it at a prefix.
    from .routes import main
    app.register_blueprint(main)

    return app
