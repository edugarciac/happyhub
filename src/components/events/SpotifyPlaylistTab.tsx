// src/components/events/SpotifyPlaylistTab.tsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Music, Check, X, Trash2, RefreshCw, ExternalLink, PlusCircle } from 'lucide-react';

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

type ConnectionStatus =
  | { status: 'not_connected' }
  | { status: 'needs_playlist_choice' }
  | { status: 'not_active' }
  | { status: 'ready'; playlistUrl: string | null; playlistName: string | null; isNewPlaylist: boolean; displayName: string | null };

interface Playlist {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
}

export default function SpotifyPlaylistTab({ eventId, isOrganizer, currentParticipantId }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  // Formulario añadir canción
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchAll = useCallback(async () => {
    const [songsRes, connRes] = await Promise.all([
      fetch(`/api/events/collaborative/${eventId}/entertainment/songs`),
      fetch(`/api/events/collaborative/${eventId}/entertainment/spotify/connection`),
    ]);
    if (songsRes.ok) setSongs((await songsRes.json()).songs);
    if (connRes.ok) setConnection(await connRes.json());
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), artist: newArtist.trim() || undefined }),
      });
      if (res.ok) {
        toast.success('Canción añadida');
        setNewTitle('');
        setNewArtist('');
        fetchAll();
      } else {
        toast.error('Error añadiendo canción');
      }
    } finally {
      setAdding(false);
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
      fetchAll();
    } else {
      toast.error(data.error || 'Error sincronizando');
    }
  };

  const approved = songs.filter(s => s.status === 'approved');
  const pending = songs.filter(s => s.status === 'pending');
  const rejected = songs.filter(s => s.status === 'rejected');

  if (loading || !connection) return <div className="p-6 text-gray-400 text-center">Cargando música...</div>;

  if (connection.status !== 'ready') {
    return (
      <div className="p-4">
        <ConnectionSetup
          eventId={eventId}
          isOrganizer={isOrganizer}
          connection={connection}
          onConnected={fetchAll}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
        <span className="text-green-800">
          🎧 Playlist: <strong>{connection.playlistName}</strong>
          {connection.displayName && <span className="text-green-600"> · conectado como {connection.displayName}</span>}
        </span>
        {connection.playlistUrl && (
          <a
            href={connection.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-700 hover:underline whitespace-nowrap"
          >
            Ver en Spotify <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Formulario añadir canción */}
      <form onSubmit={handleAddSong} className="flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Título de la canción *"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          required
        />
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Artista (opcional)"
          value={newArtist}
          onChange={e => setNewArtist(e.target.value)}
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" />
          {adding ? 'Añadiendo...' : 'Añadir canción'}
        </button>
      </form>

      {/* Lista de canciones */}
      {songs.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">Sin canciones todavía. ¡Añade la primera!</p>
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

      {/* Sync */}
      {isOrganizer && (
        <div className="flex items-center justify-between pt-2 border-t gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sync a Spotify'}
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectionSetup({ eventId, isOrganizer, connection, onConnected }: {
  eventId: number;
  isOrganizer: boolean;
  connection: ConnectionStatus;
  onConnected: () => void;
}) {
  if (!isOrganizer || connection.status === 'not_active') {
    return (
      <div className="text-center py-10">
        <Music className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          El organizador todavía no ha activado la música colaborativa para este evento.
        </p>
      </div>
    );
  }

  if (connection.status === 'not_connected') {
    return (
      <div className="text-center py-10 max-w-sm mx-auto">
        <Music className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="text-gray-700 font-medium mb-1">Activa la música colaborativa</p>
        <p className="text-gray-500 text-sm mb-4">
          Conecta tu cuenta de Spotify para compartir una playlist en la que tus invitados podrán sugerir canciones.
        </p>
        <a
          href="/api/account/spotify/connect"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Music className="w-4 h-4" />
          Conectar Spotify
        </a>
      </div>
    );
  }

  // needs_playlist_choice
  return <PlaylistChoiceForm eventId={eventId} onConnected={onConnected} />;
}

function PlaylistChoiceForm({ eventId, onConnected }: { eventId: number; onConnected: () => void }) {
  const [mode, setMode] = useState<'new' | 'existing' | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const res = await fetch('/api/account/spotify/playlists');
      if (res.ok) setPlaylists((await res.json()).playlists);
      else toast.error('Error cargando tus playlists de Spotify');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleChooseExisting = () => {
    setMode('existing');
    if (playlists.length === 0) loadPlaylists();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const body = mode === 'new'
        ? { mode: 'new', playlistName: playlistName.trim() }
        : { mode: 'existing', playlistId: selectedPlaylistId };
      const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/spotify/connection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Música activada para el evento');
        onConnected();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error activando la música');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="text-center mb-6">
        <Music className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Elige la playlist para este evento</p>
      </div>

      {!mode && (
        <div className="space-y-2">
          <button
            onClick={() => setMode('new')}
            className="w-full text-left border border-gray-200 hover:border-green-400 rounded-xl p-4 transition-colors"
          >
            <p className="font-medium text-gray-900 text-sm">🆕 Crear una playlist nueva</p>
            <p className="text-xs text-gray-500 mt-0.5">Se creará en tu cuenta de Spotify, nombrada como el evento.</p>
          </button>
          <button
            onClick={handleChooseExisting}
            className="w-full text-left border border-gray-200 hover:border-green-400 rounded-xl p-4 transition-colors"
          >
            <p className="font-medium text-gray-900 text-sm">📂 Usar una playlist existente</p>
            <p className="text-xs text-gray-500 mt-0.5">Elige una de tus playlists ya creadas en Spotify.</p>
          </button>
        </div>
      )}

      {mode === 'new' && (
        <div className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Nombre de la playlist"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => setMode(null)} className="text-sm text-gray-500 px-3 py-2">Atrás</button>
            <button
              onClick={handleSubmit}
              disabled={saving || !playlistName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Creando...' : 'Crear y activar'}
            </button>
          </div>
        </div>
      )}

      {mode === 'existing' && (
        <div className="space-y-3">
          {loadingPlaylists ? (
            <p className="text-center text-sm text-gray-400 py-4">Cargando tus playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No se encontraron playlists en tu cuenta.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {playlists.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 border rounded-lg p-2.5 cursor-pointer transition-colors ${
                    selectedPlaylistId === p.id ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="playlist"
                    value={p.id}
                    checked={selectedPlaylistId === p.id}
                    onChange={() => setSelectedPlaylistId(p.id)}
                    className="flex-shrink-0"
                  />
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.trackCount} canciones</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setMode(null)} className="text-sm text-gray-500 px-3 py-2">Atrás</button>
            <button
              onClick={handleSubmit}
              disabled={saving || !selectedPlaylistId}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Activando...' : 'Usar esta playlist'}
            </button>
          </div>
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
