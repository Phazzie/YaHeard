import { json } from '@sveltejs/kit';import { json } from '@sveltejs/kit';import { json } from '@sveltejs/kit';import { json } from '@sveltejs/kit';import { json } from '@sveltejs/kit';import { json } from '@sveltejs/kit';/**/**

import type { RequestHandler } from './$types.js';

import type { AudioProcessor } from '../../../contracts/processors.js';import type { RequestHandler } from './$types.js';

import type { TranscriptionResult } from '../../../contracts/transcription.js';

import { AssemblyAIProcessor } from '../../../implementations/assembly.js';import type { AudioProcessor } from '../../../contracts/processors.js';import type { RequestHandler } from './$types.js';

import { DeepgramProcessor } from '../../../implementations/deepgram.js';

import { WhisperProcessor } from '../../../implementations/whisper.js';import type { TranscriptionResult } from '../../../contracts/transcription.js';



export const POST: RequestHandler = async ({ request }) => {import { AssemblyAIProcessor } from '../../../implementations/assembly.js';import type { AudioProcessor } from '../../../contracts/processors.js';import type { RequestHandler } from './$types.js';

  try {

    const formData = await request.formData();import { DeepgramProcessor } from '../../../implementations/deepgram.js';

    const audioFile = formData.get('audio') as File;

import { WhisperProcessor } from '../../../implementations/whisper.js';import type { TranscriptionResult } from '../../../contracts/transcription.js';

    if (!audioFile) {

      return json({ success: false, error: 'No audio file provided' }, { status: 400 });

    }

export const POST: RequestHandler = async (event) => {import { AssemblyAIProcessor } from '../../../implementations/assembly.js';import type { AudioProcessor } from '../../../contracts/processors.js';import type { RequestHandler } from './$types.js';

    if (audioFile.size > 25 * 1024 * 1024) {

      return json({ success: false, error: 'File too large. Maximum size is 25MB.' }, { status: 400 });  const { request } = event;

    }

import { DeepgramProcessor } from '../../../implementations/deepgram.js';

    const services: AudioProcessor[] = [];

      try {

    if (process.env.OPENAI_API_KEY) {

      services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));    const formData = await request.formData();import { WhisperProcessor } from '../../../implementations/whisper.js';import type { TranscriptionResult } from '../../../contracts/transcription.js';

    }

        const audioFile = formData.get('audio') as File;

    if (process.env.ASSEMBLYAI_API_KEY) {

      services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));

    }

        if (!audioFile) {

    if (process.env.DEEPGRAM_API_KEY) {

      services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));      return json({export const POST: RequestHandler = async (event) => {import { AssemblyAIProcessor } from '../../../implementations/assembly.js';import type { AudioProcessor } from '../../contracts/processors.js';import type { RequestHandler } from './$types.js';

    }

        success: false,

    if (services.length === 0) {

      return json({ success: false, error: 'No AI services configured' }, { status: 500 });        error: 'No audio file provided'  const { request } = event;

    }

      }, { status: 400 });

    const processingStartTime = Date.now();

    const results = await Promise.allSettled(    }import { DeepgramProcessor } from '../../../implementations/deepgram.js';

      services.map(service => service.processFile(audioFile))

    );



    const transcriptionResults = results.map((result, index) => {    // Validate file size (25MB limit)  try {

      if (result.status === 'fulfilled') {

        return result.value;    if (audioFile.size > 25 * 1024 * 1024) {

      } else {

        return {      return json({    const formData = await request.formData();import { WhisperProcessor } from '../../../implementations/whisper.js';import type { TranscriptionResult } from '../../contracts/transcription.js';

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,

          serviceName: services[index].serviceName,        success: false,

          text: '',

          confidence: 0,        error: 'File too large. Maximum size is 25MB.'    const audioFile = formData.get('audio') as File;

          processingTimeMs: 0,

          timestamp: new Date(),      }, { status: 400 });

          metadata: { error: 'Service failed' }

        } as TranscriptionResult;    }

      }

    });



    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);    // Environment variable validation    if (!audioFile) {

    

    let consensusResult;    const requiredEnvVars = ['OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 'DEEPGRAM_API_KEY'];

    if (successful.length === 0) {

      consensusResult = {    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);      return json({export const POST: RequestHandler = async (event) => {import { AssemblyAIProcessor } from '../../implementations/assembly.js';import type { AudioProcessor } from '../../contracts/processors.js'; * @file +server.ts * @file +server.ts

        finalText: '',

        consensusConfidence: 0,    

        individualResults: transcriptionResults,

        disagreements: [],    if (missingVars.length > 0) {        success: false,

        stats: {

          totalProcessingTimeMs: Date.now() - processingStartTime,      return json({

          servicesUsed: 0,

          averageConfidence: 0,        success: false,        error: 'No audio file provided'  const { request } = event;

          disagreementCount: 0

        }        error: `Missing required environment variables: ${missingVars.join(', ')}`

      };

    } else {      }, { status: 500 });      }, { status: 400 });

      const bestResult = successful.reduce((best, current) =>

        (current.confidence || 0) > (best.confidence || 0) ? current : best    }

      );

    }import { DeepgramProcessor } from '../../implementations/deepgram.js';

      consensusResult = {

        finalText: bestResult.text,    // Initialize AI services

        consensusConfidence: bestResult.confidence || 0,

        individualResults: transcriptionResults,    const services: AudioProcessor[] = [];

        disagreements: [],

        stats: {    

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: successful.length,    if (process.env.OPENAI_API_KEY) {    // Validate file size (25MB limit)  try {

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,

          disagreementCount: 0      services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));

        }

      };    }    if (audioFile.size > 25 * 1024 * 1024) {

    }

    

    return json({

      success: true,    if (process.env.ASSEMBLYAI_API_KEY) {      return json({    const formData = await request.formData();import { WhisperProcessor } from '../../implementations/whisper.js';import type { TranscriptionResult } from '../../contracts/transcription.js';

      results: transcriptionResults,

      consensus: consensusResult      services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));

    });

    }        success: false,

  } catch (error) {

    return json({    

      success: false,

      error: error instanceof Error ? error.message : 'Unknown server error'    if (process.env.DEEPGRAM_API_KEY) {        error: 'File too large. Maximum size is 25MB.'    const audioFile = formData.get('audio') as File;

    }, { status: 500 });

  }      services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));

};
    }      }, { status: 400 });



    if (services.length === 0) {    }

      return json({

        success: false,

        error: 'No AI services configured'

      }, { status: 500 });    // Environment variable validation    if (!audioFile) {

    }

    const requiredEnvVars = ['OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 'DEEPGRAM_API_KEY'];

    // Process with all available services in parallel

    const processingStartTime = Date.now();    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);      return json({export const POST: RequestHandler = async (event) => {import { AssemblyAIProcessor } from '../../implementations/assembly.js'; * @purpose API endpoint for transcription processing * @purpose API endpoint for transcription processing



    const results = await Promise.allSettled(    

      services.map(async (service) => {

        try {    if (missingVars.length > 0) {        success: false,

          return await service.processFile(audioFile);

        } catch (error) {      return json({

          return {

            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,        success: false,        error: 'No audio file provided'  const { request } = event;

            serviceName: service.serviceName,

            text: '',        error: `Missing required environment variables: ${missingVars.join(', ')}`

            confidence: 0,

            processingTimeMs: Date.now() - processingStartTime,      }, { status: 500 });      }, { status: 400 });

            timestamp: new Date(),

            metadata: {    }

              error: error instanceof Error ? error.message : 'Unknown error'

            }    }import { DeepgramProcessor } from '../../implementations/deepgram.js';

          } as TranscriptionResult;

        }    // Initialize AI services

      })

    );    const services: AudioProcessor[] = [];



    // Extract results from Promise.allSettled    

    const transcriptionResults = results.map((result, index) => {

      if (result.status === 'fulfilled') {    if (process.env.OPENAI_API_KEY) {    // Validate file size (25MB limit)  try {

        return result.value;

      } else {      services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));

        return {

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,    }    if (audioFile.size > 25 * 1024 * 1024) {

          serviceName: services[index].serviceName,

          text: '',    

          confidence: 0,

          processingTimeMs: 0,    if (process.env.ASSEMBLYAI_API_KEY) {      return json({    const formData = await request.formData();import { WhisperProcessor } from '../../implementations/whisper.js'; * @phazzie-status working * @phazzie-status working

          timestamp: new Date(),

          metadata: { error: 'Service completely failed' }      services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));

        } as TranscriptionResult;

      }    }        success: false,

    });

    

    // Calculate consensus from successful results

    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);    if (process.env.DEEPGRAM_API_KEY) {        error: 'File too large. Maximum size is 25MB.'    const audioFile = formData.get('audio') as File;



    let consensusResult;      services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));

    if (successful.length === 0) {

      consensusResult = {    }      }, { status: 400 });

        finalText: '',

        consensusConfidence: 0,

        individualResults: transcriptionResults,

        disagreements: [],    if (services.length === 0) {    }

        stats: {

          totalProcessingTimeMs: Date.now() - processingStartTime,      return json({

          servicesUsed: 0,

          averageConfidence: 0,        success: false,

          disagreementCount: 0

        }        error: 'No AI services configured'

      };

    } else {      }, { status: 500 });    // Environment variable validation    if (!audioFile) {

      const bestResult = successful.reduce((best, current) =>

        (current.confidence || 0) > (best.confidence || 0) ? current : best    }

      );

    const requiredEnvVars = ['OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 'DEEPGRAM_API_KEY'];

      consensusResult = {

        finalText: bestResult.text,    // Process with all available services in parallel

        consensusConfidence: bestResult.confidence || 0,

        individualResults: transcriptionResults,    const processingStartTime = Date.now();    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);      return json({export const POST: RequestHandler = async (event) => { * @last-regenerated 2025-01-29 13:54:37 UTC * @last-regenerated 2025-01-29 13:54:37 UTC

        disagreements: [],

        stats: {

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: successful.length,    const results = await Promise.allSettled(    

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,

          disagreementCount: 0      services.map(async (service) => {

        }

      };        try {    if (missingVars.length > 0) {        success: false,

    }

          return await service.processFile(audioFile);

    return json({

      success: true,        } catch (error) {      return json({

      results: transcriptionResults,

      consensus: consensusResult          // Return failed result instead of throwing

    });

          return {        success: false,        error: 'No audio file provided'  const { request } = event;

  } catch (error) {

    return json({            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,

      success: false,

      error: error instanceof Error ? error.message : 'Unknown server error occurred'            serviceName: service.serviceName,        error: `Missing required environment variables: ${missingVars.join(', ')}`

    }, { status: 500 });

  }            text: '',

};
            confidence: 0,      }, { status: 500 });      }, { status: 400 });

            processingTimeMs: Date.now() - processingStartTime,

            timestamp: new Date(),    }

            metadata: {

              error: error instanceof Error ? error.message : 'Unknown error'    } * @dependencies processors.ts contracts, implementation files * @dependencies processors.ts contracts, implementation files

            }

          } as TranscriptionResult;    // Initialize AI services

        }

      })    const services: AudioProcessor[] = [];

    );

    

    // Extract results from Promise.allSettled

    const transcriptionResults = results.map((result, index) => {    if (process.env.OPENAI_API_KEY) {    // Validate file size (25MB limit)  try {

      if (result.status === 'fulfilled') {

        return result.value;      services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));

      } else {

        return {    }    if (audioFile.size > 25 * 1024 * 1024) {

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,

          serviceName: services[index].serviceName,    

          text: '',

          confidence: 0,    if (process.env.ASSEMBLYAI_API_KEY) {      return json({    const formData = await request.formData(); */ */

          processingTimeMs: 0,

          timestamp: new Date(),      services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));

          metadata: { error: 'Service completely failed' }

        } as TranscriptionResult;    }        success: false,

      }

    });    



    // Calculate consensus from successful results    if (process.env.DEEPGRAM_API_KEY) {        error: 'File too large. Maximum size is 25MB.'    const audioFileFromUser = formData.get('audio') as File;

    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);

      services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));

    let consensusResult;

    if (successful.length === 0) {    }      }, { status: 400 });

      consensusResult = {

        finalText: '',

        consensusConfidence: 0,

        individualResults: transcriptionResults,    if (services.length === 0) {    }

        disagreements: [],

        stats: {      return json({

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: 0,        success: false,

          averageConfidence: 0,

          disagreementCount: 0        error: 'No AI services configured'

        }

      };      }, { status: 500 });    // Environment variable validation    if (!audioFileFromUser) {

    } else {

      // Simple confidence-based consensus    }

      const bestResult = successful.reduce((best, current) =>

        (current.confidence || 0) > (best.confidence || 0) ? current : best    const requiredEnvVars = ['OPENAI_API_KEY', 'ASSEMBLYAI_API_KEY', 'DEEPGRAM_API_KEY'];

      );

    // Process with all available services in parallel

      consensusResult = {

        finalText: bestResult.text,    const processingStartTime = Date.now();    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);      return json({import { json } from '@sveltejs/kit';// Define RequestHandler type for SvelteKit API routes

        consensusConfidence: bestResult.confidence || 0,

        individualResults: transcriptionResults,

        disagreements: [],

        stats: {    const results = await Promise.allSettled(    

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: successful.length,      services.map(async (service) => {

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,

          disagreementCount: 0        try {    if (missingVars.length > 0) {        success: false,

        }

      };          return await service.processFile(audioFile);

    }

        } catch (error) {      return json({

    return json({

      success: true,          // Return failed result instead of throwing

      results: transcriptionResults,

      consensus: consensusResult          return {        success: false,        error: 'No audio file provided'import type { RequestHandler } from './$types.js';interface RequestHandler {

    });

            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,

  } catch (error) {

    return json({            serviceName: service.serviceName,        error: `Missing required environment variables: ${missingVars.join(', ')}`

      success: false,

      error: error instanceof Error ? error.message : 'Unknown server error occurred'            text: '',

    }, { status: 500 });

  }            confidence: 0,      }, { status: 500 });      }, { status: 400 });

};
            processingTimeMs: Date.now() - processingStartTime,

            timestamp: new Date(),    }

            metadata: {

              error: error instanceof Error ? error.message : 'Unknown error'    }import type { AudioProcessor } from '../../contracts/processors.js';  (event: { request: Request }): Promise<Response>;

            }

          } as TranscriptionResult;    // Initialize AI services

        }

      })    const services: AudioProcessor[] = [];

    );

    

    // Extract results from Promise.allSettled

    const transcriptionResults = results.map((result, index) => {    if (process.env.OPENAI_API_KEY) {    // Environment variable validationimport type { TranscriptionResult } from '../../contracts/transcription.js';}

      if (result.status === 'fulfilled') {

        return result.value;      services.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));

      } else {

        return {    }    const requiredEnvVars = [

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,

          serviceName: services[index].serviceName,    

          text: '',

          confidence: 0,    if (process.env.ASSEMBLYAI_API_KEY) {      'OPENAI_API_KEY',import { AssemblyAIProcessor } from '../../implementations/assembly.js';import { json } from '@sveltejs/kit';

          processingTimeMs: 0,

          timestamp: new Date(),      services.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));

          metadata: { error: 'Service completely failed' }

        } as TranscriptionResult;    }      'ASSEMBLYAI_API_KEY', 

      }

    });    



    // Calculate consensus from successful results    if (process.env.DEEPGRAM_API_KEY) {      'DEEPGRAM_API_KEY'import { DeepgramProcessor } from '../../implementations/deepgram.js';

    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);

      services.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));

    let consensusResult;

    if (successful.length === 0) {    }    ];

      consensusResult = {

        finalText: '',

        consensusConfidence: 0,

        individualResults: transcriptionResults,    if (services.length === 0) {    import { WhisperProcessor } from '../../implementations/whisper.js';// ========= REGENERATION BOUNDARY START: API Handler =========

        disagreements: [],

        stats: {      return json({

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: 0,        success: false,    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

          averageConfidence: 0,

          disagreementCount: 0        error: 'No AI services configured'

        }

      };      }, { status: 500 });    if (missingVars.length > 0) {// @phazzie: This section can be regenerated independently

    } else {

      // Simple confidence-based consensus (TODO: improve with text similarity)    }

      const bestResult = successful.reduce((best, current) =>

        (current.confidence || 0) > (best.confidence || 0) ? current : best      return json({

      );

    // Process with all available services in parallel

      consensusResult = {

        finalText: bestResult.text,    const processingStartTime = Date.now();        success: false,// ========= REGENERATION BOUNDARY START: API Handler =========// @contract: Must handle POST requests with audio files and return transcription results

        consensusConfidence: bestResult.confidence || 0,

        individualResults: transcriptionResults,

        disagreements: [],

        stats: {    const results = await Promise.allSettled(        error: `Missing required environment variables: ${missingVars.join(', ')}`

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: successful.length,      services.map(async (service) => {

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,

          disagreementCount: 0        try {      }, { status: 500 });// @phazzie: This section can be regenerated independently// @dependencies: Audio processor implementations

        }

      };          return await service.processFile(audioFile);

    }

        } catch (error) {    }

    return json({

      success: true,          // Return failed result instead of throwing

      results: transcriptionResults,

      consensus: consensusResult          return {// @contract: Must handle POST requests with audio files and return transcription results

    });

            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,

  } catch (error) {

    return json({            serviceName: service.serviceName,    const openaiKey = process.env.OPENAI_API_KEY;

      success: false,

      error: error instanceof Error ? error.message : 'Unknown server error occurred'            text: '',

    }, { status: 500 });

  }            confidence: 0,    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;// @dependencies: Audio processor implementationsexport const POST: RequestHandler = async (event: { request: Request }) => {

};
            processingTimeMs: Date.now() - processingStartTime,

            timestamp: new Date(),    const deepgramKey = process.env.DEEPGRAM_API_KEY;

            metadata: {

              error: error instanceof Error ? error.message : 'Unknown error'  const { request } = event;

            }

          } as TranscriptionResult;    // Initialize AI services

        }

      })    const services: AudioProcessor[] = [];export const POST: RequestHandler = async (event) => {

    );



    // Extract results from Promise.allSettled

    const transcriptionResults = results.map((result, index) => {    if (openaiKey) {  const { request } = event;

      if (result.status === 'fulfilled') {

        return result.value;      services.push(new WhisperProcessor({ apiKey: openaiKey }));

      } else {

        return {    }  try {

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,

          serviceName: services[index].serviceName,

          text: '',

          confidence: 0,    if (assemblyKey) {  try {    const formData = await request.formData();

          processingTimeMs: 0,

          timestamp: new Date(),      services.push(new AssemblyAIProcessor({ apiKey: assemblyKey }));

          metadata: { error: 'Service completely failed' }

        } as TranscriptionResult;    }    const formData = await request.formData();    const audioFileFromUser = formData.get('audio') as File;

      }

    });



    // Calculate consensus from successful results    if (deepgramKey) {    const audioFileFromUser = formData.get('audio') as File;

    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);

      services.push(new DeepgramProcessor({ apiKey: deepgramKey }));

    let consensusResult;

    if (successful.length === 0) {    }    if (!audioFileFromUser) {

      consensusResult = {

        finalText: '',

        consensusConfidence: 0,

        individualResults: transcriptionResults,    if (services.length === 0) {    if (!audioFileFromUser) {

        disagreements: [],

        stats: {      return json({

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: 0,        success: false,      return json({      return json({

          averageConfidence: 0,

          disagreementCount: 0        error: 'No AI services configured'

        }

      };      }, { status: 500 });        success: false,        success: false,

    } else {

      // Simple confidence-based consensus (TODO: improve with text similarity)    }

      const bestResult = successful.reduce((best, current) =>

        (current.confidence || 0) > (best.confidence || 0) ? current : best        error: 'No audio file provided'        error: 'No audio file provided'

      );

    // Process with all available services in parallel

      consensusResult = {

        finalText: bestResult.text,    const processingStartTime = Date.now();      }, { status: 400 });      }, { status: 400 });

        consensusConfidence: bestResult.confidence || 0,

        individualResults: transcriptionResults,

        disagreements: [],

        stats: {    const results = await Promise.allSettled(    }    }

          totalProcessingTimeMs: Date.now() - processingStartTime,

          servicesUsed: successful.length,      services.map(async (service) => {

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,

          disagreementCount: 0        try {

        }

      };          return await service.processFile(audioFileFromUser);

    }

        } catch (error) {    // WHY DEBUGGING INFO:    // WHY DEBUGGING INFO:

    return json({

      success: true,          return {

      results: transcriptionResults,

      consensus: consensusResult            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,    // ===================    // ===================

    });

            serviceName: service.serviceName,

  } catch (error) {

    return json({            text: '',    // Show which file is being processed for debugging    // Show which file is being processed for debugging

      success: false,

      error: error instanceof Error ? error.message : 'Unknown server error occurred'            confidence: 0,

    }, { status: 500 });

  }            processingTimeMs: Date.now() - processingStartTime,    // Include file metadata for diagnostics    // Include file metadata for diagnostics

};
            timestamp: new Date(),

            metadata: {    console.log('Processing uploaded audio file:', {    console.log('Processing uploaded audio file:', {

              error: error instanceof Error ? error.message : 'Unknown error'

            }      name: audioFileFromUser.name,      name: audioFileFromUser.name,

          } as TranscriptionResult;

        }      size: audioFileFromUser.size,      size: audioFileFromUser.size,

      })

    );      type: audioFileFromUser.type      type: audioFileFromUser.type



    // Extract actual results from Promise.allSettled    });    });

    const transcriptionResults = results.map((result, index) => {

      if (result.status === 'fulfilled') {

        return result.value;

      } else {    // ========= REGENERATION BOUNDARY START: Multi-AI Processing =========    // ========= REGENERATION BOUNDARY START: Multi-AI Processing =========

        return {

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,    // @phazzie: This section can be regenerated independently    // @phazzie: This section can be regenerated independently

          serviceName: services[index].serviceName,

          text: '',    // @contract: Must process file with multiple AI services    // @contract: Must process file with multiple AI services

          confidence: 0,

          processingTimeMs: 0,    // @dependencies: Whisper, AssemblyAI, Deepgram implementations    // @dependencies: Whisper, AssemblyAI, Deepgram implementations

          timestamp: new Date(),

          metadata: { error: 'Service completely failed' }

        } as TranscriptionResult;

      }    // Environment variable validation

    });

    const requiredEnvVars = [

    // Calculate consensus from successful results

    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);      'OPENAI_API_KEY',    // Placeholder for actual AI processing



    let consensusResult;      'ASSEMBLYAI_API_KEY',     // In real implementation, this would call multiple AI services

    if (successful.length === 0) {

      consensusResult = {      'DEEPGRAM_API_KEY'    const mockResults = [

        finalText: '',

        consensusConfidence: 0,    ];      {

        individualResults: transcriptionResults,

        disagreements: [],            id: 'whisper-1',

        stats: {

          totalProcessingTimeMs: Date.now() - processingStartTime,    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);        serviceName: 'Whisper',

          servicesUsed: 0,

          averageConfidence: 0,    if (missingVars.length > 0) {        text: 'This is a sample transcription from Whisper AI.',

          disagreementCount: 0

        }      console.error('Missing required environment variables:', missingVars.join(', '));        confidence: 0.95,

      };

    } else {      return json({        processingTimeMs: 2500,

      // Simple confidence-based consensus

      const bestResult = successful.reduce((best, current) =>        success: false,        timestamp: new Date(),

        (current.confidence || 0) > (best.confidence || 0) ? current : best

      );        error: `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`        metadata: { model: 'whisper-large-v3' }



      consensusResult = {      }, { status: 500 });      },

        finalText: bestResult.text,

        consensusConfidence: bestResult.confidence || 0,    }      {

        individualResults: transcriptionResults,

        disagreements: [],        id: 'assembly-1',

        stats: {

          totalProcessingTimeMs: Date.now() - processingStartTime,    const openaiKey = process.env.OPENAI_API_KEY;        serviceName: 'AssemblyAI',

          servicesUsed: successful.length,

          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,    const assemblyKey = process.env.ASSEMBLYAI_API_KEY;        text: 'This is a sample transcription from Assembly AI.',

          disagreementCount: 0

        }    const deepgramKey = process.env.DEEPGRAM_API_KEY;        confidence: 0.92,

      };

    }        processingTimeMs: 3200,



    return json({    // Initialize AI services        timestamp: new Date(),

      success: true,

      results: transcriptionResults,    const services: AudioProcessor[] = [];        metadata: { model: 'assembly-ai-best' }

      consensus: consensusResult

    });      },



  } catch (error) {    if (openaiKey) {      {

    console.error('API processing error:', error);

          services.push(new WhisperProcessor({ apiKey: openaiKey }));        id: 'deepgram-1',

    return json({

      success: false,    }        serviceName: 'Deepgram',

      error: error instanceof Error ? error.message : 'Unknown server error occurred'

    }, { status: 500 });        text: 'This is a sample transcription from Deepgram AI.',

  }

};    if (assemblyKey) {        confidence: 0.88,

      services.push(new AssemblyAIProcessor({ apiKey: assemblyKey }));        processingTimeMs: 2800,

    }        timestamp: new Date(),

        metadata: { model: 'deepgram-nova' }

    if (deepgramKey) {      }

      services.push(new DeepgramProcessor({ apiKey: deepgramKey }));    ];

    }



    if (services.length === 0) {

      return json({    // ========= REGENERATION BOUNDARY END: Multi-AI Processing =========

        success: false,

        error: 'No AI services configured. Please set up API keys in environment variables.'    // ========= REGENERATION BOUNDARY START: Consensus Calculation =========

      }, { status: 500 });    // @phazzie: This section can be regenerated independently

    }    // @contract: Must calculate consensus from multiple results

    // @dependencies: Comparison engine implementation

    // Process with all available services in parallel

    const processingStartTime = Date.now();



    const results = await Promise.allSettled(    // Placeholder for consensus calculation

      services.map(async (service) => {    const consensusResult = {

        try {      finalText: 'This is the consensus transcription from multiple AI services.',

          return await service.processFile(audioFileFromUser);      consensusConfidence: 0.92,

        } catch (error) {      individualResults: mockResults,

          // Return failed result instead of throwing      disagreements: [],

          return {      stats: {

            id: `${service.serviceName.toLowerCase()}-failed-${Date.now()}`,        totalProcessingTimeMs: 8500,

            serviceName: service.serviceName,        servicesUsed: 3,

            text: '',        averageConfidence: 0.92,

            confidence: 0,        disagreementCount: 0

            processingTimeMs: Date.now() - processingStartTime,      }

            timestamp: new Date(),    };

            metadata: {

              error: error instanceof Error ? error.message : 'Unknown error'

            }

          } as TranscriptionResult;    // ========= REGENERATION BOUNDARY END: Consensus Calculation =========

        }

      })

    );

    return json({

    // Extract actual results from Promise.allSettled      success: true,

    const transcriptionResults = results.map((result, index) => {      results: mockResults,

      if (result.status === 'fulfilled') {      consensus: consensusResult

        return result.value;    });

      } else {

        return {  } catch (error) {

          id: `${services[index].serviceName.toLowerCase()}-error-${Date.now()}`,

          serviceName: services[index].serviceName,

          text: '',

          confidence: 0,    return json({

          processingTimeMs: 0,      success: false,

          timestamp: new Date(),      error: 'REGENERATE_NEEDED: API processing'

          metadata: { error: 'Service completely failed' }    }, { status: 500 });

        } as TranscriptionResult;  }

      }};

    });

// ========= REGENERATION BOUNDARY END: API Handler =========

    // ========= REGENERATION BOUNDARY END: Multi-AI Processing =========

    // ========= REGENERATION BOUNDARY START: Consensus Calculation =========
    // @phazzie: This section can be regenerated independently
    // @contract: Must calculate consensus from multiple results
    // @dependencies: Comparison engine implementation

    // Calculate consensus from successful results
    const successful = transcriptionResults.filter(r => r.text && r.text.trim().length > 0);

    let consensusResult;
    if (successful.length === 0) {
      consensusResult = {
        finalText: '',
        consensusConfidence: 0,
        individualResults: transcriptionResults,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Date.now() - processingStartTime,
          servicesUsed: 0,
          averageConfidence: 0,
          disagreementCount: 0
        }
      };
    } else {
      // Simple confidence-based consensus
      const bestResult = successful.reduce((best, current) =>
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );

      // Calculate agreement based on length similarity
      const avgLength = successful.reduce((sum, r) => sum + r.text.length, 0) / successful.length;
      const agreementPercentage = Math.round(
        (successful.filter(r => Math.abs(r.text.length - avgLength) < avgLength * 0.3).length / successful.length) * 100
      );

      consensusResult = {
        finalText: bestResult.text,
        consensusConfidence: bestResult.confidence || 0,
        individualResults: transcriptionResults,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Date.now() - processingStartTime,
          servicesUsed: successful.length,
          averageConfidence: successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length,
          disagreementCount: 0
        }
      };
    }

    // ========= REGENERATION BOUNDARY END: Consensus Calculation =========

    return json({
      success: true,
      results: transcriptionResults,
      consensus: consensusResult
    });

  } catch (error) {
    console.error('API processing error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error occurred'
    }, { status: 500 });
  }
};

// ========= REGENERATION BOUNDARY END: API Handler =========