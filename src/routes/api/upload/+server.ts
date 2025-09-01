import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const UPLOAD_DIR = path.join(os.tmpdir(), 'phazzie-uploads');

// Ensure the base upload directory exists
(async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (e) {
        console.error("Failed to create base upload directory:", e);
    }
})();

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const chunk = formData.get('chunk') as File;
        const uploadId = formData.get('uploadId') as string;
        const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
        const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
        const fileName = formData.get('fileName') as string;

        if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName) {
            return json({ success: false, error: 'Invalid chunk upload request' }, { status: 400 });
        }

        const tempUploadDir = path.join(UPLOAD_DIR, uploadId);
        await fs.mkdir(tempUploadDir, { recursive: true });

        const chunkPath = path.join(tempUploadDir, `chunk-${chunkIndex}`);
        await fs.writeFile(chunkPath, Buffer.from(await chunk.arrayBuffer()));

        console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);

        // Check if all chunks have been uploaded
        const existingChunks = await fs.readdir(tempUploadDir);
        if (existingChunks.length === totalChunks) {
            console.log(`All ${totalChunks} chunks received for ${uploadId}. Reassembling file...`);
            const finalFilePath = path.join(UPLOAD_DIR, fileName);

            // Reassemble the file by concatenating chunks in order
            const fileWriteStream = (await fs.open(finalFilePath, 'w')).createWriteStream();

            for (let i = 0; i < totalChunks; i++) {
                const currentChunkPath = path.join(tempUploadDir, `chunk-${i}`);
                const chunkBuffer = await fs.readFile(currentChunkPath);
                fileWriteStream.write(chunkBuffer);
                await fs.unlink(currentChunkPath); // Delete chunk after appending
            }
            fileWriteStream.end();

            await fs.rmdir(tempUploadDir); // Clean up the temporary upload-specific directory

            console.log(`File ${fileName} reassembled successfully at ${finalFilePath}.`);

            // TODO: In the next step, trigger the transcription process with the reassembled file.
            // For now, just return a success message with the path.

            return json({
                success: true,
                message: 'Upload complete and file reassembled.',
                filePath: finalFilePath
            });
        }

        // If not all chunks are received, just acknowledge the successful chunk upload
        return json({ success: true, message: `Chunk ${chunkIndex + 1}/${totalChunks} received.` });

    } catch (error) {
        console.error('Error handling chunk upload:', error);
        return json({ success: false, error: 'Server error during chunk upload.' }, { status: 500 });
    }
};
