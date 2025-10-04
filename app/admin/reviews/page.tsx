'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/supabaseClient';
import { Star, Check, X, Eye, Calendar, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

import { Tables } from '@/database.types';

type Review = Tables<'guest_reviews'>;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [updating, setUpdating] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const { data, error } = await supabase
        .from('guest_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    let filtered = reviews;
    if (filter === 'approved') {
      filtered = reviews.filter(r => r.approved === true);
    } else if (filter === 'pending') {
      filtered = reviews.filter(r => r.approved === null);
    }
    setFilteredReviews(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [reviews, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredReviews.length);
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  const updateReviewStatus = async (reviewId: number, approved: boolean) => {
    try {
      setUpdating(reviewId);
      const { error } = await supabase
        .from('guest_reviews')
        .update({ approved })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, approved } : review
      ));
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Failed to update review status');
    } finally {
      setUpdating(null);
    }
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderCategoryRatings = (review: Review) => {
    const categories = [
      { name: 'Cleanliness', rating: review.cleanliness_rating },
      { name: 'Service', rating: review.service_rating },
      { name: 'Location', rating: review.location_rating },
      { name: 'Value', rating: review.value_rating },
      { name: 'Amenities', rating: review.amenities_rating },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        {categories.map((category) => (
          category.rating && (
            <div key={category.name} className="text-sm">
              <div className="text-gray-600 text-xs mb-1">{category.name}</div>
              {renderStars(category.rating, 'w-3 h-3')}
              <div className="text-xs text-gray-500 mt-1">{category.rating}/5</div>
            </div>
          )
        ))}
      </div>
    );
  };

  const filteredReviewsCount = {
    all: reviews.length,
    approved: reviews.filter(r => r.approved).length,
    pending: reviews.filter(r => !r.approved).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            All Reviews ({filteredReviews.length})
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchReviews(true)}
              disabled={refreshing}
              className={`px-3 py-1 text-white rounded-md text-sm transition ${
                refreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Reviews', count: filteredReviewsCount.all },
                { key: 'pending', label: 'Pending Approval', count: filteredReviewsCount.pending },
                { key: 'approved', label: 'Approved', count: filteredReviewsCount.approved },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'approved' | 'pending')}
                  className={`${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  {tab.label}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filter === tab.key ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Pagination Info */}
        {filteredReviews.length > 0 && (
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
            <div>
              Showing {startIndex + 1} to {endIndex} of {filteredReviews.length} reviews
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' ? 'No pending reviews to approve' : 'No reviews have been submitted yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {review.guest_name}
                            </h4>
                            {review.guest_location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {review.guest_location}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-lg font-semibold text-gray-900">{review.rating}/5</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Stay Dates */}
                      {review.stay_dates && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Stay: {review.stay_dates}
                          </span>
                        </div>
                      )}

                      {/* Review Text */}
                      <div className="mb-3">
                        <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                      </div>

                      {/* Category Ratings */}
                      {(review.cleanliness_rating || review.service_rating || review.location_rating || review.value_rating || review.amenities_rating) && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Category Ratings</h5>
                          {renderCategoryRatings(review)}
                        </div>
                      )}

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.approved 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.approved ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Approved
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Pending Review
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!review.approved && (
                            <button
                              onClick={() => updateReviewStatus(review.id, true)}
                              disabled={updating === review.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </button>
                          )}
                          
                          {review.approved && (
                            <button
                              onClick={() => updateReviewStatus(review.id, false)}
                              disabled={updating === review.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Unapprove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{endIndex}</span> of{' '}
                      <span className="font-medium">{filteredReviews.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}