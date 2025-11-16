'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
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

interface PaymentHistoryEntry {
  id: number;
  attemptNumber: number;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
  uploadedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  isLatest: boolean;
}

interface PaymentSummary {
  totalPaid: number;
  pendingAmount: number;
  totalSubmissions: number;
}



function UploadPaymentProofContent() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isResubmission, setIsResubmission] = useState(false);
  const [ocrResult, setOcrResult] = useState<{referenceNumber: string | null; amount: number | null; confidence: number; method: string} | null>(null);
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({ totalPaid: 0, pendingAmount: 0, totalSubmissions: 0 });
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [isManualAmountSet, setIsManualAmountSet] = useState(false); // Track if user manually set amount

  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Get booking ID directly from search params (support multiple parameter names)
  const bookingId = searchParams.get('bookingId') || searchParams.get('booking_id') || searchParams.get('booking');
  
  // Debug logging
  console.log('🔍 URL Parameter Check:');
  console.log('  - bookingId parameter:', bookingId);
  console.log('  - searchParams object:', searchParams);
  console.log('  - All search params:', Object.fromEntries(searchParams.entries()));

  // Calculate remaining balance after verified payments and pending payments
  const verifiedPaidAmount = paymentSummary.totalPaid;
  const pendingAmount = paymentSummary.pendingAmount;
  const currentDetectedAmount = ocrResult?.amount || 0;
  const remainingAmount = booking ? Math.max(0, booking.total_amount - verifiedPaidAmount - pendingAmount) : 0;
  const remainingAfterCurrent = Math.max(0, remainingAmount - currentDetectedAmount);
  
  // Function to fetch payment history
  const fetchPaymentHistory = useCallback(async (bookingId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/user/payment-history/${bookingId}?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.paymentHistory || []);
        setPaymentSummary(data.paymentSummary || { totalPaid: 0, pendingAmount: 0, totalSubmissions: 0 });
      } else {
        console.error('Failed to fetch payment history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  }, [user?.id]);

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
          // Payment history loaded successfully
          
          // Check if this is a resubmission (has rejected proofs)
          const hasRejectedProofs = proofs?.some(proof => proof.status === 'rejected');
          setIsResubmission(hasRejectedProofs || false);
        }
        
        // Don't auto-set amount on booking load - let it start empty for OCR workflow
        // const calculatedPaymentAmount = data.payment_amount || (data.total_amount * 0.5);
        // setAmount(calculatedPaymentAmount.toString());
        
        // Fetch payment history for balance calculations
        await fetchPaymentHistory(bookingId);
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
  }, [bookingId, user, router, fetchPaymentHistory]); // Include fetchPaymentHistory dependency

  // Auto-populate amount from OCR detection when available
  // This triggers after OCR processing completes
  useEffect(() => {
    if (ocrResult?.amount && !isManualAmountSet) {
      console.log('🤖 OCR useEffect: Setting amount to', ocrResult.amount);
      setAmount(ocrResult.amount.toString());
    }
  }, [ocrResult?.amount, isManualAmountSet]); // More specific dependency

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      // Dynamic import to avoid loading OCR service if not used
      import('../utils/ocrService').then(({ OCRService }) => {
        OCRService.terminateWorker().catch(console.warn);
      }).catch(() => {
        // Ignore import errors during cleanup
      });
    };
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Reset OCR result and amount for new image
      setOcrResult(null);
      setAmount(''); // Clear amount field for new image
      setIsManualAmountSet(false); // Reset manual flag for new image
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Auto-process with OCR
      try {
        console.log('🤖 Starting automatic OCR processing...');
        const { OCRService } = await import('../utils/ocrService');
        const result = await OCRService.processPaymentImage(file);
        
        // Store OCR result for display
        setOcrResult({
          referenceNumber: result.referenceNumber,
          amount: result.amount,
          confidence: result.confidence,
          method: result.method
        });
        
        let fieldsUpdated = 0;
        
        if (result.referenceNumber) {
          setReferenceNumber(result.referenceNumber);
          fieldsUpdated++;
        }
        
        // Auto-fill amount if detected (OCR takes priority over any existing value)
        if (result.amount) {
          setAmount(result.amount.toString());
          setIsManualAmountSet(false); // Reset manual flag since this is OCR auto-fill
        }
        
        if (result.method && result.method !== 'unknown') {
          const methodMap: { [key: string]: string } = {
            'gcash': 'gcash',
            'maya': 'maya',
            'bank': 'bank_transfer'
          };
          const mappedMethod = methodMap[result.method];
          if (mappedMethod) {
            setPaymentMethod(mappedMethod);
            fieldsUpdated++;
          }
        }
        
        // Auto-fill completed silently
        if (fieldsUpdated > 0) {
          console.log('✅ Auto-filled', fieldsUpdated, 'field(s) successfully');
        }
        
      } catch (error) {
        console.warn('OCR processing failed:', error);
        setOcrResult(null);
        // Silently fail - user can still fill form manually
      }
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

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      setError('Upload timeout. Please try again.');
    }, 30000); // 30 second timeout

    try {
      console.log('📤 Starting upload process...');
      
      // Import timeout utility
      const { withTimeout } = await import('../utils/apiTimeout');
      
      // Upload image to Supabase storage
      const fileExt = proofImage.name.split('.').pop();
      const fileName = `proof_${bookingId}_${Date.now()}.${fileExt}`;
      
      console.log('📁 Uploading file to storage:', fileName);
      
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Save payment proof record - Use auth.uid() which matches our database structure
      console.log('💾 Saving payment proof record...');
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

      // CRITICAL: Update booking to trigger real-time admin updates
      try {
        console.log('🔄 Now updating booking payment status to payment_review...');
        console.log('🔍 Update parameters:', {
          bookingId: parseInt(bookingId || '0'),
          userId: authUser?.id,
          updateData: {
            payment_status: 'payment_review', // This indicates payment proof needs review
            updated_at: new Date().toISOString()
          }
        });
        
        const { data: updateData, error: updateError } = await supabase
          .from('bookings')
          .update({ 
            // Keep status as 'pending' but update payment_status to indicate payment proof uploaded
            payment_status: 'payment_review', // This will trigger admin real-time subscription
            updated_at: new Date().toISOString()
          })
          .eq('id', parseInt(bookingId || '0'))
          .eq('user_id', authUser?.id || '') // Ensure user can only update their own booking
          .select(); // Add select to return updated data for verification

        if (updateError) {
          console.error('❌ Booking payment status update failed:', updateError);
          console.warn('⚠️ Could not update booking payment status, but payment proof was uploaded successfully:', updateError);
          // This is not critical - admin can update status manually when reviewing proof
        } else {
          console.log('✅ Booking payment status updated successfully - Admin should see real-time update now!');
          console.log('📋 Updated booking data:', updateData);
        }
      } catch (updateErr) {
        console.warn('⚠️ Booking payment status update failed, but payment proof upload was successful:', updateErr);
        // Continue with success flow - payment proof is the important part
      }

      // Success - Show success state briefly, then redirect
      console.log('✅ Payment proof uploaded successfully!');
      clearTimeout(timeoutId); // Clear timeout on success
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

        {/* Payment Instructions - Streamlined */}
        <div className="bg-blue-800/50 border border-blue-600/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600/30 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-blue-200 mb-1">Pay Online</h3>
              <p className="text-blue-100 text-xs">GCash, Maya, Bank Transfer</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-300 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-blue-200 mb-1">Upload Screenshot</h3>
              <p className="text-blue-100 text-xs">Clear payment confirmation</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-300 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-green-200 mb-1">Auto-Fill</h3>
              <p className="text-green-100 text-xs">AI extracts payment details</p>
            </div>
          </div>
        </div>

        {/* Payment Balance & History */}
        {(paymentSummary.totalSubmissions > 0 || paymentSummary.totalPaid > 0) && (
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="bg-blue-600/30 p-1.5 rounded-full">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                Payment History
                {paymentSummary.totalSubmissions > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {paymentSummary.totalSubmissions} submission{paymentSummary.totalSubmissions !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              {paymentSummary.totalSubmissions > 0 && (
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  {showPaymentHistory ? 'Hide Details' : 'Show Details'}
                </button>
              )}
            </div>
            
            {/* Payment Balance Summary */}
            {booking && paymentSummary.totalPaid > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
                <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                  <span>💰</span> Payment Balance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Total Booking</p>
                    <p className="text-white font-semibold text-lg">₱{booking.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Verified Payments</p>
                    <p className="text-green-400 font-semibold text-lg">₱{paymentSummary.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Remaining Balance</p>
                    <p className="font-semibold text-lg text-orange-400">
                      ₱{Math.max(0, remainingAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {paymentSummary.pendingAmount > 0 && (
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded">
                    <p className="text-yellow-300 text-sm">
                      <span className="font-medium">⏳ Pending Review:</span> ₱{paymentSummary.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {remainingAmount <= 0 && (
                  <div className="mt-3 p-2 bg-green-900/20 border border-green-600/50 rounded">
                    <p className="text-green-300 text-sm font-medium">
                      ✅ Booking fully paid! No additional payment required.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Payment History Details */}
            {showPaymentHistory && paymentHistory.length > 0 && (
              <div className="space-y-3">
                {paymentHistory.map((entry) => {
                  const isRejected = entry.status === 'rejected';
                  const isPending = entry.status === 'pending';
                  const isVerified = entry.status === 'verified';
                  
                  // Extract rejection reason from admin notes
                  let rejectionReason = null;
                  if (isRejected && entry.adminNotes) {
                    const reasonMatch = entry.adminNotes.match(/REJECTION REASON: (.+?)(?:\n|$)/);
                    rejectionReason = reasonMatch ? reasonMatch[1] : entry.adminNotes;
                  }
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border bg-gray-900/20 border-gray-600/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Attempt #{entry.attemptNumber} • {new Date(entry.uploadedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {entry.isLatest && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600/30 text-green-300">
                          {isRejected ? '❌ Rejected' : isPending ? '⏳ Under Review' : '✅ Verified'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Method:</span>
                          <span className="text-white ml-1">{entry.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white ml-1">₱{entry.amount.toLocaleString()}</span>
                        </div>
                        {entry.referenceNumber && (
                          <div>
                            <span className="text-gray-400">Ref:</span>
                            <span className="text-white ml-1">{entry.referenceNumber}</span>
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
                      
                      {isVerified && entry.verifiedAt && (
                        <div className="mt-3 p-2 bg-green-800/30 border border-green-600/30 rounded">
                          <p className="text-green-200 text-sm">
                            ✅ Verified on {new Date(entry.verifiedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                {/* Guest Information */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Primary Guest</span>
                    <span className="text-white font-medium">{booking.guest_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Total Guests</span>
                    <span className="text-white">{booking.number_of_guests} {booking.number_of_guests === 1 ? 'person' : 'people'}</span>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Check-in</span>
                    <span className="text-white">{new Date(booking.check_in_date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Check-out</span>
                    <span className="text-white">{new Date(booking.check_out_date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                {/* Additional Booking Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Duration</span>
                    <span className="text-white">
                      {(() => {
                        const checkIn = new Date(booking.check_in_date);
                        const checkOut = new Date(booking.check_out_date);
                        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                        return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
                      })()} 
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Booking Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-900/30 text-green-400'
                      : booking.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' 
                      : 'bg-gray-700 text-gray-300'
                    }`}>
                      {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {/* Payment Summary - Simplified */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-600/30">
                    {paymentSummary.totalPaid > 0 ? (
                      // Show detailed breakdown when there are payments
                      <>
                        <div className="text-gray-400 text-sm mb-1">Total Booking Amount</div>
                        <div className="text-white font-bold text-2xl">₱{booking.total_amount.toLocaleString()}</div>
                        <div className="mt-2 text-sm">
                          <span className="text-green-400">₱{paymentSummary.totalPaid.toLocaleString()} paid</span>
                          {paymentSummary.pendingAmount > 0 && (
                            <span className="text-yellow-400 ml-2">• ₱{paymentSummary.pendingAmount.toLocaleString()} pending</span>
                          )}
                        </div>
                        {remainingAmount > 0 && (
                          <div className="mt-2 px-3 py-1 bg-orange-600/20 border border-orange-500/30 rounded-full inline-block">
                            <span className="text-orange-300 font-semibold text-sm">
                              ₱{remainingAmount.toLocaleString()} remaining
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      // Show simple amount when no payments made
                      <>
                        <div className="text-gray-400 text-sm mb-1">Amount to Pay</div>
                        <div className="text-white font-bold text-2xl">₱{booking.total_amount.toLocaleString()}</div>
                        <div className="text-gray-400 text-xs mt-1">Full booking amount</div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}
            
            {/* Payment Methods */}
            <div className="mt-6 p-4 bg-green-800/20 border border-green-600/30 rounded-lg">
              <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                <span>📳</span> Payment Methods
              </h3>
              <div className="text-sm text-green-200 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GCash:</span> 
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">09662815123</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">BDO:</span> 
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">1234-567-890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">BPI:</span> 
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">1234-567-890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Maya:</span> 
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">1234-567-890</span>
                  </div>
                </div>
                <div className="text-xs text-green-300 mt-3 p-2 bg-green-900/20 rounded">
                  💡 <strong>Account Name:</strong> Kampo Ibayo
                </div>
              </div>
            </div>
          </div>

          {/* Upload Form - Dark Theme */}
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-600/30">
                <Upload className="w-4 h-4 text-green-500" />
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
              {/* File Upload - Dark Theme */
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
                          <p className="text-gray-300">📸 Click to upload payment screenshot</p>
                          <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
                          <p className="text-xs text-blue-400 mt-1">🚀 Smart auto-fill enabled</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {!previewUrl && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>💡</span> Clear screenshots help AI detect payment details
                  </p>
                )}
              </div>
              }
              {/* Compact OCR Summary - Only show key detection status */}
              {ocrResult && proofImage && (ocrResult.referenceNumber || ocrResult.amount) && (
                <div className="mt-3 p-3 bg-gray-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      🤖 Auto-Detected
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                      {ocrResult.confidence.toFixed(0)}% confidence
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {ocrResult.referenceNumber && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Reference: {ocrResult.referenceNumber}
                      </span>
                    )}
                    {ocrResult.amount && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Amount: ₱{ocrResult.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

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

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount Paid <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    // Only mark as manual if user is actually typing (not auto-population)
                    if (e.target.value !== (ocrResult?.amount?.toString() || '')) {
                      setIsManualAmountSet(true);
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="Upload receipt to auto-detect amount"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
                
                {/* Simple Payment Notice */}
                {remainingAmount > 0 && (
                  <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/50 rounded">
                    <p className="text-blue-200 text-xs">
                      <strong>Required payment:</strong> ₱{remainingAmount.toLocaleString()} (remaining balance)
                    </p>
                  </div>
                )}
                
                {/* Quick action buttons */}
                {(ocrResult?.amount || remainingAmount > 0) && (
                  <div className="mt-2 flex gap-2">
                    {ocrResult?.amount && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(ocrResult.amount!.toString());
                          setIsManualAmountSet(true);
                        }}
                        className="px-2 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/30 rounded text-xs transition-all"
                        title="Use the amount detected from your uploaded receipt"
                      >
                        Use AI: ₱{ocrResult.amount.toLocaleString()}
                      </button>
                    )}
                    {remainingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(remainingAmount.toString());
                          setIsManualAmountSet(true);
                        }}
                        className="px-2 py-1 bg-green-600/20 text-green-300 hover:bg-green-600/30 border border-green-600/30 rounded text-xs transition-all"
                        title="Pay the full remaining balance to complete your booking"
                      >
                        Pay Remaining: ₱{remainingAmount.toLocaleString()}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Payment Summary - moved below Amount Paid */}
                <div className="mt-4">
                  <div className="p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg space-y-2">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Payment Summary</h3>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Booking Amount:</span>
                      <span className="text-white font-medium">₱{booking?.total_amount.toLocaleString() || '0'}</span>
                    </div>
                    
                    {paymentSummary.totalPaid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Already Paid:</span>
                        <span className="text-green-400 font-medium">₱{paymentSummary.totalPaid.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {amount && parseFloat(amount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Payment:</span>
                        <span className="text-blue-400 font-medium">₱{parseFloat(amount).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">Remaining After This:</span>
                        <span className={`font-bold ${
                          (amount && parseFloat(amount) > 0 ? remainingAfterCurrent : remainingAmount) <= 0 ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          ₱{(amount && parseFloat(amount) > 0 ? Math.max(0, remainingAfterCurrent) : remainingAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Single Validation Message */}
                    {amount && parseFloat(amount) > 0 && remainingAmount > 0 && (
                      <>
                        {/* Show validation warning only if not paying full amount OR screenshot doesn't match */}
                        {(Math.abs(parseFloat(amount) - remainingAmount) > 0.01 || 
                          (ocrResult?.amount && Math.abs(parseFloat(amount) - ocrResult.amount) > 0.01)) && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-600/30 rounded">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <div className="text-red-300 text-xs">
                                {Math.abs(parseFloat(amount) - remainingAmount) > 0.01 ? (
                                  <p>You must pay the full remaining balance of ₱{remainingAmount.toLocaleString()}</p>
                                ) : ocrResult?.amount && Math.abs(parseFloat(amount) - ocrResult.amount) > 0.01 ? (
                                  <p>Amount doesn&apos;t match screenshot (₱{ocrResult.amount.toLocaleString()})</p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>
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
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Processing...' : 'Submit Payment Proof'}
              </button>
              
              {!proofImage && (
                <p className="text-xs text-gray-400 text-center">
                  Please upload an image before submitting
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Important Note - Full Width */}
        <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <h4 className="font-semibold text-yellow-300 mb-4">Verification Process</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>Verified within <strong>24 hours</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>Email confirmation sent</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>Secure & confidential</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
              <span>AI-powered auto-fill</span>
            </div>
          </div>
          
          {/* Helpful Tip */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0 mt-1.5"></div>
              <div>
                <h5 className="text-blue-200 font-semibold text-sm mb-1">Smart Auto-Detection</h5>
                <p className="text-blue-200 text-sm">
                  Our AI automatically detects payment amounts from screenshots - just upload and let it fill the details for you!
                </p>
              </div>
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
          <div className="text-white text-xl font-semibold">Loading payment page...</div>
        </div>
      </div>
    }>
      <UploadPaymentProofContent />
    </Suspense>
  );
}