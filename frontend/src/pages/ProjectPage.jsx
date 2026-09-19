import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, recommendationsApi, materialsApi, masteryApi } from '../api'
import {
  ArrowLeft, Brain, BarChart2, Upload, BookOpen, Target, Zap,
  CheckCircle, XCircle, TrendingUp, ChevronRight, AlertTriangle, Activity, Pencil
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import './ProjectPage.css'

export default function ProjectPage() {
  const { spaceId, projectId } = useParams()
  const navigate                = useNavigate()

  const [project,  setProject]  = useState(null)
  const [overview, setOverview] = useState(null)
  const [recs,     setRecs]     = useState([])
  const [masteries, setMasteries] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editProjForm, setEditProjForm] = useState({ name: '', description: '', learningGoal: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    Promise.all([
      projectsApi.get(projectId),
      projectsApi.overview(projectId).catch(() => null),
      recommendationsApi.list(projectId).catch(() => ({ data: { data: [] } })),
      masteryApi.list(projectId).catch(() => ({ data: { data: [] } })),
    ]).then(([p, o, r, m]) => {
      setProject(p.data.data)
      setOverview(o?.data?.data ?? null)
      setRecs(r.data.data ?? [])
      setMasteries(m.data.data ?? [])
    }).catch(() => { toast.error('Project not found'); navigate(`/spaces/${spaceId}`) })
      .finally(() => setLoading(false))
  }, [projectId])

  const dismissRec = async (recId) => {
    try {
      await recommendationsApi.dismiss(projectId, recId)
      setRecs(prev => prev.filter(r => r.id !== recId))
    } catch { toast.error('Failed to dismiss') }
  }

  const recIcon = (type) => {
    if (type === 'TUTOR')  return <Brain size={16} />
    if (type === 'QUIZ')   return <BarChart2 size={16} />
    if (type === 'UPLOAD') return <Upload size={16} />
    return <Target size={16} />
  }

  const recAction = (rec) => {
    if (rec.type === 'TUTOR')  navigate(`/spaces/${spaceId}/projects/${projectId}/tutor`)
    if (rec.type === 'QUIZ')   navigate(`/spaces/${spaceId}/projects/${projectId}/quiz`)
    if (rec.type === 'UPLOAD') navigate(`/spaces/${spaceId}/projects/${projectId}/materials`)
  }

  const openEditProject = () => {
    setEditProjForm({ name: project?.name || '', description: project?.description || '', learningGoal: project?.learningGoal || '' })
    setShowEditProject(true)
  }

  const saveEditProject = async (e) => {
    e.preventDefault()
    if (!editProjForm.name.trim()) return
    setSavingEdit(true)
    try {
      const res = await projectsApi.update(projectId, editProjForm)
      setProject(res.data.data)
      setShowEditProject(false)
      toast.success('Project updated!')
    } catch { toast.error('Failed to update project') }
    finally { setSavingEdit(false) }
  }

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:100,borderRadius:16}}/>)}
    </div>
  )

  const calculatedConceptAvg = masteries.length > 0
    ? masteries.reduce((acc, m) => acc + (m.masteryScore ?? 0), 0) / masteries.length
    : 0

  const rawMastery = overview?.overallMastery 
    ?? overview?.averageMastery 
    ?? (project?.averageMastery && project.averageMastery > 0 ? project.averageMastery : null)
    ?? calculatedConceptAvg

  const mastery = Math.round(rawMastery)

  return (
    <div className="project-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <span className="breadcrumb-sep">/</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/spaces/${spaceId}`)}>
          {project?.spaceName}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{project?.name}</span>
      </div>

      {/* Header */}
      <div className="proj-page-header">
        <div>
          <h1 className="page-title">{project?.name}</h1>
          {project?.learningGoal && (
            <p className="page-sub"><Target size={13} style={{display:'inline',marginRight:4}}/>{project.learningGoal}</p>
          )}
        </div>
        {/* Quick nav */}
        <div className="proj-quick-nav">
          <button className="btn btn-ghost btn-sm" onClick={openEditProject}>
            <Pencil size={13}/> Edit
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/materials`)}>
            <Upload size={15}/> Materials
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/tutor`)}>
            <Brain size={15}/> Tutor
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/quiz`)}>
            <BarChart2 size={15}/> Start Quiz
          </button>
        </div>
      </div>

      <div className="proj-page-body">
        {/* Left: Overview stats */}
        <div className="proj-overview">
          {/* Mastery ring */}
          <div className="card mastery-card">
            <h3 className="card-section-title">Overall Mastery</h3>
            <div className="mastery-ring-wrap">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-overlay)" strokeWidth="10"/>
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="url(#masteryGrad)"
                  strokeWidth="10"
                  strokeDasharray={`${mastery * 3.14} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{transition:'stroke-dasharray 0.6s ease'}}
                />
                <defs>
                  <linearGradient id="masteryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="mastery-ring-label">
                <span className="mastery-pct">{mastery}%</span>
                <span className="mastery-txt">mastered</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="card proj-stat-grid">
            <ProjStat icon={<BookOpen size={16}/>} label="Materials" value={overview?.materialCount ?? overview?.totalMaterials ?? project?.materialCount ?? 0} />
            <ProjStat icon={<BarChart2 size={16}/>} label="Quizzes" value={overview?.totalQuizAttempts ?? overview?.totalQuizzesTaken ?? 0} />
            <ProjStat icon={<Brain size={16}/>} label="Sessions" value={overview?.tutorSessionCount ?? 0} />
            <ProjStat icon={<TrendingUp size={16}/>} label="Concepts" value={overview?.conceptCount ?? masteries.length} />
          </div>
        </div>

        {/* Right: Recommendations */}
        <div className="proj-recs">
          <h3 className="card-section-title" style={{marginBottom:12}}>
            <Zap size={16} style={{color:'var(--accent-amber)'}}/> AI Recommendations
          </h3>
          {recs.length === 0 ? (
            <div className="empty-state" style={{padding:'32px 16px'}}>
              <CheckCircle size={36} className="empty-state-icon" style={{color:'var(--accent-emerald)'}}/>
              <p>No recommendations right now — keep learning!</p>
            </div>
          ) : (
            <div className="recs-list">
              {recs.map(rec => (
                <div key={rec.id} className="rec-item card">
                  <div className="rec-icon">{recIcon(rec.type)}</div>
                  <div className="rec-body">
                    <p className="rec-title">{rec.title}</p>
                    <p className="rec-desc">{rec.description}</p>
                  </div>
                  <div className="rec-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => recAction(rec)}>
                      Go <ChevronRight size={12}/>
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => dismissRec(rec.id)} title="Dismiss">
                      <XCircle size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concept Mastery & Growth Analysis */}
      <div className="card concept-mastery-section" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 className="card-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--brand-400)' }} /> Concept Mastery &amp; Growth Analysis
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Individual concept retention evaluated across quizzes, assessments, and tutor interactions
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/quiz`)}
          >
            <BarChart2 size={14} /> Practice Weak Concepts
          </button>
        </div>

        {masteries.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <Brain size={32} className="empty-state-icon" />
            <p>Start a quiz or ask the tutor to generate concept mastery tracking.</p>
          </div>
        ) : (
          <div className="concept-grid">
            {masteries.map(m => {
              const score = Math.round(m.masteryScore || 0)
              const status = m.growthStatus || 'STABLE'
              return (
                <div key={m.id} className="concept-card">
                  <div className="concept-header">
                    <div>
                      <h4 className="concept-title">{m.conceptName}</h4>
                      {m.conceptDescription && (
                        <p className="concept-desc">{m.conceptDescription}</p>
                      )}
                    </div>
                    <div className={`growth-tag ${status.toLowerCase()}`}>
                      {status === 'IMPROVING' && <><TrendingUp size={12} /> Improving</>}
                      {status === 'STABLE' && <><Activity size={12} /> Stable</>}
                      {status === 'REQUIRING_ATTENTION' && <><AlertTriangle size={12} /> Needs Attention</>}
                    </div>
                  </div>

                  <div className="concept-meter-wrap">
                    <div className="concept-meter-info">
                      <span className="evidence-chip">
                        {m.evidenceCount || 0} {m.evidenceCount === 1 ? 'assessment' : 'assessments'}
                      </span>
                      <span className="concept-pct">{score}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 8 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${score}%`,
                          background:
                            status === 'IMPROVING' ? 'var(--accent-emerald)'
                            : status === 'REQUIRING_ATTENTION' ? 'var(--accent-rose)'
                            : 'var(--brand-500)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="concept-card-footer">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/tutor`)}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                    >
                      <Brain size={13} /> Ask Tutor
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/quiz`)}
                      style={{ fontSize: 12, padding: '4px 8px' }}
                    >
                      <BarChart2 size={13} /> Quiz
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

      {/* Edit project modal */}
      {showEditProject && (
        <Modal title="Edit Project" onClose={() => setShowEditProject(false)}>
          <form onSubmit={saveEditProject}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group">
                <label className="input-label">Project name *</label>
                <input
                  className="input"
                  value={editProjForm.name}
                  onChange={e => setEditProjForm(v => ({...v, name: e.target.value}))}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={editProjForm.description}
                  onChange={e => setEditProjForm(v => ({...v, description: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Learning Goal</label>
                <input
                  className="input"
                  value={editProjForm.learningGoal}
                  onChange={e => setEditProjForm(v => ({...v, learningGoal: e.target.value}))}
                  placeholder="e.g. Understand backpropagation from scratch"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditProject(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? <span className="spinner" style={{width:16,height:16}}/> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
  )
}

function ProjStat({ icon, label, value }) {
  return (
    <div className="proj-stat">
      <div className="proj-stat-icon">{icon}</div>
      <div className="proj-stat-value">{value}</div>
      <div className="proj-stat-label">{label}</div>
    </div>
  )
}
