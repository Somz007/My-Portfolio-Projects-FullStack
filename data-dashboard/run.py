# run.py — entry point. Use `python run.py` or `flask run`.
from dotenv import load_dotenv
load_dotenv()  # must be called before importing the app so os.environ is populated

import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'
    print(f'Dashboard running on http://localhost:{port}')
    app.run(debug=debug, port=port)
