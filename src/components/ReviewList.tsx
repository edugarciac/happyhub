import { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import { Loader2 } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  review_text: string | null;
  customer_name: string;
  created_at: string;
}

interface ReviewListProps {
  limit?: number;
}

export default function ReviewList({ limit = 10 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (newOffset: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviews?limit=${limit}&offset=${newOffset}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar las reseñas');
      }

      const data = await response.json();

      if (data.success && data.reviews) {
        if (newOffset === 0) {
          setReviews(data.reviews);
        } else {
          setReviews((prev) => [...prev, ...data.reviews]);
        }

        // Check if there are more reviews
        setHasMore(data.reviews.length === limit);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0);
  }, []);

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchReviews(newOffset);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sé el primero en valorar
        </h3>
        <p className="text-gray-600">
          Aún no hay reseñas. ¡Comparte tu experiencia con nosotros!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="btn-outline"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </span>
            ) : (
              'Cargar más reseñas'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
