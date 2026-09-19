import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  FileText, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  UserPlus
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

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.password, form.fullName)
      toast.success('Verification code sent to your email!')
      navigate(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed')
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
                Open Access • Zero Setup Required
              </div>

              <h1 className="auth-headline">
                Accelerate Learning with <br />
                <span className="auth-headline-highlight">Deep Cognitive Science</span>
              </h1>

              <p className="auth-pitch">
                Create spaces for your courses, upload lecture materials, and study with an 
                AI tutor that continuously models your comprehension gaps.
              </p>

              <div className="auth-feature-stack">
                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">Multi-Document RAG Ingestion</div>
                    <div className="auth-feature-row-desc">
                      Upload course PDFs, textbooks, and notes with instant vector-chunk grounding and page citations.
                    </div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">Adaptive Quiz Engine</div>
                    <div className="auth-feature-row-desc">
                      Generates diagnostic multi-choice assessments tuned precisely to your current knowledge level.
                    </div>
                  </div>
                </div>

                <div className="auth-feature-row">
                  <div className="auth-feature-row-icon">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <div className="auth-feature-row-title">Hierarchical Mastery Intelligence</div>
                    <div className="auth-feature-row-desc">
                      Gain macro visibility across your entire space while tracking micro concept mastery inside projects.
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
            <Link to="/login" className="auth-tab-btn">
              Sign In
            </Link>
            <span className="auth-tab-btn active">
              Create Account
            </span>
          </div>

          <h2 className="auth-form-title">Get started today</h2>
          <p className="auth-form-desc">Create your student account to start building spaces and tracking mastery.</p>


          {/* Interactive Form */}
          <form className="auth-form-fields" onSubmit={handleSubmit}>
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="register-name">
                Full Name
              </label>
              <div className="auth-input-container">
                <User size={16} className="auth-input-icon" />
                <input
                  id="register-name"
                  className="auth-input"
                  type="text"
                  placeholder="Prof. Alex Mercer"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="auth-input-container">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="register-email"
                  className="auth-input"
                  type="email"
                  placeholder="alex.mercer@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="register-password">
                Password <span style={{ color: '#64748b', fontSize: '11px' }}>(min. 8 characters)</span>
              </label>
              <div className="auth-input-container">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="register-password"
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
              id="register-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              <span className="auth-btn-shine" />
              {loading ? (
                <>
                  <span className="spinner" /> Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={17} /> Create Student Account
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}
