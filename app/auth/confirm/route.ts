import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../utils/supabaseAdmin";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const { error } = await supabaseAdmin.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Email verified server-side — redirect to login with success toast
      return NextResponse.redirect(
        new URL("/auth?tab=login&verified=true", request.url)
      );
    }
  }

  // Verification failed — redirect to auth with error
  return NextResponse.redirect(
    new URL("/auth?tab=login&error=verification_failed", request.url)
  );
}
