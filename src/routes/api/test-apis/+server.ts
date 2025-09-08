import { json, type RequestHandler } from '@sveltejs/kit';
import { validateCsrfToken } from '$lib/security';

// Import all the service implementations
import { assemblyAiProcessor } from '../../../implementations/assembly';
import { deepgramProcessor } from '../../../implementations/deepgram';
import { geminiProcessor } from '../../../implementations/gemini';
import { whisperProcessor } from '../../../implementations/whisper';
import { elevenLabsProcessor } from '../../../implementations/elevenlabs';

const allServices = [
  assemblyAiProcessor,
  deepgramProcessor,
  geminiProcessor,
  whisperProcessor,
  elevenLabsProcessor
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    validateCsrfToken(body.csrfToken);

    const configuredServices = allServices.filter(s => s.isConfigured);

    if (configuredServices.length === 0) {
      return json({
        testResults: [{
          serviceName: 'All Services',
          success: false,
          error: 'No API keys are configured on the server.'
        }]
      });
    }

    const testResults = await Promise.all(
      configuredServices.map(service => service.testConnection())
    );

    return json({ testResults });

  } catch (error) {
    console.error('API test endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
