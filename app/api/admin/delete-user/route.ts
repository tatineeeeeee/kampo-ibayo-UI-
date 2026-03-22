import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await validateAdminAuth(request);
    if (!auth.success) return authErrorResponse(auth as AuthFailure);

    const isCurrentUserSuperAdmin = auth.user.isSuperAdmin;

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


    // Get user details before deletion for audit logging and permission checks
    let userDetails = null
    if (userId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, is_super_admin')
        .eq('id', userId)
        .single()
      userDetails = userData
    } else if (authId) {
      // Also look up by auth_id so permission checks are not skipped
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, is_super_admin')
        .eq('auth_id', authId)
        .single()
      userDetails = userData
    }

    // 🔐 PERMISSION CHECKS

    // 1. Cannot delete yourself
    if (userDetails?.id === auth.user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 })
    }

    // 2. Super Admin cannot be deleted by anyone
    if (userDetails?.is_super_admin) {
      return NextResponse.json({ error: 'Cannot delete Super Admin accounts' }, { status: 403 })
    }

    // 3. Only Super Admin can delete other admins
    if (userDetails?.role === 'admin' && !isCurrentUserSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admin can delete administrator accounts' }, { status: 403 })
    }

    // 🔒 AUDIT LOG: Admin user deletion initiated

    // Delete from database first (using the database user ID)
    if (userId) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return NextResponse.json({
          error: 'Failed to delete user from database'
        }, { status: 500 })
      }
    }

    // Delete from auth (using the auth ID)
    if (authId) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId)

      if (authError) {
        console.error('Auth deletion error:', authError)
        return NextResponse.json({
          success: true,
          message: 'User deleted from database, auth deletion may be incomplete'
        }, { status: 200 })
      }
    }


    // 🔒 AUDIT LOG: Admin user deletion completed

    return NextResponse.json({
      success: true,
      message: 'User completely deleted from both database and auth'
    })

  } catch (error) {
    console.error('Unexpected error in delete API:', error)

    // Ensure we always return valid JSON
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}