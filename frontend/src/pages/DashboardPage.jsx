import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { spacesApi, analyticsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  Plus, 
  BookOpen, 
  Folder, 
  Brain, 
  Target, 
  Zap, 
  ChevronRight, 
  Trash2, 
  MessageSquare, 
  Clock, 
  FileText,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [spaces, setSpaces] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newSpace, setNewSpace] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([spacesApi.list(), analyticsApi.overview()])
      .then(([s, a]) => {
        setSpaces(s.data.data)
        setAnalytics(a.data.data)
      })
      .catch(() => toast.error('Failed to load dashboard overview'))
      .finally(() => setLoading(false))
  }, [])

  const createSpace = async (e) => {
    e.preventDefault()
    if (!newSpace.name.trim()) return
    setSaving(true)
    try {
      const res = await spacesApi.create(newSpace)
      setSpaces((prev) => [res.data.data, ...prev])
      setShowModal(false)
      setNewSpace({ name: '', description: '' })
      toast.success('Space created!')
    } catch {
      toast.error('Failed to create space')
    } finally {
      setSaving(false)
    }
  }

  const deleteSpace = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this space and all its projects?')) return
    try {
      await spacesApi.delete(id)
      setSpaces((prev) => prev.filter((s) => s.id !== id))
      toast.success('Space deleted')
    } catch {
      toast.error('Failed to delete space')
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return (
      <div className="dash-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    )
  }

  const mostRecentProject = analytics?.recentProjects?.[0]

  // Project with lowest mastery score (different from most recent)
  const weakestProject = analytics?.recentProjects
    ?.filter(p => p.projectId !== mostRecentProject?.projectId)
    ?.reduce((min, p) => (!min || (p.masteryScore ?? 0) < (min.masteryScore ?? 0)) ? p : min, null)

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">
            {greeting}, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="dash-sub">
            Your personalized AI study companion & cognitive growth workspace
          </p>
        </div>
        <button id="create-space-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Space
        </button>
      </div>

      {/* ══════════ CONTINUITY GRID ══════════ */}
      {(mostRecentProject || weakestProject) && (
        <div className={`dash-continuity-grid${weakestProject ? '' : ' dash-continuity-single'}`}>

          {/* WHERE WAS I? — Continue Learning */}
          {mostRecentProject && (
            <div className="dash-continue-card">
              <div>
                <div className="dash-continue-top">
                  <span className="dash-continue-badge">
                    <Clock size={12} /> Continue Learning
                  </span>
                  {mostRecentProject.spaceName && (
                    <span className="dash-continue-space">
                      <Folder size={12} /> {mostRecentProject.spaceName}
                    </span>
                  )}
                </div>

                <h2 className="dash-continue-title">{mostRecentProject.projectName}</h2>
                <p className="dash-continue-goal">
                  {mostRecentProject.learningGoal || 'Mastery tracking and adaptive practice in progress.'}
                </p>

                <div className="dash-continue-mastery-bar">
                  <div className="dash-continue-mastery-label">
                    <span>Project Mastery</span>
                    <span style={{ color: '#fbbf24' }}>{mostRecentProject.masteryScore ?? 0}%</span>
                  </div>
                  <div className="dash-bar-bg">
                    <div
                      className="dash-bar-fill"
                      style={{
                        width: `${Math.max(4, mostRecentProject.masteryScore ?? 0)}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="dash-continue-actions">
                <button
                  className="dash-action-btn dash-action-btn-primary"
                  onClick={() => navigate(`/spaces/${mostRecentProject.spaceId}/projects/${mostRecentProject.projectId}/tutor`)}
                >
                  <MessageSquare size={13} /> Ask AI Tutor
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => navigate(`/spaces/${mostRecentProject.spaceId}/projects/${mostRecentProject.projectId}/quiz`)}
                >
                  <Zap size={13} color="#fbbf24" /> Adaptive Quiz
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => navigate(`/spaces/${mostRecentProject.spaceId}/projects/${mostRecentProject.projectId}/materials`)}
                >
                  <FileText size={13} /> Materials
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => navigate(`/spaces/${mostRecentProject.spaceId}/projects/${mostRecentProject.projectId}`)}
                >
                  Overview <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* NEEDS ATTENTION — Least Mastery Project */}
          {weakestProject && (
            <div className="dash-weak-project-card">
              <div>
                <div className="dash-continue-top">
                  <span className="dash-weak-project-badge">
                    <AlertTriangle size={12} /> Needs Attention
                  </span>
                  {weakestProject.spaceName && (
                    <span className="dash-continue-space">
                      <Folder size={12} /> {weakestProject.spaceName}
                    </span>
                  )}
                </div>

                <h2 className="dash-continue-title">{weakestProject.projectName}</h2>
                <p className="dash-continue-goal">
                  {weakestProject.learningGoal || 'This project has the lowest mastery — a great place to focus next.'}
                </p>

                <div className="dash-continue-mastery-bar">
                  <div className="dash-continue-mastery-label">
                    <span>Project Mastery</span>
                    <span style={{ color: (weakestProject.masteryScore ?? 0) < 40 ? '#fb7185' : '#fbbf24' }}>
                      {weakestProject.masteryScore ?? 0}%
                    </span>
                  </div>
                  <div className="dash-bar-bg">
                    <div
                      className="dash-bar-fill"
                      style={{
                        width: `${Math.max(4, weakestProject.masteryScore ?? 0)}%`,
                        background: (weakestProject.masteryScore ?? 0) < 40
                          ? 'linear-gradient(90deg, #f43f5e, #fb923c)'
                          : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="dash-continue-actions">
                <button
                  className="dash-action-btn dash-action-btn-danger"
                  onClick={() => navigate(`/spaces/${weakestProject.spaceId}/projects/${weakestProject.projectId}/quiz`)}
                >
                  <Zap size={13} /> Practice Now
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => navigate(`/spaces/${weakestProject.spaceId}/projects/${weakestProject.projectId}/tutor`)}
                >
                  <MessageSquare size={13} /> Ask AI Tutor
                </button>
                <button
                  className="dash-action-btn"
                  onClick={() => navigate(`/spaces/${weakestProject.spaceId}/projects/${weakestProject.projectId}`)}
                >
                  Overview <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════ OVERALL PROGRESS STATS ══════════ */}
      {analytics && (
        <div className="dash-stats">
          <StatCard
            icon={<Folder size={20} />}
            label="Spaces"
            value={analytics.totalSpaces ?? spaces.length}
            color="brand"
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Projects"
            value={analytics.totalProjects ?? 0}
            color="violet"
          />
          <StatCard
            icon={<Brain size={20} />}
            label="Avg. Mastery"
            value={`${Math.round(analytics.averageMastery ?? 0)}%`}
            color="cyan"
          />
          <StatCard
            icon={<Target size={20} />}
            label="Quiz Sessions"
            value={analytics.totalQuizAttempts ?? 0}
            color="emerald"
          />
        </div>
      )}



      {/* ══════════ YOUR SPACES GRID ══════════ */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2>
            Your Learning Spaces <span className="badge badge-muted">{spaces.length}</span>
          </h2>
        </div>

        {spaces.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} className="empty-state-icon" />
            <h3>No spaces yet</h3>
            <p>
              Spaces are your high-level learning domains — like "Computer Science" or "Organic Chemistry"
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create your first space
            </button>
          </div>
        ) : (
          <div className="spaces-grid">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="space-card card card-interactive"
                onClick={() => navigate(`/spaces/${space.id}`)}
              >
                <div className="space-card-header">
                  <div className="space-icon">
                    <Folder size={20} />
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm space-delete"
                    onClick={(e) => deleteSpace(e, space.id)}
                    title="Delete space"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="space-name">{space.name}</h3>
                {space.description && <p className="space-desc">{space.description}</p>}
                <div className="space-footer">
                  <span className="badge badge-muted">
                    <BookOpen size={11} /> {space.projectCount ?? 0} projects
                  </span>
                  <ChevronRight size={14} className="space-arrow" />
                </div>
              </div>
            ))}
            <button className="space-card-add" onClick={() => setShowModal(true)}>
              <Plus size={22} />
              <span>New space</span>
            </button>
          </div>
        )}
      </div>

      {/* Create space modal */}
      {showModal && (
        <Modal title="Create Space" onClose={() => setShowModal(false)}>
          <form onSubmit={createSpace}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="input-label">Space name *</label>
              <input
                id="space-name-input"
                className="input"
                placeholder="e.g. Machine Learning"
                value={newSpace.name}
                onChange={(e) => setNewSpace((v) => ({ ...v, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Description</label>
              <textarea
                id="space-desc-input"
                className="input"
                placeholder="Optional — what will you study here?"
                rows={3}
                value={newSpace.description}
                onChange={(e) => setNewSpace((v) => ({ ...v, description: e.target.value }))}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button id="space-create-submit" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Space'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    brand: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
    violet: { bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.25)', text: '#f59e0b' },
    cyan: { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', text: '#2dd4bf' },
    emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
  }
  const c = colors[color]
  return (
    <div className="stat-card" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="stat-icon" style={{ color: c.text }}>
        {icon}
      </div>
      <div className="stat-value" style={{ color: c.text }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
