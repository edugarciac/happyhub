import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Photo {
  src: string;
  alt: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

export default function PhotoGallery({ photos, title = 'Nuestro Espacio' }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  if (photos.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">{title}</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Descubre nuestro espacio de celebraciones, diseñado para crear momentos inolvidables
        </p>

        {/* Main carousel */}
        <div className="relative max-w-4xl mx-auto mb-8">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={photos[currentIndex].src}
              alt={photos[currentIndex].alt}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openLightbox(currentIndex)}
            />
          </div>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>

          {/* Caption */}
          {photos[currentIndex].caption && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-3 rounded-lg text-center">
              {photos[currentIndex].caption}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex justify-center gap-3 flex-wrap">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-20 h-20 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-4 ring-primary-500 scale-105'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-gray-500 text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>

          <img
            src={photos[currentIndex].src}
            alt={photos[currentIndex].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          {photos[currentIndex].caption && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-6 py-3 rounded-lg text-center max-w-lg">
              {photos[currentIndex].caption}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
