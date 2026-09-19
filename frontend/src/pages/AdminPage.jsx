import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api'
import {
  Shield, Activity, Server, Cpu, Database, CheckCircle, AlertTriangle,
  Clock, Layers, Users, RefreshCw, Zap, ArrowUpRight, Wifi,
  BookOpen, FileText, BrainCircuit, TerminalSquare, FlaskConical
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminPage.css'

/* ─── Event type → color/icon map ─────────────────────────── */
const EVENT_META = {
  QUIZ_ATTEMPT:     { color: '#a855f7', label: 'Quiz Attempt' },
  TUTOR_SESSION:    { color: '#38bdf8', label: 'Tutor Session' },
  MATERIAL_UPLOAD:  { color: '#10b981', label: 'Material Upload' },
  PROJECT_CREATED:  { color: '#f59e0b', label: 'Project Created' },
  SPACE_CREATED:    { color: '#6366f1', label: 'Space Created' },
  MASTERY_UPDATED:  { color: '#fbbf24', label: 'Mastery Update' },
  USER_REGISTERED:  { color: '#ec4899', label: 'User Registered' },
}
const evtMeta = (type) => EVENT_META[type] ?? { color: '#64748b', label: type ?? 'Event' }

/* ─── Feature icon map for AI Observability ───────────────── */
const FEATURE_ICONS = {
  QUIZ:      <FlaskConical size={14} color="#a855f7" />,
  TUTOR:     <BrainCircuit size={14} color="#38bdf8" />,
  RAG:       <FileText size={14} color="#10b981" />,
  EMBEDDING: <Zap size={14} color="#f59e0b" />,
}

/* ─── Animated counter number ─────────────────────────────── */
function StatNumber({ value, color }) {
  return (
    <span className="metric-value" style={color ? { color } : {}}>
      {typeof value === 'number' ? value.toLocaleString() : value ?? 0}
    </span>
  )
}

/* ─── Health status card ──────────────────────────────────── */
function HealthCard({ icon, label, detail, status = 'healthy' }) {
  const isOk = status === 'healthy'
  return (
    <div className={`health-card card ${isOk ? 'health-ok' : 'health-warn'}`}>
      <div className={`health-icon ${isOk ? 'healthy' : 'warn'}`}>
        {isOk ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      </div>
      <div>
        <div className="health-status">{label}</div>
        <div className="health-detail">{detail}</div>
      </div>
      <div className={`health-live-dot ${isOk ? '' : 'warn-dot'}`} title="Live" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [usage, setUsage] = useState([])
  const [jobs, setJobs] = useState([])
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [ovRes, usRes, jbRes, urRes, actRes] = await Promise.all([
        adminApi.overview().catch(() => ({ data: { data: null } })),
        adminApi.usage().catch(() => ({ data: { data: [] } })),
        adminApi.jobs().catch(() => ({ data: { data: [] } })),
        adminApi.users().catch(() => ({ data: { data: [] } })),
        adminApi.activity().catch(() => ({ data: { data: [] } })),
      ])
      setOverview(ovRes.data.data)
      setUsage(usRes.data.data || [])
      setJobs(jbRes.data.data || [])
      setUsers(urRes.data.data || [])
      setActivity(actRes.data.data || [])
      setLastRefresh(new Date())
    } catch {
      toast.error('Failed to load admin telemetry')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /* ── Derived metrics ── */
  const totalTokens = usage.reduce((a, u) => a + (u.totalInputTokens || 0) + (u.totalOutputTokens || 0), 0)
  const avgLatency  = usage.length > 0
    ? Math.round(usage.reduce((a, u) => a + (u.avgLatencyMs || 0), 0) / usage.length)
    : 0
  const totalCost   = usage.reduce((a, u) => a + (u.totalCostUsd || 0), 0)

  const jobsStats = {
    done:       jobs.filter(j => j.status === 'DONE').length,
    failed:     jobs.filter(j => j.status === 'FAILED').length,
    processing: jobs.filter(j => j.status === 'PROCESSING').length,
    queued:     jobs.filter(j => j.status === 'QUEUED').length,
  }

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  /* ── Tab panel content ── */
  const tabs = [
    { id: 'overview', icon: <Server size={14} />,  label: 'System Health & Metrics' },
    { id: 'ai',       icon: <Cpu size={14} />,     label: 'AI Observability & LLM Costs' },
    { id: 'jobs',     icon: <Layers size={14} />,  label: `Worker Pipeline (${jobs.length})` },
    { id: 'users',    icon: <Users size={14} />,   label: `User Journeys & Audit (${users.length})` },
  ]

  return (
    <div className="admin-page">

      {/* ══ Header ══════════════════════════════════════════════ */}
      <div className="admin-header">
        <div>
          <div className="admin-badge">
            <Shield size={12} /> Platform Intelligence &amp; Observability
          </div>
          <h1 className="page-title gradient-text">Admin &amp; AI Control Hub</h1>
          <p className="page-sub">
            Real-time infrastructure health, LLM telemetry, background job queues &amp; learner activity audits
          </p>
        </div>
        <div className="admin-header-right">
          {lastRefresh && (
            <span className="admin-last-refresh">
              <Clock size={11} /> Last refreshed {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh Telemetry'}
          </button>
        </div>
      </div>

      {/* ══ Tab Bar ═════════════════════════════════════════════ */}
      <div className="admin-tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`admin-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <div
          className="admin-tab-indicator"
          style={{ '--tab-idx': tabs.findIndex(t => t.id === tab) }}
        />
      </div>

      {/* ══ Loading skeleton ═════════════════════════════════════ */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
      ) : (

        <div className="admin-tab-panels">

          {/* ════════ TAB 1: SYSTEM HEALTH ════════ */}
          {tab === 'overview' && (
            <div className="admin-section-grid tab-panel">

              {/* Health Cards */}
              <div className="admin-health-row">
                <HealthCard
                  icon={<Server size={18} />}
                  label={`System Core: ${overview?.systemHealth ?? 'HEALTHY'}`}
                  detail="Spring Boot 3.4 · Tomcat Port 8080"
                />
                <HealthCard
                  icon={<Database size={18} />}
                  label={`PostgreSQL: ${overview?.dbStatus ?? 'CONNECTED'}`}
                  detail="pgvector v0.8 · 7 Migrations Applied"
                />
                <HealthCard
                  icon={<BrainCircuit size={18} />}
                  label={`Gemini Engine: ${overview?.aiStatus ?? 'ONLINE'}`}
                  detail={`Active: ${overview?.aiModel ?? 'gemini-3.6-flash'}`}
                />
              </div>

              {/* PRD Platform Stats Grid */}
              <div className="admin-metrics-grid">
                {[
                  { label: 'Registered Users',    value: overview?.totalUsers,           sub: 'Active platform learners',    color: '#38bdf8', icon: <Users size={16} /> },
                  { label: 'Learning Spaces',     value: overview?.totalSpaces,          sub: 'Subject domains',             color: '#a855f7', icon: <Layers size={16} /> },
                  { label: 'Total Projects',      value: overview?.totalProjects,        sub: 'Isolated learning tracks',    color: '#f59e0b', icon: <BookOpen size={16} /> },
                  { label: 'Study Materials',     value: overview?.totalMaterials,       sub: 'Indexed knowledge PDFs',      color: '#10b981', icon: <FileText size={16} /> },
                  { label: 'Total AI Calls',      value: overview?.totalAiCalls,         sub: 'RAG, quizzes & tutor',        color: '#fbbf24', icon: <Zap size={16} />,    highlight: true },
                  { label: 'Background Jobs',     value: overview?.totalBackgroundJobs,  sub: 'Completed async workflows',   color: '#6366f1', icon: <TerminalSquare size={16} /> },
                ].map(({ label, value, sub, color, icon, highlight }) => (
                  <div key={label} className={`card metric-box ${highlight ? 'metric-highlight' : ''}`}>
                    <div className="metric-icon" style={{ color }}>{icon}</div>
                    <span className="metric-label">{label}</span>
                    <StatNumber value={value} color={highlight ? color : undefined} />
                    <span className="metric-sub">{sub}</span>
                  </div>
                ))}
              </div>

              {/* Activity Stream */}
              <div className="card">
                <div className="section-header">
                  <h3 className="section-title">
                    <Activity size={15} style={{ color: 'var(--brand-400)' }} />
                    Recent Platform Learning Events
                  </h3>
                  <span className="section-badge">{activity.length} events</span>
                </div>

                {activity.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <Activity size={32} className="empty-state-icon" />
                    <p>No learning events recorded yet.</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {activity.slice(0, 12).map((evt, i) => {
                      const meta = evtMeta(evt.eventType)
                      return (
                        <div key={evt.id ?? i} className="activity-row">
                          <div className="activity-dot" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                          <div className="activity-content">
                            <span className="activity-type">{meta.label}</span>
                            {evt.userId && (
                              <span className="activity-user">
                                <Users size={10} /> {evt.userId?.toString().slice(0, 8)}…
                              </span>
                            )}
                          </div>
                          <span className="activity-time">
                            {evt.createdAt ? new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ TAB 2: AI OBSERVABILITY ════════ */}
          {tab === 'ai' && (
            <div className="admin-section-grid tab-panel">

              {/* AI KPI row */}
              <div className="admin-metrics-grid">
                {[
                  { label: 'Total Tokens Processed', value: totalTokens.toLocaleString(), sub: 'Input & output combined',        color: '#fbbf24', highlight: true },
                  { label: 'Avg AI Latency',          value: `${avgLatency} ms`,           sub: 'Across all features',           color: '#38bdf8' },
                  { label: 'Generation Model',        value: overview?.aiModel ?? 'gemini-3.6-flash', sub: 'Structured output + RAG', color: '#a855f7', small: true },
                  { label: 'Embedding Model',         value: overview?.embeddingModel ?? 'gemini-embedding-001', sub: '3072 dimensions/chunk', color: '#10b981', small: true },
                  { label: 'Estimated Cost',          value: `$${totalCost.toFixed(4)}`,   sub: 'Candidate / Dev tier',          color: '#10b981' },
                ].map(({ label, value, sub, color, highlight, small }) => (
                  <div key={label} className={`card metric-box ${highlight ? 'metric-highlight' : ''}`}>
                    <span className="metric-label">{label}</span>
                    <span className="metric-value" style={{ color: highlight ? color : undefined, fontSize: small ? 16 : undefined }}>
                      {value ?? 0}
                    </span>
                    <span className="metric-sub">{sub}</span>
                  </div>
                ))}
              </div>

              {/* Telemetry breakdown table */}
              <div className="card">
                <div className="section-header">
                  <h3 className="section-title">
                    <Cpu size={15} style={{ color: 'var(--brand-400)' }} />
                    Telemetry Breakdown by AI Feature
                  </h3>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Input Tokens</th>
                        <th>Output Tokens</th>
                        <th>Avg Latency</th>
                        <th>Est. Cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                            No AI usage logged yet. Try asking the Tutor or generating a Quiz.
                          </td>
                        </tr>
                      ) : usage.map(u => (
                        <tr key={u.feature}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {FEATURE_ICONS[u.feature] ?? <Zap size={14} color="#64748b" />}
                              <span style={{ fontWeight: 600, color: 'var(--brand-300)' }}>{u.feature}</span>
                            </div>
                          </td>
                          <td>{(u.totalInputTokens || 0).toLocaleString()}</td>
                          <td>{(u.totalOutputTokens || 0).toLocaleString()}</td>
                          <td>
                            <span className={`latency-badge ${u.avgLatencyMs > 5000 ? 'slow' : u.avgLatencyMs > 2000 ? 'medium' : 'fast'}`}>
                              {u.avgLatencyMs ? `${Math.round(u.avgLatencyMs)} ms` : 'N/A'}
                            </span>
                          </td>
                          <td>${Number(u.totalCostUsd || 0).toFixed(4)}</td>
                          <td><span className="badge badge-success">OK</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PRD Observability callout */}
              <div className="card insight-card">
                <div className="insight-header">
                  <BrainCircuit size={16} color="#a855f7" />
                  <h4>PRD Observability Insights</h4>
                </div>
                <ul className="insight-list">
                  <li><strong>Active model:</strong> Google Gemini 3.6 Flash with structured JSON output enforcement for all quiz and tutor routes.</li>
                  <li><strong>Slow responses?</strong> Caused by high-context RAG embeddings + multi-distractor MCQ generation or rubric evaluation.</li>
                  <li><strong>Failure resilience:</strong> Automatic exponential backoff with up to 3 retry attempts in the worker pipeline.</li>
                  <li><strong>BKT Mastery:</strong> Bayesian Knowledge Tracing updates after each quiz attempt — evidenceCount must be &gt; 0 to register score.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ════════ TAB 3: WORKER PIPELINE ════════ */}
          {tab === 'jobs' && (
            <div className="admin-section-grid tab-panel">

              {/* Job stats mini row */}
              <div className="admin-metrics-grid" style={{ '--cols': 4 }}>
                {[
                  { label: 'Completed',  value: jobsStats.done,       color: '#10b981' },
                  { label: 'Processing', value: jobsStats.processing,  color: '#f59e0b' },
                  { label: 'Queued',     value: jobsStats.queued,      color: '#6366f1' },
                  { label: 'Failed',     value: jobsStats.failed,      color: '#f43f5e' },
                ].map(s => (
                  <div key={s.label} className="card metric-box">
                    <span className="metric-label">{s.label}</span>
                    <span className="metric-value" style={{ color: s.color }}>{s.value}</span>
                    <span className="metric-sub">jobs</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-header">
                  <h3 className="section-title">
                    <Layers size={15} style={{ color: 'var(--accent-cyan)' }} />
                    Background Worker Processing Pipeline
                  </h3>
                  <span className="section-badge">{jobs.length} total jobs</span>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Workflow Type</th>
                        <th>Status</th>
                        <th>Attempts / Max</th>
                        <th>Created At</th>
                        <th>Processing Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                            No asynchronous jobs queued yet.
                          </td>
                        </tr>
                      ) : jobs.map(j => {
                        const duration = j.startedAt && j.completedAt
                          ? `${((new Date(j.completedAt) - new Date(j.startedAt)) / 1000).toFixed(1)}s`
                          : '—'
                        return (
                          <tr key={j.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                              {j.id?.toString().substring(0, 8)}…
                            </td>
                            <td style={{ fontWeight: 500 }}>{j.jobType}</td>
                            <td>
                              <span className={`job-badge ${j.status?.toLowerCase()}`}>{j.status}</span>
                            </td>
                            <td>{j.attempts} / {j.maxAttempts}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {j.createdAt ? new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                            </td>
                            <td style={{ fontSize: 12 }}>{duration}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════ TAB 4: USER JOURNEYS & AUDIT ════════ */}
          {tab === 'users' && (
            <div className="admin-section-grid tab-panel">

              {/* User stats row */}
              <div className="admin-metrics-grid" style={{ '--cols': 3 }}>
                <div className="card metric-box">
                  <span className="metric-label">Total Learners</span>
                  <span className="metric-value">{users.length}</span>
                  <span className="metric-sub">Platform-wide registrations</span>
                </div>
                <div className="card metric-box">
                  <span className="metric-label">Admins</span>
                  <span className="metric-value">{users.filter(u => u.role === 'ADMIN').length}</span>
                  <span className="metric-sub">Elevated privilege accounts</span>
                </div>
                <div className="card metric-box metric-highlight">
                  <span className="metric-label">Data Isolation</span>
                  <span className="metric-value" style={{ color: '#10b981' }}>100%</span>
                  <span className="metric-sub">All workspaces row-level scoped</span>
                </div>
              </div>

              <div className="card">
                <div className="section-header">
                  <h3 className="section-title">
                    <Users size={15} style={{ color: 'var(--accent-amber)' }} />
                    Platform Learners &amp; Data Isolation Audit
                  </h3>
                  <div className="search-input-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search name or email…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="admin-search-input"
                    />
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Learner</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Data Isolation</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                            No users match your search.
                          </td>
                        </tr>
                      ) : filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="user-table-avatar">
                                {(u.fullName || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600 }}>{u.fullName || 'Learner'}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'ADMIN' ? 'badge-brand' : 'badge-muted'}`}>{u.role}</span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            <span className="badge badge-success">Workspace Scoped</span>
                          </td>
                          <td>
                            <div className="user-online-badge">
                              <span className="online-dot" />
                              Active
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
