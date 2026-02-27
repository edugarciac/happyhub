import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { Star, MessageCircle } from 'lucide-react';

interface ReviewStats {
  average: number | null;
  count: number;
}

export default function ReviewsSummary() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reviews/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats || stats.count === 0) {
    return null; // Don't show if no reviews
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-ocean-50 rounded-2xl p-8 shadow-lg border border-primary-100">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-md">
          <Star className="w-8 h-8 text-yellow-500 fill-current" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Lo que dicen nuestros clientes
        </h3>

        {/* Rating Display */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-5xl font-bold text-primary-600">
            {stats.average?.toFixed(1)}
          </div>
          <div className="text-left">
            <StarRating rating={stats.average || 0} readonly size="lg" showHalfStars />
            <p className="text-sm text-gray-600 mt-1">
              Basado en {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>
        </div>

        {/* Reviews Count Badge */}
        <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
          <MessageCircle className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-gray-900">
            {stats.count} {stats.count === 1 ? 'cliente satisfecho' : 'clientes satisfechos'}
          </span>
        </div>

        {/* CTA to see reviews */}
        <a
          href="/servicios#reviews"
          className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
        >
          Ver todas las reseñas →
        </a>
      </div>
    </div>
  );
}
