'use client';

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Star, Send, MapPin, Calendar, User, MessageSquare, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

interface ReviewSubmissionFormProps {
  bookingId?: number;
  initialBookingId?: number;
  initialGuestName?: string;
  initialGuestEmail?: string;
  prefilledData?: {
    guestName?: string;
    guestEmail?: string;
    guestLocation?: string;
  };
  categoryRatings?: {
    overall: number;
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  stayDates?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  isModal?: boolean;
}

const ReviewSubmissionForm = ({ 
  bookingId, 
  initialBookingId,
  initialGuestName,
  initialGuestEmail,
  prefilledData, 
  categoryRatings,
  stayDates,
  onSuccess, 
  onCancel,
  className = "",
  isModal = false
}: ReviewSubmissionFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    reviewText: '',
    guestName: initialGuestName || prefilledData?.guestName || '',
    guestEmail: initialGuestEmail || prefilledData?.guestEmail || user?.email || '',
    guestLocation: prefilledData?.guestLocation || '',
    bookingId: initialBookingId || bookingId || 0
  });
  // const [photos, setPhotos] = useState<File[]>([]); // TODO: Implement photo storage
  const [photos, setPhotos] = useState<File[]>([]);

  // Handle star rating
  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const validateForm = () => {
    // If category ratings provided, use overall rating from there
    const rating = categoryRatings?.overall || formData.rating;
    
    if (rating === 0) {
      setError('Please select a rating');
      return false;
    }
    if (formData.reviewText.trim().length < 10) {
      setError('Please write at least 10 characters in your review');
      return false;
    }
    if (!formData.guestName.trim()) {
      setError('Please enter your display name');
      return false;
    }
    return true;
  };

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Test Supabase connection first
      console.log('🔗 Testing Supabase connection...');
      const { error: connectionError } = await supabase
        .from('guest_reviews')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Supabase connection failed:', connectionError);
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }
      
      console.log('✅ Supabase connection successful');

      // Check if user already submitted a review for this booking
      if (bookingId && user?.id) {
        // Use basic fields that we know exist
        const { data: existingReview, error: reviewError } = await supabase
          .from('guest_reviews')
          .select('id, approved, created_at')
          .eq('booking_id', bookingId)
          .eq('user_id', user.id)
          .single();

        // If no review exists, that's fine - continue with submission
        if (reviewError && reviewError.code !== 'PGRST116') {
          console.error('Error checking existing review:', reviewError);
          // Continue anyway, let the insertion handle any issues
        }

        if (existingReview) {
          if (existingReview.approved === true) {
            setError('You have already submitted a review for this booking and it has been published. You cannot submit another review for the same stay.');
            setIsSubmitting(false);
            return;
          } else if (existingReview.approved === null) {
            setError('You have already submitted a review for this booking and it is waiting for admin confirmation. Please wait 24-48 hours for approval.');
            setIsSubmitting(false);
            return;
          } else {
            // Review was rejected - allow resubmission
            const createdDate = new Date(existingReview.created_at);
            const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceCreation > 30) {
              setError('This review was rejected more than 30 days ago. Please contact support if you still wish to submit a review.');
              setIsSubmitting(false);
              return;
            }
            
            // Show rejection message and allow resubmission
            console.log('🔄 Previous review was rejected, allowing resubmission...');
            setError('Your previous review was not approved by our moderation team. You can submit a new review that follows our guidelines.');
            
            // Delete the old rejected review to allow resubmission
            const { error: deleteError } = await supabase
              .from('guest_reviews')
              .delete()
              .eq('id', existingReview.id);
            
            if (deleteError) {
              console.error('❌ Error deleting rejected review:', deleteError);
              setError('Failed to process resubmission. Please contact support.');
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      // Ensure we have a valid user ID for the database
      if (!user?.id) {
        setError('Please log in to submit a review');
        setIsSubmitting(false);
        return;
      }

      console.log('📋 User info:', { id: user.id, email: user.email });
      console.log('📝 Form data before submission:', {
        user_id: user.id,
        guest_name: formData.guestName.trim(),
        guest_location: formData.guestLocation.trim() || null,
        rating: formData.rating,
        reviewText: formData.reviewText.trim(),
        bookingId: formData.bookingId,
        hasBookingId: Boolean(formData.bookingId)
      });

      // Prepare review data matching the table structure
      const reviewData = {
        user_id: user.id,
        guest_name: formData.guestName.trim(),
        guest_location: formData.guestLocation.trim() || null,
        rating: categoryRatings?.overall || formData.rating,
        review_text: formData.reviewText.trim(),
        // Add category ratings if provided
        ...(categoryRatings && {
          cleanliness_rating: categoryRatings.cleanliness || null,
          service_rating: categoryRatings.service || null,
          location_rating: categoryRatings.location || null,
          value_rating: categoryRatings.value || null,
          amenities_rating: categoryRatings.amenities || null,
        }),
        // Add stay dates if provided
        ...(stayDates && { stay_dates: stayDates }),
        // Only add booking_id if it's a valid positive number
        ...(formData.bookingId && formData.bookingId > 0 && { booking_id: formData.bookingId })
      };

      console.log('🚀 Final review data to insert:', reviewData);
      console.log('🔍 Data types check:', {
        user_id_type: typeof reviewData.user_id,
        user_id_value: reviewData.user_id,
        rating_type: typeof reviewData.rating,
        rating_value: reviewData.rating,
        guest_name_type: typeof reviewData.guest_name,
        guest_location_type: typeof reviewData.guest_location
      });

      // Insert review into database
      const { data: insertData, error: insertError } = await supabase
        .from('guest_reviews')
        .insert([reviewData])
        .select('*'); // Select all fields to see what was inserted

      console.log('📊 Database response:', { data: insertData, error: insertError });

      if (insertError) {
        console.error('❌ Database insertion error details:', insertError);
        console.error('❌ Error message:', insertError.message);
        console.error('❌ Error code:', insertError.code);
        console.error('❌ Error details:', insertError.details);
        console.error('❌ Error hint:', insertError.hint);
        console.error('❌ Full error object:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      // Handle photo uploads if any photos were selected
      if (photos.length > 0 && insertData && insertData[0]) {
        const reviewId = insertData[0].id;
        console.log('📸 Uploading photos for review ID:', reviewId, 'Type:', typeof reviewId);
        
        try {
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const fileExt = photo.name.split('.').pop();
            const fileName = `review_${reviewId}_photo_${i + 1}.${fileExt}`;
            const filePath = `review-photos/${fileName}`;

            // Upload photo to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('review-photos')
              .upload(filePath, photo);

            if (uploadError) {
              console.error('❌ Photo upload error:', uploadError);
              continue; // Continue with other photos even if one fails
            }

            // Get public URL for the uploaded photo
            const { data: { publicUrl } } = supabase.storage
              .from('review-photos')
              .getPublicUrl(filePath);

            // Save photo reference to database
            const { error: photoDbError } = await supabase
              .from('review_photos')
              .insert({
                review_id: reviewId, // Keep as UUID string
                photo_url: publicUrl,
                display_order: i + 1
              });

            if (photoDbError) {
              console.error('❌ Photo database insert error:', photoDbError);
            } else {
              console.log('✅ Photo uploaded successfully:', fileName);
            }
          }
        } catch (photoError) {
          console.error('❌ Photo upload process error:', photoError);
          // Don't fail the entire review submission if photos fail
        }
      }

      // Success!
      setSubmitted(true);
      if (onSuccess) {
        onSuccess(); // Call immediately, parent handles success display
      }

    } catch (err: unknown) {
      console.error('❌ Error submitting review:', err);
      console.error('❌ Error as JSON:', JSON.stringify(err, null, 2));
      console.error('📋 Form data at error:', formData);
      console.error('👤 User at error:', user);
      
      // Extract error message safely
      let errorMessage = 'Failed to submit review. Please try again.';
      
      if (err instanceof Error) {
        console.error('📝 Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        errorMessage = `Submission failed: ${err.message}`;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as Record<string, unknown>;
        console.error('🔍 Error object details:', errorObj);
        
        if (typeof errorObj.message === 'string') {
          errorMessage = `Submission failed: ${errorObj.message}`;
        } else if (typeof errorObj.code === 'string') {
          errorMessage = `Database error (${errorObj.code}). Please try again.`;
        }
      } else {
        console.error('❓ Unknown error type:', typeof err, err);
      }
      
      // Common error scenarios
      if (errorMessage.includes('permission denied') || errorMessage.includes('RLS') || errorMessage.includes('row-level security')) {
        errorMessage = 'Permission denied: You need to be logged in with a valid account to submit reviews. Please try logging out and back in.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Invalid input')) {
        errorMessage = 'Invalid data provided. Please check your review and try again.';
      } else if (errorMessage.includes('violates row-level security')) {
        errorMessage = 'Security policy violation. Please contact support if this continues.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - only show if no onSuccess callback (modal usage)
  if (submitted && !onSuccess) {
    return (
      <div className={`${className} ${isModal ? 'max-w-full' : 'max-w-md'} mx-auto`}>
        <div className={`${isModal ? 'bg-green-50 border-green-200 text-green-800' : 'bg-green-900/20 border-green-500/30 text-white'} border rounded-xl p-6 text-center`}>
          <CheckCircle className={`w-16 h-16 ${isModal ? 'text-green-500' : 'text-green-400'} mx-auto mb-4`} />
          <h3 className={`text-xl font-bold ${isModal ? 'text-green-800' : 'text-white'} mb-2`}>Thank You!</h3>
          <p className={`${isModal ? 'text-green-700' : 'text-green-100'} mb-4`}>
            Your review has been submitted successfully. It will be published after moderation.
          </p>
          <p className={`${isModal ? 'text-green-600' : 'text-green-200'} text-sm`}>
            We appreciate your feedback and hope to see you again at Kampo Ibayo!
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className={`${className} ${isModal ? 'max-w-full' : 'max-w-md'} mx-auto`}>
        <div className={`${isModal ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-blue-900/20 border-blue-500/30 text-white'} border rounded-xl p-6 text-center`}>
          <User className={`w-16 h-16 ${isModal ? 'text-blue-500' : 'text-blue-400'} mx-auto mb-4`} />
          <h3 className={`text-xl font-bold ${isModal ? 'text-blue-800' : 'text-white'} mb-2`}>Please Log In</h3>
          <p className={`${isModal ? 'text-blue-700' : 'text-blue-100'} mb-4`}>
            You need to be logged in to submit a review.
          </p>
          <a
            href="/auth"
            className={`inline-flex items-center px-4 py-2 ${isModal ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-lg transition-colors`}
          >
            <User className="w-4 h-4 mr-2" />
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} ${isModal ? 'max-w-full' : 'max-w-full'} mx-auto`}>
      <div className={`${isModal ? 'bg-transparent border-0 shadow-none p-0' : 'bg-transparent border-0 shadow-none p-0'} rounded-xl`}>
        {/* Header - only show in modal mode */}
        {isModal && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Share Your Experience
            </h2>
            <p className="text-gray-400">
              Help future guests by sharing your honest review of Kampo Ibayo
            </p>
          </div>
        )}

        {/* Review Guidelines */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
          <h4 className="text-yellow-200 font-medium mb-3 flex items-center gap-2">
            📝 Review Guidelines
          </h4>
          <ul className="text-yellow-100 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Be honest and specific about your experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Focus on facilities, service, and cleanliness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Keep language respectful and family-friendly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>Avoid personal information or contact details</span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {/* Rating - only show if no category ratings provided */}
          {!categoryRatings && (
            <div className="space-y-3">
              <label className="block text-white font-semibold">
                Overall Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= formData.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-400 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-white font-medium">
                  {formData.rating > 0 && (
                    <>
                      {formData.rating}/5 {
                        formData.rating === 5 ? '- Excellent!' :
                        formData.rating === 4 ? '- Great!' :
                        formData.rating === 3 ? '- Good' :
                        formData.rating === 2 ? '- Fair' : '- Needs Improvement'
                      }
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Review Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-white font-semibold">
                Your Review *
              </label>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                📝 {showTemplates ? 'Hide' : 'Show'} Templates
              </button>
            </div>
            
            {/* Quick Review Templates - Always available */}
            {showTemplates && (
              <div className="space-y-2 mb-4">
                <p className="text-gray-400 text-sm">Choose a template to get started:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('reviewText', "Great stay! The rooms were clean, staff was friendly, and the facilities were excellent. The pool area was particularly enjoyable. Would definitely recommend to families and couples alike!")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border border-gray-600"
                  >
                    <div className="text-green-400 text-sm font-medium mb-1">👍 Positive Experience</div>
                    <div className="text-gray-300 text-xs">Clean, friendly, excellent facilities</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('reviewText', "Perfect for our family vacation! The kids loved the pool, and we appreciated the clean facilities and helpful staff. Great location and value for money. Will be back!")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border border-gray-600"
                  >
                    <div className="text-blue-400 text-sm font-medium mb-1">👨‍👩‍👧‍👦 Family-Friendly</div>
                    <div className="text-gray-300 text-xs">Kids enjoyed, good value</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('reviewText', "Wonderful romantic getaway! Beautiful, peaceful setting with excellent amenities. The staff was attentive and the rooms were spotless. Highly recommend for couples!")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border border-gray-600"
                  >
                    <div className="text-pink-400 text-sm font-medium mb-1">💕 Romantic Getaway</div>
                    <div className="text-gray-300 text-xs">Peaceful, spotless, for couples</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('reviewText', "")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border border-gray-600"
                  >
                    <div className="text-gray-400 text-sm font-medium mb-1">✍️ Start Fresh</div>
                    <div className="text-gray-300 text-xs">Clear and write your own</div>
                  </button>
                </div>
              </div>
            )}
            
            <div className="relative">
              <MessageSquare className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.reviewText}
                onChange={(e) => handleInputChange('reviewText', e.target.value)}
                placeholder="Tell us about your experience at Kampo Ibayo..."
                rows={5}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                maxLength={1000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {formData.reviewText.length}/1000
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <PhotoUpload
            onPhotosChange={(selectedPhotos) => {
              setPhotos(selectedPhotos);
              console.log('Photos selected:', selectedPhotos.length);
            }}
            maxPhotos={3}
            className="space-y-3"
          />

          {/* Guest Information */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-3">
              <label className="block text-white font-semibold">
                Display Name *
              </label>
              <div className="relative">
                <User className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) => handleInputChange('guestName', e.target.value)}
                  placeholder="How should we display your name?"
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  maxLength={100}
                />
              </div>
              <p className="text-gray-400 text-xs">
                This is how your name will appear on the review
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="block text-white font-semibold">
              Your Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.guestLocation}
                onChange={(e) => handleInputChange('guestLocation', e.target.value)}
                placeholder="e.g., Manila, Philippines"
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                maxLength={100}
              />
            </div>
          </div>

          {/* Booking ID (if provided) */}
          {bookingId && (
            <div className="bg-gray-700/50 rounded-lg p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Verified Booking</p>
                <p className="text-gray-400 text-sm">Booking ID: #{bookingId}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <p className="text-gray-400 text-sm text-center">
            Your review will be moderated before being published. 
            We only publish honest and constructive feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmissionForm;