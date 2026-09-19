import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './GoogleSignInButton.css'

export default function GoogleSignInButton({ mode = 'signin' }) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const buttonDivRef = useRef(null)
  const [loading, setLoading] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    if (!clientId) return

    // Load Google Identity Services script
    const scriptId = 'google-identity-services-script'
    let script = document.getElementById(scriptId)

    const initGsi = () => {
      if (!window.google || !buttonDivRef.current) return
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        })

        window.google.accounts.id.renderButton(buttonDivRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: 320,
        })
      } catch (err) {
        console.warn('GSI render error:', err)
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGsi
      document.body.appendChild(script)
    } else {
      initGsi()
    }
  }, [clientId, mode])

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google Sign-In failed')
      return
    }

    setLoading(true)
    try {
      const user = await loginWithGoogle(response.credential)
      toast.success(`Welcome, ${user.fullName || user.email}!`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleManualClick = () => {
    if (!clientId) {
      toast(
        'Google OAuth endpoint is active on backend! To enable popup, add VITE_GOOGLE_CLIENT_ID to your environment.',
        { icon: 'ℹ️', duration: 5000 }
      )
      return
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt()
    }
  }

  return (
    <div className="google-auth-wrap">
      {/* If Google GSI rendered a native button and clientId exists */}
      <div 
        ref={buttonDivRef} 
        className={`google-native-btn-container ${!clientId ? 'google-hidden' : ''}`}
      />

      {/* Fallback branded button if clientId is missing or script hasn't rendered */}
      {(!clientId || loading) && (
        <button
          type="button"
          className="google-btn-custom"
          onClick={handleManualClick}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  )
}
