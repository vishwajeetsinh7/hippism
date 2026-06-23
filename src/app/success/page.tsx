'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Clock, ChefHat, UtensilsCrossed, Bell, BellOff, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  getOrderById,
  updateOrderStatus,
  sendOrderNotification,
  requestNotificationPermission,
  type LocalOrder,
} from '@/lib/orderHistory'

type OrderStatus = LocalOrder['status']

const statusSteps: { status: OrderStatus; label: string; desc: string; icon: React.ReactNode; emoji: string }[] = [
  { status: 'pending',   label: 'Order Received',  desc: 'In the queue',            icon: <Clock size={18} />,            emoji: '🕐' },
  { status: 'preparing', label: 'Being Prepared',  desc: 'Our chefs are cooking!',  icon: <ChefHat size={18} />,          emoji: '👨‍🍳' },
  { status: 'ready',     label: 'Ready to Serve',  desc: "We'll call your name!",   icon: <UtensilsCrossed size={18} />,  emoji: '✅' },
  { status: 'completed', label: 'Completed',        desc: 'Enjoy your meal!',        icon: <CheckCircle size={18} />,      emoji: '🎉' },
]

const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed']

function getStepIndex(status: OrderStatus) {
  return statusOrder.indexOf(status)
}

// ── Notification Permission Banner ──
function NotificationBanner({
  onAllow,
  onDismiss,
}: {
  onAllow: () => void
  onDismiss: () => void
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      boxShadow: '0 4px 16px rgba(26,71,49,0.25)',
    }}>
      <div style={{
        width: 40, height: 40,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Bell size={20} color="#D4A373" style={{ animation: 'bounce-gentle 1s ease-in-out infinite' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: 'white', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
          Get Order Updates 🔔
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>
          We&apos;ll notify you when your food is ready
        </p>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={onDismiss}
          style={{
            padding: '6px 10px', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
            color: 'rgba(255,255,255,0.6)', fontSize: '11px',
            fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={onAllow}
          style={{
            padding: '6px 12px', background: '#D4A373',
            border: 'none', borderRadius: '8px',
            color: 'white', fontSize: '11px', fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
          }}
        >
          Allow
        </button>
      </div>
    </div>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [orderId, setOrderId] = useState('')
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('pending')
  const [animate, setAnimate] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const [statusHistory, setStatusHistory] = useState<Array<{ status: OrderStatus; time: string }>>([])
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const playUserChime = useCallback(() => {
    try {
      const ctx = new window.AudioContext()
      const frequencies = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.12 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4)
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.42)
      })
    } catch {
      // Web Audio not available
    }
  }, [])

  // Handle status change: update localStorage + send notification
  const handleStatusChange = useCallback((newStatus: OrderStatus, orderNum: string, oid: string) => {
    updateOrderStatus(oid, newStatus)
    setCurrentStatus(newStatus)
    setStatusHistory(prev => [...prev, { status: newStatus, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }])
    sendOrderNotification(orderNum, newStatus)
    playUserChime()
  }, [playUserChime])

  useEffect(() => {
    const num = searchParams.get('order') || ''
    let id = searchParams.get('id') || ''
    setOrderNumber(num)
    setTimeout(() => setAnimate(true), 100)

    // Check notification permission state
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
      setShowNotifBanner(Notification.permission === 'default')
    }

    const initOrder = async () => {
      // If we only have order number but no ID, fetch the ID from Supabase
      if (!id && num) {
        const { data } = await supabase.from('orders').select('id, status').eq('order_number', num).single()
        if (data) {
          id = data.id
          setCurrentStatus(data.status as OrderStatus)
        }
      }

      setOrderId(id)

      // Load current status from localStorage if we have the ID
      if (id) {
        const stored = getOrderById(id)
        if (stored) setCurrentStatus(stored.status)
      }

      // Subscribe to real-time status changes for this order
      if (id) {
        const channel = supabase
          .channel(`order_status_${id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
            (payload) => {
              const newStatus = payload.new.status as OrderStatus
              handleStatusChange(newStatus, num, id)
            }
          )
          .subscribe()
        subscriptionRef.current = channel
      }
    }

    initOrder()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [searchParams, handleStatusChange])

  const handleAllowNotifications = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    setShowNotifBanner(false)
    if (perm === 'granted') {
      // Send a welcome notification
      try {
        new Notification('🔔 Notifications Enabled!', {
          body: `We'll notify you when ${orderNumber} status changes.`,
          icon: '/favicon.ico',
        })
      } catch { /* ignore */ }
    }
  }

  const currentStep = getStepIndex(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F5F0E8 0%, #EAE4D6 100%)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background deco */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(212,163,115,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(45,90,61,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.04, pointerEvents: 'none' }}>
        <svg viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100">
          <path d="M0 120 L80 50 L130 75 L200 20 L260 65 L310 35 L380 80 L430 45 L480 60 L480 120 Z" fill="#1a4731" />
        </svg>
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '400px', margin: '0 auto',
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        {/* ── Success icon ── */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '12px' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-12px', background: 'rgba(45,90,61,0.08)', borderRadius: '50%', animation: 'pulse-ring 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: '-6px', background: 'rgba(45,90,61,0.12)', borderRadius: '50%', animation: 'pulse-ring 2s 0.5s ease-out infinite' }} />
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 32px rgba(26,71,49,0.35)', position: 'relative',
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="font-playfair" style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginTop: '16px', marginBottom: '4px' }}>
            Order Confirmed!
          </h1>
          <p style={{ color: '#888', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
            Sit back & enjoy the mountain vibes 🏔️
          </p>
        </div>

        {/* ── Notification permission banner ── */}
        {showNotifBanner && notifPermission === 'default' && (
          <NotificationBanner
            onAllow={handleAllowNotifications}
            onDismiss={() => setShowNotifBanner(false)}
          />
        )}
        {notifPermission === 'granted' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', marginBottom: '12px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '10px',
          }}>
            <Bell size={13} color="#22c55e" />
            <span style={{ fontSize: '12px', color: '#16a34a', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
              Notifications enabled — we&apos;ll alert you when status changes
            </span>
          </div>
        )}
        {notifPermission === 'denied' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', marginBottom: '12px',
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '10px',
          }}>
            <BellOff size={13} color="#aaa" />
            <span style={{ fontSize: '12px', color: '#aaa', fontFamily: 'DM Sans, sans-serif' }}>
              Notifications blocked — enable in browser settings
            </span>
          </div>
        )}

        {/* ── Order number card ── */}
        <div className="card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #1a4731, #2D5A3D)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L42 38H6L24 4Z" stroke="#D4A373" strokeWidth="3" strokeLinejoin="round" fill="none"/>
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Hippism Escape · Old Manali</span>
            </div>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              background: isCancelled ? 'rgba(239,68,68,0.3)' : 'rgba(212,163,115,0.3)',
              color: isCancelled ? '#fca5a5' : '#D4A373',
              borderRadius: '999px', padding: '2px 10px',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.05em',
            }}>
              {isCancelled ? '❌ CANCELLED' : `🟢 LIVE`}
            </span>
          </div>
          <div style={{ padding: '16px 16px 14px' }}>
            <p style={{ fontSize: '11px', color: '#bbb', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Order Number
            </p>
            <p style={{ fontSize: '30px', fontWeight: 800, color: '#1a4731', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '8px' }}>
              {orderNumber}
            </p>
            <p style={{ fontSize: '12px', color: '#bbb', fontFamily: 'DM Sans, sans-serif' }}>
              Show this at the counter
            </p>
          </div>
        </div>

        {/* ── Live Status Tracker ── */}
        {!isCancelled && (
          <div className="card" style={{ marginBottom: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                🔴 Live Order Status
              </h2>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                background: '#e8f5ee', color: '#2D5A3D',
                borderRadius: '999px', padding: '2px 8px',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                AUTO-UPDATING
              </span>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {statusSteps.map((step, i) => {
                const isDone = i <= currentStep
                const isCurrent = i === currentStep
                const isLast = i === statusSteps.length - 1

                return (
                  <div key={step.status} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    {/* Connector line */}
                    {!isLast && (
                      <div style={{
                        position: 'absolute', left: '18px', top: '38px',
                        width: '2px', height: 'calc(100% - 14px)',
                        background: isDone && i < currentStep
                          ? 'linear-gradient(180deg, #2D5A3D, #2D5A3D)'
                          : '#e5e5e5',
                        transition: 'background 0.4s ease',
                        zIndex: 0,
                      }} />
                    )}

                    {/* Step icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? (isCurrent ? 'linear-gradient(135deg, #1a4731, #2D5A3D)' : '#e8f5ee') : '#f5f5f5',
                      border: `2px solid ${isDone ? '#2D5A3D' : '#e5e5e5'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isDone ? (isCurrent ? 'white' : '#2D5A3D') : '#ccc',
                      zIndex: 1, position: 'relative',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(45,90,61,0.15)' : 'none',
                      transition: 'all 0.4s ease',
                    }}>
                      {isDone && !isCurrent
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        : step.icon
                      }
                    </div>

                    <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                      <p style={{
                        fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                        fontSize: '13px',
                        color: isCurrent ? '#1a4731' : isDone ? '#555' : '#bbb',
                        fontFamily: 'DM Sans, sans-serif',
                        marginBottom: '2px',
                        transition: 'all 0.3s ease',
                      }}>
                        {step.emoji} {step.label}
                        {isCurrent && (
                          <span style={{
                            marginLeft: '8px', fontSize: '10px',
                            background: '#e8f5ee', color: '#2D5A3D',
                            borderRadius: '999px', padding: '1px 7px', fontWeight: 700,
                            animation: 'pulse-ring 1.5s infinite',
                          }}>NOW</span>
                        )}
                      </p>
                      <p style={{ fontSize: '11px', color: isCurrent ? '#888' : '#ccc', fontFamily: 'DM Sans, sans-serif' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Status history ── */}
        {statusHistory.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '14px', padding: '12px 14px',
            marginBottom: '14px',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#999', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Updates Received
            </p>
            {statusHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', padding: '3px 0' }}>
                <span style={{ color: '#555' }}>{statusSteps.find(s => s.status === h.status)?.label || h.status}</span>
                <span style={{ color: '#aaa' }}>{h.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── CTAs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/orders" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '14px',
              background: 'white', color: '#1a4731',
              border: '1.5px solid rgba(45,90,61,0.2)',
              borderRadius: '14px', fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              📋 View All My Orders
            </button>
          </Link>
          <Link href="/menu" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%' }}>
              🍽️ &nbsp; Order More Items
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function SuccessLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(45,90,61,0.15)', borderTopColor: '#2D5A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <SuccessContent />
    </Suspense>
  )
}
