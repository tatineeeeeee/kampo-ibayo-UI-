import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }

    // Create admin client inside the function
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 🔐 Get the access token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Verify the token and get the user using admin client
    const { data: { user: currentAuthUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)

    if (authError || !currentAuthUser) {
      console.error('Auth verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized - Invalid or expired session' }, { status: 401 })
    }

    // Get current user's role (is_super_admin column may not exist yet)
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_id', currentAuthUser.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 401 })
    }

    // 🔐 Only admins can delete users
    if (currentUser.role !== 'admin') {
      console.log('🔒 AUDIT: Non-admin attempted user deletion', {
        timestamp: new Date().toISOString(),
        currentUserRole: currentUser.role,
        currentUserId: currentUser.id
      })
      return NextResponse.json({ error: 'Permission denied - Admin access required' }, { status: 403 })
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { userId, authId } = requestBody

    if (!userId && !authId) {
      return NextResponse.json({ error: 'User ID or Auth ID required' }, { status: 400 })
    }

    console.log('Delete request received:', { userId: !!userId, authId: !!authId })

    // Get user details before deletion for audit logging and permission checks
    let userDetails = null
    if (userId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single()
      userDetails = userData
    }

    // 🔐 PERMISSION CHECKS

    // 1. Cannot delete yourself
    if (userDetails?.id === currentUser.id) {
      console.log('🔒 AUDIT: Self-deletion attempt blocked', {
        timestamp: new Date().toISOString(),
        userId: currentUser.id
      })
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 })
    }

    // 2. Cannot delete other admins (for now, until super admin is set up)
    if (userDetails?.role === 'admin') {
      console.log('🔒 AUDIT: Admin deletion blocked', {
        timestamp: new Date().toISOString(),
        attemptedBy: currentUser.id,
        targetUser: userDetails.email
      })
      return NextResponse.json({ error: 'Cannot delete administrator accounts' }, { status: 403 })
    }

    // 🔒 AUDIT LOG: Admin user deletion initiated
    console.log('🔒 AUDIT: Admin user deletion initiated', {
      timestamp: new Date().toISOString(),
      targetUserId: userId,
      targetAuthId: authId,
      targetUserEmail: userDetails?.email,
      targetUserName: userDetails?.name,
      targetUserRole: userDetails?.role,
      adminIpAddress: request.headers.get('x-forwarded-for') || 'unknown',
      adminUserAgent: request.headers.get('user-agent') || 'unknown',
      action: 'ADMIN_DELETE_USER'
    })

    // Delete from database first (using the database user ID)
    if (userId) {
      console.log('Deleting from database...')
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return NextResponse.json({
          error: 'Failed to delete user from database',
          details: dbError.message
        }, { status: 500 })
      }
      console.log('Successfully deleted from database')
    }

    // Delete from auth (using the auth ID)
    if (authId) {
      console.log('Deleting from auth...')
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId)

      if (authError) {
        console.error('Auth deletion error:', authError)
        return NextResponse.json({
          success: true,
          message: 'User deleted from database, auth deletion failed',
          authError: authError.message
        }, { status: 200 })
      }
      console.log('Successfully deleted from auth')
    }

    console.log('User deletion completed successfully')

    // 🔒 AUDIT LOG: Admin user deletion completed
    console.log('🔒 AUDIT: Admin user deletion completed successfully', {
      timestamp: new Date().toISOString(),
      targetUserId: userId,
      targetAuthId: authId,
      targetUserEmail: userDetails?.email,
      targetUserName: userDetails?.name,
      targetUserRole: userDetails?.role,
      adminIpAddress: request.headers.get('x-forwarded-for') || 'unknown',
      deletedFromDatabase: !!userId,
      deletedFromAuth: !!authId,
      action: 'ADMIN_DELETE_USER_SUCCESS'
    })

    return NextResponse.json({
      success: true,
      message: 'User completely deleted from both database and auth'
    })

  } catch (error) {
    console.error('Unexpected error in delete API:', error)

    // Ensure we always return valid JSON
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}