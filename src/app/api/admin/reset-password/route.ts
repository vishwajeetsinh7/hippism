import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Temporary endpoint to reset admin password to: hippism@2024
// Visit /api/admin/reset-password once to reset, then delete this file.
export async function GET() {
  try {
    const newPassword = 'hippism@2024'
    const hash = await bcrypt.hash(newPassword, 10)

    // Upsert admin user
    const { error } = await supabase
      .from('admin_users')
      .upsert({ username: 'admin', password_hash: hash }, { onConflict: 'username' })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully.',
      credentials: { username: 'admin', password: newPassword }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
