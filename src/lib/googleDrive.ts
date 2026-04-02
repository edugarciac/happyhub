import { google } from 'googleapis';
import { Readable } from 'stream';

const EXCEL_FILENAME = 'Registro_Facturas.xlsx';

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function getOrCreateFolder(parentId: string, name: string): Promise<string> {
  const drive = getDriveClient();
  const escapedName = name.replace(/'/g, "\\'");
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return folder.data.id!;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export async function getMonthFolder(year: number, month: number): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID!;
  const yearFolderId = await getOrCreateFolder(rootFolderId, String(year));
  const monthFolderName = `${String(month).padStart(2, '0')}-${MONTH_NAMES[month - 1]}`;
  return getOrCreateFolder(yearFolderId, monthFolderName);
}

export async function uploadFile(
  folderId: string,
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();
  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  });

  return {
    id: response.data.id!,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
  };
}

export async function findExcelFile(): Promise<{ id: string; buffer: Buffer } | null> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID!;

  const response = await drive.files.list({
    q: `'${rootFolderId}' in parents and name = '${EXCEL_FILENAME}' and trashed = false`,
    fields: 'files(id)',
  });

  if (!response.data.files || response.data.files.length === 0) return null;

  const fileId = response.data.files[0].id!;
  const fileResponse = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return { id: fileId, buffer: Buffer.from(fileResponse.data as ArrayBuffer) };
}

export async function saveExcelFile(buffer: Buffer, fileId?: string): Promise<string> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID!;
  const stream = Readable.from(buffer);
  const media = {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: stream,
  };

  if (fileId) {
    const response = await drive.files.update({ fileId, media, fields: 'id' });
    return response.data.id!;
  }

  const response = await drive.files.create({
    requestBody: { name: EXCEL_FILENAME, parents: [rootFolderId] },
    media,
    fields: 'id',
  });
  return response.data.id!;
}

export async function listInvoiceFiles(): Promise<Array<{ id: string; name: string; webViewLink: string; createdTime: string }>> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FACTURAS_FOLDER_ID!;

  // Recursively get all non-folder files under root
  const response = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and name != '${EXCEL_FILENAME}' and trashed = false`,
    fields: 'files(id, name, webViewLink, createdTime)',
    orderBy: 'createdTime desc',
    pageSize: 100,
  });

  return (response.data.files || []).map(f => ({
    id: f.id!,
    name: f.name!,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    createdTime: f.createdTime!,
  }));
}
