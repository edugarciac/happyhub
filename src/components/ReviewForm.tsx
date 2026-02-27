import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema, ReviewFormData } from '../utils/validators';
import StarRating from './StarRating';
import { apiClient } from '../lib/apiClient';

interface ReviewFormProps {
  reservationId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  reservationId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reservation_id: reservationId,
      rating: 0,
      review_text: '',
    },
  });

  const reviewText = watch('review_text') || '';
  const charCount = reviewText.length;

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setValue('rating', newRating, { shouldValidate: true });
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiClient.post('/api/reviews', {
        reservation_id: data.reservation_id,
        rating: data.rating,
        review_text: data.review_text || undefined,
      });

      if (response.data.success) {
        setSubmitSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Error al enviar la reseña. Inténtalo de nuevo.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-green-900 mb-2">
          ¡Gracias por tu valoración!
        </h3>
        <p className="text-green-700 mb-4">
          Tu reseña ha sido enviada y será publicada tras su revisión.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn-outline"
          >
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Valora tu experiencia
        </h3>
        <p className="text-gray-600 mb-4">
          Tu opinión nos ayuda a mejorar y ayuda a otros clientes a decidir.
        </p>
      </div>

      {/* Rating Stars */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Valoración <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={handleRatingChange}
          readonly={false}
          size="lg"
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
        )}
        {rating > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {rating === 5 && '¡Excelente! 🎉'}
            {rating === 4 && 'Muy bien! 👍'}
            {rating === 3 && 'Bien 👌'}
            {rating === 2 && 'Puede mejorar 🤔'}
            {rating === 1 && 'No satisfactorio 😞'}
          </p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="review_text" className="block text-sm font-medium text-gray-700 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          id="review_text"
          {...register('review_text')}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Cuéntanos más sobre tu experiencia..."
        />
        <div className="flex justify-between items-center mt-1">
          {errors.review_text && (
            <p className="text-sm text-red-600">{errors.review_text.message}</p>
          )}
          <p
            className={`text-sm ${
              charCount > 450 ? 'text-orange-600 font-medium' : 'text-gray-500'
            } ml-auto`}
          >
            {charCount}/500 caracteres
          </p>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || submitSuccess || rating === 0}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-outline"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
