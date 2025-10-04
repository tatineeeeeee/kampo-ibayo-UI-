'use client';

import { useState } from 'react';
import { Star, Sparkles, Users, MapPin, DollarSign, Wifi } from 'lucide-react';

interface CategoryRatingsProps {
  ratings: {
    overall: number;
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  onRatingChange: (category: string, rating: number) => void;
  className?: string;
}

const CategoryRatings = ({ ratings, onRatingChange, className = "" }: CategoryRatingsProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  // Smart prompts based on overall rating
  const getSmartPrompt = () => {
    const overall = ratings.overall;
    if (overall === 5) {
      return {
        text: "Wonderful! What made your stay exceptional?",
        color: "text-green-400",
        bgColor: "bg-green-900/20 border-green-600/30"
      };
    } else if (overall === 4) {
      return {
        text: "Great! What did you enjoy most about your stay?",
        color: "text-blue-400",
        bgColor: "bg-blue-900/20 border-blue-600/30"
      };
    } else if (overall === 3) {
      return {
        text: "Good experience! What aspects stood out to you?",
        color: "text-yellow-400",
        bgColor: "bg-yellow-900/20 border-yellow-600/30"
      };
    } else if (overall >= 1) {
      return {
        text: "Thank you for your feedback. How could we improve?",
        color: "text-orange-400",
        bgColor: "bg-orange-900/20 border-orange-600/30"
      };
    }
    return null;
  };

  const smartPrompt = getSmartPrompt();

  const categories = [
    {
      key: 'overall',
      label: 'Overall Experience',
      icon: Star,
      description: 'Your overall satisfaction with your stay',
      color: 'text-yellow-400'
    },
    {
      key: 'cleanliness',
      label: 'Cleanliness',
      icon: Sparkles,
      description: 'How clean and well-maintained everything was',
      color: 'text-blue-400'
    },
    {
      key: 'service',
      label: 'Staff & Service',
      icon: Users,
      description: 'Quality of customer service and staff interactions',
      color: 'text-green-400'
    },
    {
      key: 'location',
      label: 'Location',
      icon: MapPin,
      description: 'Convenience and attractiveness of the location',
      color: 'text-purple-400'
    },
    {
      key: 'value',
      label: 'Value for Money',
      icon: DollarSign,
      description: 'How well the experience matched what you paid',
      color: 'text-orange-400'
    },
    {
      key: 'amenities',
      label: 'Amenities',
      icon: Wifi,
      description: 'Quality and availability of facilities and services',
      color: 'text-pink-400'
    }
  ];

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 5: return 'Excellent';
      case 4: return 'Great';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'Not rated';
    }
  };

  const handleStarClick = (category: string, rating: number) => {
    onRatingChange(category, rating);
  };

  const handleStarHover = (category: string, rating: number) => {
    setHoveredCategory(category);
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredCategory(null);
    setHoveredRating(0);
  };

  const getDisplayRating = (category: string, starIndex: number) => {
    if (hoveredCategory === category && hoveredRating > 0) {
      return starIndex <= hoveredRating;
    }
    return starIndex <= ratings[category as keyof typeof ratings];
  };

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Rate Your Experience
        </h2>
        <p className="text-gray-400">
          Help future guests by rating different aspects of your stay
        </p>
      </div>

      {/* Smart Prompt */}
      {smartPrompt && (
        <div className={`${smartPrompt.bgColor} border rounded-lg p-4 mb-6 text-center`}>
          <p className={`${smartPrompt.color} font-medium text-sm`}>
            💭 {smartPrompt.text}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const currentRating = ratings[category.key as keyof typeof ratings];
          const isHovered = hoveredCategory === category.key;
          
          return (
            <div
              key={category.key}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`${category.color} bg-gray-700/50 rounded-lg p-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {category.label}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {category.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {currentRating > 0 ? `${currentRating}/5` : '—'}
                  </div>
                  <div className={`text-sm ${
                    currentRating > 0 ? category.color : 'text-gray-500'
                  }`}>
                    {getRatingText(currentRating)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 sm:gap-2">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isActive = getDisplayRating(category.key, starIndex);
                  
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => handleStarClick(category.key, starIndex)}
                      onMouseEnter={() => handleStarHover(category.key, starIndex)}
                      onMouseLeave={handleStarLeave}
                      className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-2 sm:p-1 min-h-[48px] sm:min-h-0 flex items-center justify-center"
                    >
                      <Star
                        className={`w-9 h-9 sm:w-8 sm:h-8 transition-colors ${
                          isActive
                            ? `${category.color} fill-current`
                            : 'text-gray-500 hover:text-gray-400'
                        } ${
                          isHovered && starIndex <= hoveredRating
                            ? 'scale-110'
                            : ''
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {currentRating > 0 && (
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full">
                    <Star className={`w-3 h-3 ${category.color} fill-current`} />
                    <span className="text-white text-sm font-medium">
                      {currentRating} star{currentRating !== 1 ? 's' : ''} - {getRatingText(currentRating)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-5 h-5 text-blue-400" />
          <h4 className="text-white font-semibold">Rating Guidelines</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm">
          <div className="text-center">
            <div className="text-red-400 font-medium">1 Star - Poor</div>
            <div className="text-gray-400">Below expectations</div>
          </div>
          <div className="text-center">
            <div className="text-orange-400 font-medium">2 Stars - Fair</div>
            <div className="text-gray-400">Some issues</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-medium">3 Stars - Good</div>
            <div className="text-gray-400">Met expectations</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-medium">4 Stars - Great</div>
            <div className="text-gray-400">Above expectations</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 font-medium">5 Stars - Excellent</div>
            <div className="text-gray-400">Exceptional</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryRatings;