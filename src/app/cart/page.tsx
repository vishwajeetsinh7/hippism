'use client'

import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/lib/store'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, getTotalItems } = useCartStore()

  if (items.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#F5F0E8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Empty cart illustration */}
          <div
            style={{
              width: 120, height: 120,
              background: 'linear-gradient(135deg, #e8f5ee 0%, #f0ead8 100%)',
              borderRadius: '36px',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <ShoppingBag size={52} color="#c8d8c4" strokeWidth={1.5} />
          </div>

          <h2
            className="font-playfair"
            style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}
          >
            Your cart is empty
          </h2>
          <p
            style={{
              color: '#888', fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6,
              marginBottom: '28px', maxWidth: '220px', margin: '0 auto 28px',
            }}
          >
            Looks like you haven&apos;t added anything yet. Let&apos;s fix that!
          </p>

          <Link href="/menu" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              Browse Menu
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '160px' }}>
      {/* ── Header ── */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/menu" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38,
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.07)',
            }}>
              <ArrowLeft size={18} color="#333" />
            </div>
          </Link>
          <div>
            <h1
              className="font-playfair"
              style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1 }}
            >
              Your Cart
            </h1>
            <p style={{ fontSize: '12px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ── Cart items ── */}
      <main style={{ padding: '16px' }}>
        {/* Items label */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Order Items
          </span>
          <span style={{ fontSize: '12px', color: '#999', fontFamily: 'DM Sans, sans-serif' }}>
            Swipe to remove
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className="card animate-fade-in"
              style={{ padding: '14px', animationDelay: `${index * 0.05}s` }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* Food emoji */}
                <div style={{
                  width: 52, height: 52,
                  background: 'linear-gradient(135deg, #e8f5ee 0%, #f0ead8 100%)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}>
                  🍽️
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{
                      fontSize: '14px', fontWeight: 600, color: '#1a1a1a',
                      fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3,
                    }}>
                      {item.name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        flexShrink: 0,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px',
                        opacity: 0.4,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                    >
                      <Trash2 size={15} color="#e53e3e" />
                    </button>
                  </div>

                  {item.description && (
                    <p style={{
                      fontSize: '12px', color: '#aaa',
                      fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4,
                      marginTop: '2px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginTop: '10px',
                  }}>
                    <span style={{
                      fontSize: '16px', fontWeight: 700,
                      color: '#1a4731', fontFamily: 'DM Sans, sans-serif',
                    }}>
                      ₹{item.price * item.quantity}
                    </span>

                    {/* Qty control */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      background: 'rgba(45,90,61,0.07)',
                      border: '1.5px solid rgba(45,90,61,0.15)',
                      borderRadius: '10px', overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: 32, height: 32, border: 'none', background: 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#2D5A3D',
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{
                        minWidth: '28px', textAlign: 'center',
                        fontSize: '14px', fontWeight: 700,
                        color: '#1a4731', fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: 32, height: 32, border: 'none', background: 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#2D5A3D',
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bill details */}
        <div className="card" style={{ marginTop: '20px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #1a4731 0%, #2D5A3D 100%)',
          }}>
            <h2 className="font-playfair" style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
              Bill Details
            </h2>
          </div>

          <div style={{ padding: '14px 16px' }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0',
              }}>
                <span style={{ fontSize: '13px', color: '#666', fontFamily: 'DM Sans, sans-serif' }}>
                  {item.name}
                  <span style={{ color: '#aaa' }}> × {item.quantity}</span>
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', color: '#333' }}>
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}

            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)',
              margin: '10px 0',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>
                Total Amount
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#1a4731', fontFamily: 'DM Sans, sans-serif' }}>
                ₹{getTotal()}
              </span>
            </div>

            <p style={{
              fontSize: '11px', color: '#bbb',
              fontFamily: 'DM Sans, sans-serif', marginTop: '6px',
              textAlign: 'right',
            }}>
              * Inclusive of all taxes
            </p>
          </div>
        </div>

        {/* Add more items */}
        <Link href="/menu" style={{ textDecoration: 'none', display: 'block', marginTop: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '12px',
            border: '1.5px dashed rgba(45,90,61,0.3)',
            borderRadius: '14px',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: '13px', color: '#2D5A3D', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
              + Add more items
            </span>
          </div>
        </Link>
      </main>

      {/* ── Bottom CTA ── */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(245,240,232,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '16px 16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          zIndex: 50,
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div>
            <p style={{ fontSize: '12px', color: '#999', fontFamily: 'DM Sans, sans-serif' }}>Grand Total</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#1a4731', fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>
              ₹{getTotal()}
            </p>
          </div>
          <Link href="/checkout" style={{ textDecoration: 'none' }}>
            <button
              className="btn-primary ripple"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '24px', paddingRight: '20px' }}
            >
              Place Order
              <ChevronRight size={16} color="white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
