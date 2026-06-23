// Order history stored in localStorage
// Key: 'hippism_order_history'

export interface LocalOrderItem {
  name: string
  quantity: number
  price: number
  subtotal: number
}

export interface LocalOrder {
  id: string            // Supabase order UUID
  orderNumber: string   // HE-XXXX
  customerName: string
  mobile: string
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  items: LocalOrderItem[]
  notes?: string
  createdAt: string     // ISO string
  updatedAt: string     // ISO string
}

const STORAGE_KEY = 'hippism_order_history'
const MAX_ORDERS = 50  // keep last 50 orders per device

export function saveOrder(order: LocalOrder): void {
  try {
    const existing = getOrders()
    // Remove duplicate if re-saving
    const filtered = existing.filter(o => o.id !== order.id)
    const updated = [order, ...filtered].slice(0, MAX_ORDERS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}

export function updateOrderStatus(
  orderId: string,
  status: LocalOrder['status']
): LocalOrder | null {
  try {
    const orders = getOrders()
    let updated: LocalOrder | null = null
    const newOrders = orders.map(o => {
      if (o.id === orderId) {
        updated = { ...o, status, updatedAt: new Date().toISOString() }
        return updated
      }
      return o
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders))
    return updated
  } catch {
    return null
  }
}

export function getOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalOrder[]
  } catch {
    return []
  }
}

export function getOrderById(orderId: string): LocalOrder | null {
  return getOrders().find(o => o.id === orderId) || null
}

export function clearAllOrders(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ── Notification helpers ──────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function sendOrderNotification(
  orderNumber: string,
  status: LocalOrder['status']
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const messages: Record<LocalOrder['status'], { title: string; body: string; icon: string }> = {
    pending:   { title: '🕐 Order Received', body: `${orderNumber} — We got your order! Hang tight.`, icon: '🕐' },
    preparing: { title: '👨‍🍳 We\'re Cooking!', body: `${orderNumber} — Your food is being prepared.`, icon: '👨‍🍳' },
    ready:     { title: '✅ Order Ready!', body: `${orderNumber} — Your order is ready to pick up!`, icon: '✅' },
    completed: { title: '🎉 Order Complete', body: `${orderNumber} — Enjoy your meal! Come again.`, icon: '🎉' },
    cancelled: { title: '❌ Order Cancelled', body: `${orderNumber} — Your order was cancelled.`, icon: '❌' },
  }

  const msg = messages[status]
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: orderNumber,        // replaces previous notification for same order
      renotify: true,
    })
  } catch {
    // Notification API unavailable
  }
}
