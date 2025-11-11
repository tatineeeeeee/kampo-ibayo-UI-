import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables for account deletion')
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    // Create admin client
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

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { userId, confirmationToken } = requestBody

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Processing account deletion request for user:', userId)

    // First, verify the user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email, name, role')
      .eq('auth_id', userId)
      .single()

    if (fetchError || !existingUser) {
      console.error('User not found:', fetchError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 🔒 AUDIT LOG: Account deletion attempt
    console.log('🔒 AUDIT: User account deletion initiated', {
      timestamp: new Date().toISOString(),
      userId: userId,
      userEmail: existingUser.email,
      userName: existingUser.name,
      userRole: existingUser.role,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Safety check: Don't delete admin accounts through this endpoint
    if (existingUser.role === 'admin') {
      return NextResponse.json({ 
        error: 'Admin accounts cannot be self-deleted. Contact support.' 
      }, { status: 403 })
    }

    // Check for active bookings (business rule enforcement)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, check_in_date, check_out_date, guest_name, total_amount')
      .eq('user_id', userId)

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError)
      return NextResponse.json({ 
        error: 'Unable to verify account eligibility for deletion' 
      }, { status: 500 })
    }

    // Analyze booking status
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeBookings = bookings?.filter(b => 
      b.status === 'pending' || 
      b.status === 'confirmed' || 
      b.status === 'paid'
    ) || []

    const upcomingBookings = bookings?.filter(b => {
      const checkInDate = new Date(b.check_in_date)
      return checkInDate > today
    }) || []

    const recentBookings = bookings?.filter(b => {
      const checkOutDate = new Date(b.check_out_date)
      return checkOutDate > thirtyDaysAgo
    }) || []

    // Enforce business rules
    if (activeBookings.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete account: ${activeBookings.length} active booking(s) found`,
        details: 'Please cancel or complete all pending/confirmed/paid bookings first',
        activeBookings: activeBookings.map(b => ({
          id: b.id,
          status: b.status,
          checkIn: b.check_in_date,
          checkOut: b.check_out_date
        }))
      }, { status: 400 })
    }

    if (upcomingBookings.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete account: ${upcomingBookings.length} upcoming booking(s) found`,
        details: 'Please cancel all future bookings first',
        upcomingBookings: upcomingBookings.map(b => ({
          id: b.id,
          checkIn: b.check_in_date,
          checkOut: b.check_out_date
        }))
      }, { status: 400 })
    }

    if (recentBookings.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete account: ${recentBookings.length} recent booking(s) within 30 days`,
        details: 'Please contact support for accounts with recent bookings',
        requiresSupport: true
      }, { status: 400 })
    }

    // If they have old bookings, require confirmation token
    if (bookings && bookings.length > 0 && confirmationToken !== 'DELETE') {
      return NextResponse.json({ 
        error: 'Additional confirmation required',
        details: `Account has ${bookings.length} historical booking(s)`,
        requiresConfirmation: true,
        bookingCount: bookings.length
      }, { status: 400 })
    }

    console.log('Account deletion eligibility verified. Processing deletion...')

    // Anonymize old booking records instead of deleting them (for business records)
    if (bookings && bookings.length > 0) {
      const { error: anonymizeError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          guest_name: 'Deleted User',
          guest_email: 'deleted@privacy.local',
          guest_phone: null,
          special_requests: 'User account deleted'
        })
        .eq('user_id', userId)

      if (anonymizeError) {
        console.error('Error anonymizing booking records:', anonymizeError)
        return NextResponse.json({ 
          error: 'Failed to process booking data anonymization' 
        }, { status: 500 })
      }

      console.log(`Anonymized ${bookings.length} booking record(s)`)
    }

    // Delete user from database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('auth_id', userId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to delete user profile' 
      }, { status: 500 })
    }

    console.log('User profile deleted from database')

    // Delete from authentication system
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth deletion error:', authError)
      return NextResponse.json({ 
        success: true, 
        message: 'Account partially deleted. Authentication cleanup may be incomplete.',
        warning: 'Contact support if you experience login issues'
      }, { status: 200 })
    }

    console.log('User authentication record deleted')

    // 🔒 AUDIT LOG: Successful account deletion
    console.log('🔒 AUDIT: User account deletion completed successfully', {
      timestamp: new Date().toISOString(),
      userId: userId,
      userEmail: existingUser.email,
      userName: existingUser.name,
      userRole: existingUser.role,
      bookingsAnonymized: bookings ? bookings.length : 0,
      totalBookings: bookings ? bookings.length : 0,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Account successfully deleted',
      details: {
        profileDeleted: true,
        authDeleted: true,
        bookingsAnonymized: bookings ? bookings.length : 0
      }
    })

  } catch (error) {
    console.error('Unexpected error in account deletion:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Internal server error during account deletion',
      message: errorMessage
    }, { status: 500 })
  }
}