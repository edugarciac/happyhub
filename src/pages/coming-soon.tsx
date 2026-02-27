import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function ComingSoon() {
  const router = useRouter();

  const handleSecretClick = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>HappyHub - Coming in 2026</title>
        <meta name="description" content="HappyHub está llegando en 2026. El espacio perfecto para tus celebraciones." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="relative w-screen h-screen overflow-hidden bg-black">
        {/* Full screen image */}
        <Image
          src="/Happyhub-coming2026.jpeg"
          alt="HappyHub Coming in 2026"
          fill
          priority
          className="object-cover"
          quality={100}
        />

        {/* Preview access button */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={handleSecretClick}
            className="btn-primary px-8 py-3 text-lg font-semibold shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            Access to preview website
          </button>
        </div>
      </div>
    </>
  );
}
