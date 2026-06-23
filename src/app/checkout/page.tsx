'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, FileText, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { saveOrder } from '@/lib/orderHistory'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', mobile: '', notes: '' })
  const [errors, setErrors] = useState({ name: '', mobile: '' })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const [queueCount, setQueueCount] = useState<number | null>(null)
  const [isAutofilled, setIsAutofilled] = useState(false)

  // Load customer info & queue length on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hippism_customer_info')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name && parsed.mobile) {
          setFormData(prev => ({ ...prev, name: parsed.name, mobile: parsed.mobile }))
          setIsAutofilled(true)
        }
      }
    } catch {}

    async function fetchQueue() {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'preparing'])
        .gte('created_at', threeHoursAgo)
      
      setQueueCount(count || 0)
    }
    fetchQueue()
  }, [])

  const validateForm = () => {
    const newErrors = { name: '', mobile: '' }
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required'
    } else if (formData.mobile.length < 10) {
      newErrors.mobile = 'Mobile number must be at least 10 digits'
    } else if (!/^\d+$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number'
    }
    setErrors(newErrors)
    return !newErrors.name && !newErrors.mobile
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (items.length === 0) {
      router.push('/menu')
      return
    }
    setLoading(true)
    try {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)

      let orderNumber = 'HE-1001'
      if (lastOrder && lastOrder.length > 0 && lastOrder[0].order_number) {
        const lastNum = parseInt(lastOrder[0].order_number.replace('HE-', ''))
        orderNumber = `HE-${lastNum + 1}`
      }

      const total = getTotal()
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.name.trim(),
          mobile_number: formData.mobile.trim(),
          notes: formData.notes.trim() || null,
          total,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map(item => ({
        order_id: order.id,
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      // Save to localStorage for My Orders + status tracking
      saveOrder({
        id: order.id,
        orderNumber,
        customerName: formData.name.trim(),
        mobile: formData.mobile.trim(),
        total,
        status: 'pending',
        notes: formData.notes.trim() || undefined,
        items: items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.price * i.quantity,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Save customer info for future autofill
      try {
        localStorage.setItem('hippism_customer_info', JSON.stringify({
          name: formData.name.trim(),
          mobile: formData.mobile.trim()
        }))
      } catch {}

      clearCart()
      router.push(`/success?order=${orderNumber}&id=${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
        background: '#F5F0E8',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛒</div>
          <h2 className="font-playfair" style={{ fontSize: '22px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            No items in cart
          </h2>
          <p style={{ color: '#888', fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
            Add some delicious items first
          </p>
          <Link href="/menu" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Browse Menu</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '40px' }}>
      {/* ── Header ── */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/cart" style={{ textDecoration: 'none' }}>
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
              Place Order
            </h1>
            <p style={{ fontSize: '12px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
              Almost there! 🎉
            </p>
          </div>
        </div>
      </header>

      <main style={{ padding: '16px' }}>
        {/* ── Order Summary Card ── */}
        <div className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #1a4731 0%, #2D5A3D 100%)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>🧾</span>
            <h2 className="font-playfair" style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
              Order Summary
            </h2>
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '12px',
              color: 'white',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
            }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            {items.map((item, index) => (
              <div key={item.id}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0',
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#333', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                      {item.name}
                    </span>
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '11px', color: '#aaa',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      × {item.quantity}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: 'DM Sans, sans-serif' }}>
                    ₹{item.price * item.quantity}
                  </span>
                </div>
                {index < items.length - 1 && (
                  <div style={{ height: '1px', background: '#f0f0f0' }} />
                )}
              </div>
            ))}

            <div style={{
              marginTop: '10px', paddingTop: '10px',
              borderTop: '1.5px dashed rgba(0,0,0,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                Total
              </span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
                ₹{getTotal()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Queue Notice ── */}
        {queueCount !== null && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '16px', animation: 'fadeIn 0.5s ease-out',
          }}>
            <div style={{ fontSize: '20px' }}>👨‍🍳</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', fontFamily: 'DM Sans, sans-serif' }}>
                {queueCount === 0 ? 'No wait right now!' : `${queueCount} order${queueCount !== 1 ? 's' : ''} in queue`}
              </p>
              <p style={{ fontSize: '12px', color: '#b45309', fontFamily: 'DM Sans, sans-serif' }}>
                {queueCount === 0 ? 'Your order will be prepared immediately.' : 'Your order will be placed in the kitchen queue.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Customer Details Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(26,71,49,0.06) 0%, rgba(196,136,58,0.04) 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '16px' }}>👤</span>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                Your Details
              </h2>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isAutofilled ? (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                  padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', fontFamily: 'DM Sans, sans-serif' }}>
                        {formData.name}
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
                        +91 {formData.mobile}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAutofilled(false)}
                    style={{
                      background: 'none', border: 'none', color: '#1a4731', fontWeight: 700,
                      fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      padding: '8px', textDecoration: 'underline'
                    }}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <>
              {/* Name field */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 600, color: '#555',
                  fontFamily: 'DM Sans, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}>
                  <User size={12} color="#888" />
                  Full Name <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    background: focusedField === 'name' ? 'white' : '#f8f8f8',
                    border: `1.5px solid ${errors.name ? '#e53e3e' : focusedField === 'name' ? '#2D5A3D' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'DM Sans, sans-serif',
                    color: '#1a1a1a',
                    outline: 'none',
                    boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(45,90,61,0.12)' : errors.name ? '0 0 0 3px rgba(229,62,62,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                {errors.name && (
                  <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '5px', fontFamily: 'DM Sans, sans-serif' }}>
                    ⚠ {errors.name}
                  </p>
                )}
              </div>

              {/* Mobile field */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 600, color: '#555',
                  fontFamily: 'DM Sans, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}>
                  <Phone size={12} color="#888" />
                  Mobile Number <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    borderRight: '1.5px solid rgba(0,0,0,0.1)',
                    paddingRight: '10px',
                  }}>
                    <span style={{ fontSize: '14px' }}>🇮🇳</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#555', fontFamily: 'DM Sans, sans-serif' }}>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter mobile number"
                    maxLength={15}
                    onFocus={() => setFocusedField('mobile')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '13px 14px 13px 78px',
                      background: focusedField === 'mobile' ? 'white' : '#f8f8f8',
                      border: `1.5px solid ${errors.mobile ? '#e53e3e' : focusedField === 'mobile' ? '#2D5A3D' : 'rgba(0,0,0,0.12)'}`,
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontFamily: 'DM Sans, sans-serif',
                      color: '#1a1a1a',
                      outline: 'none',
                      boxShadow: focusedField === 'mobile' ? '0 0 0 3px rgba(45,90,61,0.12)' : errors.mobile ? '0 0 0 3px rgba(229,62,62,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                {errors.mobile && (
                  <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '5px', fontFamily: 'DM Sans, sans-serif' }}>
                    ⚠ {errors.mobile}
                  </p>
                )}
              </div>
              </>
              )}

              {/* Notes field */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 600, color: '#555',
                  fontFamily: 'DM Sans, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}>
                  <FileText size={12} color="#888" />
                  Special Instructions
                  <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 400, color: '#bbb', textTransform: 'none', letterSpacing: 0 }}>
                    optional
                  </span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., No onion, extra spicy, allergen info..."
                  rows={3}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    background: focusedField === 'notes' ? 'white' : '#f8f8f8',
                    border: `1.5px solid ${focusedField === 'notes' ? '#2D5A3D' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    color: '#1a1a1a',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                    boxShadow: focusedField === 'notes' ? '0 0 0 3px rgba(45,90,61,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Note card ── */}
          <div style={{
            marginTop: '14px', padding: '12px 14px',
            background: 'rgba(212,163,115,0.1)',
            border: '1px solid rgba(212,163,115,0.3)',
            borderRadius: '14px',
            display: 'flex', gap: '10px',
          }}>
            <CheckCircle2 size={18} color="#c4883a" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#8a6020', fontFamily: 'DM Sans, sans-serif', marginBottom: '2px' }}>
                Dine-in Order
              </p>
              <p style={{ fontSize: '12px', color: '#a07030', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
                Please show this order number at the counter. We&apos;ll call your name when it&apos;s ready!
              </p>
            </div>
          </div>

          {/* ── Submit button ── */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                Placing Order...
              </>
            ) : (
              <>
                Confirm Order · ₹{getTotal()}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
