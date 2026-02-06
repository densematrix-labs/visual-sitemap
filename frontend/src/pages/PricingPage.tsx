/**
 * Pricing Page for Visual Sitemap
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createCheckout } from '../api/payment'
import { getDeviceId } from '../utils/fingerprint'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import '../App.css'

const products = [
  {
    sku: 'pack_5',
    name: '5 Scans',
    price_cents: 499,
    generations: 5,
    discount_percent: null,
    popular: false,
  },
  {
    sku: 'pack_20',
    name: '20 Scans',
    price_cents: 1499,
    generations: 20,
    discount_percent: 25,
    popular: true,
  },
]

const features = [
  'Full website crawling',
  'Interactive graph visualization',
  'Export as JSON',
  'All 7 languages supported',
  'Deep scan up to 500 pages',
]

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function PricingPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (sku: string) => {
    setLoading(sku)
    setError(null)
    try {
      const deviceId = await getDeviceId()
      const response = await createCheckout({
        product_sku: sku,
        device_id: deviceId,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/pricing`,
      })
      window.location.href = response.checkout_url
    } catch (err) {
      setError('Failed to create checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">SITEMAP</span>
            <span className="logo-bracket">]</span>
          </Link>
          <span className="tagline">{t('tagline')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="main">
        <div className="pricing-container">
          <h1 className="pricing-title">&gt; {t('pricing.title', 'Choose Your Plan')}_</h1>
          <p className="pricing-subtitle">{t('pricing.subtitle', 'Unlock unlimited website scanning')}</p>

          {error && <div className="error-message">{error}</div>}

          <div className="pricing-grid">
            {products.map((product) => (
              <div
                key={product.sku}
                className={`pricing-card ${product.popular ? 'popular' : ''}`}
              >
                {product.popular && (
                  <div className="popular-badge">POPULAR</div>
                )}

                <h2 className="product-name">{product.name}</h2>
                <p className="product-count">{product.generations} scans</p>
                
                <div className="price-wrapper">
                  <span className="price">{formatCurrency(product.price_cents)}</span>
                  {product.discount_percent && (
                    <span className="discount">Save {product.discount_percent}%</span>
                  )}
                </div>
                <p className="per-unit">
                  {formatCurrency(Math.round(product.price_cents / product.generations))} per scan
                </p>

                <button
                  className="buy-button"
                  disabled={loading !== null}
                  onClick={() => handlePurchase(product.sku)}
                >
                  {loading === product.sku ? (
                    <>
                      <Loader2 className="spinner" size={16} />
                      Processing...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </button>

                <div className="features-list">
                  <p className="features-title">Includes:</p>
                  {features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <Check size={14} className="feature-check" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="back-link">
            <Link to="/">&larr; Back to Scanner</Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        {t('footer')}
      </footer>
    </div>
  )
}
