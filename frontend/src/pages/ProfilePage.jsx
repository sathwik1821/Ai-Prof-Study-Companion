import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../api'
import { User, Lock, Shield, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, login } = useAuth()

  // ── Profile form
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [savingPw, setSavingPw]       = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) return toast.error('Name cannot be empty')
    setSavingProfile(true)
    try {
      await userApi.updateProfile({ fullName: fullName.trim() })
      toast.success('Profile updated!')
      // Refresh auth context with new name via /me
      const res = await userApi.getProfile()
      // update localStorage user info
      window.dispatchEvent(new Event('profile-updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('New passwords do not match')
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    setSavingPw(true)
    try {
      await userApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const avatarLetter = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-sub">Manage your account information and security</p>
      </div>

      <div className="profile-grid">

        {/* ── Left: Avatar + identity ── */}
        <div className="profile-identity-card card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{avatarLetter}</div>
            <div className="profile-avatar-glow" />
          </div>
          <div className="profile-identity-info">
            <h2 className="profile-identity-name">{user?.fullName || '—'}</h2>
            <p className="profile-identity-email">{user?.email}</p>
            <span className={`badge ${user?.role === 'ADMIN' ? 'badge-brand' : 'badge-muted'}`}>
              <Shield size={11} /> {user?.role || 'USER'}
            </span>
          </div>
          <div className="profile-meta">
            <div className="profile-meta-row">
              <span className="profile-meta-label">Email verified</span>
              <span className="profile-meta-val">
                {user?.emailVerified
                  ? <><CheckCircle size={13} color="var(--accent-emerald)" /> Yes</>
                  : '—'}
              </span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-label">Member since</span>
              <span className="profile-meta-val">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: Edit forms ── */}
        <div className="profile-forms">

          {/* Edit Name */}
          <div className="card profile-form-card">
            <div className="profile-form-header">
              <User size={16} className="profile-form-icon" />
              <h3>Personal Information</h3>
            </div>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <span className="input-hint">Email cannot be changed</span>
              </div>
              <div className="profile-form-footer">
                <button type="submit" className="btn btn-primary" disabled={savingProfile || fullName.trim() === (user?.fullName || '')}>
                  {savingProfile ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="card profile-form-card">
            <div className="profile-form-header">
              <Lock size={16} className="profile-form-icon" />
              <h3>Change Password</h3>
            </div>
            <form onSubmit={handlePasswordSave}>
              <div className="form-group">
                <label className="input-label">Current Password</label>
                <div className="input-pw-wrap">
                  <input
                    className="input"
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(v => ({ ...v, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button type="button" className="input-pw-toggle" onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">New Password</label>
                <div className="input-pw-wrap">
                  <input
                    className="input"
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(v => ({ ...v, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" className="input-pw-toggle" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  className="input"
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(v => ({ ...v, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              <div className="profile-form-footer">
                <button type="submit" className="btn btn-primary" disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}>
                  {savingPw ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <><Lock size={14} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
