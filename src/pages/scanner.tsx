import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { ReceiptData } from './api/scan-receipt';

type Step = 'capture' | 'scanning' | 'validate' | 'sending' | 'done';
type Destination = 'drive' | 'n8n';

interface ScanResult {
  data: ReceiptData;
  image: string;
  mimeType: string;
  fileName: string;
}

const emptyReceipt = (): ReceiptData => ({
  vendor: '',
  date: '',
  invoiceNumber: '',
  items: [],
  subtotal: '',
  tax: '',
  taxRate: '',
  total: '',
  paymentMethod: '',
  notes: '',
});

export default function ScannerPage() {
  const [step, setStep] = useState<Step>('capture');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [editedData, setEditedData] = useState<ReceiptData>(emptyReceipt());
  const [destination, setDestination] = useState<Destination>('n8n');
  const [error, setError] = useState<string>('');
  const [doneResult, setDoneResult] = useState<{ link?: string; destination: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError('');
    const mimeType = file.type || 'image/jpeg';
    const fileName = file.name || `ticket_${Date.now()}.jpg`;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];

      setStep('scanning');

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Error al escanear la imagen');
        setStep('capture');
        return;
      }

      setScanResult({ data: json.data, image: base64, mimeType, fileName });
      setEditedData(json.data);
      setStep('validate');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const updateField = (field: keyof ReceiptData, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setEditedData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setEditedData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: '', unitPrice: '', total: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setEditedData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSend = async () => {
    if (!scanResult) return;
    setStep('sending');
    setError('');

    const res = await fetch('/api/send-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        receiptData: editedData,
        image: scanResult.image,
        mimeType: scanResult.mimeType,
        fileName: scanResult.fileName,
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.error || 'Error al enviar');
      setStep('validate');
      return;
    }

    setDoneResult({ link: json.webViewLink, destination: json.destination });
    setStep('done');
  };

  const handleReset = () => {
    setStep('capture');
    setScanResult(null);
    setEditedData(emptyReceipt());
    setError('');
    setDoneResult(null);
  };

  return (
    <>
      <Head>
        <title>Escaner de Tickets | HappyHub</title>
        <meta name="description" content="Escanea tickets y facturas con IA" />
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Escaner de Tickets</h1>
            <p className="text-gray-500 mt-2">
              Fotografía un ticket o factura, revisa los datos y envíalos a Google Drive o n8n
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm">
            {(['capture', 'validate', 'done'] as const).map((s, i) => {
              const labels = ['Captura', 'Validación', 'Enviado'];
              const isActive = step === s || (s === 'capture' && step === 'scanning') || (s === 'validate' && step === 'sending');
              const isDone = (i === 0 && (step === 'validate' || step === 'sending' || step === 'done')) ||
                             (i === 1 && step === 'done');
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`${isActive || isDone ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{labels[i]}</span>
                  {i < 2 && <div className="w-8 h-px bg-gray-300" />}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* STEP: CAPTURE */}
          {(step === 'capture') && (
            <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700 group-hover:text-primary transition-colors">Hacer foto</p>
                    <p className="text-xs text-gray-400 mt-1">Usa la cámara del dispositivo</p>
                  </div>
                </button>

                {/* Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-100 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <svg className="w-7 h-7 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700 group-hover:text-primary transition-colors">Subir archivo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF...</p>
                  </div>
                </button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
                className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* STEP: SCANNING */}
          {step === 'scanning' && (
            <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Analizando imagen...</h2>
              <p className="text-gray-500 text-sm">Claude Vision está extrayendo los datos del ticket</p>
            </div>
          )}

          {/* STEP: VALIDATE */}
          {(step === 'validate' || step === 'sending') && scanResult && (
            <div className="space-y-6">
              {/* Preview thumbnail */}
              <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${scanResult.mimeType};base64,${scanResult.image}`}
                  alt="Ticket escaneado"
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                />
                <div>
                  <p className="font-medium text-gray-700">{scanResult.fileName}</p>
                  <p className="text-xs text-gray-400 mt-1">Revisa y edita los datos antes de enviar</p>
                </div>
              </div>

              {/* Form */}
              <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-800 text-lg border-b pb-3">Datos del ticket</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Proveedor / Comercio</label>
                    <input type="text" value={editedData.vendor}
                      onChange={(e) => updateField('vendor', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
                    <input type="text" value={editedData.date} placeholder="DD/MM/YYYY"
                      onChange={(e) => updateField('date', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nº Factura / Ticket</label>
                    <input type="text" value={editedData.invoiceNumber}
                      onChange={(e) => updateField('invoiceNumber', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Método de pago</label>
                    <input type="text" value={editedData.paymentMethod}
                      onChange={(e) => updateField('paymentMethod', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-600">Líneas / Artículos</label>
                    <button onClick={addItem}
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Añadir línea
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editedData.items.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                        Sin artículos
                      </p>
                    )}
                    {editedData.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                        <input type="text" placeholder="Descripción" value={item.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                          className="col-span-5 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                        <input type="text" placeholder="Cant." value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className="col-span-2 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                        <input type="text" placeholder="P.unit" value={item.unitPrice}
                          onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                          className="col-span-2 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                        <input type="text" placeholder="Total" value={item.total}
                          onChange={(e) => updateItem(i, 'total', e.target.value)}
                          className="col-span-2 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white" />
                        <button onClick={() => removeItem(i)}
                          className="col-span-1 flex justify-center text-gray-400 hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Subtotal</label>
                    <input type="text" value={editedData.subtotal}
                      onChange={(e) => updateField('subtotal', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">IVA</label>
                    <div className="flex gap-2">
                      <input type="text" value={editedData.taxRate} placeholder="21%"
                        onChange={(e) => updateField('taxRate', e.target.value)}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="text" value={editedData.tax}
                        onChange={(e) => updateField('tax', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <span className="font-bold text-gray-800">TOTAL</span>
                    </label>
                    <input type="text" value={editedData.total}
                      onChange={(e) => updateField('total', e.target.value)}
                      className="w-full border-2 border-primary/40 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Notas adicionales</label>
                  <textarea rows={2} value={editedData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
              </div>

              {/* Destination selector */}
              <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Destino del envío</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${destination === 'drive' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="destination" value="drive"
                      checked={destination === 'drive'} onChange={() => setDestination('drive')}
                      className="sr-only" />
                    <div className="w-9 h-9 flex-shrink-0">
                      <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">Google Drive</p>
                      <p className="text-xs text-gray-400">happyhub.rovellat@gmail.com</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${destination === 'n8n' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="destination" value="n8n"
                      checked={destination === 'n8n'} onChange={() => setDestination('n8n')}
                      className="sr-only" />
                    <div className="w-9 h-9 flex-shrink-0 bg-orange-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">Flujo n8n</p>
                      <p className="text-xs text-gray-400">n8n.happyhub.es</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm">
                  Nueva foto
                </button>
                <button onClick={handleSend} disabled={step === 'sending'}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2">
                  {step === 'sending' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && doneResult && (
            <div className="card bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ticket enviado</h2>
              <p className="text-gray-500 mb-6">
                {doneResult.destination === 'drive'
                  ? 'El ticket y los datos han sido subidos a Google Drive'
                  : 'El ticket ha sido enviado al flujo de n8n correctamente'}
              </p>
              {doneResult.link && (
                <a href={doneResult.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver en Google Drive
                </a>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={handleReset}
                  className="btn-primary px-8 py-3 rounded-xl text-sm">
                  Escanear otro ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
