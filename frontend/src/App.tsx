import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { SitemapGraph } from './components/SitemapGraph';
import { NodeDetails } from './components/NodeDetails';
import { crawlSitemap, type SitemapResult, type PageNode } from './api/sitemap';
import './App.css';

function App() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SitemapResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<PageNode | null>(null);

  const handleScan = async () => {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError(t('error.invalidUrl'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedNode(null);

    try {
      const data = await crawlSitemap({
        url: parsedUrl.toString(),
        max_depth: depth,
        max_pages: maxPages,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.crawlFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-${new URL(result.root_url).hostname}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setResult(null);
    setSelectedNode(null);
    setError(null);
    setUrl('');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">SITEMAP</span>
            <span className="logo-bracket">]</span>
          </h1>
          <span className="tagline">{t('app.tagline')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Input Section */}
        <section className="input-section">
          <div className="input-row">
            <div className="url-input-wrapper">
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="url-input"
                placeholder={t('input.placeholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleScan()}
                disabled={loading}
                data-testid="input-field"
              />
            </div>
            <button
              className="scan-btn"
              onClick={handleScan}
              disabled={loading || !url.trim()}
              data-testid="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {t('input.scanning')}
                </>
              ) : (
                t('input.scan')
              )}
            </button>
          </div>

          <div className="options-row">
            <div className="option">
              <label htmlFor="depth">{t('input.depth')}</label>
              <select
                id="depth"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                disabled={loading}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
            <div className="option">
              <label htmlFor="maxPages">{t('input.maxPages')}</label>
              <select
                id="maxPages"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                disabled={loading}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <section className="results-section">
            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-value">{result.total_pages}</span>
                <span className="stat-label">{t('result.pages')}</span>
              </div>
              <div className="stat">
                <span className="stat-value text-amber">{result.total_links}</span>
                <span className="stat-label">{t('result.links')}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{result.crawl_time_seconds}</span>
                <span className="stat-label">{t('result.seconds')}</span>
              </div>
              <div className="stats-actions">
                <button className="action-btn" onClick={handleExport}>
                  <Download size={16} />
                  {t('export.json')}
                </button>
                <button className="action-btn secondary" onClick={handleReset}>
                  <RotateCcw size={16} />
                  {t('export.reset')}
                </button>
              </div>
            </div>

            {/* Graph */}
            <div className="graph-section">
              <SitemapGraph
                nodes={result.nodes}
                links={result.links}
                onNodeClick={setSelectedNode}
              />
              {selectedNode && (
                <div className="node-details-panel" data-testid="result">
                  <NodeDetails
                    node={selectedNode}
                    onClose={() => setSelectedNode(null)}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="terminal-prompt">
              <span className="prompt-symbol">&gt;</span>
              <span className="prompt-text">AWAITING_TARGET_URL</span>
              <span className="cursor blink">_</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>{t('footer.poweredBy')}</span>
      </footer>
    </div>
  );
}

export default App;
