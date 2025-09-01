import { json, type RequestHandler } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const TMP_DIR = '/tmp';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = formData.get('chunkIndex') as string;

    if (!chunk || !uploadId || !chunkIndex) {
      return json({ error: 'Missing required fields (chunk, uploadId, chunkIndex).' }, { status: 400 });
    }

    const uploadDir = path.join(TMP_DIR, uploadId);

    // Create directory for chunks if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write the chunk to a file
    const chunkPath = path.join(uploadDir, chunkIndex);
    await writeFile(chunkPath, Buffer.from(await chunk.arrayBuffer()));

    return json({ success: true, message: `Chunk ${chunkIndex} of ${uploadId} uploaded.` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`Chunk Upload API Error: ${errorMessage}`);
    return json({ error: 'Failed to upload chunk.' }, { status: 500 });
  }
};
