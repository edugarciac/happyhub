import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface Props {
  inviteCode: string;
  eventTitle: string;
}

export default function InviteShareCard({ inviteCode, eventTitle }: Props) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/eventos/unirse/${inviteCode}`
      : `/eventos/unirse/${inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Te invito a unirte a "${eventTitle}" en HappyHub! Haz clic aquí para unirte: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-purple-600" />
        <span className="font-semibold text-purple-800 text-sm">Invita a participantes</span>
      </div>

      <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-xs text-gray-500 truncate flex-1">{inviteUrl}</span>
        <button
          onClick={handleCopy}
          className="text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0"
          title="Copiar enlace"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <button
        onClick={handleWhatsApp}
        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
      >
        <span>Compartir por WhatsApp</span>
      </button>
    </div>
  );
}
