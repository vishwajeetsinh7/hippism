'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Phone, MessageSquare, X, ChevronRight, Clock, CheckCircle2, ChefHat, XCircle, RefreshCw } from 'lucide-react'
import type { Order, OrderItem } from '@/lib/types'

const statusConfig = [
  { value: 'pending',   label: 'Pending',   emoji: '🕐', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  { value: 'preparing', label: 'Preparing', emoji: '👨‍🍳', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  { value: 'ready',     label: 'Ready',     emoji: '✅', bg: '#d1fae5', color: '#065f46', dot: '#22c55e' },
  { value: 'completed', label: 'Completed', emoji: '🎉', bg: '#e0e7ff', color: '#3730a3', dot: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', emoji: '❌', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
]

const filterOptions = [
  { value: 'all',       label: 'All',       icon: <RefreshCw size={13} /> },
  { value: 'pending',   label: 'Pending',   icon: <Clock size={13} /> },
  { value: 'preparing', label: 'Preparing', icon: <ChefHat size={13} /> },
  { value: 'ready',     label: 'Ready',     icon: <CheckCircle2 size={13} /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle2 size={13} /> },
  { value: 'cancelled', label: 'Cancelled', icon: <XCircle size={13} /> },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    
    // Fallback: Robust HTTP Polling every 5 seconds
    const pollInterval = setInterval(fetchOrders, 5000)

    const subscription = supabase
      .channel('orders_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
      
    return () => {
      clearInterval(pollInterval)
      subscription.unsubscribe()
    }
  }, [fetchOrders])

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId)
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as Order['status'] })
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  async function openOrderDetails(order: Order) {
    // Stop the layout ringtone since the admin is acknowledging an order
    window.dispatchEvent(new Event('stop-admin-ringtone'))
    
    setSelectedOrder(order)
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setOrderItems(data || [])
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusConfig = (status: string) => statusConfig.find(s => s.value === status) || statusConfig[0]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(45,90,61,0.15)', borderTopColor: '#2D5A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#888', fontFamily: 'DM Sans, sans-serif' }}>Loading orders...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>
            Orders
          </h1>
          <p style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
            {orders.length} total · {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length} active
          </p>
        </div>
        <button
          onClick={fetchOrders}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'white', border: '1.5px solid rgba(0,0,0,0.1)',
            borderRadius: '12px', padding: '8px 14px',
            fontSize: '12px', color: '#555', fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
        {filterOptions.map(opt => {
          const count = opt.value === 'all' ? orders.length : orders.filter(o => o.status === opt.value).length
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px',
                background: active ? '#1a4731' : 'white',
                color: active ? 'white' : '#666',
                border: `1.5px solid ${active ? 'transparent' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: '10px', fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s ease', flexShrink: 0,
              }}
            >
              {opt.icon}
              {opt.label}
              <span style={{
                background: active ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                color: active ? 'white' : '#888',
                borderRadius: '999px', padding: '1px 7px',
                fontSize: '11px', fontWeight: 700,
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '18px',
            padding: '40px', textAlign: 'center',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontWeight: 600, color: '#555', fontFamily: 'DM Sans, sans-serif' }}>No orders found</p>
            <p style={{ fontSize: '13px', color: '#aaa', fontFamily: 'DM Sans, sans-serif', marginTop: '4px' }}>
              {filter !== 'all' ? `No ${filter} orders` : 'Orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const sc = getStatusConfig(order.status)
            const isActive = order.status === 'pending' || order.status === 'preparing'
            return (
              <button
                key={order.id}
                onClick={() => openOrderDetails(order)}
                style={{
                  width: '100%', background: 'white',
                  borderRadius: '16px', padding: '14px 16px',
                  border: `1.5px solid ${isActive ? 'rgba(45,90,61,0.2)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: isActive ? '0 2px 12px rgba(45,90,61,0.08)' : '0 1px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s ease',
                  animation: `fadeIn 0.3s ${i * 0.03}s ease-out both`,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                {/* Status dot */}
                <div style={{
                  width: 44, height: 44, background: sc.bg,
                  borderRadius: '13px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0,
                }}>
                  {sc.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                      {order.order_number}
                    </span>
                    {isActive && (
                      <div style={{
                        width: 7, height: 7, background: sc.dot,
                        borderRadius: '50%',
                        animation: 'pulse-ring 1.5s ease-out infinite',
                      }} />
                    )}
                    <span style={{
                      fontSize: '10px', fontWeight: 600,
                      background: sc.bg, color: sc.color,
                      borderRadius: '999px', padding: '2px 8px',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {sc.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                    {order.customer_name}
                  </p>
                  <p style={{ fontSize: '11px', color: '#aaa', fontFamily: 'DM Sans, sans-serif' }}>
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '15px', color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
                    ₹{order.total}
                  </p>
                  <ChevronRight size={14} color="#ccc" style={{ marginTop: '4px' }} />
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* ── Order Detail Sheet ── */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: 'white', width: '100%', maxWidth: '900px',
              borderRadius: '24px 24px 0 0',
              maxHeight: '90vh', overflowY: 'auto',
              animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div style={{
              padding: '20px 20px 0',
              background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
              borderRadius: '24px 24px 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: 'white' }}>
                      {selectedOrder.order_number}
                    </h2>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      background: 'rgba(255,255,255,0.15)',
                      color: 'white', borderRadius: '999px',
                      padding: '3px 10px',
                    }}>
                      {getStatusConfig(selectedOrder.status).label}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px', fontFamily: 'DM Sans, sans-serif' }}>
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    width: 36, height: 36, background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} color="white" />
                </button>
              </div>

              {/* Status update tabs inside header */}
              <div style={{ display: 'flex', gap: '6px', paddingBottom: '16px', overflowX: 'auto' }} className="hide-scrollbar">
                {statusConfig.map(s => (
                  <button
                    key={s.value}
                    onClick={() => updateOrderStatus(selectedOrder.id, s.value)}
                    disabled={updatingId === selectedOrder.id}
                    style={{
                      padding: '6px 14px',
                      background: selectedOrder.status === s.value ? 'white' : 'rgba(255,255,255,0.1)',
                      color: selectedOrder.status === s.value ? '#1a4731' : 'rgba(255,255,255,0.7)',
                      border: `1.5px solid ${selectedOrder.status === s.value ? 'white' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: '10px', fontSize: '12px',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Customer info */}
              <div style={{
                background: '#f8f8f8', borderRadius: '14px',
                padding: '14px', marginBottom: '16px',
              }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px' }}>
                  👤 {selectedOrder.customer_name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Phone size={13} color="#888" />
                  <span style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Sans, sans-serif' }}>
                    {selectedOrder.mobile_number}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px', padding: '8px', background: '#fff9e6', borderRadius: '8px' }}>
                    <MessageSquare size={13} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Sans, sans-serif' }}>
                      {selectedOrder.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Items */}
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif', marginBottom: '10px' }}>
                🧾 Order Items
              </h3>
              <div style={{ background: '#f8f8f8', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
                {orderItems.map((item, i) => (
                  <div key={item.id} style={{
                    padding: '10px 14px',
                    borderBottom: i < orderItems.length - 1 ? '1px solid #eeeeee' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>🍽️</span>
                      <span style={{ fontSize: '13px', color: '#333', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                        {item.item_name}
                      </span>
                      <span style={{
                        fontSize: '11px', color: '#aaa',
                        background: '#eeeeee', borderRadius: '999px',
                        padding: '1px 7px', fontFamily: 'DM Sans, sans-serif',
                      }}>×{item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                      ₹{item.subtotal}
                    </span>
                  </div>
                ))}
                <div style={{
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                    Total
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: 'white', fontFamily: 'DM Sans, sans-serif' }}>
                    ₹{selectedOrder.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
