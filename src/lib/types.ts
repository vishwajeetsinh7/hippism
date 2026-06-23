export interface Category {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  mobile_number: string
  notes: string | null
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string | null
  item_name: string
  price: number
  quantity: number
  subtotal: number
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  description?: string
}
