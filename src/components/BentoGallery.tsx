import Image from 'next/image';

interface Photo {
  src: string;
  alt: string;
  caption: string;
}

interface BentoGalleryProps {
  photos: Photo[];
}

export default function BentoGallery({ photos }: BentoGalleryProps) {
  const [main, ...rest] = photos;

  return (
    <section className="py-24 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-6 border border-primary-200">
            Nuestro espacio
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
            Un espacio hecho para celebrar
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 h-[480px] md:h-[560px]">
          {/* Main large photo */}
          {main && (
            <div className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden group cursor-pointer">
              <Image
                src={main.src}
                alt={main.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-white font-semibold text-sm">{main.caption}</p>
              </div>
            </div>
          )}

          {/* Smaller photos */}
          {rest.slice(0, 4).map((photo) => (
            <div key={photo.src} className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white font-medium text-xs leading-snug">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
