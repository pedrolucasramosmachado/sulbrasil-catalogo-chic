import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID as string;
const ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID as string;
const SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string;
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME as string;
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL as string;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// Log de verificação (apenas para debug em desenvolvimento)
if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.error('R2: Variáveis de ambiente faltando!', {
    hasAccountId: !!ACCOUNT_ID,
    hasAccessKey: !!ACCESS_KEY_ID,
    hasSecretKey: !!SECRET_ACCESS_KEY,
    hasBucket: !!BUCKET_NAME
  });
}

/**
 * Faz upload de um arquivo para o Cloudflare R2 e retorna a URL pública.
 */
export const uploadToR2 = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: file.type || 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Retorna a URL pública do arquivo
    const publicBaseUrl = PUBLIC_URL.replace(/\/$/, '');
    return `${publicBaseUrl}/${key}`;
  } catch (error: any) {
    console.error('Erro detalhado R2 upload:', error);
    // Se for um erro de credenciais ou CORS, o console vai mostrar mais detalhes
    if (error.name === 'InvalidAccessKeyId') {
      console.error('R2: Chave de acesso inválida. Verifique o VITE_R2_ACCESS_KEY_ID.');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('R2: Assinatura não confere. Verifique o VITE_R2_SECRET_ACCESS_KEY.');
    }
    return null;
  }
};

/**
 * Deleta um arquivo do R2 a partir da URL pública.
 */
export const deleteFromR2 = async (publicUrl: string): Promise<void> => {
  try {
    const publicBaseUrl = PUBLIC_URL.replace(/\/$/, '');
    const key = publicUrl.replace(`${publicBaseUrl}/`, '');
    if (!key || key === publicUrl) return; // URL não é do R2, ignora

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Erro ao deletar do R2:', error);
  }
};
