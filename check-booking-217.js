// Quick script to check booking 217 payment status
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooking217() {
  console.log('🔍 Checking Booking 217...');
  
  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', 217)
    .single();
    
  console.log('📋 Booking:', booking);
  console.log('❌ Booking Error:', bookingError);
  
  // Get all payment proofs for this booking
  const { data: proofs, error: proofsError } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('booking_id', 217);
    
  console.log('💰 Payment Proofs:', proofs);
  console.log('❌ Proofs Error:', proofsError);
  
  // Check for existing balance payments
  const balancePayments = proofs?.filter(p => p.payment_method === 'cash_on_arrival') || [];
  console.log('💵 Existing Balance Payments:', balancePayments);
}

checkBooking217().catch(console.error);