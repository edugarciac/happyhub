import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function ComingSoon() {
  const router = useRouter();

  const handleSecretClick = () => {
    router.push('/preview');
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

        {/* Secret clickable area on orange dot (top-right of yellow emoji) */}
        <button
          onClick={handleSecretClick}
          className="absolute cursor-pointer opacity-0 hover:opacity-10 hover:bg-white/20 transition-opacity duration-300 rounded-full"
          style={{
            top: '28%',
            left: '54%',
            width: '3%',
            height: '5%',
            minWidth: '30px',
            minHeight: '30px',
          }}
          aria-label="Secret access"
        />
      </div>
    </>
  );
}
