import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
}

export default function ImageUpload({ value, onChange, folder }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Formato no permitido (JPG, PNG, WebP, GIF o AVIF)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return; }

    setUploading(true);
    setError('');

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await upload(`${folder}/${safeName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: file.type,
      });
      onChange(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <Image src={value} alt="Preview" width={200} height={120} className="rounded-lg object-cover border border-gray-200" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      )}
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFile} className="hidden" />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
