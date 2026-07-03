import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test 1: Import authOptions
    const { authOptions } = await import('../../lib/auth');

    // Test 2: Check environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    // Test 3: Check database connection
    let dbStatus = 'not tested';
    try {
      const { checkConnection } = await import('../../lib/db');
      const connected = await checkConnection();
      dbStatus = connected ? 'connected' : 'failed';
    } catch (dbError: any) {
      dbStatus = `error: ${dbError.message}`;
    }

    // Test 4: Check providers
    const providers = authOptions.providers.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));

    res.status(200).json({
      success: true,
      envCheck,
      dbStatus,
      providers,
      authOptionsLoaded: !!authOptions,
    });
  } catch (error: unknown) {
    console.error('test-auth-config error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Error';
    res.status(500).json({
      success: false,
      error: message,
      name,
      ...(process.env.NODE_ENV === 'development' && error instanceof Error
        ? { stack: error.stack }
        : {}),
    });
  }
}
