import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { spacesApi, projectsApi } from '../api'
import {
  ArrowLeft, Plus, BookOpen, Brain, BarChart2, Trash2, ChevronRight, Target, Pencil, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import './SpacePage.css'

export default function SpacePage() {
  const { spaceId } = useParams()
  const navigate     = useNavigate()

  const [space,        setSpace]        = useState(null)
  const [projects,     setProjects]     = useState([])
  const [spaceMastery, setSpaceMastery] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [newProj,      setNewProj]      = useState({ name: '', description: '', learningGoal: '' })
  const [saving,       setSaving]       = useState(false)
  const [showEditSpace, setShowEditSpace] = useState(false)
  const [editSpaceForm, setEditSpaceForm] = useState({ name: '', description: '' })
  const [savingEdit,   setSavingEdit]   = useState(false)

  const handleOpenCreateProject = (prefill) => {
    if (prefill) {
      setNewProj({
        name: prefill.name || '',
        description: prefill.description || '',
        learningGoal: prefill.learningGoal || ''
      })
    } else {
      setNewProj({ name: '', description: '', learningGoal: '' })
    }
    setShowModal(true)
  }

  useEffect(() => {
    Promise.all([
      spacesApi.get(spaceId),
      projectsApi.list(spaceId),
      spacesApi.mastery(spaceId).catch(() => null),
    ])
      .then(([s, p, m]) => {
        setSpace(s.data.data)
        setProjects(p.data.data)
        if (m?.data?.data) setSpaceMastery(m.data.data)
      })
      .catch(() => { toast.error('Space not found'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [spaceId])

  const createProject = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await projectsApi.create(spaceId, newProj)
      setProjects(prev => [res.data.data, ...prev])
      setShowModal(false)
      setNewProj({ name: '', description: '', learningGoal: '' })
      toast.success('Project created!')
      // Refresh space mastery
      spacesApi.mastery(spaceId).then(m => { if (m?.data?.data) setSpaceMastery(m.data.data) }).catch(() => {})
    } catch { toast.error('Failed to create project') }
    finally { setSaving(false) }
  }

  const deleteProject = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its data?')) return
    try {
      await projectsApi.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
      spacesApi.mastery(spaceId).then(m => { if (m?.data?.data) setSpaceMastery(m.data.data) }).catch(() => {})
    } catch { toast.error('Failed to delete project') }
  }

  const openEditSpace = () => {
    setEditSpaceForm({ name: space?.name || '', description: space?.description || '' })
    setShowEditSpace(true)
  }

  const saveEditSpace = async (e) => {
    e.preventDefault()
    if (!editSpaceForm.name.trim()) return
    setSavingEdit(true)
    try {
      const res = await spacesApi.update(spaceId, editSpaceForm)
      setSpace(res.data.data)
      setShowEditSpace(false)
      toast.success('Space updated!')
    } catch { toast.error('Failed to update space') }
    finally { setSavingEdit(false) }
  }

  const statusColor = (status) => {
    if (status === 'ACTIVE') return 'badge-success'
    if (status === 'COMPLETED') return 'badge-brand'
    return 'badge-muted'
  }

  const overallScore = Math.round(spaceMastery?.overallMasteryScore ?? 0)
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (overallScore / 100) * circumference

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:1000}}>
      {[1,2].map(i => <div key={i} className="skeleton" style={{height:140,borderRadius:16}} />)}
    </div>
  )

  return (
    <div className="space-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14}/> Dashboard
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{space?.name}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{space?.name}</h1>
          {space?.description && <p className="page-sub">{space.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={openEditSpace}>
            <Pencil size={14} /> Edit Space
          </button>
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> New Project
          </button>
        </div>
      </div>

      {/* Space Mastery Intelligence Card */}
      {spaceMastery && spaceMastery.totalConcepts > 0 && (
        <div className="space-mastery-card">
          <div className="sm-header">
            <div className="sm-title-row">
              <span className="sm-badge"><Brain size={13}/> Space-Level Mastery</span>
              <h2 className="sm-title">Knowledge Synthesis</h2>
            </div>
            <span className="sm-subtitle">{spaceMastery.totalConcepts} concepts tracked across {projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="sm-body-grid">
            {/* Circular Gauge */}
            <div className="sm-gauge-panel">
              <div className="sm-gauge-wrap">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="spaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <circle
                    className="sm-gauge-bg"
                    cx="60" cy="60" r={radius}
                    strokeWidth="9" fill="none"
                  />
                  <circle
                    className="sm-gauge-bar"
                    cx="60" cy="60" r={radius}
                    strokeWidth="9" fill="none"
                    stroke="url(#spaceGrad)"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                  />
                </svg>
                <div className="sm-gauge-text">
                  <span className="sm-gauge-pct">{overallScore}%</span>
                  <span className="sm-gauge-label">Mastery</span>
                </div>
              </div>
            </div>

            {/* Metrics column */}
            <div className="sm-metrics-col">
              <div className="sm-metric-item">
                <span className="sm-metric-label"><span className="sm-metric-dot dot-emerald"/> Mastered (≥75%)</span>
                <span className="sm-metric-val" style={{color:'var(--accent-emerald)'}}>{spaceMastery.masteredCount} concepts</span>
              </div>
              <div className="sm-metric-item">
                <span className="sm-metric-label"><span className="sm-metric-dot dot-amber"/> Improving (50-74%)</span>
                <span className="sm-metric-val" style={{color:'var(--brand-300)'}}>{spaceMastery.improvingCount} concepts</span>
              </div>
              <div className="sm-metric-item">
                <span className="sm-metric-label"><span className="sm-metric-dot dot-rose"/> Needs Attention (&lt;50%)</span>
                <span className="sm-metric-val" style={{color:'var(--accent-rose)'}}>{spaceMastery.attentionCount} concepts</span>
              </div>
            </div>

            {/* Cross-project weakest concepts */}
            <div className="sm-weak-col">
              <div className="sm-col-title">
                <Target size={13} style={{color:'var(--accent-rose)'}}/> Priority Focus Concepts
              </div>
              <div className="sm-weak-list">
                {(spaceMastery.weakestConcepts || []).slice(0, 3).map(wc => (
                  <div key={wc.id} className="sm-weak-chip">
                    <span className="sm-weak-name" title={wc.conceptName}>{wc.conceptName}</span>
                    <span className="sm-weak-score">{Math.round(wc.masteryScore)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Mastery Breakdown */}
          {spaceMastery.projectBreakdown?.length > 0 && (
            <div className="sm-projects-breakdown">
              <div className="sm-col-title">
                <BarChart2 size={13}/> Project Mastery Breakdown
              </div>
              {spaceMastery.projectBreakdown.map(pb => (
                <div
                  key={pb.projectId}
                  className="sm-proj-row"
                  onClick={() => navigate(`/spaces/${spaceId}/projects/${pb.projectId}`)}
                  title={`Open ${pb.projectName}`}
                >
                  <span className="sm-proj-name">{pb.projectName}</span>
                  <div className="sm-proj-bar-wrap">
                    <div
                      className="sm-proj-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(4, pb.averageMastery))}%` }}
                    />
                  </div>
                  <span className="sm-proj-pct">{Math.round(pb.averageMastery)}%</span>
                  <ChevronRight size={14} style={{color:'var(--text-muted)'}}/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="empty-state empty-state-projects card">
          <div className="empty-state-badge">
            <Sparkles size={13} style={{ color: 'var(--brand-400)' }} />
            <span>Onboarding: Step 2</span>
          </div>
          <BookOpen size={44} className="empty-state-icon" style={{ color: 'var(--brand-400)', opacity: 0.9 }} />
          <h3 style={{ fontSize: 18, color: '#f8fafc', margin: '6px 0 4px' }}>Add your first study project</h3>
          <p style={{ maxWidth: 460, color: 'var(--text-secondary)', fontSize: 13.5, margin: '0 auto 16px', lineHeight: 1.5 }}>
            Projects group specific topics, exam preps, or weekly lecture units inside <strong>{space?.name}</strong>.
          </p>

          <div className="project-starter-chips" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleOpenCreateProject({
                name: 'Foundational Concepts & Principles',
                description: 'Core lecture slides, key definitions, and introductory mechanisms.',
                learningGoal: 'Master all fundamental principles and pass diagnostic quiz'
              })}
            >
              📖 Foundational Concepts
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleOpenCreateProject({
                name: 'Midterm & Exam Preparation',
                description: 'High-yield topics, practice problems, and weak area reinforcement.',
                learningGoal: 'Achieve 85%+ mastery before examination'
              })}
            >
              🎯 Midterm & Exam Prep
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleOpenCreateProject({
                name: 'Problem Sets & Lab Assignments',
                description: 'Hands-on practice exercises, case studies, and calculation walkthroughs.',
                learningGoal: 'Solve all problem sets independently without hints'
              })}
            >
              🔬 Problem Sets & Labs
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenCreateProject()}>
            <Plus size={16}/> Create Custom Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(proj => (
            <div
              key={proj.id}
              className="proj-card card card-interactive"
              onClick={() => navigate(`/spaces/${spaceId}/projects/${proj.id}`)}
            >
              <div className="proj-card-top">
                <span className={`badge ${statusColor(proj.status)}`}>{proj.status ?? 'ACTIVE'}</span>
                <button
                  className="btn btn-ghost btn-icon btn-sm proj-delete"
                  onClick={e => deleteProject(e, proj.id)}
                >
                  <Trash2 size={13}/>
                </button>
              </div>
              <h3 className="proj-name">{proj.name}</h3>
              {proj.description && <p className="proj-desc">{proj.description}</p>}
              {proj.learningGoal && (
                <div className="proj-goal">
                  <Target size={12}/> {proj.learningGoal}
                </div>
              )}
              <div className="proj-stats">
                <span><BookOpen size={12}/> {proj.materialCount ?? 0} materials</span>
                <span><Brain size={12}/> {Math.round(proj.averageMastery ?? spaceMastery?.projectBreakdown?.find(pb => pb.projectId === proj.id)?.averageMastery ?? 0)}% mastery</span>
              </div>
              <div className="proj-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); navigate(`/spaces/${spaceId}/projects/${proj.id}/tutor`) }}
                >
                  <Brain size={13}/> Tutor
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); navigate(`/spaces/${spaceId}/projects/${proj.id}/quiz`) }}
                >
                  <BarChart2 size={13}/> Quiz
                </button>
                <ChevronRight size={14} className="proj-arrow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit space modal */}
      {showEditSpace && (
        <Modal title="Edit Space" onClose={() => setShowEditSpace(false)}>
          <form onSubmit={saveEditSpace}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group">
                <label className="input-label">Space name *</label>
                <input
                  className="input"
                  value={editSpaceForm.name}
                  onChange={e => setEditSpaceForm(v => ({...v, name: e.target.value}))}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={editSpaceForm.description}
                  onChange={e => setEditSpaceForm(v => ({...v, description: e.target.value}))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditSpace(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? <span className="spinner" style={{width:16,height:16}}/> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create project modal */}
      {showModal && (
        <Modal title="Create Project" onClose={() => setShowModal(false)}>
          <form onSubmit={createProject}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group">
                <label className="input-label">Project name *</label>
                <input
                  id="project-name-input"
                  className="input"
                  placeholder="e.g. Neural Networks Fundamentals"
                  value={newProj.name}
                  onChange={e => setNewProj(v=>({...v, name:e.target.value}))}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="input-label">Description</label>
                <textarea
                  id="project-desc-input"
                  className="input"
                  rows={2}
                  placeholder="What is this project about?"
                  value={newProj.description}
                  onChange={e => setNewProj(v=>({...v, description:e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Learning goal</label>
                <input
                  id="project-goal-input"
                  className="input"
                  placeholder="e.g. Understand backpropagation from scratch"
                  value={newProj.learningGoal}
                  onChange={e => setNewProj(v=>({...v, learningGoal:e.target.value}))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="project-create-submit" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{width:16,height:16}}/> : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
