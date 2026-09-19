import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api'
import { 
  GraduationCap, 
  ShieldCheck, 
  Mail, 
  ArrowLeft, 
  RefreshCw, 
  KeyRound, 
  CheckCircle2,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPage.css'

const FLOATING_DOTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${6 + Math.random() * 88}%`,
  top: `${8 + Math.random() * 84}%`,
  delay: `${Math.random() * 6}s`,
  duration: `${7 + Math.random() * 6}s`,
  size: Math.random() > 0.6 ? 4 : 2,
}))

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(45)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef([])
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Focus the first empty digit input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '')
    if (!cleanVal) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }

    const digit = cleanVal[cleanVal.length - 1]
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Move to next box if available
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)

    const nextEmptyIndex = newOtp.findIndex(val => !val)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e) => {
    if (e) e.preventDefault()
    const fullOtp = otp.join('').trim()

    if (!email) {
      toast.error('Email address is missing. Please enter your email.')
      return
    }

    if (fullOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email.trim(), fullOtp)
      toast.success('Email verified successfully! Welcome aboard.')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || resending || !email) return

    setResending(true)
    try {
      await authApi.resendOtp({ email: email.trim() })
      toast.success('A new verification code has been sent to your email!')
      setCountdown(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-wrapper">
      {/* Dynamic ambient lighting */}
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      {/* Floating particles */}
      <div className="auth-particles-canvas">
        {FLOATING_DOTS.map((dot) => (
          <div
            key={dot.id}
            className="auth-floating-dot"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              animationDelay: dot.delay,
              animationDuration: dot.duration,
            }}
          />
        ))}
      </div>

      {/* Verification Card Stage */}
      <div className="auth-card-stage" style={{ maxWidth: 540, gridTemplateColumns: '1fr' }}>
        <div className="auth-form-panel" style={{ padding: '48px 40px' }}>
          
          {/* Logo & Brand Header */}
          <div className="auth-form-header" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div 
              style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.25)'
              }}
            >
              <KeyRound size={28} color="#fbbf24" />
            </div>

            <h2 className="auth-form-title" style={{ fontSize: 24, marginBottom: 8 }}>
              Check Your Inbox
            </h2>
            <p className="auth-form-subtitle" style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6 }}>
              We sent a 6-digit security code to
            </p>
            {email ? (
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6,
                  marginTop: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '5px 14px',
                  borderRadius: 999,
                  color: '#f8fafc',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                <Mail size={13} color="#60a5fa" />
                {email}
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto' }}
                />
              </div>
            )}
          </div>

          {/* OTP Input Boxes */}
          <form onSubmit={handleVerify}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 10, 
                margin: '24px 0 28px' 
              }}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  style={{
                    width: 46,
                    height: 54,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    borderRadius: 12,
                    background: digit ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: digit ? '1.5px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: digit ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#fbbf24'
                    e.target.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.3)'
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14.5,
                fontWeight: 700,
                opacity: (loading || otp.join('').length !== 6) ? 0.6 : 1,
                cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  Verifying Security Code...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Verify & Activate Account
                </>
              )}
            </button>
          </form>

          {/* Resend & Timer Info */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginTop: 24,
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              fontSize: 12.5,
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="#fbbf24" />
              <span>Valid for 10 minutes</span>
            </div>

            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: 0
                }}
              >
                <RefreshCw size={12} className={resending ? 'auth-spinner' : ''} />
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <span style={{ color: '#64748b' }}>
                Resend in {countdown}s
              </span>
            )}
          </div>

          {/* Back to Login link */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link 
              to="/login" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                fontSize: 13, 
                color: '#94a3b8', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
