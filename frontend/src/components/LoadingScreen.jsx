import { GraduationCap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        width: 56, height: 56,
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse-glow 2s ease infinite',
        boxShadow: '0 0 24px rgba(245,158,11,0.4)',
      }}>
        <GraduationCap size={28} color="#080a0f" />
      </div>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )
}
