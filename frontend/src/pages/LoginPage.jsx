import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Brain, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  KeyRound
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

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back to AiProf!')
      navigate('/dashboard')
    } catch (err) {
      const errCode = err.response?.data?.errorCode
      const errMsg = err.response?.data?.message ?? 'Invalid email or password'
      if (errCode === 'EMAIL_NOT_VERIFIED' || errMsg.toLowerCase().includes('verify')) {
        toast.error(errMsg)
        navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`)
        return
      }
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="auth-wrapper">
      {/* Background ambient lighting */}
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

      {/* Master Frosted Glass Card */}
      <div className="auth-card-stage">
        
        {/* ══════════ LEFT SHOWCASE PANEL ══════════ */}
        <div className="auth-showcase">
          <div>
            <div className="auth-showcase-header">
              <div className="auth-brand-badge-icon">
                <GraduationCap size={26} />
              </div>
              <div>
                <div className="auth-brand-title">AiProf</div>
                <div className="auth-brand-subtitle">AI Study Companion</div>
              </div>
            </div>

            <div className="auth-showcase-body">
              <div className="auth-status-pill">
                <span className="auth-pulse-dot" />
                Your Personal AI Study Space
              </div>

              <h1 className="auth-headline">
                Master Complex Topics with <br />
                <span className="auth-headline-highlight">Adaptive AI Intelligence</span>
              </h1>

              <p className="auth-pitch">
                Upload your materials, chat with an AI tutor grounded in your content, 
                and take adaptive quizzes that track exactly where you stand.
              </p>

              <div className="auth-feature-stack">
                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <Brain size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">Bayesian Knowledge Tracing (BKT)</div>
                    <div className="auth-feature-row-desc">
                      Probabilistic modeling tracks your evolving mastery per concept with diminishing returns.
                    </div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">Strict Project Context Isolation</div>
                    <div className="auth-feature-row-desc">
                      Zero information bleed across projects and spaces with deterministic RAG chunk indexing.
                    </div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">AI Tutor with Source Citations</div>
                    <div className="auth-feature-row-desc">
                      Ask anything about your uploaded materials and get grounded answers with exact page references.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ══════════ RIGHT FORM PANEL ══════════ */}
        <div className="auth-form-panel">
          {/* Top Segmented Navigation */}
          <div className="auth-tab-switch">
            <span className="auth-tab-btn active">
              Sign In
            </span>
            <Link to="/register" className="auth-tab-btn">
              Create Account
            </Link>
          </div>

          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-desc">Authenticate to access your spaces, projects, and AI tutor.</p>


          {/* Interactive Form */}
          <form className="auth-form-fields" onSubmit={handleSubmit}>
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="auth-input-container">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="name@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="login-password">
                Password
              </label>
              <div className="auth-input-container">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-input-toggle-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              <span className="auth-btn-shine" />
              {loading ? (
                <>
                  <span className="spinner" /> Authenticating…
                </>
              ) : (
                <>
                  <KeyRound size={17} /> Sign In to Dashboard
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}
