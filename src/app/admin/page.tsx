'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Clock, CheckCircle, IndianRupee, ShoppingBag, Users } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  todayRevenue: number
}

function StatCard({
  icon, label, value, color, bg, trend
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  bg: string
  trend?: string
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '18px',
      padding: '18px',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{
          width: 42, height: 42,
          background: bg, borderRadius: '13px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#22c55e',
            background: '#f0fdf4', borderRadius: '999px', padding: '2px 8px',
          }}>
            {trend}
          </span>
        )}
      </div>
      <p style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '12px', color: '#999', fontFamily: 'DM Sans, sans-serif', marginTop: '4px' }}>
        {label}
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, pendingOrders: 0, completedOrders: 0, todayRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; order_number: string; customer_name: string; total: number; status: string; created_at: string }>>([])

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const [todayRes, pendingRes, completedRes, revenueRes, recentRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'preparing']),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('orders').select('total').gte('created_at', today.toISOString()),
          supabase.from('orders').select('id, order_number, customer_name, total, status, created_at').order('created_at', { ascending: false }).limit(5),
        ])
        const todayRevenue = revenueRes.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
        setStats({ todayOrders: todayRes.count || 0, pendingOrders: pendingRes.count || 0, completedOrders: completedRes.count || 0, todayRevenue })
        setRecentOrders(recentRes.data || [])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    
    // Fallback: Robust HTTP Polling every 5 seconds
    const pollInterval = setInterval(fetchStats, 5000)

    const subscription = supabase.channel('dashboard_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats).subscribe()
    return () => {
      clearInterval(pollInterval)
      subscription.unsubscribe()
    }
  }, [])

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    preparing: { bg: '#dbeafe', color: '#1e40af', label: 'Preparing' },
    ready:     { bg: '#d1fae5', color: '#065f46', label: 'Ready' },
    completed: { bg: '#e0e7ff', color: '#3730a3', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(45,90,61,0.15)', borderTopColor: '#2D5A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#888', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' }}>Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Today's Orders"
          value={stats.todayOrders}
          color="#3b82f6"
          bg="#eff6ff"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Active Orders"
          value={stats.pendingOrders}
          color="#f59e0b"
          bg="#fffbeb"
          trend={stats.pendingOrders > 0 ? `${stats.pendingOrders} waiting` : undefined}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Completed"
          value={stats.completedOrders}
          color="#22c55e"
          bg="#f0fdf4"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Today's Revenue"
          value={`₹${stats.todayRevenue}`}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
      </div>

      {/* Recent Orders */}
      <div style={{
        background: 'white', borderRadius: '18px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #f5f5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} color="#2D5A3D" />
            <h2 style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
              Recent Orders
            </h2>
          </div>
          <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '12px', color: '#2D5A3D', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
              View All →
            </span>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#aaa', fontFamily: 'DM Sans, sans-serif' }}>No orders yet today</p>
          </div>
        ) : (
          recentOrders.map((order, i) => {
            const s = statusColors[order.status] || statusColors.pending
            return (
              <div key={order.id} style={{
                padding: '12px 18px',
                borderBottom: i < recentOrders.length - 1 ? '1px solid #f5f5f5' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36, height: 36, background: '#f5f5f5',
                    borderRadius: '10px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '16px',
                  }}>
                    🍽️
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                      {order.order_number}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
                      {order.customer_name} · {formatTime(order.created_at)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
                    ₹{order.total}
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 600,
                    background: s.bg, color: s.color,
                    borderRadius: '999px', padding: '2px 8px',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick actions */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26,71,49,0.06) 0%, rgba(196,136,58,0.04) 100%)',
        border: '1px solid rgba(45,90,61,0.1)',
        borderRadius: '16px', padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Users size={14} color="#2D5A3D" />
          <h3 style={{ fontWeight: 700, fontSize: '13px', color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
            Quick Actions
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '8px 16px', background: '#1a4731', color: 'white',
              border: 'none', borderRadius: '10px', fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              View Orders
            </button>
          </Link>
          <Link href="/admin/menu" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '8px 16px', background: 'white', color: '#1a4731',
              border: '1.5px solid rgba(45,90,61,0.25)', borderRadius: '10px', fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              Manage Menu
            </button>
          </Link>
          <Link href="/menu" target="_blank" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '8px 16px', background: 'white', color: '#888',
              border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, cursor: 'pointer',
            }}>
              View Menu →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
