'use client'

import { useAdmin, AdminProvider } from '@/lib/admin/context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, LogOut, Bell, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'

function useOrderNotifications(enabled: boolean) {
  const [newOrders, setNewOrders] = useState<Order[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isFirstLoad = useRef(true)
  const knownOrderIds = useRef<Set<string>>(new Set())

  // Play a continuous notification ringtone using the public file
  const playChime = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.loop = true
      audioRef.current.play().catch(() => {
        // Audio might be blocked by browser until interaction
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    async function loadInitialOrders() {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(100)
      if (data) {
        data.forEach(o => knownOrderIds.current.add(o.id))
      }
      isFirstLoad.current = false
    }

    loadInitialOrders()

    // Fallback: Robust HTTP Polling every 5 seconds for NEW orders
    const pollInterval = setInterval(async () => {
      if (isFirstLoad.current) return
      
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (data) {
        const newOnes = data.filter(o => !knownOrderIds.current.has(o.id))
        if (newOnes.length > 0) {
          newOnes.forEach(o => knownOrderIds.current.add(o.id))
          setNewOrders(prev => [...newOnes, ...prev])
          setUnreadCount(c => c + newOnes.length)
          playChime()
          
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            newOnes.forEach(order => {
              new Notification('🍽️ New Order!', {
                body: `${order.order_number} — ${order.customer_name} — ₹${order.total}`,
                icon: '/favicon.ico',
              })
            })
          }
        }
      }
    }, 5000)

    // Subscribe to real-time status changes (WebSocket)
    const channel = supabase
      .channel('admin_new_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (isFirstLoad.current) return
        const order = payload.new as Order
        if (knownOrderIds.current.has(order.id)) return
        knownOrderIds.current.add(order.id)

        setNewOrders(prev => [order, ...prev])
        setUnreadCount(c => c + 1)
        playChime()

        // Browser notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('🍽️ New Order!', {
            body: `${order.order_number} — ${order.customer_name} — ₹${order.total}`,
            icon: '/favicon.ico',
          })
        }
      })
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      channel.unsubscribe()
    }
  }, [enabled, playChime])

  const clearNotifications = useCallback(() => {
    setNewOrders([])
    setUnreadCount(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  return { newOrders, unreadCount, clearNotifications, audioRef }
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const { newOrders, unreadCount, clearNotifications, audioRef } = useOrderNotifications(!!user)

  useEffect(() => {
    if (!loading && !user && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [user, loading, pathname, router])

  // Request notification permission
  useEffect(() => {
    if (user && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user])

  // Stop the ringtone if they click an order on the orders page
  useEffect(() => {
    const handleStopRingtone = () => clearNotifications()
    window.addEventListener('stop-admin-ringtone', handleStopRingtone)
    return () => window.removeEventListener('stop-admin-ringtone', handleStopRingtone)
  }, [clearNotifications])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F0F2F5',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(45,90,61,0.15)',
          borderTopColor: '#2D5A3D',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user && pathname !== '/admin/login') return null
  if (pathname === '/admin/login') return <>{children}</>

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', exact: true },
    { href: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Orders', exact: false },
    { href: '/admin/menu', icon: <UtensilsCrossed size={18} />, label: 'Menu', exact: false },
  ]

  // This simple click handler unlocks the AudioContext silently on the first interaction
  // It guarantees that the audio element will be allowed to play later
  const unlockAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current!.pause()
        audioRef.current!.currentTime = 0
      }).catch(() => {})
    }
  }

  return (
    <div onClick={unlockAudio} style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: 'DM Sans, sans-serif' }}>
      <audio ref={audioRef} src="/ringtone.wav" preload="auto" />
      {/* ── Top Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1a4731 0%, #2D5A3D 100%)',
        padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 30, height: 30,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L42 38H6L24 4Z" stroke="#D4A373" strokeWidth="3" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 700, color: 'white', lineHeight: 1 }}>
              Hippism Escape
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
              ADMIN PANEL
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (unreadCount > 0) clearNotifications() }}
              style={{
                width: 36, height: 36,
                background: unreadCount > 0 ? 'rgba(212,163,115,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${unreadCount > 0 ? 'rgba(212,163,115,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              <Bell size={16} color={unreadCount > 0 ? '#D4A373' : 'rgba(255,255,255,0.7)'}
                style={unreadCount > 0 ? { animation: 'bounce-gentle 0.5s ease infinite' } : {}} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#ef4444', color: 'white',
                  width: 18, height: 18, borderRadius: '999px',
                  fontSize: '10px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #1a4731',
                  animation: 'pulse-ring 1s ease-out infinite',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute', right: 0, top: '44px',
                background: 'white', borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                border: '1px solid rgba(0,0,0,0.07)',
                width: '280px', zIndex: 200,
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease-out',
              }}>
                <div style={{
                  padding: '12px 14px', background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>
                    New Orders 🔔
                  </span>
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color="rgba(255,255,255,0.7)" />
                  </button>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {newOrders.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', color: '#aaa', fontFamily: 'DM Sans, sans-serif' }}>No new orders yet</p>
                      <p style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>Notifications will appear here</p>
                    </div>
                  ) : (
                    newOrders.map((order) => (
                      <Link href="/admin/orders" key={order.id} onClick={() => setShowNotifications(false)} style={{ textDecoration: 'none' }}>
                        <div style={{
                          padding: '10px 14px', borderBottom: '1px solid #f5f5f5',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f8')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 36, height: 36, background: '#e8f5ee',
                            borderRadius: '10px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, fontSize: '16px',
                          }}>🍽️</div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{order.order_number}</p>
                            <p style={{ fontSize: '12px', color: '#888' }}>{order.customer_name} · ₹{order.total}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '6px 12px',
              color: '#fca5a5', fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '0 16px',
        display: 'flex', gap: '4px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 14px',
                borderBottom: isActive ? '2.5px solid #2D5A3D' : '2.5px solid transparent',
                color: isActive ? '#1a4731' : '#888',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px', fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* ── Page Content ── */}
      <main style={{ padding: '20px 16px', minHeight: 'calc(100vh - 112px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  )
}
