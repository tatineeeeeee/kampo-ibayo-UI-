'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import { Upload, FileImage, CreditCard, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  payment_type: string | null; // 'half' or 'full'
  payment_amount: number | null; // Amount to be paid based on payment_type
}

interface ExistingPaymentProof {
  id: number;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
  reference_number: string | null;
  payment_method: string;
  amount: number;
}



function UploadPaymentProofContent() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [existingProofs, setExistingProofs] = useState<ExistingPaymentProof[]>([]);
  const [isResubmission, setIsResubmission] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Get booking ID directly from search params
  const bookingId = searchParams.get('bookingId') || searchParams.get('booking_id');
  
  // Debug logging
  console.log('🔍 URL Parameter Check:');
  console.log('  - bookingId parameter:', bookingId);
  console.log('  - searchParams object:', searchParams);
  console.log('  - All search params:', Object.fromEntries(searchParams.entries()));

  // Calculate payment amounts based on booking payment type
  const paymentAmount = booking?.payment_amount || (booking ? booking.total_amount * 0.5 : 0);
  const remainingAmount = booking ? booking.total_amount - paymentAmount : 0;

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', parseInt(bookingId || '0'))
          .eq('user_id', user?.id || '') // Ensure user can only access their own bookings
          .single();

        if (error) {
          setError('Booking not found or access denied');
          return;
        }

        setBooking(data);
        
        // Fetch existing payment proofs for this booking
        const { data: proofs, error: proofsError } = await supabase
          .from('payment_proofs')
          .select('id, status, admin_notes, uploaded_at, reference_number, payment_method, amount')
          .eq('booking_id', parseInt(bookingId || '0'))
          .eq('user_id', user?.id || '')
          .order('uploaded_at', { ascending: false });

        if (proofsError) {
          console.warn('Could not fetch existing proofs:', proofsError);
        } else {
          setExistingProofs(proofs || []);
          
          // Check if this is a resubmission (has rejected proofs)
          const hasRejectedProofs = proofs?.some(proof => proof.status === 'rejected');
          setIsResubmission(hasRejectedProofs || false);
        }
        
        // Set the correct payment amount based on booking payment type
        const calculatedPaymentAmount = data.payment_amount || (data.total_amount * 0.5);
        setAmount(calculatedPaymentAmount.toString());
      } catch (error) {
        setError('Failed to fetch booking details');
        console.error('Error fetching booking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (bookingId) {
      console.log('Booking ID found:', bookingId, '- Fetching details...');
      fetchBookingDetails();
    } else {
      console.error('No booking ID found in URL parameters');
      setError('No booking ID provided');
      setIsLoading(false);
      
      // Auto-redirect to bookings after 3 seconds if no booking ID
      setTimeout(() => {
        console.log('No booking ID found, redirecting to bookings...');
        router.replace('/bookings');
      }, 3000);
    }
  }, [bookingId, user, router]); // Remove downPaymentAmount to prevent circular dependency

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and GIF files are allowed');
        return;
      }

      setProofImage(file);
      setError('');
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proofImage || !paymentMethod || !amount || !booking) {
      setError('Please fill all required fields and upload an image');
      return;
    }

    // Check if reference number is required for selected payment method
    const requiresReference = ['gcash', 'maya', 'bank_transfer'].includes(paymentMethod);
    if (requiresReference && !referenceNumber.trim()) {
      const methodName = paymentMethod === 'gcash' ? 'GCash' 
        : paymentMethod === 'maya' ? 'Maya' 
        : 'Bank Transfer';
      setError(`Reference number is required for ${methodName} payments`);
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress('Starting upload...');

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      setUploadProgress('');
      setError('Upload timeout. Please try again.');
    }, 30000); // 30 second timeout

    try {
      console.log('📤 Starting upload process...');
      setUploadProgress('Preparing file...');
      
      // Import timeout utility
      const { withTimeout } = await import('../utils/apiTimeout');
      
      // Upload image to Supabase storage
      const fileExt = proofImage.name.split('.').pop();
      const fileName = `proof_${bookingId}_${Date.now()}.${fileExt}`;
      
      console.log('📁 Uploading file to storage:', fileName);
      setUploadProgress('Uploading image...');
      
      const { error: uploadError } = await withTimeout(
        supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofImage),
        30000, // 30 second timeout for file uploads
        'File upload timed out'
      );

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ File uploaded to storage successfully');
      setUploadProgress('Processing upload...');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Save payment proof record - Use auth.uid() which matches our database structure
      console.log('💾 Saving payment proof record...');
      setUploadProgress('Saving proof record...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from('payment_proofs')
        .insert({
          booking_id: parseInt(bookingId || '0'),
          user_id: authUser?.id || '', // Use auth user ID which is what we store
          proof_image_url: publicUrl,
          reference_number: referenceNumber || null,
          payment_method: paymentMethod,
          amount: parseFloat(amount),
          status: 'pending'
        });

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('✅ Payment proof record saved successfully');
      setUploadProgress('Updating booking status...');

      // Add small delay to ensure real-time subscription catches payment proof insert first
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update booking status (optional - don't block success if this fails)
      try {
        console.log('🔄 Now updating booking payment status to pending_verification...');
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'pending_verification',
            updated_at: new Date().toISOString()
          })
          .eq('id', parseInt(bookingId || '0'))
          .eq('user_id', authUser?.id || ''); // Ensure user can only update their own booking

        if (updateError) {
          console.warn('⚠️ Could not update booking status, but payment proof was uploaded successfully:', updateError);
          // This is not critical - admin can update status manually when reviewing proof
        } else {
          console.log('✅ Booking status updated successfully');
        }
      } catch (updateErr) {
        console.warn('⚠️ Booking status update failed, but payment proof upload was successful:', updateErr);
        // Continue with success flow - payment proof is the important part
      }

      // Success - Show success state briefly, then redirect
      console.log('✅ Payment proof uploaded successfully!');
      clearTimeout(timeoutId); // Clear timeout on success
      setUploadProgress('Upload complete!');
      setUploadSuccess(true);
      
      // Add a small delay to show success state, then redirect
      setTimeout(() => {
        router.push('/bookings?payment_uploaded=true');
      }, 1500);
      
    } catch (err) {
      console.error('Upload error:', err);
      clearTimeout(timeoutId); // Clear timeout on error
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      if (!uploadSuccess) {
        setIsUploading(false);
        setUploadProgress('');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Please log in to continue</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md border border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">⚠️ Access Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-gray-400 text-sm mb-6">
            Please select a booking from your bookings page to upload payment proof.
          </p>
          <button
            onClick={() => {
              console.log('Redirecting to bookings page...');
              // Use replace instead of push to prevent back button issues
              router.replace('/bookings');
            }}
            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-600 transition-colors"
          >
            📋 Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sticky Header - Match bookings page style */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🔙 Navigating back to bookings...');
                  router.replace('/bookings');
                }}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Bookings"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">Upload Payment Proof</h1>
                <p className="text-xs sm:text-sm text-gray-400">Booking #{booking?.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <span className="hidden sm:inline text-sm text-gray-300">Secure Upload</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">

        {/* Payment Instructions - Helpful Guide */}
        <div className="bg-blue-800/50 border border-blue-600/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600/30 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Payment Instructions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">📱 Step 1: Make Online Payment</h3>
              <p className="text-blue-100 mb-1">Pay your booking amount using these online methods:</p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• GCash Transfer</li>
                <li>• Maya/PayMaya Transfer</li>
                <li>• Bank Transfer (BPI, BDO, etc.)</li>
                <li>• Online Banking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-200 mb-2">📸 Step 2: Take Screenshot</h3>
              <p className="text-blue-100 mb-1">Capture a clear photo/screenshot showing:</p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• Payment amount</li>
                <li>• Transaction date & time</li>
                <li>• Reference number</li>
                <li>• Recipient details</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Previous Payment Attempts */}
        {existingProofs.length > 0 && (
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="bg-yellow-600/30 p-1.5 rounded-full">
                <CreditCard className="w-4 h-4 text-yellow-500" />
              </div>
              Payment History
            </h2>
            
            <div className="space-y-3">
              {existingProofs.map((proof, index) => {
                const isRejected = proof.status === 'rejected';
                const isPending = proof.status === 'pending';
                
                // Extract rejection reason from admin notes
                let rejectionReason = null;
                if (isRejected && proof.admin_notes) {
                  const reasonMatch = proof.admin_notes.match(/REJECTION REASON: (.+?)(?:\n|$)/);
                  rejectionReason = reasonMatch ? reasonMatch[1] : proof.admin_notes;
                }
                
                return (
                  <div
                    key={proof.id}
                    className={`p-4 rounded-lg border ${
                      isRejected 
                        ? 'bg-red-900/20 border-red-600/50' 
                        : isPending 
                        ? 'bg-yellow-900/20 border-yellow-600/50'
                        : 'bg-green-900/20 border-green-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        Attempt #{existingProofs.length - index} • {new Date(proof.uploaded_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isRejected 
                          ? 'bg-red-600/30 text-red-300' 
                          : isPending 
                          ? 'bg-yellow-600/30 text-yellow-300'
                          : 'bg-green-600/30 text-green-300'
                      }`}>
                        {isRejected ? '❌ Rejected' : isPending ? '⏳ Under Review' : '✅ Verified'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white ml-1">{proof.payment_method}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white ml-1">₱{proof.amount.toLocaleString()}</span>
                      </div>
                      {proof.reference_number && (
                        <div>
                          <span className="text-gray-400">Ref:</span>
                          <span className="text-white ml-1">{proof.reference_number}</span>
                        </div>
                      )}
                    </div>
                    
                    {isRejected && rejectionReason && (
                      <div className="mt-3 p-3 bg-red-800/30 border border-red-600/30 rounded">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-red-300 font-medium text-sm">Reason for rejection:</h4>
                            <p className="text-red-200 text-sm mt-1">{rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isPending && (
                      <div className="mt-3 p-3 bg-yellow-800/30 border border-yellow-600/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-yellow-200 text-sm">Currently under admin review. You will be notified via email once reviewed.</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {isResubmission && (
              <div className="mt-4 p-4 bg-blue-800/30 border border-blue-600/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600/30 p-2 rounded-full flex-shrink-0">
                    <Upload className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-blue-300 font-medium">Ready to resubmit?</h4>
                    <p className="text-blue-200 text-sm mt-1">
                      Please review the rejection reason above and upload a corrected payment proof below. 
                      Make sure your new submission addresses the issues mentioned.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Booking Details - Dark Theme */}
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="bg-red-600/30 p-1.5 rounded-full">
                <CreditCard className="w-4 h-4 text-red-500" />
              </div>
              Booking Summary
            </h2>
            {booking && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Guest Name:</span>
                  <span className="font-medium text-white">{booking.guest_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Check-in:</span>
                  <span className="font-medium text-white">{new Date(booking.check_in_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Check-out:</span>
                  <span className="font-medium text-white">{new Date(booking.check_out_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Guests:</span>
                  <span className="font-medium text-white">{booking.number_of_guests}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="font-semibold text-lg text-white">₱{booking.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700 bg-green-800/20 px-3 rounded">
                  <span className="text-green-300 font-medium">
                    💰 {booking?.payment_type === 'full' ? 'Full Payment (100%)' : 'Down Payment (50%)'}:
                  </span>
                  <span className="font-bold text-green-400 text-lg">₱{paymentAmount.toLocaleString()}</span>
                </div>
                {booking?.payment_type !== 'full' && (
                  <div className="flex justify-between py-2 bg-orange-800/20 px-3 rounded">
                    <span className="text-orange-300">💳 Pay on Arrival (50%):</span>
                    <span className="font-medium text-orange-400">₱{remainingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Payment Details */}
            <div className="mt-6 p-4 bg-green-800/20 border border-green-600/30 rounded-lg">
              <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                <span>📱</span> Payment Details
              </h3>
              <div className="text-sm text-green-200 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="font-medium">GCash:</span> 
                  <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">09662815123</span>
                  <span className="text-xs">(Kampo Ibayo)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">BDO:</span> 
                  <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">1234-567-890</span>
                  <span className="text-xs">(Kampo Ibayo)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">BPI:</span> 
                  <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">1234-567-890</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">PayMaya:</span> 
                  <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">1234-567-890</span>
                </p>
                <p className="text-xs text-green-300 mt-2">
                  💡 <strong>Amount to pay:</strong> ₱{paymentAmount.toLocaleString()} 
                  ({booking?.payment_type === 'full' ? '100% full payment' : '50% down payment'})
                </p>
              </div>
            </div>
          </div>

          {/* Upload Form - Dark Theme */}
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${isResubmission ? 'bg-orange-600/30' : 'bg-green-600/30'}`}>
                <Upload className={`w-4 h-4 ${isResubmission ? 'text-orange-500' : 'text-green-500'}`} />
              </div>
              {isResubmission ? 'Resubmit Payment Proof' : 'Upload Payment Proof'}
            </h2>
            
            {isResubmission && (
              <div className="mb-4 p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <p className="text-orange-200 text-sm">
                    <strong>Resubmission:</strong> Please address the rejection reason above when uploading your new payment proof.
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method <span className="text-red-400">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="" className="bg-gray-700">Select Payment Method</option>
                  <option value="gcash" className="bg-gray-700">GCash</option>
                  <option value="maya" className="bg-gray-700">Maya/PayMaya</option>
                  <option value="bank_transfer" className="bg-gray-700">Bank Transfer</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference/Transaction Number 
                  {(paymentMethod === 'gcash' || paymentMethod === 'maya' || paymentMethod === 'bank_transfer' || paymentMethod === 'online_banking') && (
                    <span className="text-red-400">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={
                    paymentMethod === 'gcash' ? "Enter GCash reference number (e.g., 1234567890)"
                    : paymentMethod === 'maya' ? "Enter Maya reference number"
                    : paymentMethod === 'bank_transfer' ? "Enter bank transaction reference"
                    : paymentMethod === 'online_banking' ? "Enter online banking reference"
                    : "Enter transaction reference (if available)"
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required={paymentMethod === 'gcash' || paymentMethod === 'maya' || paymentMethod === 'bank_transfer' || paymentMethod === 'online_banking'}
                />
                {(paymentMethod === 'gcash' || paymentMethod === 'maya' || paymentMethod === 'bank_transfer' || paymentMethod === 'online_banking') && (
                  <p className="text-sm text-yellow-400 mt-1 flex items-center gap-1">
                    <span>⚠️</span> Reference number is required for {paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'maya' ? 'Maya' : paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Online Banking'} payments
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount Paid <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
                <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                  <span>💡</span> Recommended: ₱{paymentAmount.toLocaleString()} 
                  ({booking?.payment_type === 'full' ? 'full payment' : '50% down payment'})
                </p>
              </div>

              {/* File Upload - Dark Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Screenshot/Receipt <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-red-500 transition-colors bg-gray-700/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="proof-upload"
                    required
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <Image
                          src={previewUrl}
                          alt="Payment proof preview"
                          width={200}
                          height={150}
                          className="mx-auto rounded-lg shadow-md max-h-40 object-contain border border-gray-600"
                        />
                        <p className="text-sm text-green-400 font-medium">✅ Image uploaded - Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileImage className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <Upload className="w-6 h-6 text-red-400 mx-auto mb-2" />
                          <p className="text-gray-300">📸 Click to upload screenshot or receipt</p>
                          <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  💡 <strong>Tip:</strong> Make sure the image shows payment amount, date, and reference number clearly
                </p>
              </div>

              {/* Error Message - Dark Theme */}
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button - Enhanced */}
              <button
                type="submit"
                disabled={isUploading || !proofImage || uploadSuccess}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  uploadSuccess 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploadSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-100" />
                    ✅ Upload Successful! Redirecting...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {uploadProgress || 'Processing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Payment Proof
                  </>
                )}
              </button>
              
              {!proofImage && (
                <p className="text-xs text-gray-400 text-center">
                  Please upload an image before submitting
                </p>
              )}
            </form>

            {/* Important Note - Dark Theme */}
            <div className="mt-6 p-4 bg-yellow-800/20 border border-yellow-600/50 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-1">⚠️ Important Guidelines:</h4>
              <ul className="text-sm text-yellow-200 space-y-1">
                <li>• 📸 Upload clear screenshot showing payment confirmation</li>
                <li>• 🔢 Include transaction reference number if available</li>
                <li>• ⏱️ Admin will verify and confirm your booking within <strong>24 hours</strong></li>
                <li>• 📧 You&apos;ll receive email confirmation once verified</li>
                <li>• 🔒 Your payment information is kept secure and confidential</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function UploadPaymentProof() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibent">Loading payment page...</div>
        </div>
      </div>
    }>
      <UploadPaymentProofContent />
    </Suspense>
  );
}