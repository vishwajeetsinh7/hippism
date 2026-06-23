'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ShoppingCart, X, ChevronDown, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import type { Category, MenuItem } from '@/lib/types'

// Map category names to emojis
const CATEGORY_EMOJI: Record<string, string> = {
  'starters': '🥗',
  'appetizers': '🥗',
  'main course': '🍛',
  'mains': '🍛',
  'breakfast': '🍳',
  'pizza': '🍕',
  'pasta': '🍝',
  'burgers': '🍔',
  'sandwiches': '🥪',
  'wraps': '🌯',
  'salads': '🥙',
  'soups': '🍲',
  'beverages': '☕',
  'drinks': '🥤',
  'coffee': '☕',
  'tea': '🍵',
  'juice': '🍹',
  'smoothie': '🥤',
  'shakes': '🥛',
  'desserts': '🍰',
  'sweets': '🍮',
  'cakes': '🎂',
  'snacks': '🍟',
  'sides': '🍟',
  'thali': '🍱',
  'biryani': '🍚',
  'rice': '🍚',
  'noodles': '🍜',
  'momos': '🥟',
  'north indian': '🍛',
  'south indian': '🥘',
  'chinese': '🥢',
  'continental': '🥗',
  'special': '⭐',
  'chef special': '👨‍🍳',
  'combos': '🎁',
  'meal': '🍽️',
  'default': '🍽️',
}

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return CATEGORY_EMOJI['default']
}

function SkeletonCard() {
  return (
    <div className="menu-card p-4 flex gap-3">
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-16 rounded mt-2" />
      </div>
      <div className="skeleton rounded-xl" style={{ width: 88, height: 88 }} />
    </div>
  )
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  const tabRef = useRef<HTMLDivElement>(null)
  const { items, addItem, updateQuantity, getTotalItems } = useCartStore()

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, itemsRes] = await Promise.all([
          supabase.from('categories').select('*').order('sort_order'),
          supabase.from('menu_items').select('*').order('sort_order')
        ])
        if (catRes.data) setCategories(catRes.data)
        if (itemsRes.data) setMenuItems(itemsRes.data)
        if (catRes.data && catRes.data.length > 0) {
          setActiveCategory(catRes.data[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory ? item.category_id === activeCategory : true
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    return matchesCategory && matchesSearch && item.available
  })

  const getItemQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    return item?.quantity || 0
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const tab = tabRef.current
    if (tab) {
      const activeButton = tab.querySelector(`[data-category="${categoryId}"]`)
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: '#F5F0E8' }}>
      {/* ── Header ── */}
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        {/* Brand row */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'linear-gradient(135deg, #1a4731, #2D5A3D)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                    <path d="M24 6L42 38H6L24 6Z" stroke="#D4A373" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
                    <path d="M4 38H44" stroke="#D4A373" strokeWidth="1.5" opacity="0.6"/>
                  </svg>
                </div>
                <div>
                  <h1
                    className="font-playfair"
                    style={{ fontSize: '18px', fontWeight: 700, color: '#1a4731', lineHeight: 1.1 }}
                  >
                    Hippism Escape
                  </h1>
                  <p style={{ fontSize: '10px', color: '#888', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em' }}>
                    Old Manali
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* My Orders */}
            <Link href="/orders" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40,
                background: 'rgba(45,90,61,0.08)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(45,90,61,0.12)',
              }}>
                <ClipboardList size={18} color="#2D5A3D" />
              </div>
            </Link>

            {/* Cart */}
            <Link href="/cart" style={{ textDecoration: 'none' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 40, height: 40,
                  background: 'rgba(45,90,61,0.08)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(45,90,61,0.12)',
                }}>
                  <ShoppingCart size={18} color="#2D5A3D" />
                </div>
                {getTotalItems() > 0 && (
                  <div style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#D4A373', color: 'white',
                    width: 18, height: 18, borderRadius: '999px',
                    fontSize: '10px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {getTotalItems()}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

        {/* Search bar */}
        <div style={{ padding: '10px 16px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color={searchFocused ? '#2D5A3D' : '#aaa'}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }}
            />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: '#ddd', border: 'none', borderRadius: '999px',
                  width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <X size={10} color="#666" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        {!searchQuery && (
          <div
            ref={tabRef}
            className="hide-scrollbar"
            style={{
              display: 'flex', gap: '8px',
              padding: '0 16px 12px',
              overflowX: 'auto',
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                data-category={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`category-pill ${activeCategory === category.id ? 'category-pill-active' : 'category-pill-inactive'}`}
                style={{ flexShrink: 0 }}
              >
                <span style={{ marginRight: '5px' }}>{getCategoryEmoji(category.name)}</span>
                {category.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main style={{ padding: '16px 16px 0' }}>
        {/* Section title */}
        {!searchQuery && (
          <div className="section-header">
            <span className="section-title">
              {categories.find(c => c.id === activeCategory)?.name || 'Menu'}
            </span>
            <div className="section-line" />
            {!loading && (
              <span style={{
                fontSize: '12px', color: '#999',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500, flexShrink: 0,
              }}>
                {filteredItems.length} items
              </span>
            )}
          </div>
        )}

        {searchQuery && (
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} color="#999" />
            <span style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Sans, sans-serif' }}>
              <span style={{ fontWeight: 600, color: '#333' }}>{filteredItems.length}</span> result{filteredItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </span>
          </div>
        )}

        {/* Menu grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredItems.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '32px' }}>
              <div style={{ fontSize: '48px' }}>🍽️</div>
              <p style={{ fontWeight: 600, color: '#555', fontSize: '16px', fontFamily: 'DM Sans, sans-serif' }}>
                No items found
              </p>
              <p style={{ fontSize: '13px', color: '#999', fontFamily: 'DM Sans, sans-serif' }}>
                {searchQuery ? 'Try a different search term' : 'Check back soon!'}
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const quantity = getItemQuantity(item.id)
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={quantity}
                  index={index}
                  onAdd={() => addItem({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    description: item.description || undefined
                  })}
                  onIncrement={() => updateQuantity(item.id, quantity + 1)}
                  onDecrement={() => updateQuantity(item.id, quantity - 1)}
                />
              )
            })
          )}
        </div>
      </main>

      {/* ── Floating cart bar ── */}
      {getTotalItems() > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 20, left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 'calc(480px - 32px)',
            zIndex: 50,
          }}
          className="animate-slide-up"
        >
          <Link href="/cart" style={{ textDecoration: 'none', display: 'block' }}>
            <div className="cart-float">
              <div style={{
                width: 36, height: 36,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShoppingCart size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '11px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                }}>
                  {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
                </p>
                <p style={{
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  ₹{totalAmount}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: '#D4A373',
                borderRadius: '10px',
                padding: '8px 14px',
              }}>
                <span style={{
                  color: 'white', fontSize: '13px',
                  fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                }}>
                  View Cart
                </span>
                <ChevronDown size={14} color="white" style={{ transform: 'rotate(-90deg)' }} />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function MenuItemCard({
  item,
  quantity,
  index,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  item: MenuItem
  quantity: number
  index: number
  onAdd: () => void
  onIncrement: () => void
  onDecrement: () => void
}) {
  // Determine veg/nonveg from description or name heuristics
  const isVeg = item.description
    ? item.description.toLowerCase().includes('veg') && !item.description.toLowerCase().includes('non-veg')
    : false

  return (
    <div
      className="menu-card animate-fade-in"
      style={{ animationDelay: `${index * 0.04}s`, padding: '14px' }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Veg badge */}
          {isVeg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <div style={{
                width: 14, height: 14,
                border: '1.5px solid #2e7d32',
                borderRadius: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 7, height: 7,
                  background: '#2e7d32',
                  borderRadius: '50%',
                }} />
              </div>
              <span style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>Veg</span>
            </div>
          )}

          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1a1a1a',
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.3,
              marginBottom: '4px',
            }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p
              style={{
                fontSize: '12px',
                color: '#888',
                lineHeight: 1.4,
                fontFamily: 'DM Sans, sans-serif',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              {item.description}
            </p>
          )}

          {/* Price + Add button row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#1a4731',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ₹{item.price}
              </span>
            </div>

            {quantity === 0 ? (
              <button className="add-btn" onClick={onAdd}>
                + ADD
              </button>
            ) : (
              <div className="qty-control">
                <button className="qty-btn" onClick={onDecrement}>−</button>
                <span className="qty-value">{quantity}</span>
                <button className="qty-btn" onClick={onIncrement}>+</button>
              </div>
            )}
          </div>
        </div>

        {/* Food image / placeholder */}
        <div
          className="img-placeholder"
          style={{
            width: 90, height: 90,
            borderRadius: '14px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '32px' }}>{getFoodEmoji(item.name)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Map food names to emojis
function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('latte') || lower.includes('cappuccino')) return '☕'
  if (lower.includes('tea') || lower.includes('chai')) return '🍵'
  if (lower.includes('pizza')) return '🍕'
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('spaghetti')) return '🍝'
  if (lower.includes('burger') || lower.includes('sandwich')) return '🍔'
  if (lower.includes('wrap') || lower.includes('roll')) return '🌯'
  if (lower.includes('salad')) return '🥗'
  if (lower.includes('soup')) return '🍲'
  if (lower.includes('rice') || lower.includes('biryani') || lower.includes('pulao')) return '🍚'
  if (lower.includes('momo') || lower.includes('dumpling')) return '🥟'
  if (lower.includes('pancake') || lower.includes('waffle')) return '🥞'
  if (lower.includes('cake') || lower.includes('dessert') || lower.includes('brownie') || lower.includes('cookie')) return '🍰'
  if (lower.includes('ice cream') || lower.includes('kulfi')) return '🍦'
  if (lower.includes('juice') || lower.includes('shake') || lower.includes('smoothie')) return '🥤'
  if (lower.includes('lassi') || lower.includes('chaas')) return '🥛'
  if (lower.includes('egg') || lower.includes('omelette') || lower.includes('omellet')) return '🍳'
  if (lower.includes('toast') || lower.includes('bread') || lower.includes('sandwich')) return '🍞'
  if (lower.includes('paneer')) return '🧀'
  if (lower.includes('chicken') || lower.includes('mutton') || lower.includes('meat') || lower.includes('fish') || lower.includes('prawn')) return '🍗'
  if (lower.includes('dal') || lower.includes('curry') || lower.includes('sabzi')) return '🍛'
  if (lower.includes('maggi') || lower.includes('noodle')) return '🍜'
  if (lower.includes('fries') || lower.includes('chips')) return '🍟'
  if (lower.includes('nachos') || lower.includes('snack')) return '🫔'
  if (lower.includes('water') || lower.includes('soda') || lower.includes('cold drink')) return '💧'
  return '🍽️'
}
