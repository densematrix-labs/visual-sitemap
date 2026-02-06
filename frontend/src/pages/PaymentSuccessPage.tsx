/**
 * Payment Success Page for Visual Sitemap
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckCircle, Loader2 } from 'lucide-react'
import { fetchTokenByDevice } from '../api/payment'
import { getDeviceId } from '../utils/fingerprint'
import { useTokenStore } from '../stores/tokenStore'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import '../App.css'

export function PaymentSuccessPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setToken, token } = useTokenStore()

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const deviceId = await getDeviceId()
        const tokenData = await fetchTokenByDevice(deviceId)
        if (tokenData) {
          setToken(tokenData)
        }
      } catch (err) {
        setError('Failed to retrieve your credits. Please contact support.')
      } finally {
        setLoading(false)
      }
    }

    // Delay fetch slightly to allow webhook to process
    const timer = setTimeout(fetchToken, 2000)
    return () => clearTimeout(timer)
  }, [setToken])

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
        <div className="success-container">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner large" size={48} />
              <h2>&gt; PROCESSING_PAYMENT_</h2>
              <p>Activating your credits...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <h2>&gt; ERROR_</h2>
              <p>{error}</p>
              <Link to="/" className="back-button">
                &larr; Back to Scanner
              </Link>
            </div>
          ) : (
            <div className="success-state">
              <CheckCircle size={64} className="success-icon" />
              <h1>&gt; PAYMENT_SUCCESSFUL_</h1>
              <p className="success-message">
                Thank you for your purchase! Your credits have been activated.
              </p>
              
              {token && (
                <div className="credits-info">
                  <p className="credits-count">
                    <span className="label">Available Scans:</span>
                    <span className="value">{token.remaining_generations}</span>
                  </p>
                </div>
              )}

              <Link to="/" className="start-button">
                Start Scanning &rarr;
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        {t('footer')}
      </footer>
    </div>
  )
}
