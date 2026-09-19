import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tutorApi } from '../api'
import {
  ArrowLeft, Send, Brain, Plus, Trash2, MessageSquare,
  Lightbulb, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './TutorPage.css'

export default function TutorPage() {
  const { spaceId, projectId } = useParams()
  const navigate                = useNavigate()

  const [conversations, setConversations]       = useState([])
  const [activeConvId,  setActiveConvId]         = useState(null)
  const [messages,      setMessages]             = useState([])
  const [input,         setInput]                = useState('')
  const [sending,       setSending]              = useState(false)
  const [loadingConvs,  setLoadingConvs]         = useState(true)
  const [loadingMsgs,   setLoadingMsgs]          = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // Load conversations
  useEffect(() => {
    tutorApi.conversations(projectId)
      .then(res => setConversations(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingConvs(false))
  }, [projectId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    setLoadingMsgs(true)
    tutorApi.messages(projectId, activeConvId)
      .then(res => setMessages(res.data.data ?? []))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false))
  }, [activeConvId, projectId])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)

    // Optimistic user message
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, { id: tempId, role: 'USER', content: text, createdAt: new Date().toISOString() }])

    try {
      const res = await tutorApi.ask(projectId, {
        question: text,
        conversationId: activeConvId || undefined,
      })
      const data = res.data.data
      // Set conversation if new
      if (!activeConvId && data.conversationId) {
        setActiveConvId(data.conversationId)
        setConversations(prev => [
          { id: data.conversationId, title: text.slice(0, 60), createdAt: new Date().toISOString() },
          ...prev,
        ])
      }
      // Replace temp + add AI reply
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: `u-${Date.now()}`, role: 'USER',      content: text,           createdAt: new Date().toISOString() },
        { id: `a-${Date.now()}`, role: 'ASSISTANT', content: data.answer,    sources: data.sources, createdAt: new Date().toISOString() },
      ])
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('AI tutor is unavailable right now')
    } finally { setSending(false) }
  }

  const deleteConv = async (e, id) => {
    e.stopPropagation()
    try {
      await tutorApi.deleteConversation(projectId, id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConvId === id) { setActiveConvId(null); setMessages([]) }
    } catch { toast.error('Failed to delete') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="tutor-shell">
      {/* Sidebar */}
      <div className="tutor-sidebar">
        <div className="tutor-sidebar-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}`)}>
            <ArrowLeft size={14}/> Back
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setActiveConvId(null); setMessages([]) }}
          >
            <Plus size={14}/> New
          </button>
        </div>

        <div className="conv-list">
          {loadingConvs ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{height:52, borderRadius:10, margin:'4px 0'}}/>)
          ) : conversations.length === 0 ? (
            <div className="conv-empty">
              <MessageSquare size={28} />
              <p>No conversations yet</p>
            </div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <MessageSquare size={14} className="conv-icon"/>
              <span className="conv-title">{conv.title || 'Conversation'}</span>
              <button className="conv-delete btn btn-ghost btn-icon" style={{padding:4}} onClick={e => deleteConv(e, conv.id)}>
                <Trash2 size={12}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="tutor-chat">
        {/* Chat header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="tutor-avatar">
              <Brain size={18}/>
            </div>
            <div>
              <p className="chat-title">Socratic AI Tutor</p>
              <p className="chat-sub">Grounded in your uploaded materials · asks questions to guide you</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !loadingMsgs ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <Brain size={32}/>
              </div>
              <h3>Start a conversation</h3>
              <p>Ask your AI tutor anything about your study materials</p>
              <div className="chat-starters">
                {['Explain the key concepts', 'What should I focus on?', 'Give me a summary'].map(s => (
                  <button key={s} className="starter-chip" onClick={() => { setInput(s); textareaRef.current?.focus() }}>
                    <Lightbulb size={12}/> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMsgs ? (
            <div style={{display:'flex',justifyContent:'center',marginTop:48}}>
              <div className="spinner" style={{width:28,height:28}}/>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                {msg.role === 'ASSISTANT' && (
                  <div className="msg-avatar ai-avatar"><Brain size={14}/></div>
                )}
                <div className={`message-bubble ${msg.role === 'USER' ? 'user-bubble' : 'ai-bubble'}`}>
                  {msg.role === 'ASSISTANT' ? (
                    <div className="ai-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="message-text">{msg.content}</p>
                  )}
                  {msg.sources?.length > 0 && (
                    <div className="sources">
                      <span className="sources-label">Sources:</span>
                      {msg.sources.map((s, i) => (
                        <span key={i} className="source-chip">{s.materialName ?? `Source ${i+1}`}</span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'USER' && (
                  <div className="msg-avatar user-avatar-small">U</div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="message-row ai">
              <div className="msg-avatar ai-avatar"><Brain size={14}/></div>
              <div className="ai-bubble typing-bubble">
                <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              id="tutor-input"
              className="chat-textarea"
              placeholder="Ask your tutor anything… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              id="tutor-send-btn"
              className={`btn btn-primary btn-icon chat-send ${!input.trim() || sending ? 'disabled' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || sending}
            >
              {sending ? <span className="spinner" style={{width:16,height:16}}/> : <Send size={16}/>}
            </button>
          </div>
          <p className="chat-hint">AI responses are grounded in your uploaded study materials via RAG</p>
        </div>
      </div>
    </div>
  )
}
