import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kv } from '@vercel/kv';

export const GET: RequestHandler = async ({ params }) => {
  const { jobId } = params;

  if (!jobId) {
    return json({ success: false, error: 'No Job ID provided.' }, { status: 400 });
  }

  try {
    console.log(`@phazzie-checkpoint-status-1: Checking status for job ${jobId}`);
    const result = await kv.get(jobId);

    if (!result) {
      return json({ success: true, status: 'pending' }, { status: 202 });
    }

    return json({ success: true, ...result });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown KV error';
    console.error(`@phazzie-error-status: Failed to get status for job ${jobId}`, error);
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
};
