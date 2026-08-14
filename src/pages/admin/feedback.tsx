import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { MessageSquare } from 'lucide-react';

interface FeedbackItem {
  id: number;
  message: string;
  page_path: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export default function AdminFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/feedback')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setItems(data.feedback);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head><title>Feedback — Admin HappyHub</title></Head>
      <AdminLayout>
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="text-sm text-gray-500 mt-1">Mensajes enviados por usuarios desde el sitio.</p>
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Sin feedback todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.message}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 flex-wrap">
                    <span>{new Date(item.created_at).toLocaleString('es-ES')}</span>
                    {item.page_path && <><span>·</span><span>{item.page_path}</span></>}
                    {(item.user_name || item.user_email) && (
                      <><span>·</span><span>{item.user_name || item.user_email}</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
