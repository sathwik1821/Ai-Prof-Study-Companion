import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  FolderPlus, 
  BookOpen, 
  UploadCloud, 
  BrainCircuit, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Compass, 
  Layers, 
  ArrowRight,
  GraduationCap
} from 'lucide-react'
import './OnboardingGuide.css'

const STARTER_PRESETS = [
  {
    id: 'cs',
    title: 'Computer Science & Software',
    desc: 'Algorithms, data structures, operating systems, and cloud architecture',
    icon: '💻',
    category: 'Engineering'
  },
  {
    id: 'bio',
    title: 'Biology & Life Sciences',
    desc: 'Cell biology, biochemistry, human anatomy, and physiological systems',
    icon: '🧬',
    category: 'Natural Sciences'
  },
  {
    id: 'math',
    title: 'Mathematics & Physical Sciences',
    desc: 'Calculus, linear algebra, thermodynamics, and electromagnetism',
    icon: '📐',
    category: 'Exact Sciences'
  },
  {
    id: 'business',
    title: 'Economics & Management',
    desc: 'Microeconomics, financial accounting, marketing, and business strategy',
    icon: '📊',
    category: 'Business & Finance'
  }
]

export default function OnboardingGuide({ spaces = [], analytics = null, onOpenCreateSpace, isForcedOpen = false, onCloseForced }) {
  const navigate = useNavigate()

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('aiprof_onboarding_dismissed') === 'true'
  })
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('aiprof_onboarding_collapsed') === 'true'
  })

  // Synchronize when forced open from header button
  useEffect(() => {
    if (isForcedOpen) {
      setDismissed(false)
      setCollapsed(false)
    }
  }, [isForcedOpen])

  // Determine completions
  const step1Complete = spaces.length > 0
  const step2Complete = (analytics?.totalProjects ?? 0) > 0 || spaces.some(s => (s.projectCount ?? 0) > 0)
  const step3Complete = (analytics?.totalMaterials ?? 0) > 0
  const step4Complete = (analytics?.totalQuizAttempts ?? 0) > 0 || (analytics?.totalConversations ?? 0) > 0

  const steps = [
    {
      id: 1,
      title: 'Create your First Learning Space',
      desc: 'Spaces represent overarching subjects or courses like "Computer Science" or "Organic Chemistry".',
      completed: step1Complete,
      icon: FolderPlus,
      actionText: step1Complete ? 'Space Created' : '+ Create Space',
      action: () => onOpenCreateSpace(),
      active: !step1Complete
    },
    {
      id: 2,
      title: 'Add a Study Project',
      desc: 'Projects organize specific modules, exam preps, or weekly lecture topics inside your space.',
      completed: step2Complete,
      icon: BookOpen,
      actionText: step2Complete ? 'Project Added' : (spaces.length > 0 ? 'Open Space & Add Project' : 'Create space first'),
      action: () => {
        if (spaces.length > 0) {
          navigate(`/spaces/${spaces[0].id}`)
        } else {
          onOpenCreateSpace()
        }
      },
      active: step1Complete && !step2Complete
    },
    {
      id: 3,
      title: 'Upload Lecture Notes & Materials',
      desc: 'Drop PDF slides, syllabi, or notes. AiProf indexes them with deterministic RAG for source-cited answers.',
      completed: step3Complete,
      icon: UploadCloud,
      actionText: step3Complete ? 'Materials Uploaded' : 'Go to Projects',
      action: () => {
        if (spaces.length > 0) {
          navigate(`/spaces/${spaces[0].id}`)
        } else {
          onOpenCreateSpace()
        }
      },
      active: step2Complete && !step3Complete
    },
    {
      id: 4,
      title: 'Master Topics with Socratic AI & Quizzes',
      desc: 'Chat with your AI Professor and take adaptive quizzes to build real, tracked concept mastery.',
      completed: step4Complete,
      icon: BrainCircuit,
      actionText: step4Complete ? 'Mastery Active' : 'Start Practicing',
      action: () => {
        if (spaces.length > 0) {
          navigate(`/spaces/${spaces[0].id}`)
        } else {
          onOpenCreateSpace()
        }
      },
      active: step3Complete && !step4Complete
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  const handleDismiss = () => {
    localStorage.setItem('aiprof_onboarding_dismissed', 'true')
    setDismissed(true)
    if (onCloseForced) onCloseForced()
  }

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('aiprof_onboarding_collapsed', next ? 'true' : 'false')
  }

  if (dismissed && !isForcedOpen) {
    return null
  }

  return (
    <div className={`onboarding-card card ${collapsed ? 'onboarding-collapsed' : ''}`}>
      {/* Background ambient lighting */}
      <div className="onboarding-ambient" />

      {/* Header bar */}
      <div className="onboarding-header">
        <div className="onboarding-title-wrap">
          <div className="onboarding-badge">
            <Sparkles size={14} className="sparkle-spin" />
            <span>Getting Started Guide</span>
          </div>
          <h2 className="onboarding-title">
            {completedCount === 4 
              ? '🎉 All Set! You are ready to achieve mastery.' 
              : 'Welcome to AiProf! Set up your study workspace'}
          </h2>
          <p className="onboarding-sub">
            Follow these 4 simple steps to unlock grounded AI tutoring, verified document citations, and adaptive quizzes.
          </p>
        </div>

        <div className="onboarding-controls">
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            onClick={toggleCollapse}
            title={collapsed ? 'Expand guide' : 'Minimize guide'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            onClick={handleDismiss}
            title="Dismiss onboarding guide"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress meter */}
      <div className="onboarding-progress-row">
        <div className="onboarding-progress-meta">
          <span className="onboarding-progress-label">
            Setup Roadmap: <strong>{completedCount} of 4 completed</strong>
          </span>
          <span className="onboarding-progress-pct">{progressPercent}%</span>
        </div>
        <div className="onboarding-progress-track">
          <div 
            className="onboarding-progress-fill" 
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Collapsed view summary */}
      {collapsed && (
        <div className="onboarding-collapsed-body" onClick={toggleCollapse}>
          <div className="onboarding-pill-steps">
            {steps.map(s => (
              <span key={s.id} className={`step-mini-pill ${s.completed ? 'done' : ''}`}>
                {s.completed ? '✓' : s.id} {s.title.split(' ')[0]}
              </span>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
            <span>Expand Roadmap</span>
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Expanded Roadmap Steps */}
      {!collapsed && (
        <div className="onboarding-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div 
                key={step.id} 
                className={`onboarding-step-card ${step.completed ? 'is-completed' : ''} ${step.active ? 'is-active' : ''}`}
              >
                <div className="step-card-header">
                  <div className="step-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <div className="step-status">
                    {step.completed ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    ) : (
                      <span className="badge badge-muted">
                        Step {step.id}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>

                <div className="step-card-footer">
                  <button 
                    className={`btn btn-sm ${step.completed ? 'btn-ghost' : step.active ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={step.action}
                  >
                    <span>{step.actionText}</span>
                    {!step.completed && <ArrowRight size={13} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Starter Templates when user has 0 spaces */}
      {!collapsed && spaces.length === 0 && (
        <div className="onboarding-presets-section">
          <div className="onboarding-presets-header">
            <span className="badge badge-brand">
              <Compass size={13} /> Quick-Start Templates
            </span>
            <h4 className="presets-title">Or choose a pre-configured study space to get started in 1 click:</h4>
          </div>

          <div className="onboarding-presets-grid">
            {STARTER_PRESETS.map((p) => (
              <div 
                key={p.id} 
                className="preset-card card card-interactive"
                onClick={() => onOpenCreateSpace({ name: p.title, description: p.desc })}
              >
                <div className="preset-top">
                  <span className="preset-emoji">{p.icon}</span>
                  <span className="preset-cat">{p.category}</span>
                </div>
                <h5 className="preset-name">{p.title}</h5>
                <p className="preset-desc">{p.desc}</p>
                <div className="preset-action">
                  <span>Use Template</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
