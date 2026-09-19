import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi, spacesApi } from '../api'
import {
  TrendingUp,
  Brain,
  Target,
  BookOpen,
  Zap,
  ChevronRight,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Activity
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area, ReferenceLine
} from 'recharts'
import toast from 'react-hot-toast'
import './AnalyticsPage.css'

/* ─── Custom chart tooltip ────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="chart-tooltip-val" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `${Math.round(p.value)}%` : p.value}
        </p>
      ))}
      {payload[0]?.payload?.projectName && payload[0].payload.projectName !== label && (
        <p className="chart-tooltip-proj">{payload[0].payload.projectName}</p>
      )}
    </div>
  )
}

/* ─── KPI stat card ───────────────────────────────────────── */
function AnalStat({ icon, label, value, color, sub }) {
  return (
    <div className="anal-stat card">
      <div className="anal-stat-top">
        <div className="anal-stat-icon" style={{ color }}>{icon}</div>
        <span className="anal-stat-label">{label}</span>
      </div>
      <div className="anal-stat-value" style={{ color }}>{value}</div>
      {sub && <span className="anal-stat-sub">{sub}</span>}
    </div>
  )
}

/* ─── Mini SVG mastery ring ───────────────────────────────── */
function MasteryRing({ score }) {
  const r = 16, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score > 0 ? '#f43f5e' : '#1e293b'
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="mastery-ring" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx="20" cy="20" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">
        {score > 0 ? `${score}%` : '—'}
      </text>
    </svg>
  )
}

/* ─── Space color palette ─────────────────────────────────── */
const SPACE_COLORS = ['#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#ec4899']

/* ═══════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSpaceId, setSelectedSpaceId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      spacesApi.list()
    ])
      .then(([ovRes, spRes]) => {
        setOverview(ovRes.data.data)
        const raw = spRes.data.data || []
        setSpaces(raw.map((s, i) => ({ ...s, color: SPACE_COLORS[i % SPACE_COLORS.length] })))
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  /* ── Derived data with space color injection ── */
  const allProjects = useMemo(() => overview?.recentProjects ?? overview?.masteryByProject ?? [], [overview])
  const allQuizData = useMemo(() => overview?.recentActivity ?? [], [overview])
  const allWeakConcepts = useMemo(() => overview?.weakestConcepts ?? [], [overview])
  const nextAction = overview?.nextRecommendedAction
  const avgMastery = Math.round(overview?.averageMastery ?? 0)

  const projectsWithColor = useMemo(() =>
    allProjects.map(p => {
      const sp = spaces.find(s => s.id === p.spaceId)
      return { ...p, spaceColor: sp?.color || '#64748b' }
    }),
    [allProjects, spaces])

  const filteredProjects = useMemo(() =>
    selectedSpaceId ? projectsWithColor.filter(p => p.spaceId === selectedSpaceId) : projectsWithColor,
    [projectsWithColor, selectedSpaceId])

  const filteredQuizData = useMemo(() => {
    if (!selectedSpaceId) return allQuizData
    const spaceProjectNames = allProjects.filter(p => p.spaceId === selectedSpaceId).map(p => p.projectName)
    return allQuizData.filter(q => spaceProjectNames.includes(q.projectName))
  }, [allQuizData, allProjects, selectedSpaceId])

  const filteredWeakConcepts = useMemo(() =>
    selectedSpaceId ? allWeakConcepts.filter(c => c.spaceId === selectedSpaceId) : allWeakConcepts,
    [allWeakConcepts, selectedSpaceId])

  const masteryChartData = useMemo(() =>
    filteredProjects.map(p => ({
      projectName: p.projectName?.length > 14 ? p.projectName.slice(0, 13) + '…' : p.projectName,
      fullName: p.projectName,
      averageMastery: Math.round(p.averageMastery ?? p.masteryScore ?? 0),
    })),
    [filteredProjects])

  /* Projects grouped by space for Learning Continuity */
  const projectsBySpace = useMemo(() => {
    const groups = {}
    filteredProjects.forEach(p => {
      const key = p.spaceId || '__none__'
      if (!groups[key]) groups[key] = { spaceName: p.spaceName || 'Projects', spaceId: p.spaceId, color: p.spaceColor, items: [] }
      groups[key].items.push(p)
    })
    return Object.values(groups)
  }, [filteredProjects])

  /* ── Action routing ── */
  const handleActionClick = () => {
    if (!nextAction) return
    const { actionType, projectId, spaceId } = nextAction
    if (actionType === 'QUIZ' && projectId && spaceId) navigate(`/spaces/${spaceId}/projects/${projectId}/quiz`)
    else if (actionType === 'TUTOR' && projectId && spaceId) navigate(`/spaces/${spaceId}/projects/${projectId}/tutor`)
    else if (actionType === 'MATERIAL' && projectId && spaceId) navigate(`/spaces/${spaceId}/projects/${projectId}/materials`)
    else if (spaceId) navigate(`/spaces/${spaceId}`)
    else navigate('/dashboard')
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="analytics-page">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 18 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="analytics-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Learning Analytics</h1>
          <p className="page-sub">Mastery intelligence, adaptive prescriptions &amp; space-level progress</p>
        </div>
      </div>

      {/* ══ PRD §16: What should I do next? ════════════════════ */}
      {nextAction && (
        <div className="anal-action-banner">
          <div className="anal-action-content">
            <div className="anal-action-badge">
              <Sparkles size={13} /> AI Prescriptive Action &bull; {nextAction.reason || 'Optimal Next Step'}
            </div>
            <h2 className="anal-action-title">{nextAction.title}</h2>
            <p className="anal-action-desc">{nextAction.description}</p>
          </div>
          <button className="anal-action-btn" onClick={handleActionClick}>
            <span>Take Action Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ══ PRD §16: How am I doing? — KPI Cards ════════════════ */}
      <div className="analytics-stats">
        <AnalStat
          icon={<Brain size={20} />}
          label="Average Mastery"
          value={avgMastery > 0 ? `${avgMastery}%` : '—'}
          color={avgMastery >= 75 ? '#10b981' : avgMastery >= 50 ? '#fbbf24' : avgMastery > 0 ? '#f43f5e' : '#475569'}
          sub={avgMastery === 0 ? 'Start studying to track mastery' : null}
        />
        <AnalStat icon={<BookOpen size={20} />} label="Total Projects" value={overview?.totalProjects ?? 0} color="#38bdf8" />
        <AnalStat icon={<Target size={20} />} label="Quizzes Taken" value={overview?.totalQuizAttempts ?? 0} color="#a855f7" />
        <AnalStat icon={<TrendingUp size={20} />} label="Tutor Sessions" value={overview?.totalConversations ?? 0} color="#f59e0b" />
      </div>

      {/* ══ Space Filter Pills ════════════════════════════════════ */}
      {spaces.length > 0 && (
        <div className="space-filter-bar">
          <div className="space-filter-label">
            <Layers size={13} /> Filter by Space
          </div>
          <div className="space-pills-row">
            <button
              className={`space-pill ${!selectedSpaceId ? 'space-pill-active space-pill-all' : ''}`}
              onClick={() => setSelectedSpaceId(null)}
            >
              <Activity size={12} style={{ flexShrink: 0 }} />
              All Spaces
              <span className="space-pill-count">{allProjects.length}</span>
            </button>
            {spaces.map((sp, i) => {
              const count = allProjects.filter(p => p.spaceId === sp.id).length
              if (count === 0) return null
              const isActive = selectedSpaceId === sp.id
              return (
                <button
                  key={sp.id}
                  className={`space-pill ${isActive ? 'space-pill-active' : ''}`}
                  style={isActive ? { '--pill-color': sp.color } : {}}
                  onClick={() => setSelectedSpaceId(isActive ? null : sp.id)}
                >
                  <span className="space-pill-dot" style={{ background: sp.color }} />
                  {sp.name}
                  <span className="space-pill-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ Charts Row ════════════════════════════════════════════ */}
      <div className="analytics-charts">

        {/* — Mastery by Project — */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Brain size={15} style={{ color: '#fbbf24' }} /> Mastery by Project
            </h3>
            <span className="chart-sub">BKT probabilistic score</span>
          </div>

          {masteryChartData.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 0' }}>
              <Brain size={36} className="empty-state-icon" />
              <p>No projects {selectedSpaceId ? 'in this space' : 'yet'}</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={masteryChartData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="projectName" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="rgba(16,185,129,0.18)" strokeDasharray="4 4" label={{ value: 'Proficient', fill: '#475569', fontSize: 10, position: 'right' }} />
                  <Area type="monotone" dataKey="averageMastery" name="Mastery" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mastGrad)" dot={{ fill: '#fbbf24', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="chart-projects-list">
                {filteredProjects.map((p, idx) => {
                  const score = Math.round(p.averageMastery ?? p.masteryScore ?? 0)
                  const barColor = score >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : score >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : score > 0 ? 'linear-gradient(90deg,#f43f5e,#fb923c)' : 'rgba(255,255,255,0.05)'
                  return (
                    <div key={p.projectId || idx} className="chart-proj-row"
                      onClick={() => p.spaceId && navigate(`/spaces/${p.spaceId}/projects/${p.projectId}`)}>
                      <div className="chart-proj-meta">
                        <div className="chart-proj-info">
                          <span className="chart-proj-name">{p.projectName}</span>
                          {p.spaceName && (
                            <span className="chart-proj-space" style={{ color: p.spaceColor, background: p.spaceColor + '18', borderColor: p.spaceColor + '40' }}>
                              {p.spaceName}
                            </span>
                          )}
                        </div>
                        <span className="chart-proj-score" style={{ color: score >= 75 ? '#10b981' : score >= 50 ? '#fbbf24' : score > 0 ? '#f43f5e' : '#475569' }}>
                          {score > 0 ? `${score}%` : '—'}
                        </span>
                      </div>
                      <div className="chart-bar-bg">
                        <div className="chart-bar-fill" style={{ width: `${score > 0 ? Math.max(4, score) : 0}%`, background: barColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* — Quiz Performance Trends — */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Target size={15} style={{ color: '#a855f7' }} /> Quiz Performance Trends
            </h3>
            <span className="chart-sub">Score history over time</span>
          </div>

          {filteredQuizData.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 0' }}>
              <Target size={36} className="empty-state-icon" style={{ color: '#a855f7' }} />
              <p>Complete quizzes to see your score trajectory</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={filteredQuizData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="rgba(16,185,129,0.18)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="scorePercent" name="Score" stroke="#a855f7" strokeWidth={2.5}
                    dot={{ fill: '#a855f7', r: 4 }} activeDot={{ r: 6, fill: '#c084fc' }} />
                </LineChart>
              </ResponsiveContainer>

              <div className="quiz-stats-footer">
                <div className="quiz-stat-pill">
                  <CheckCircle2 size={12} color="#a855f7" />
                  {filteredQuizData.length} quiz{filteredQuizData.length !== 1 ? 'zes' : ''} recorded
                </div>
                {(() => {
                  const recent = filteredQuizData.slice(-5)
                  const avg = Math.round(recent.reduce((a, q) => a + q.scorePercent, 0) / recent.length)
                  return (
                    <div className="quiz-stat-pill">
                      <TrendingUp size={12} color="#10b981" />
                      Recent avg: {avg}%
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ PRD §16: Focus & Continuity Grid ════════════════════ */}
      <div className="analytics-split-grid">

        {/* PRD: Weakest concepts needing attention */}
        <div className="card split-card">
          <div className="split-header">
            <h3 className="split-title">
              <AlertTriangle size={15} color="#f43f5e" /> Priority Focus Concepts
            </h3>
            <span className="split-subtitle">Lowest retention — reinforce now</span>
          </div>

          {filteredWeakConcepts.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <p>{allWeakConcepts.length === 0 ? 'Study to unlock concept tracking' : 'All concepts in healthy retention!'}</p>
            </div>
          ) : (
            <div className="weak-concepts-list">
              {filteredWeakConcepts.map(c => {
                const score = Math.round(c.masteryScore ?? 0)
                const sp = spaces.find(s => s.id === c.spaceId)
                return (
                  <div key={c.conceptId} className="weak-concept-item">
                    <div className="wc-left">
                      <span className="wc-name">{c.conceptName}</span>
                      <div className="wc-context">
                        {sp && (
                          <span className="wc-space-badge" style={{ color: sp.color, background: sp.color + '18', borderColor: sp.color + '40' }}>
                            {sp.name}
                          </span>
                        )}
                        <span className="wc-project">
                          <BookOpen size={10} /> {c.projectName}
                        </span>
                      </div>
                    </div>
                    <div className="wc-right">
                      <span className="wc-score" style={{ color: score < 40 ? '#fb7185' : '#fbbf24' }}>{score}%</span>
                      {c.spaceId && c.projectId && (
                        <button className="wc-action-btn" onClick={() => navigate(`/spaces/${c.spaceId}/projects/${c.projectId}/quiz`)}>
                          <Zap size={12} /> Practice
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PRD: Where was I? — Learning Continuity grouped by space */}
        <div className="card split-card">
          <div className="split-header">
            <h3 className="split-title">
              <Clock size={15} color="#38bdf8" /> Learning Continuity
            </h3>
            <span className="split-subtitle">Where was I? Resume instantly</span>
          </div>

          {projectsBySpace.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <BookOpen size={32} color="#38bdf8" style={{ margin: '0 auto 8px' }} />
              <p>No active projects yet</p>
            </div>
          ) : (
            <div className="continuity-groups">
              {projectsBySpace.map((group, gi) => (
                <div key={group.spaceId || gi} className="continuity-group">
                  {/* Space group header */}
                  <div className="continuity-space-header">
                    <span className="continuity-space-dot" style={{ background: group.color }} />
                    <span className="continuity-space-name" style={{ color: group.color }}>{group.spaceName}</span>
                    <span className="continuity-space-count">{group.items.length} project{group.items.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="continuity-list">
                    {group.items.map(p => {
                      const score = Math.round(p.averageMastery ?? p.masteryScore ?? 0)
                      return (
                        <div key={p.projectId} className="continuity-item">
                          <MasteryRing score={score} />
                          <div className="ci-info" onClick={() => p.spaceId && navigate(`/spaces/${p.spaceId}/projects/${p.projectId}`)}>
                            <span className="ci-name">{p.projectName}</span>
                            <span className="ci-last">
                              {p.updatedAt
                                ? `Updated ${new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                : 'No activity yet'}
                            </span>
                          </div>
                          <div className="ci-quick-actions">
                            <button className="ci-quick-btn ci-tutor-btn" title="AI Tutor"
                              onClick={() => navigate(`/spaces/${p.spaceId}/projects/${p.projectId}/tutor`)}>
                              <MessageSquare size={12} />
                            </button>
                            <button className="ci-quick-btn ci-quiz-btn" title="Take Quiz"
                              onClick={() => navigate(`/spaces/${p.spaceId}/projects/${p.projectId}/quiz`)}>
                              <Zap size={12} />
                            </button>
                            <ChevronRight size={14} className="ci-arrow"
                              onClick={() => p.spaceId && navigate(`/spaces/${p.spaceId}/projects/${p.projectId}`)} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

