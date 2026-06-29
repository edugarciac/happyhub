// src/components/events/PhotoAlbumSection.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Trash2, Camera } from 'lucide-react';

interface Photo {
  id: number;
  url: string;
  caption: string | null;
  uploaded_by_participant_id: number | null;
  created_at: string;
}

interface PhotoAlbumSectionProps {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
}

export default function PhotoAlbumSection({ eventId, isOrganizer, currentParticipantId }: PhotoAlbumSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/photos`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);

    for (const file of files) {
      if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); continue; }
      if (file.size > 5 * 1024 * 1024) { setError('Cada imagen debe ser menor a 5MB'); continue; }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: { name: file.name, data: base64, type: file.type }, folder: 'event-photos' }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          setError(uploadData.error || 'Error al subir imagen');
          continue;
        }

        const photoRes = await fetch(`/api/events/collaborative/${eventId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: uploadData.url }),
        });
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          setPhotos((prev) => [photoData.photo, ...prev]);
        }
      } catch {
        setError('Error de conexión al subir');
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/photos/${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setLightboxPhoto(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-violet-500" /> Álbum de fotos
          <span className="text-gray-400 font-normal ml-1 text-xs">
            ({photos.length} foto{photos.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 font-semibold flex items-center gap-1 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Subiendo...' : 'Subir fotos'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {photos.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-violet-300 hover:text-violet-400 transition-colors"
        >
          <Camera className="w-8 h-8 mb-2" />
          <p className="text-sm font-medium">Sin fotos aún. Sube la primera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => {
            const canDelete = isOrganizer || photo.uploaded_by_participant_id === currentParticipantId;
            return (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                onClick={() => setLightboxPhoto(photo)}
              >
                <Image src={photo.url} alt={photo.caption || 'Foto del evento'} fill className="object-cover" />
                {canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image src={lightboxPhoto.url} alt={lightboxPhoto.caption || 'Foto del evento'} fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
