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

        {/* Secret clickable area on winking eye of emoji */}
        <button
          onClick={handleSecretClick}
          className="absolute cursor-pointer opacity-0 hover:opacity-5 hover:bg-white/10 transition-opacity duration-300 rounded-full"
          style={{
            top: '24.5%',
            left: '50.5%',
            width: '50px',
            height: '50px',
          }}
          aria-label="Secret access"
        />
      </div>
    </>
  );
}
