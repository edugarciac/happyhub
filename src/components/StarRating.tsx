import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showHalfStars?: boolean;
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showHalfStars = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(null);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.min(Math.max((displayRating - index) * 100, 0), 100);

    // For interactive mode or full stars, just use filled or empty
    if (!showHalfStars || !readonly) {
      const isFilled = starValue <= Math.round(displayRating);
      return (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          className={`${sizeClasses[size]} ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } transition-transform ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
          aria-label={`${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
        >
          <Star className="w-full h-full" fill={isFilled ? 'currentColor' : 'none'} />
        </button>
      );
    }

    // For read-only with half-stars (displaying decimal ratings)
    return (
      <div key={index} className="relative inline-block">
        <Star
          className={`${sizeClasses[size]} text-gray-300`}
          fill="none"
        />
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fillPercentage}%` }}
        >
          <Star
            className={`${sizeClasses[size]} text-yellow-400`}
            fill="currentColor"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
    </div>
  );
}
