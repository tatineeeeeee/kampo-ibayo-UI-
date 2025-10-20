import { NextRequest } from 'next/server';
import { supabase } from '@/app/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Server-side authentication utility for API routes
 * Note: This is a simplified version that relies on client-side auth state
 * In production, you should use proper server-side session validation
 */
export async function validateAdminAccess(): Promise<{ 
  isValid: boolean; 
  user?: User; 
  error?: string 
}> {
  try {
    // Get current session (this will work in API routes if called from authenticated frontend)
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