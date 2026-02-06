# Visual Sitemap Scanner

> Map your website's DNA — Deep scan any website and generate an interactive visual sitemap showing page relationships.

![Visual Sitemap Scanner](https://img.shields.io/badge/status-live-green)

## Features

- 🔍 **Deep Crawl** — Recursively crawl websites up to 5 levels deep
- 🗺️ **Interactive Graph** — D3.js force-directed visualization of page relationships
- 🔗 **Link Analysis** — See incoming/outgoing links for each page
- 📤 **Export** — Download sitemap data as JSON
- 🌍 **7 Languages** — English, 中文, 日本語, Deutsch, Français, 한국어, Español

## Tech Stack

- **Frontend**: React + Vite + TypeScript + D3.js
- **Backend**: Python FastAPI + Playwright
- **Deployment**: Docker

## Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (for deployment)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
playwright install chromium

# Run development server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install

# Run development server
npm run dev
```

### Docker

```bash
docker compose up --build
```

## Testing

### Backend

```bash
cd backend
pip install pytest pytest-cov pytest-asyncio httpx
pytest --cov=app --cov-fail-under=95
```

### Frontend

```bash
cd frontend
npm run test:coverage
```

## License

MIT © DenseMatrix
