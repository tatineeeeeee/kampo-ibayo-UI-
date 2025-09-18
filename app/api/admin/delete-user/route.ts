import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // You'll need to add this to your .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: NextRequest) {
  try {
    const { userId, authId } = await request.json()

    if (!userId && !authId) {
      return NextResponse.json({ error: 'User ID or Auth ID required' }, { status: 400 })
    }

    // Delete from database first (using the database user ID)
    if (userId) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return NextResponse.json({ error: 'Failed to delete user from database' }, { status: 500 })
      }
    }

    // Delete from auth (using the auth ID)
    if (authId) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId)

      if (authError) {
        console.error('Auth deletion error:', authError)
        return NextResponse.json({ 
          success: true, 
          message: 'User deleted from database, auth deletion failed',
          authError: authError.message 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User completely deleted from both database and auth' 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}