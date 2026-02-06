import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import { PricingPage } from './pages/PricingPage'
import { PaymentSuccessPage } from './pages/PaymentSuccessPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
