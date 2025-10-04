'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Tables } from '../../database.types';
import { Star, ChevronLeft, ChevronRight, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

type GuestReview = Tables<'guest_reviews'>;

interface ReviewPhotoSimple {
  id: number;
  photo_url: string;
  caption: string | null;
  display_order: number;
}

interface ReviewWithPhotos extends GuestReview {
  review_photos?: ReviewPhotoSimple[];
}

interface ReviewSystemProps {
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

const ReviewSystem = ({ 
  limit = 6, 
  showPagination = true, 
  className = "" 
}: ReviewSystemProps) => {
  const [reviews, setReviews] = useState<ReviewWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const reviewsPerPage = limit;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  // Fetch reviews from database
  const fetchReviews = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching reviews for page:', page);

      // Calculate offset for pagination
      const offset = (page - 1) * reviewsPerPage;

      // First, let's try a simple query to test basic functionality
      console.log('📊 Testing basic reviews query...');
      const { data: testData, error: testError } = await supabase
        .from('guest_reviews')
        .select('id, guest_name, rating, review_text, approved, created_at')
        .eq('approved', true)
        .limit(3);

      if (testError) {
        console.error('❌ Basic query failed:', testError);
      } else {
        console.log('✅ Basic query successful, found', testData?.length, 'approved reviews');
      }

      // First, try to fetch reviews with photos
      let reviewsData, reviewsError, count;
      
      try {
        console.log('📸 Attempting to fetch reviews with photos...');
        // Try the advanced query with photos first
        const { data, error, count: reviewCount } = await supabase
          .from('guest_reviews')
          .select(`
            *,
            review_photos (
              id,
              photo_url,
              caption,
              display_order
            )
          `, { count: 'exact' })
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + reviewsPerPage - 1);
        
        reviewsData = data;
        reviewsError = error;
        count = reviewCount;
        
        if (error) {
          console.error('❌ Photos query failed:', error);
        } else {
          console.log('✅ Photos query successful, found', data?.length, 'reviews');
        }
      } catch (photoError) {
        console.log('❌ Photos query crashed, falling back to basic query:', photoError);
        
        // Fallback to basic query without photos
        const { data, error, count: reviewCount } = await supabase
          .from('guest_reviews')
          .select('*', { count: 'exact' })
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + reviewsPerPage - 1);
        
        reviewsData = data;
        reviewsError = error;
        count = reviewCount;
        
        console.log('📝 Fallback query result:', { data: data?.length, error });
      }

      if (reviewsError) {
        console.error('Reviews fetch error details:', reviewsError);
        console.error('Error message:', reviewsError.message);
        console.error('Error code:', reviewsError.code);
        throw reviewsError;
      }

      setReviews(reviewsData || []);
      setTotalReviews(count || 0);

      // Calculate average rating from approved reviews only
      const { data: allReviews, error: avgError } = await supabase
        .from('guest_reviews')
        .select('rating')
        .eq('approved', true);

      if (!avgError && allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
        setAverageRating(Math.round(avg * 10) / 10); // Round to 1 decimal place
      }

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [reviewsPerPage]);

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage, fetchReviews]);

  // Handle pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render star rating
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-800 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg animate-pulse"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="border-t border-gray-600 pt-3 sm:pt-4">
                <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Reviews</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => fetchReviews(currentPage)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="flex flex-col items-center gap-4">
          <Star className="w-12 h-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
            <p className="text-gray-400">Be the first to share your experience at Kampo Ibayo!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Reviews Header with Stats */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          {renderStars(averageRating, 'lg')}
          <span className="text-2xl font-bold text-white ml-2">{averageRating}</span>
          <span className="text-gray-400">({totalReviews} reviews)</span>
        </div>
        <p className="text-gray-400 text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
          Read authentic reviews from families and adventurers who experienced Kampo Ibayo
        </p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="group bg-gray-800 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg hover:bg-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Rating and Verification */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {renderStars(review.rating)}
              <div className="flex items-center gap-2">
                {review.approved && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Approved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Text */}
            <p className="text-gray-300 italic text-xs xs:text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 line-clamp-4">
              &ldquo;{review.review_text}&rdquo;
            </p>

            {/* Review Photos */}
            {review.review_photos && review.review_photos.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {review.review_photos
                    .sort((a, b) => a.display_order - b.display_order)
                    .slice(0, 3)
                    .map((photo) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={photo.photo_url}
                          alt={photo.caption || "Review photo"}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100px, (max-width: 1200px) 120px, 150px"
                        />
                      </div>
                    ))}
                </div>
                {review.review_photos.length > 3 && (
                  <p className="text-gray-500 text-xs mt-2">
                    +{review.review_photos.length - 3} more photo{review.review_photos.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Guest Info */}
            <div className="border-t border-gray-600 pt-3 sm:pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-red-400 text-sm xs:text-base">
                    - {review.guest_name}
                  </p>
                  {review.guest_location && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs xs:text-sm mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{review.guest_location}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;
              
              // Show first page, last page, current page, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      isCurrentPage
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="text-gray-500 px-1">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Review Summary */}
      <div className="text-center mt-6 text-sm text-gray-400">
        Showing {reviews.length} of {totalReviews} verified guest reviews
      </div>
    </div>
  );
};

export default ReviewSystem;