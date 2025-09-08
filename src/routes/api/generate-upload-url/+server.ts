import { json, error } from '@sveltejs/kit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateCsrfFromJson } from '$lib/security';
import { randomUUID } from 'crypto';

const {
  SPACES_BUCKET_NAME,
  SPACES_REGION,
  SPACES_ENDPOINT,
  SPACES_ACCESS_KEY_ID,
  SPACES_SECRET_ACCESS_KEY
} = process.env;

// Basic validation to ensure all required env vars are set
if (!SPACES_BUCKET_NAME || !SPACES_REGION || !SPACES_ENDPOINT || !SPACES_ACCESS_KEY_ID || !SPACES_SECRET_ACCESS_KEY) {
  throw new Error('Missing required DigitalOcean Spaces environment variables.');
}

// Create an S3 client configured for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${SPACES_ENDPOINT}`,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_ACCESS_KEY_ID,
    secretAccessKey: SPACES_SECRET_ACCESS_KEY,
  },
});

export const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const originalFilename = body.filename;

    if (!validateCsrfFromJson(body, cookies.get('csrfToken'))) {
        throw error(403, 'Request could not be processed. Please try again.');
    }

    if (!originalFilename || typeof originalFilename !== 'string') {
      throw error(400, 'Filename is required.');
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
