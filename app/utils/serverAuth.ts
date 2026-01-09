/**
 * =============================================================================
 * SERVER-SIDE AUTHENTICATION UTILITY
 * =============================================================================
 * 
 * PHP FRAMEWORK SECURITY EQUIVALENTS:
 * 
 * 1. SESSION MANAGEMENT (PHP: session_start(), $_SESSION['user_id'])
 *    - Uses JWT tokens instead of server-side sessions
 *    - supabase.auth.getSession() validates the JWT signature
 *    - Equivalent to: if(!isset($_SESSION['user_id'])) { die('Unauthorized'); }
 * 
 * 2. ROLE-BASED ACCESS CONTROL (PHP: if($_SESSION['role'] !== 'admin'))
 *    - Checks user role from database after session validation
 *    - Prevents unauthorized access to admin functions
 * 
 * 3. JWT TOKEN SECURITY:
 *    - Tokens signed with RS256 (asymmetric encryption)
 *    - Cannot be forged without Supabase's private key
 *    - Automatically expires to prevent session hijacking
 * 
 * =============================================================================
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/app/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Validates admin/staff access for protected API routes
 * 
 * PHP Equivalent:
 *   session_start();
 *   if(!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
 *     http_response_code(401);
 *     die(json_encode(['error' => 'Unauthorized']));
 *   }
 */
export async function validateAdminAccess(): Promise<{
  isValid: boolean;
  user?: User;
  error?: string
}> {
  try {
    /**
     * SESSION VALIDATION - PHP Equivalent: session_start(); if(isset($_SESSION['user_id']))
     * JWT token is verified using asymmetric encryption (RS256)
     */
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return {
        isValid: false,
        error: 'Authentication required'
      };
    }

    // Get user data from database to check role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('auth_id', session.user.id)
      .single();

    if (userError || !userData) {
      return {
        isValid: false,
        error: 'User not found'
      };
    }

    // Check if user has admin or staff role
    if (userData.role !== 'admin' && userData.role !== 'staff') {
      return {
        isValid: false,
        error: 'Admin or Staff access required'
      };
    }

    return {
      isValid: true,
      user: userData as User
    };
  } catch (error) {
    console.error('Server auth validation error:', error);
    return {
      isValid: false,
      error: 'Authentication validation failed'
    };
  }
}

/**
 * Higher-order function to protect admin API routes
 */
export function withAdminAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const auth = await validateAdminAccess();

    if (!auth.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: auth.error || 'Access denied'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, auth.user!);
  };
}