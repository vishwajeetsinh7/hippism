'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/admin/context'
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { login } = useAdmin()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username, password)
    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error || 'Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #0d2318 0%, #1a4731 40%, #2D5A3D 70%, #1e3d2a 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-15%',
        width: '55%', height: '55%',
        background: 'radial-gradient(circle, rgba(196,136,58,0.18) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%',
        width: '45%', height: '45%',
        background: 'radial-gradient(circle, rgba(61,122,85,0.2) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Mountain silhouette */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.07, pointerEvents: 'none' }}>
        <svg viewBox="0 0 480 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="140">
          <path d="M0 160 L70 65 L120 100 L190 30 L255 95 L300 52 L370 110 L430 68 L480 88 L480 160 Z" fill="white" />
        </svg>
      </div>

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 72, height: 72,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '22px',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L44 38H4L24 4Z" stroke="#D4A373" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
              <path d="M4 38H44" stroke="#D4A373" strokeWidth="1.5" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '26px', fontWeight: 700,
            color: 'white', lineHeight: 1.1, marginBottom: '4px',
          }}>
            Hippism Escape
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '12px',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Admin Panel
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}>
          <h2 style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 700,
            color: '#1a1a1a', marginBottom: '6px',
          }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
            Sign in to manage orders and menu
          </p>

          {error && (
            <div style={{
              background: '#fff5f5', color: '#c53030',
              border: '1px solid #fed7d7',
              borderRadius: '12px', padding: '10px 14px',
              fontSize: '13px', marginBottom: '16px',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Username */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 700,
                color: '#666', fontFamily: 'DM Sans, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px',
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color={focused === 'username' ? '#2D5A3D' : '#bbb'} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  transition: 'color 0.2s',
                }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  placeholder="admin"
                  required
                  style={{
                    width: '100%', padding: '12px 12px 12px 38px',
                    background: focused === 'username' ? 'white' : '#f8f8f8',
                    border: `1.5px solid ${focused === 'username' ? '#2D5A3D' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '12px', fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif', color: '#1a1a1a',
                    outline: 'none',
                    boxShadow: focused === 'username' ? '0 0 0 3px rgba(45,90,61,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 700,
                color: '#666', fontFamily: 'DM Sans, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color={focused === 'password' ? '#2D5A3D' : '#bbb'} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  transition: 'color 0.2s',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '12px 40px 12px 38px',
                    background: focused === 'password' ? 'white' : '#f8f8f8',
                    border: `1.5px solid ${focused === 'password' ? '#2D5A3D' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '12px', fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif', color: '#1a1a1a',
                    outline: 'none',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(45,90,61,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: '#bbb', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: '6px',
                padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1a4731 0%, #2D5A3D 100%)',
                color: 'white', border: 'none',
                borderRadius: '14px', fontSize: '15px',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(45,90,61,0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '20px',
          color: 'rgba(255,255,255,0.35)', fontSize: '11px',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Hippism Escape © Old Manali
        </p>
      </div>
    </div>
  )
}
