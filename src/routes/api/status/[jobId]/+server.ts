import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kv } from '@vercel/kv';
import logger from '../../../../lib/server/logger';
import { limiter } from '../../../../lib/server/ratelimit';

export const GET: RequestHandler = async (event) => {
  await limiter.check(event);
  const { params } = event;
  const { jobId } = params;

  if (!jobId) {
    return json({ success: false, error: 'No Job ID provided.' }, { status: 400 });
  }

  try {
    const result = await kv.get(jobId);

    if (!result) {
      const timestamp = new Date().toISOString();
      // If you have logic to estimate wait time, replace the static value below
      const estimatedWaitTimeSeconds = 30; // Example static value
      return json(
        {
          success: true,
          status: 'pending',
          timestamp,
          estimatedWaitTimeSeconds
        },
        { status: 202 }
      );
    }

    return json({ success: true, ...result });

  } catch (error) {
    logger.error({ err: error, jobId }, 'Failed to get job status');
    return json({ success: false, error: 'An error occurred while fetching job status.' }, { status: 500 });
  }
};
