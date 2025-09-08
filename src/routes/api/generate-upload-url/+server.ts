import { json, error } from '@sveltejs/kit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateCsrfFromJson } from '$lib/security';
import { randomUUID } from 'crypto';
import { browser } from '$app/environment';

let s3Client: S3Client;

if (!browser) {
  const {
    SPACES_BUCKET_NAME,
    SPACES_REGION,
    SPACES_ENDPOINT,
    SPACES_ACCESS_KEY_ID,
    SPACES_SECRET_ACCESS_KEY
  } = process.env;

  if (!SPACES_BUCKET_NAME || !SPACES_REGION || !SPACES_ENDPOINT || !SPACES_ACCESS_KEY_ID || !SPACES_SECRET_ACCESS_KEY) {
    console.warn('Missing DigitalOcean Spaces environment variables. Presigned URL generation will be skipped.');
  } else {
    s3Client = new S3Client({
      endpoint: `https://${SPACES_ENDPOINT}`,
      region: SPACES_REGION,
      credentials: {
        accessKeyId: SPACES_ACCESS_KEY_ID,
        secretAccessKey: SPACES_SECRET_ACCESS_KEY,
      },
    });
  }
}

export const POST = async ({ request, cookies }) => {
  if (!s3Client) {
    throw error(500, 'S3 client is not configured on the server.');
  }
  try {
    const body = await request.json();
    const originalFilename = body.filename;

    if (!originalFilename || typeof originalFilename !== 'string') {
      throw error(400, 'Filename is required.');
    }

    const csrfCookie = cookies.get('csrfToken');
    if (!validateCsrfFromJson(body, csrfCookie)) {
      throw error(403, 'CSRF token validation failed.');
    }

    // Sanitize filename and create a unique key for the object in the bucket
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '');
    const objectKey = `${randomUUID()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: SPACES_BUCKET_NAME,
      Key: objectKey,
      ACL: 'public-read' // Make the file publicly readable after upload
    });

    // Generate the presigned URL, valid for 5 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // The public URL is the URL of the object after it's uploaded
    const publicUrl = `https://${SPACES_BUCKET_NAME}.${SPACES_ENDPOINT}/${objectKey}`;

    return json({
      signedUrl,
      publicUrl,
      objectKey
    });

  } catch (err) {
    console.error('Error generating presigned URL:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    // Avoid leaking internal details in production
    if (process.env.NODE_ENV === 'production') {
      throw error(500, 'Could not generate upload URL.');
    }
    throw error(500, `Could not generate upload URL: ${message}`);
  }
};
