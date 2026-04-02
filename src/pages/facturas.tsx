import { useState, useRef, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface InvoiceResult {
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  nifCif: string;
  concepto: string;
  baseImponible: string;
  porcentajeIva: string;
  cuotaIva: string;
  total: string;
  formaPago: string;
  categoria: string;
  notas: string;
  driveLink: string;
}

interface HistoryRow {
  numeroFactura: string;
  fecha: string;
  proveedor: string;
  concepto: string;
  total: number;
  categoria: string;
  driveLink: string;
  fechaRegistro: string;
}

type UploadState = 'idle' | 'reading' | 'uploading' | 'success' | 'error';

const FIELD_LABELS: Record<keyof Omit<InvoiceResult, 'driveLink'>, string> = {
  numeroFactura: 'Nº Factura',
  fecha: 'Fecha',
  proveedor: 'Proveedor / Emisor',
  nifCif: 'NIF / CIF',
  concepto: 'Concepto',
  baseImponible: 'Base Imponible (€)',
  porcentajeIva: '% IVA',
  cuotaIva: 'Cuota IVA (€)',
  total: 'Total (€)',
  formaPago: 'Forma de Pago',
  categoria: 'Categoría',
  notas: 'Notas',
};

export default function Facturas() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/facturas/list');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.invoices || []);
        setHistoryTotal(data.total || 0);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingHistory(false);
    }
  }

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setError('');
    setResult(null);
    setUploadState('reading');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Tipo de archivo no soportado. Usa PDF, JPG, PNG o WebP.`);
      setUploadState('error');
      return;
    }

    if (file.size > 18 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 18MB.');
      setUploadState('error');
      return;
    }

    // Read file as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // strip data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setUploadState('uploading');

    try {
      const res = await fetch('/api/facturas/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, data: base64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la factura');
      }

      setResult(data.invoice);
      setUploadState('success');
      fetchHistory(); // refresh list
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      setUploadState('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const reset = () => {
    setUploadState('idle');
    setFileName('');
    setResult(null);
    setError('');
  };

  const isProcessing = uploadState === 'reading' || uploadState === 'uploading';

  return (
    <>
      <Head>
        <title>Gestión de Facturas - HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">HappyHub</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-medium">Facturas</span>
            </div>
            <a
              href={`https://drive.google.com/drive/folders/${process.env.NEXT_PUBLIC_DRIVE_FACTURAS_FOLDER_ID || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
              Ver en Google Drive
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
            <p className="text-gray-500 mt-1">
              Sube facturas y recibos para extraer datos automáticamente y registrarlos en Google Drive.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Panel */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Subir Factura</h2>

                {uploadState === 'idle' || uploadState === 'error' ? (
                  <>
                    {/* Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                        dragOver
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center">
                          <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Arrastra una factura aquí
                          </p>
                          <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                        </div>
                        <p className="text-xs text-gray-400">PDF, JPG, PNG, WebP — máx. 18MB</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                        <button onClick={reset} className="mt-2 text-xs text-red-600 underline">
                          Intentar de nuevo
                        </button>
                      </div>
                    )}
                  </>
                ) : isProcessing ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                    <p className="text-sm font-medium text-gray-700">
                      {uploadState === 'reading' ? 'Leyendo archivo...' : 'Extrayendo datos y subiendo a Drive...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{fileName}</p>
                  </div>
                ) : uploadState === 'success' && result ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-sm">Factura procesada y guardada</span>
                    </div>

                    {/* Extracted data */}
                    <div className="space-y-2">
                      {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map(key => (
                        result[key] ? (
                          <div key={key} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                            <span className="text-gray-500 font-medium w-36 shrink-0">{FIELD_LABELS[key]}</span>
                            <span className="text-gray-800 text-right">{result[key]}</span>
                          </div>
                        ) : null
                      ))}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <a
                        href={result.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 px-3 bg-ocean-50 text-ocean-700 border border-ocean-200 rounded-lg text-sm font-medium hover:bg-ocean-100 transition-colors"
                      >
                        Ver en Drive
                      </a>
                      <button
                        onClick={reset}
                        className="flex-1 py-2 px-3 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Subir otra factura
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Instructions */}
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Cómo funciona</h3>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Sube una factura en PDF o imagen</li>
                  <li>Claude AI extrae los datos automáticamente</li>
                  <li>El archivo se guarda en Drive organizado por mes y año</li>
                  <li>Los datos se registran en <strong>Registro_Facturas.xlsx</strong></li>
                </ol>
              </div>
            </div>

            {/* History Panel */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Facturas registradas</h2>
                  {historyTotal > 0 && (
                    <span className="text-sm font-semibold text-primary-700">
                      Total: {historyTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </span>
                  )}
                </div>

                {loadingHistory ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-400 text-sm">No hay facturas registradas aún.</p>
                    <p className="text-gray-300 text-xs mt-1">Las facturas subidas aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {history.map((row, i) => (
                      <div key={i} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-mono">{row.numeroFactura || '—'}</span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{row.fecha}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{row.proveedor}</p>
                            <p className="text-xs text-gray-500 truncate">{row.concepto}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900">
                              {Number(row.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            </p>
                            <span className="inline-block mt-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                              {row.categoria}
                            </span>
                          </div>
                        </div>
                        {row.driveLink && (
                          <a
                            href={row.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ocean-600 hover:underline mt-1 inline-block"
                          >
                            Ver archivo
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
