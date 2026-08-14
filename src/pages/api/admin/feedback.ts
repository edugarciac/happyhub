import { query } from '@/lib/db';
import { withAdminHandler, methodNotAllowed } from '@/lib/apiMiddleware';

export default withAdminHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res);

  const result = await query(
    `SELECT f.id, f.message, f.page_path, f.created_at, u.name AS user_name, u.email AS user_email
     FROM feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC`
  );

  return res.status(200).json({ success: true, feedback: result.rows });
}, 'admin-feedback');
