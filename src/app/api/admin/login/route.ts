import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Fallback credentials (used if admin_users table is empty or unreachable)
const FALLBACK_USERNAME = 'admin'
const FALLBACK_PASSWORD = 'hippism@2024'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 })
    }

    // Try DB first
    const { data: adminUser } = await supabase.from('admin_users').select('*').eq('username', username).single()

    if (adminUser) {
      const isValid = await bcrypt.compare(password, adminUser.password_hash)
      if (isValid) return NextResponse.json({ success: true })
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // Fallback: hardcoded credentials
    if (username === FALLBACK_USERNAME && password === FALLBACK_PASSWORD) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
