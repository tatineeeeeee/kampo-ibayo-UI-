'use client';

import { useState } from 'react';
import { supabase } from '../supabaseClient';

// TEMPORARY TESTING COMPONENT - Remove after testing
export default function ReviewTester() {
  const [results, setResults] = useState<Array<{
    id: string;
    guest_name: string;
    rating: number;
    review_text: string;
    approved: boolean | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const checkRecentReviews = async () => {
    setLoading(true);
    try {
      const { data: reviews, error } = await supabase
        .from('guest_reviews')
        .select('id, guest_name, rating, review_text, approved, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (approved: boolean | null) => {
    if (approved === true) return '✅ AUTO-PUBLISHED';
    if (approved === false) return '⚠️ FLAGGED';
    return '⏳ PENDING (Legacy)';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto m-4">
      <h2 className="text-xl font-bold mb-4">🧪 Review Auto-Approval Testing</h2>
      
      <button 
        onClick={checkRecentReviews}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Check Recent Reviews'}
      </button>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold">Recent Reviews:</h3>
          {results.map(review => (
            <div key={review.id} className="border-l-4 border-gray-300 pl-4 py-2">
              <div className="font-medium text-lg">{getStatusIcon(review.approved)}</div>
              <div className="text-sm text-gray-600">
                <strong>Guest:</strong> {review.guest_name} | 
                <strong> Rating:</strong> {'⭐'.repeat(review.rating)} | 
                <strong> ID:</strong> {review.id}
              </div>
              <div className="mt-1 text-gray-800">
                <strong>Review:</strong> &ldquo;{review.review_text.substring(0, 100)}{review.review_text.length > 100 ? '...' : ''}&rdquo;
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(review.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">Testing Instructions:</h4>
        <ul className="mt-2 text-sm text-yellow-700 space-y-1">
          <li>1. Submit reviews with the test cases above</li>
          <li>2. Click &ldquo;Check Recent Reviews&rdquo; to see their status</li>
          <li>3. ✅ = Published immediately (good!)</li>
          <li>4. ⚠️ = Flagged for admin review (good for problematic content!)</li>
          <li>5. Check admin interface to manage flagged reviews</li>
        </ul>
      </div>
    </div>
  );
}