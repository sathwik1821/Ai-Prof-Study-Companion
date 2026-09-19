import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { spacesApi } from '../api'
import {
  Folder, Plus, BookOpen, Trash2, ChevronRight, Search, Sparkles, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import './SpacesPage.css'

export default function SpacesPage() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newSpace, setNewSpace] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadSpaces = () => {
    setLoading(true)
    spacesApi.list()
      .then(res => setSpaces(res.data.data ?? []))
      .catch(() => toast.error('Failed to load learning spaces'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSpaces()
  }, [])

  const createSpace = async (e) => {
    e.preventDefault()
    if (!newSpace.name.trim()) return
    setSaving(true)
    try {
      const res = await spacesApi.create(newSpace)
      setSpaces(prev => [res.data.data, ...prev])
      setShowModal(false)
      setNewSpace({ name: '', description: '' })
      toast.success('Space created successfully!')
    } catch {
      toast.error('Failed to create space')
    } finally {
      setSaving(false)
    }
  }

  const deleteSpace = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this space and all associated projects and materials?')) return
    try {
      await spacesApi.delete(id)
      setSpaces(prev => prev.filter(s => s.id !== id))
      toast.success('Space deleted')
    } catch {
      toast.error('Failed to delete space')
    }
  }

  const filteredSpaces = spaces.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="spaces-page">
      {/* Page Header */}
      <div className="spaces-header">
        <div>
          <h1 className="spaces-title">
            My Learning Spaces <span className="spaces-count-pill">{spaces.length}</span>
          </h1>
          <p className="spaces-sub">
            Organize your study domains, courses, and project environments
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            id="create-space-page-btn"
            className="btn btn-primary"
            onClick={() => { setNewSpace({ name: '', description: '' }); setShowModal(true) }}
          >
            <Plus size={16} /> New Space
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {spaces.length > 0 && (
        <div className="spaces-toolbar">
          <div className="spaces-search-box">
            <Search size={15} className="spaces-search-icon" />
            <input
              type="text"
              placeholder="Search spaces by name or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="spaces-search-input"
            />
          </div>
        </div>
      )}

      {/* Spaces Grid */}
      {loading ? (
        <div className="spaces-loading-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          ))}
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="empty-state card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Folder size={32} color="#fbbf24" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            {searchTerm ? 'No matching spaces found' : 'No learning spaces yet'}
          </h2>
          <p style={{ fontSize: 13.5, color: '#94a3b8', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
            {searchTerm
              ? `No spaces matched "${searchTerm}". Clear search to view all spaces.`
              : 'Spaces are high-level academic domains (like "Machine Learning" or "Operating Systems") that encapsulate projects, lecture materials, and AI tutoring.'
            }
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { setNewSpace({ name: '', description: '' }); setShowModal(true) }}
          >
            <Plus size={16} /> Create Your First Space
          </button>
        </div>
      ) : (
        <div className="spaces-grid">
          {filteredSpaces.map((space) => (
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

          {/* Quick Add Card */}
          <button
            className="space-card-add"
            onClick={() => { setNewSpace({ name: '', description: '' }); setShowModal(true) }}
          >
            <Plus size={22} />
            <span>New space</span>
          </button>
        </div>
      )}

      {/* Create Space Modal */}
      {showModal && (
        <Modal title="Create Learning Space" onClose={() => setShowModal(false)}>
          <form onSubmit={createSpace}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="input-label">Space name *</label>
              <input
                id="modal-space-name-input"
                className="input"
                placeholder="e.g. Distributed Systems & Cloud"
                value={newSpace.name}
                onChange={(e) => setNewSpace((v) => ({ ...v, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Description</label>
              <textarea
                id="modal-space-desc-input"
                className="input"
                placeholder="Optional — e.g. Core concepts, raft consensus, and microservices"
                rows={3}
                value={newSpace.description}
                onChange={(e) => setNewSpace((v) => ({ ...v, description: e.target.value }))}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button id="modal-space-create-submit" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Space'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
