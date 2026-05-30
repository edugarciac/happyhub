import { useState, useRef } from 'react';

interface ParsedRow {
  name: string;
  email: string | null;
  status: 'ok' | 'no_email' | 'invalid_email';
}

interface ExcelImporterProps {
  eventId: number;
  onImported: (guests: any[]) => void;
}

const STATUS_LABEL: Record<ParsedRow['status'], string> = {
  ok: '✓ ok',
  no_email: 'sin email',
  invalid_email: '⚠ email inválido',
};

const STATUS_COLOR: Record<ParsedRow['status'], string> = {
  ok: 'text-green-600',
  no_email: 'text-amber-600',
  invalid_email: 'text-red-600',
};

export default function ExcelImporter({ eventId, onImported }: ExcelImporterProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setParsing(true);
    setRows([]);

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/events/collaborative/${eventId}/guests/import/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al parsear el archivo'); return; }
      setRows(data.rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validRows = rows.filter((r) => r.status === 'ok' || r.status === 'no_email');

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/guests/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows.map((r) => ({ name: r.name, email: r.email })) }),
      });
      const data = await res.json();
      if (res.ok) {
        onImported(validRows);
        setRows([]);
      } else {
        setError(data.error || 'Error al importar');
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-violet-300 rounded-xl p-6 text-center bg-violet-50 hover:bg-violet-100 cursor-pointer transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="text-3xl mb-2">📊</div>
        <p className="font-semibold text-violet-700 text-sm">
          {parsing ? 'Leyendo archivo...' : 'Arrastra el Excel aquí o haz clic'}
        </p>
        <p className="text-gray-400 text-xs mt-1">Columnas requeridas: <strong>nombre</strong> y <strong>email</strong> · .xlsx o .xls</p>
        <a
          href="/templates/invitados-plantilla.xlsx"
          download
          onClick={(e) => e.stopPropagation()}
          className="text-violet-500 text-xs underline mt-2 inline-block"
        >
          Descargar plantilla de ejemplo
        </a>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-semibold mb-2">
            {rows.length} filas detectadas — {validRows.length} válidas para importar
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left px-3 py-2 font-semibold">#</th>
                  <th className="text-left px-3 py-2 font-semibold">Nombre</th>
                  <th className="text-left px-3 py-2 font-semibold">Email</th>
                  <th className="text-left px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-800">{row.name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{row.email || '—'}</td>
                    <td className={`px-3 py-1.5 font-semibold ${STATUS_COLOR[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setRows([])}
              className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!validRows.length || importing}
              className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
            >
              {importing ? 'Importando...' : `Importar ${validRows.length} válidos →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
