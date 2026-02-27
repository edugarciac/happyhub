import StarRating from './StarRating';
import { formatDate } from '../utils/formatters';

interface ReviewCardProps {
  review: {
    id: number;
    rating: number;
    review_text: string | null;
    customer_name: string;
    created_at: string | Date;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const reviewDate = typeof review.created_at === 'string'
    ? new Date(review.created_at)
    : review.created_at;

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{review.customer_name}</h4>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(reviewDate)}
        </span>
      </div>

      {review.review_text && (
        <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
      )}
    </div>
  );
}
