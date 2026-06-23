'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Clock, ChefHat, CheckCircle, XCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  getOrders,
  updateOrderStatus,
  sendOrderNotification,
  type LocalOrder,
} from '@/lib/orderHistory'

const statusConfig: Record<string, { label: string; emoji: string; bg: string; color: string; dot: string }> = {
  pending:   { label: 'Pending',   emoji: '🕐', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  preparing: { label: 'Preparing', emoji: '👨‍🍳', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  ready:     { label: 'Ready!',    emoji: '✅', bg: '#d1fae5', color: '#065f46', dot: '#22c55e' },
  completed: { label: 'Completed', emoji: '🎉', bg: '#e0e7ff', color: '#3730a3', dot: '#8b5cf6' },
  cancelled: { label: 'Cancelled', emoji: '❌', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

const activeStatuses = new Set(['pending', 'preparing', 'ready'])

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const handleStatusUpdate = useCallback((orderId: string, newStatus: LocalOrder['status'], orderNumber: string) => {
    const updated = updateOrderStatus(orderId, newStatus)
    if (updated) {
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
      sendOrderNotification(orderNumber, newStatus)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const stored = getOrders()
    setOrders(stored)

    // Subscribe to status updates for all active orders
    const activeOrders = stored.filter(o => activeStatuses.has(o.status))
    if (activeOrders.length === 0) return

    const channels = activeOrders.map(order => {
      return supabase
        .channel(`myorders_${order.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
          (payload) => {
            handleStatusUpdate(order.id, payload.new.status as LocalOrder['status'], order.orderNumber)
          }
        )
        .subscribe()
    })

    return () => {
      channels.forEach(c => c.unsubscribe())
    }
  }, [handleStatusUpdate])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0E8' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(45,90,61,0.15)', borderTopColor: '#2D5A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '32px' }}>
      {/* Header */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/menu" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, background: 'rgba(0,0,0,0.05)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.07)',
            }}>
              <ArrowLeft size={18} color="#333" />
            </div>
          </Link>
          <div>
            <h1 className="font-playfair" style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1 }}>
              My Orders
            </h1>
            <p style={{ fontSize: '12px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} on this device
            </p>
          </div>
        </div>
      </header>

      <main style={{ padding: '16px' }}>
        {orders.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100,
              background: 'linear-gradient(135deg, #e8f5ee, #f0ead8)',
              borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '44px', marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}>
              📋
            </div>
            <h2 className="font-playfair" style={{ fontSize: '22px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
              No orders yet
            </h2>
            <p style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, marginBottom: '24px', maxWidth: '220px' }}>
              Your order history will appear here after you place your first order
            </p>
            <Link href="/menu" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">Browse Menu</button>
            </Link>
          </div>
        ) : (
          <>
            {/* Active orders section */}
            {orders.some(o => activeStatuses.has(o.status)) && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse-ring 1.5s ease-out infinite' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a4731', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Active Orders
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orders.filter(o => activeStatuses.has(o.status)).map((order, i) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={i}
                      expanded={expandedId === order.id}
                      onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past orders */}
            {orders.some(o => !activeStatuses.has(o.status)) && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Clock size={13} color="#999" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#999', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Past Orders
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orders.filter(o => !activeStatuses.has(o.status)).map((order, i) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={i}
                      expanded={expandedId === order.id}
                      onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function OrderCard({
  order,
  index,
  expanded,
  onToggle,
  formatDate,
}: {
  order: LocalOrder
  index: number
  expanded: boolean
  onToggle: () => void
  formatDate: (s: string) => string
}) {
  const sc = statusConfig[order.status] || statusConfig.pending
  const isActive = activeStatuses.has(order.status)

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'white',
        borderRadius: '18px',
        border: `1.5px solid ${isActive ? 'rgba(45,90,61,0.18)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isActive ? '0 4px 16px rgba(45,90,61,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        animationDelay: `${index * 0.05}s`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '14px 16px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}
      >
        {/* Status icon */}
        <div style={{
          width: 46, height: 46, background: sc.bg,
          borderRadius: '14px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, position: 'relative',
        }}>
          {sc.emoji}
          {isActive && (
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 10, height: 10, background: sc.dot,
              borderRadius: '50%', border: '2px solid white',
              animation: 'pulse-ring 1.5s ease-out infinite',
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
              {order.orderNumber}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              background: sc.bg, color: sc.color,
              borderRadius: '999px', padding: '2px 8px',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {sc.label}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#999', fontFamily: 'DM Sans, sans-serif', marginTop: '2px' }}>
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '15px', color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
            ₹{order.total}
          </p>
          <p style={{ fontSize: '11px', color: '#bbb', fontFamily: 'DM Sans, sans-serif', marginTop: '1px' }}>
            {expanded ? '▲ Less' : '▼ More'}
          </p>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f5f5f5', padding: '14px 16px' }}>
          {/* Items list */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#aaa', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Items Ordered
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🍽️</span>
                  <span style={{ fontSize: '13px', color: '#333', fontFamily: 'DM Sans, sans-serif' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#bbb', fontFamily: 'DM Sans, sans-serif' }}>×{item.quantity}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', fontFamily: 'DM Sans, sans-serif' }}>
                  ₹{item.subtotal}
                </span>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>₹{order.total}</span>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: '10px', padding: '8px 10px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '12px', color: '#92400e', fontFamily: 'DM Sans, sans-serif' }}>
                📝 <em>{order.notes}</em>
              </p>
            </div>
          )}

          {/* Status tracker for active orders */}
          {isActive && (
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#aaa', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Live Status
              </p>
              <MiniStatusTracker currentStatus={order.status} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniStatusTracker({ currentStatus }: { currentStatus: LocalOrder['status'] }) {
  const steps: Array<{ status: LocalOrder['status']; label: string; emoji: string }> = [
    { status: 'pending',   label: 'Received',  emoji: '🕐' },
    { status: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
    { status: 'ready',     label: 'Ready!',    emoji: '✅' },
  ]
  const statusOrder: LocalOrder['status'][] = ['pending', 'preparing', 'ready', 'completed']
  const currentIdx = statusOrder.indexOf(currentStatus)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {steps.map((step, i) => {
        const stepIdx = statusOrder.indexOf(step.status)
        const isDone = stepIdx <= currentIdx
        const isCurrent = stepIdx === currentIdx

        return (
          <div key={step.status} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isDone ? (isCurrent ? 'linear-gradient(135deg, #1a4731, #2D5A3D)' : '#e8f5ee') : '#f5f5f5',
                border: `2px solid ${isDone ? '#2D5A3D' : '#e5e5e5'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px',
                boxShadow: isCurrent ? '0 0 0 3px rgba(45,90,61,0.15)' : 'none',
              }}>
                {isDone && !isCurrent
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2D5A3D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : step.emoji
                }
              </div>
              <span style={{ fontSize: '9px', color: isCurrent ? '#1a4731' : isDone ? '#888' : '#ccc', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: isDone && stepIdx < currentIdx ? '#2D5A3D' : '#e5e5e5', margin: '0 4px', marginBottom: '16px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
