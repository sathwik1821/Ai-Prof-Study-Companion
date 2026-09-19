import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi, assessmentApi } from '../api'
import {
  ArrowLeft, BarChart2, CheckCircle, XCircle, Trophy, RefreshCw,
  ChevronRight, FileText, Sparkles, Send, Award, BookOpen, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import './QuizPage.css'

export default function QuizPage() {
  const { spaceId, projectId } = useParams()
  const navigate                = useNavigate()

  const [activeTab,   setActiveTab]  = useState('mcq')    // mcq | open_ended
  const [view,        setView]       = useState('home')   // home | active | result
  const [attempt,     setAttempt]    = useState(null)
  const [questions,   setQuestions]  = useState([])
  const [currentQ,    setCurrentQ]   = useState(0)
  const [selected,    setSelected]   = useState(null)
  const [answered,    setAnswered]   = useState(null)  // question after answer submitted
  const [submitting,  setSubmitting] = useState(false)
  const [history,     setHistory]    = useState([])
  const [loadingHist, setLoadingHist]= useState(true)
  const [starting,    setStarting]   = useState(false)

  // Open-ended assessment state
  const [promptInput, setPromptInput] = useState('Explain the core mechanics and system architecture presented in your materials.')
  const [userResponse, setUserResponse] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState(null)
  const [assessHistory, setAssessHistory] = useState([])
  const [loadingAssess, setLoadingAssess] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [fetchingChallenge, setFetchingChallenge] = useState(false)

  const fetchNewChallenge = async () => {
    setFetchingChallenge(true)
    try {
      const res = await assessmentApi.challenge(projectId)
      const data = res.data.data
      if (data && data.prompt) {
        setPromptInput(data.prompt)
        setChallengeData(data)
        setUserResponse('')
        setEvalResult(null)
        toast.success('Generated challenge from your course materials!')
      }
    } catch (err) {
      toast.error('Could not generate dynamic challenge; select a suggested question.')
    } finally {
      setFetchingChallenge(false)
    }
  }

  useEffect(() => {
    quizApi.list(projectId)
      .then(res => setHistory(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingHist(false))

    loadAssessments()
  }, [projectId])

  const loadAssessments = () => {
    setLoadingAssess(true)
    assessmentApi.list(projectId)
      .then(res => setAssessHistory(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingAssess(false))
  }

  const handleAssessmentSubmit = async (e) => {
    e?.preventDefault()
    if (!userResponse.trim() || evaluating) return
    setEvaluating(true)
    setEvalResult(null)

    try {
      const res = await assessmentApi.submit(projectId, {
        prompt: promptInput.trim(),
        userResponse: userResponse.trim()
      })
      setEvalResult(res.data.data)
      toast.success('Assessment evaluated! Concept mastery updated.')
      loadAssessments()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Assessment evaluation failed')
    } finally {
      setEvaluating(false)
    }
  }

  const startQuiz = async (count = 3) => {
    setStarting(true)
    try {
      const res = await quizApi.start(projectId, { questionCount: typeof count === 'number' ? count : 3 })
      const att = res.data.data
      setAttempt(att)
      setQuestions(att.questions ?? [])
      setCurrentQ(0)
      setSelected(null)
      setAnswered(null)
      setView('active')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not start quiz — upload materials first')
    } finally { setStarting(false) }
  }

  const submitAnswer = async () => {
    if (selected === null || submitting) return
    setSubmitting(true)
    const q = questions[currentQ]
    const chosenOption = q.options ? q.options[selected] : ['A', 'B', 'C', 'D'][selected]
    try {
      const res = await quizApi.answer(projectId, attempt.id, q.id, {
        answer: chosenOption,
        selectedOption: selected
      })
      const data = res.data.data
      setAnswered(data)
      const correct = data?.isCorrect ?? data?.correct ?? false
      if (correct) {
        setAttempt(prev => ({
          ...prev,
          correctCount: (prev?.correctCount ?? 0) + 1,
          score: (prev?.score ?? prev?.correctCount ?? 0) + 1,
        }))
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to submit answer')
    } finally { setSubmitting(false) }
  }

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1)
      setSelected(null)
      setAnswered(null)
    } else {
      // Quiz complete — reload attempt for score
      quizApi.get(projectId, attempt.id)
        .then(res => { setAttempt(res.data.data); setView('result') })
        .catch(() => setView('result'))
    }
  }

  const score = attempt?.score ?? attempt?.correctCount ?? 0
  const total = questions.length

  if (view === 'active' && questions.length > 0) {
    const q = questions[currentQ]
    const opts = ['A','B','C','D']
    return (
      <div className="quiz-active-shell">
        {/* Header */}
        <div className="quiz-active-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setView('home')}>
            <ArrowLeft size={14}/> Exit
          </button>
          <div className="quiz-progress-wrap">
            <span className="quiz-q-num">Question {currentQ+1} of {total}</span>
            <div className="progress-track" style={{width:200}}>
              <div className="progress-fill" style={{width:`${((currentQ+1)/total)*100}%`}}/>
            </div>
          </div>
          <span className="quiz-score-chip">
            <Trophy size={13}/> {score}/{answered ? currentQ + 1 : currentQ}
          </span>
        </div>

        {/* Question */}
        <div className="quiz-question-card card">
          <p className="quiz-q-text">{q.questionText}</p>
          <div className="quiz-options">
            {q.options?.map((opt, i) => {
              let cls = 'quiz-option'
              const correctOpt = answered ? (
                answered.correctOption ??
                q.options?.findIndex(o => {
                  const c = (answered.correctAnswer || '').trim().toUpperCase()
                  const item = (o || '').trim().toUpperCase()
                  return item === c || (c.length >= 1 && item.startsWith(c.substring(0, 1)))
                })
              ) : null

              if (answered) {
                if (i === correctOpt) cls += ' correct'
                else if (i === selected && i !== correctOpt) cls += ' wrong'
              } else if (i === selected) {
                cls += ' selected'
              }
              const cleanOpt = typeof opt === 'string' ? opt.replace(/^[A-D]\)\s*/i, '') : opt
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => !answered && setSelected(i)}
                  disabled={!!answered}
                >
                  <span className="option-letter">{opts[i]}</span>
                  <span>{cleanOpt}</span>
                </button>
              )
            })}
          </div>

          {answered && (() => {
            const isCorrect = answered.isCorrect ?? answered.correct ?? false
            return (
              <div className={`quiz-feedback ${isCorrect ? 'correct-feedback' : 'wrong-feedback'}`}>
                {isCorrect
                  ? <><CheckCircle size={16}/> Correct! {answered.explanation || ''}</>
                  : <><XCircle size={16}/> Incorrect — {answered.explanation || answered.aiFeedback || 'Check the highlighted correct answer.'}</>
                }
              </div>
            )
          })()}

          <div className="quiz-action-row">
            {!answered ? (
              <button
                id="quiz-submit-btn"
                className="btn btn-primary"
                onClick={submitAnswer}
                disabled={selected === null || submitting}
              >
                {submitting ? <span className="spinner" style={{width:16,height:16}}/> : 'Submit Answer'}
              </button>
            ) : (
              <button id="quiz-next-btn" className="btn btn-primary" onClick={nextQuestion}>
                {currentQ + 1 < total ? 'Next Question' : 'See Results'} <ChevronRight size={15}/>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'result') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const grade = pct >= 80 ? { label: 'Excellent!', color: 'var(--accent-emerald)' }
                : pct >= 60 ? { label: 'Good work!', color: 'var(--accent-amber)' }
                :             { label: 'Keep practising', color: 'var(--accent-rose)' }
    return (
      <div className="quiz-result-shell">
        <div className="card quiz-result-card">
          <div className="result-trophy" style={{color: grade.color}}>
            <Trophy size={48}/>
          </div>
          <h2 className="result-title">{grade.label}</h2>
          <p className="result-score">You scored {score} out of {total} ({pct}%)</p>
          <div className="progress-track" style={{width:'100%',height:10}}>
            <div className="progress-fill" style={{width:`${pct}%`, background: grade.color}}/>
          </div>
          <div className="result-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}`)}>
              <ArrowLeft size={15}/> Project
            </button>
            <button className="btn btn-primary" onClick={() => startQuiz(3)}>
              <RefreshCw size={15}/> Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Home view
  return (
    <div className="quiz-home-shell">
      <div className="breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}`)}>
          <ArrowLeft size={14}/> Project
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Assessment &amp; Quiz</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Adaptive Assessments</h1>
          <p className="page-sub">Evidence-based learning: test your knowledge with interactive MCQs or written conceptual analysis</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="quiz-mode-selector">
        <button
          className={`quiz-mode-btn ${activeTab === 'mcq' ? 'active' : ''}`}
          onClick={() => setActiveTab('mcq')}
        >
          <BarChart2 size={16} /> Multiple Choice Quiz
        </button>
        <button
          className={`quiz-mode-btn ${activeTab === 'open_ended' ? 'active' : ''}`}
          onClick={() => setActiveTab('open_ended')}
        >
          <FileText size={16} /> Open-Ended Assessment
        </button>
      </div>

      {/* TAB 1: MCQ QUIZ */}
      {activeTab === 'mcq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                Generate Adaptive Practice Quiz
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Gemini dynamically selects concepts and calibrates difficulty according to your current mastery.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                id="start-quick-quiz-btn"
                className="btn btn-primary"
                onClick={() => startQuiz(3)}
                disabled={starting}
              >
                {starting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><BarChart2 size={15} /> Quick Quiz (3 Qs)</>}
              </button>
              <button
                id="start-full-quiz-btn"
                className="btn btn-secondary"
                onClick={() => startQuiz(5)}
                disabled={starting}
              >
                {starting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <>Full Quiz (5 Qs)</>}
              </button>
            </div>
          </div>

          {starting && (
            <div className="card" style={{ padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>Generating Adaptive AI Quiz...</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
                Synthesizing concepts from your materials and drafting questions aligned to your knowledge gaps.
              </p>
            </div>
          )}

          {/* Past MCQ Attempts */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              PAST QUIZ ATTEMPTS
            </h3>
            {loadingHist ? (
              [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />)
            ) : history.length === 0 ? (
              <div className="empty-state card" style={{ padding: '32px 16px' }}>
                <BarChart2 size={36} className="empty-state-icon" />
                <p>No quiz attempts yet — start your first quiz above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(att => {
                  const attScore = att.score ?? att.correctCount ?? 0
                  const pct = att.totalQuestions > 0 ? Math.round((attScore / att.totalQuestions) * 100) : 0
                  return (
                    <div key={att.id} className="hist-item card">
                      <div className="hist-left">
                        <Trophy size={16} style={{ color: pct >= 80 ? 'var(--accent-emerald)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>{attScore} / {att.totalQuestions ?? 0} correct</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {att.startedAt ? new Date(att.startedAt).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                      <div className="hist-pct" style={{ color: pct >= 80 ? 'var(--accent-emerald)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                        {pct}%
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OPEN-ENDED ASSESSMENT */}
      {activeTab === 'open_ended' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Assessment Form Card */}
          <div className="card assessment-form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} style={{ color: 'var(--brand-400)' }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0 }}>
                    Open-Ended Understanding Assessment
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Write out your explanation in your own words. Gemini evaluates accuracy, depth, concepts covered, and gaps against your materials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="generate-challenge-btn"
                className="btn btn-primary btn-sm"
                onClick={fetchNewChallenge}
                disabled={fetchingChallenge}
                style={{ gap: 6 }}
              >
                {fetchingChallenge ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} />}
                {fetchingChallenge ? 'Analyzing Materials...' : '⚡ Generate AI Challenge'}
              </button>
            </div>

            {/* Dynamic Challenge Card if generated */}
            {challengeData && (
              <div className="card" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Topic: {challengeData.topic || 'Core Subject'}
                  </span>
                  {challengeData.sourceMaterial && (
                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                      Source: {challengeData.sourceMaterial}
                    </span>
                  )}
                </div>
                {challengeData.hint && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💡 <strong>Rubric Hint:</strong> {challengeData.hint}
                  </p>
                )}
                {challengeData.expectedConcepts?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Focus on:</span>
                    {challengeData.expectedConcepts.map((c, i) => (
                      <span key={i} className="eval-chip" style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.05)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prompt presets */}
            <div className="prompt-presets">
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>Quick Topics:</span>
              <button
                type="button"
                className="preset-chip"
                onClick={() => setPromptInput('Explain the core mechanics and system architecture presented in your materials.')}
              >
                Core Architecture &amp; Mechanics
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => setPromptInput('What are the key trade-offs and potential limitations of the concepts discussed in this material?')}
              >
                Trade-offs &amp; Limitations
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => setPromptInput('How does this approach solve practical bottlenecks compared to traditional methods?')}
              >
                Practical Bottlenecks
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Assessment Question / Prompt
                </label>
                <input
                  type="text"
                  className="input"
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  placeholder="Enter the conceptual question or topic..."
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Your Detailed Answer / Explanation
                  </label>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {userResponse.length} characters ({userResponse.split(/\s+/).filter(Boolean).length} words)
                  </span>
                </div>
                <textarea
                  className="input"
                  rows={5}
                  value={userResponse}
                  onChange={e => setUserResponse(e.target.value)}
                  placeholder="Type your explanation, reasoning, definitions, and application details here... (aim for depth and specific mechanisms)"
                  style={{ resize: 'vertical', lineHeight: 1.5 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="submit"
                  id="submit-assessment-btn"
                  className="btn btn-primary"
                  disabled={evaluating || !userResponse.trim()}
                  style={{ gap: 8 }}
                >
                  {evaluating ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16 }} />
                      <span>Gemini Evaluating Rigor Against Source...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit for Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Evaluation Result */}
          {evalResult && (
            <div className="card eval-result-card">
              <div className="eval-result-header">
                <div>
                  <span className={`eval-level-badge ${evalResult.understandingLevel?.toLowerCase()}`}>
                    <Award size={13} /> {evalResult.understandingLevel || 'EVALUATED'}
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 8 }}>
                    Evaluation Score: {evalResult.score} / 10
                  </h3>
                </div>
                <div className="eval-score-ring">
                  <span>{Math.round((evalResult.score / 10) * 100)}%</span>
                </div>
              </div>

              {/* Concepts Covered */}
              <div className="eval-concept-section">
                <span className="eval-concept-label">Concepts Demonstrated:</span>
                <div className="eval-chip-row">
                  {evalResult.conceptsCovered?.length ? (
                    evalResult.conceptsCovered.map((c, i) => (
                      <span key={i} className="eval-chip covered">
                        <CheckCircle size={12} /> {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None highlighted</span>
                  )}
                </div>
              </div>

              {/* Missing Concepts */}
              <div className="eval-concept-section">
                <span className="eval-concept-label">Missing Concepts / Gaps to Review:</span>
                <div className="eval-chip-row">
                  {evalResult.missingConcepts?.length ? (
                    evalResult.missingConcepts.map((m, i) => (
                      <span key={i} className="eval-chip missing">
                        <AlertCircle size={12} /> {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--accent-emerald)' }}>All critical concepts covered!</span>
                  )}
                </div>
              </div>

              {/* Formative Feedback */}
              <div className="eval-feedback-box">
                <p className="eval-feedback-title">Formative AI Pedagogical Feedback</p>
                <p className="eval-feedback-body">{evalResult.feedback}</p>
              </div>

              {/* Follow-up actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={fetchNewChallenge}
                  style={{ gap: 6 }}
                >
                  <Sparkles size={14} /> Try Another Challenge
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}/tutor`)}
                  style={{ gap: 6 }}
                >
                  <BookOpen size={14} /> Ask Tutor About Missing Concepts
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}`)}
                  style={{ gap: 6 }}
                >
                  <ArrowLeft size={14} /> View Updated Mastery
                </button>
              </div>
            </div>
          )}

          {/* Past Open-Ended Assessments */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              PAST OPEN-ENDED ASSESSMENTS
            </h3>
            {loadingAssess ? (
              [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 8 }} />)
            ) : assessHistory.length === 0 ? (
              <div className="empty-state card" style={{ padding: '32px 16px' }}>
                <FileText size={36} className="empty-state-icon" />
                <p>No open-ended assessments completed yet. Try answering a question above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assessHistory.map(a => (
                  <div key={a.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.prompt}</p>
                      <span className={`eval-level-badge ${a.understandingLevel?.toLowerCase()}`}>
                        {a.score}/10 — {a.understandingLevel}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 8 }}>
                      "{a.userResponse}"
                    </p>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
                      <strong>Feedback:</strong> {a.feedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
