// src/components/events/SpotifyPlaylistTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Music, Check, X, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string | null;
  spotify_track_id: string | null;
  spotify_track_uri: string | null;
  suggested_by_participant_id: number | null;
  suggested_by_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface SpotifyStatus {
  connected: boolean;
  playlistUrl: string | null;
}

interface SpotifyTrack {
  id: string;
  uri: string;
  title: string;
  artist: string;
  albumImage: string | null;
}

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
}

export default function SpotifyPlaylistTab({ eventId, isOrganizer, currentParticipantId }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [spotify, setSpotify] = useState<SpotifyStatus>({ connected: false, playlistUrl: null });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSongs = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs`);
    if (res.ok) {
      const data = await res.json();
      setSongs(data.songs);
      setSpotify(data.spotify);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/entertainment/spotify/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tracks);
          setShowDropdown(true);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelectTrack = async (track: SpotifyTrack) => {
    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: track.title,
        artist: track.artist,
        spotifyTrackId: track.id,
        spotifyTrackUri: track.uri,
      }),
    });
    if (res.ok) {
      toast.success('Canción añadida');
      fetchSongs();
    } else {
      toast.error('Error añadiendo canción');
    }
  };

  const handleStatus = async (songId: number, status: 'approved' | 'rejected') => {
    setActionId(songId);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs/${songId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActionId(null);
    if (res.ok) {
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, status } : s));
    } else {
      toast.error('Error actualizando canción');
    }
  };

  const handleDelete = async (songId: number) => {
    setActionId(songId);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs/${songId}`, {
      method: 'DELETE',
    });
    setActionId(null);
    if (res.ok) {
      setSongs(prev => prev.filter(s => s.id !== songId));
      toast.success('Canción eliminada');
    } else {
      toast.error('Error eliminando canción');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/spotify/sync`, {
      method: 'POST',
    });
    const data = await res.json();
    setSyncing(false);
    if (res.ok) {
      toast.success(`Playlist sincronizada (${data.tracksAdded} canciones)`);
      fetchSongs();
    } else {
      toast.error(data.error || 'Error sincronizando');
    }
  };

  const approved = songs.filter(s => s.status === 'approved');
  const pending = songs.filter(s => s.status === 'pending');
  const rejected = songs.filter(s => s.status === 'rejected');

  if (loading) return <div className="p-6 text-gray-400 text-center">Cargando canciones...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Banner conectar Spotify */}
      {isOrganizer && !spotify.connected && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-sm text-green-800">
            <strong>🎧 Conecta Spotify</strong> para sincronizar la playlist con tu cuenta
          </span>
          <a
            href={`/api/events/collaborative/${eventId}/entertainment/spotify/connect`}
            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700"
          >
            Conectar Spotify
          </a>
        </div>
      )}

      {/* Búsqueda de canciones */}
      <div className="relative">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm pr-8"
          placeholder="Buscar canción en Spotify..."
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
            {searchResults.map(track => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                {track.albumImage && (
                  <img src={track.albumImage} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{track.title}</div>
                  <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de canciones */}
      {songs.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">Sin canciones todavía. ¡Busca y añade la primera!</p>
      ) : (
        <div className="space-y-3">
          {approved.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aprobadas ({approved.length})
              </div>
              {approved.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pendientes de aprobación ({pending.length})
              </div>
              {pending.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
          {isOrganizer && rejected.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rechazadas ({rejected.length})
              </div>
              {rejected.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId}
                  onStatus={handleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync y enlace playlist */}
      {isOrganizer && spotify.connected && (
        <div className="flex items-center justify-between pt-2 border-t gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sync a Spotify'}
          </button>
          {spotify.playlistUrl && (
            <a
              href={spotify.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-green-700 hover:underline"
            >
              Ver playlist <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SongRow({ song, isOrganizer, currentParticipantId, actionId, onStatus, onDelete }: {
  song: Song;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  actionId: number | null;
  onStatus: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (id: number) => void;
}) {
  const busy = actionId === song.id;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border mb-1 ${
      song.status === 'approved' ? 'bg-green-50 border-green-100' :
      song.status === 'rejected' ? 'bg-red-50 border-red-100 opacity-60' :
      'bg-white border-gray-100'
    }`}>
      <Music className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{song.title}</div>
        <div className="text-xs text-gray-500 truncate">
          {song.artist}{song.suggested_by_name ? ` · ${song.suggested_by_name}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {song.status === 'pending' && isOrganizer && (
          <>
            <button
              onClick={() => onStatus(song.id, 'approved')}
              disabled={busy}
              className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded"
              title="Aprobar"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onStatus(song.id, 'rejected')}
              disabled={busy}
              className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded"
              title="Rechazar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {song.status === 'approved' && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Aprobada</span>
        )}
        {song.status === 'rejected' && isOrganizer && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Rechazada</span>
        )}
        {(isOrganizer || song.suggested_by_participant_id === currentParticipantId) && (
          <button
            onClick={() => onDelete(song.id)}
            disabled={busy}
            className="text-gray-300 hover:text-red-500 p-1"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
