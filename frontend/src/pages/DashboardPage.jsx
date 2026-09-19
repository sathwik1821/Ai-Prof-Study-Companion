import { useState, useEffect, useMemo } from 'react'
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
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowRight
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

  const handleOpenCreateSpace = () => {
    setNewSpace({ name: '', description: '' })
    setShowModal(true)
  }

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
  const nextAction = analytics?.nextRecommendedAction
  const topWeakConcept = analytics?.weakestConcepts?.[0]

  // Project with lowest mastery score (different from most recent) as fallback if needed
  const weakestProject = analytics?.recentProjects
    ?.filter(p => p.projectId !== mostRecentProject?.projectId)
    ?.reduce((min, p) => (!min || (p.masteryScore ?? 0) < (min.masteryScore ?? 0)) ? p : min, null)

  // Targeted Mastery Recommendation data from Analytics
  const targetCardData = useMemo(() => {
    if (nextAction) {
      const isWeakConcept = topWeakConcept != null
      const score = isWeakConcept ? Math.round(topWeakConcept.masteryScore ?? 0) : null
      return {
        badgeText: nextAction.reason || 'Targeted Mastery Growth',
        title: nextAction.title,
        description: nextAction.description,
        metricLabel: isWeakConcept 
          ? `Concept Retention • ${topWeakConcept.conceptName}` 
          : 'Prescriptive Learning Target',
        metricValue: isWeakConcept ? `${score}%` : 'AI Prescribed',
        metricColor: isWeakConcept ? (score < 40 ? '#fb7185' : '#fbbf24') : '#c084fc',
        percent: isWeakConcept ? score : 100,
        barGradient: isWeakConcept
          ? (score < 40 ? 'linear-gradient(90deg, #f43f5e, #fb923c)' : 'linear-gradient(90deg, #a855f7, #6366f1)')
          : 'linear-gradient(90deg, #a855f7, #38bdf8)',
        actionBtnLabel: nextAction.actionType === 'QUIZ' ? 'Practice Concept'
          : nextAction.actionType === 'TUTOR' ? 'Ask AI Tutor'
          : nextAction.actionType === 'MATERIAL' ? 'Upload Notes'
          : 'Take Action',
        projectId: nextAction.projectId || topWeakConcept?.projectId,
        spaceId: nextAction.spaceId || topWeakConcept?.spaceId,
        onAction: () => {
          if (nextAction.actionType === 'QUIZ' && nextAction.projectId && nextAction.spaceId) {
            navigate(`/spaces/${nextAction.spaceId}/projects/${nextAction.projectId}/quiz`)
          } else if (nextAction.actionType === 'TUTOR' && nextAction.projectId && nextAction.spaceId) {
            navigate(`/spaces/${nextAction.spaceId}/projects/${nextAction.projectId}/tutor`)
          } else if (nextAction.actionType === 'MATERIAL' && nextAction.projectId && nextAction.spaceId) {
            navigate(`/spaces/${nextAction.spaceId}/projects/${nextAction.projectId}/materials`)
          } else if (nextAction.spaceId) {
            navigate(`/spaces/${nextAction.spaceId}`)
          } else if (spaces.length > 0) {
            navigate(`/spaces/${spaces[0].id}`)
          } else {
            handleOpenCreateSpace()
          }
        }
      }
    } else if (weakestProject) {
      const score = Math.round(weakestProject.masteryScore ?? 0)
      return {
        badgeText: 'Needs Attention',
        title: weakestProject.projectName,
        description: weakestProject.learningGoal || 'This project has the lowest mastery — a great place to focus next.',
        metricLabel: 'Project Mastery',
        metricValue: `${score}%`,
        metricColor: score < 40 ? '#fb7185' : '#fbbf24',
        percent: score,
        barGradient: score < 40 ? 'linear-gradient(90deg, #f43f5e, #fb923c)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        actionBtnLabel: 'Practice Now',
        projectId: weakestProject.projectId,
        spaceId: weakestProject.spaceId,
        onAction: () => navigate(`/spaces/${weakestProject.spaceId}/projects/${weakestProject.projectId}/quiz`)
      }
    }
    return null
  }, [nextAction, topWeakConcept, weakestProject, spaces, navigate])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/spaces')}>
            <Folder size={15} /> My Spaces
          </button>
          <button id="create-space-btn" className="btn btn-primary" onClick={() => handleOpenCreateSpace()}>
            <Plus size={16} /> New Space
          </button>
        </div>
      </div>

      {/* ══════════ CONTINUITY & TARGETED MASTERY GRID ══════════ */}
      {(mostRecentProject || targetCardData) && (
        <div className={`dash-continuity-grid${targetCardData && mostRecentProject ? '' : ' dash-continuity-single'}`}>

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

          {/* TARGETED MASTERY — Recommended Focus from Analytics */}
          {targetCardData && (
            <div className="dash-recommended-card">
              <div>
                <div className="dash-continue-top">
                  <span className="dash-recommended-badge">
                    <Sparkles size={12} /> {targetCardData.badgeText}
                  </span>
                  <span 
                    className="dash-continue-space"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/analytics')}
                    title="View learning analytics"
                  >
                    <TrendingUp size={12} /> Analytics
                  </span>
                </div>

                <h2 className="dash-continue-title">{targetCardData.title}</h2>
                <p className="dash-continue-goal">
                  {targetCardData.description}
                </p>

                <div className="dash-continue-mastery-bar">
                  <div className="dash-continue-mastery-label">
                    <span>{targetCardData.metricLabel}</span>
                    <span style={{ color: targetCardData.metricColor }}>
                      {targetCardData.metricValue}
                    </span>
                  </div>
                  <div className="dash-bar-bg">
                    <div
                      className="dash-bar-fill"
                      style={{
                        width: `${Math.max(6, targetCardData.percent)}%`,
                        background: targetCardData.barGradient,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="dash-continue-actions">
                <button
                  className="dash-action-btn dash-action-btn-recommended"
                  onClick={targetCardData.onAction}
                >
                  <Zap size={13} /> {targetCardData.actionBtnLabel}
                </button>
                {targetCardData.projectId && targetCardData.spaceId && (
                  <button
                    className="dash-action-btn"
                    onClick={() => navigate(`/spaces/${targetCardData.spaceId}/projects/${targetCardData.projectId}/tutor`)}
                  >
                    <MessageSquare size={13} /> Ask Tutor
                  </button>
                )}
                <button
                  className="dash-action-btn"
                  onClick={() => navigate('/analytics')}
                >
                  Analytics <ChevronRight size={13} />
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
            label="Total Spaces"
            value={analytics.totalSpaces ?? spaces.length}
            color="brand"
            onClick={() => navigate('/spaces')}
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Active Projects"
            value={analytics.totalProjects ?? 0}
            color="violet"
            onClick={() => navigate('/spaces')}
          />
          <StatCard
            icon={<Brain size={20} />}
            label="Avg. Mastery"
            value={`${Math.round(analytics.averageMastery ?? 0)}%`}
            color="cyan"
            onClick={() => navigate('/analytics')}
          />
          <StatCard
            icon={<Target size={20} />}
            label="Quiz Sessions"
            value={analytics.totalQuizAttempts ?? 0}
            color="emerald"
            onClick={() => navigate('/analytics')}
          />
        </div>
      )}

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

function StatCard({ icon, label, value, color, onClick }) {
  const colors = {
    brand: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
    violet: { bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.25)', text: '#f59e0b' },
    cyan: { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', text: '#2dd4bf' },
    emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
  }
  const c = colors[color]
  return (
    <div 
      className="stat-card" 
      style={{ background: c.bg, border: `1px solid ${c.border}`, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
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
