import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { materialsApi } from '../api'
import {
  ArrowLeft, Upload, FileText, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import './MaterialsPage.css'

const statusIcon = (status) => {
  if (status === 'READY')      return <CheckCircle size={14}/>
  if (status === 'PROCESSING') return <Clock size={14}/>
  if (status === 'FAILED')     return <AlertCircle size={14}/>
  return <Clock size={14}/>
}
const statusClass = (status) => {
  if (status === 'READY')      return 'badge-success'
  if (status === 'PROCESSING') return 'badge-warning'
  if (status === 'FAILED')     return 'badge-danger'
  return 'badge-muted'
}

export default function MaterialsPage() {
  const { spaceId, projectId } = useParams()
  const navigate                = useNavigate()

  const [materials, setMaterials]   = useState([])
  const [loading,   setLoading]     = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [dragOver,  setDragOver]    = useState(false)
  const fileInputRef = useRef(null)

  const loadMaterials = () => {
    materialsApi.list(projectId)
      .then(res => setMaterials(res.data.data ?? []))
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMaterials() }, [projectId])

  // Poll processing materials every 4 seconds
  useEffect(() => {
    const hasProcessing = materials.some(m => {
      const s = m.processingStatus || m.status
      return s === 'PROCESSING' || s === 'QUEUED'
    })
    if (!hasProcessing) return
    const timer = setInterval(loadMaterials, 4000)
    return () => clearInterval(timer)
  }, [materials])

  const uploadFile = async (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast.error('Only PDF, TXT, and Markdown files are supported')
      return
    }
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await materialsApi.upload(projectId, fd)
      setMaterials(prev => [res.data.data, ...prev])
      toast.success('File uploaded — processing in background…')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Upload failed')
    } finally { setUploading(false) }
  }

  const deleteMaterial = async (id) => {
    if (!confirm('Delete this material and its embeddings?')) return
    try {
      await materialsApi.delete(projectId, id)
      setMaterials(prev => prev.filter(m => m.id !== id))
      toast.success('Material deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1024/1024).toFixed(1)} MB`
  }

  return (
    <div className="materials-page">
      <div className="breadcrumb">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/spaces/${spaceId}/projects/${projectId}`)}>
          <ArrowLeft size={14}/> Project
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Materials</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Study Materials</h1>
          <p className="page-sub">Upload PDFs, slides, or notes — they power the AI tutor and quizzes</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={loadMaterials} title="Refresh">
            <RefreshCw size={14}/>
          </button>
          <button
            id="upload-btn"
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <span className="spinner" style={{width:16,height:16}}/> : <><Upload size={15}/> Upload File</>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            style={{display:'none'}}
            onChange={e => uploadFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={28} className="drop-icon"/>
        <p className="drop-title">{uploading ? 'Uploading…' : 'Drop a file here or click to browse'}</p>
        <p className="drop-hint">PDF, TXT, Markdown · Max 20MB</p>
      </div>

      {/* List */}
      <div>
        <h3 style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:12}}>
          UPLOADED FILES
          <span className="badge badge-muted" style={{marginLeft:8}}>{materials.length}</span>
        </h3>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{height:72,borderRadius:12,marginBottom:8}}/>)
        ) : materials.length === 0 ? (
          <div className="empty-state" style={{padding:'32px 16px'}}>
            <FileText size={40} className="empty-state-icon"/>
            <h3>No files uploaded yet</h3>
            <p>Upload your study materials to unlock the AI tutor and quiz generation</p>
          </div>
        ) : (
          <div className="materials-list">
            {materials.map(mat => {
              const status = mat.processingStatus || mat.status || 'QUEUED'
              const name = mat.originalFilename || mat.fileName || mat.name || 'Untitled Document'
              return (
                <div key={mat.id} className="material-item card">
                  <div className="mat-icon">
                    <FileText size={18}/>
                  </div>
                  <div className="mat-body">
                    <p className="mat-name" title={name}>{name}</p>
                    <div style={{display:'flex',gap:10,alignItems:'center',marginTop:4,flexWrap:'wrap'}}>
                      <span className={`badge ${statusClass(status)}`}>
                        {statusIcon(status)} {status}
                      </span>
                      {mat.pageCount > 0 && (
                        <span style={{fontSize:12,color:'var(--text-muted)'}}>{mat.pageCount} pages</span>
                      )}
                      {mat.fileSizeBytes && (
                        <span style={{fontSize:12,color:'var(--text-muted)'}}>{formatSize(mat.fileSizeBytes)}</span>
                      )}
                      {mat.chunkCount > 0 && (
                        <span style={{fontSize:12,color:'var(--text-muted)'}}>{mat.chunkCount} chunks indexed</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => deleteMaterial(mat.id)}
                    title="Delete"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
