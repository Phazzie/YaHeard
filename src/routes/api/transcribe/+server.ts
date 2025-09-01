/**
 * @file +server.ts
 * @purpose API endpoint for transcription processing
 * @phazzie-status working
 * @last-regenerated 2025-09-01 - FIXED: Real AI integration
 * @dependencies processors.ts contracts, implementation files
 */

// Define RequestHandler type for SvelteKit API routes
interface RequestHandler {
  (event: { request: Request }): Promise<Response>;
}
import { json } from '@sveltejs/kit';
import { PERFORMANCE_CONFIG } from '../../../lib/config.js';

// REAL AI PROCESSOR IMPORTS - STEP 1 COMPLETE ✅
import { WhisperProcessor } from '../../../implementations/whisper.js';
import { AssemblyAIProcessor } from '../../../implementations/assembly.js';
import { DeepgramProcessor } from '../../../implementations/deepgram.js';
import { ElevenLabsProcessor } from '../../../implementations/elevenlabs.js';
import { GeminiProcessor } from '../../../implementations/gemini.js';
import { ConsensusComparisonEngine } from '../../../implementations/comparison.js';

// ========= REGENERATION BOUNDARY START: API Handler =========
// @phazzie: This section can be regenerated independently
// @contract: Must handle POST requests with audio files and return transcription results
// @dependencies: Audio processor implementations

export const POST: RequestHandler = async (event: { request: Request }) => {
  const { request } = event;
  console.log('@phazzie-checkpoint-api-1: Transcription API called');

  try {
    const formData = await request.formData();
    const audioFileFromUser = formData.get('audio') as File;

    if (!audioFileFromUser) {
      console.error('@phazzie-error: No audio file provided to API');
      return json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    console.log('@phazzie-checkpoint-api-2: Audio file received');
    console.log('@phazzie-checkpoint-api-3: File details:', {
      name: audioFileFromUser.name,
      size: audioFileFromUser.size,
      type: audioFileFromUser.type
    });

    // ========= REGENERATION BOUNDARY START: Multi-AI Processing =========
    // @phazzie: FIXED - Real AI implementation replacing mock data
    // @contract: Must process file with multiple AI services
    // @dependencies: Whisper, AssemblyAI, Deepgram implementations

    console.log('@phazzie-checkpoint-api-4: Starting REAL multi-AI processing');

    // STEP 3: REAL AI PROCESSING - Replace mock data with actual AI calls
    // Initialize AI processors with environment variables
    const processors = [];
    
    // Add processors only if API keys are available (graceful degradation)
    if (process.env.OPENAI_API_KEY) {
      processors.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));
    }
    
    if (process.env.ASSEMBLYAI_API_KEY) {
      processors.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));
    }
    
    if (process.env.DEEPGRAM_API_KEY) {
      processors.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));
    }

    if (process.env.ELEVENLABS_API_KEY) {
      processors.push(new ElevenLabsProcessor({ apiKey: process.env.ELEVENLABS_API_KEY }));
    }

    if (process.env.GEMINI_API_KEY) {
      processors.push(new GeminiProcessor({ apiKey: process.env.GEMINI_API_KEY }));
    }

    // Ensure we have at least one processor available
    if (processors.length === 0) {
      console.error('@phazzie-error: No AI service API keys configured');
      return json({
        success: false,
        error: 'No AI services configured. Please check API keys: OPENAI_API_KEY, ASSEMBLYAI_API_KEY, DEEPGRAM_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY'
      }, { status: 500 });
    }

    console.log(`@phazzie-checkpoint-api-4b: Initialized ${processors.length} AI processors`);

    // Process audio file with all available AI services in parallel
    // Use Promise.allSettled for fault tolerance - continue even if some services fail
    const processingPromises = processors.map(async (processor) => {
      try {
        console.log(`@phazzie-checkpoint-api-4c: Processing with ${processor.serviceName}`);
        
        // Add timeout wrapper for each processor to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS}ms`)), 
                    PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS);
        });
        
        const result = await Promise.race([
          processor.processFile(audioFileFromUser),
          timeoutPromise
        ]);
        
        console.log(`@phazzie-checkpoint-api-4d: ${processor.serviceName} completed successfully`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`@phazzie-error: ${processor.serviceName} failed: ${errorMessage}`);
        // Return null for failed services - will be filtered out
        return null;
      }
    });

    const processingResults = await Promise.allSettled(processingPromises);
    
    // Extract successful results and filter out failures
    const successfulResults = processingResults
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    // Ensure we have at least one successful result
    if (successfulResults.length === 0) {
      console.error('@phazzie-error: All AI services failed to process audio');
      return json({
        success: false,
        error: 'All AI services failed to process the audio file. Please try again or check audio format.'
      }, { status: 500 });
    }

    console.log(`@phazzie-checkpoint-api-5: AI processing completed - ${successfulResults.length}/${processors.length} services succeeded`);

    // ========= REGENERATION BOUNDARY END: Multi-AI Processing =========

    // ========= REGENERATION BOUNDARY START: Consensus Calculation =========
    // @phazzie: FIXED - Real consensus engine replacing mock calculation
    // @contract: Must calculate consensus from multiple results
    // @dependencies: Comparison engine implementation

    console.log('@phazzie-checkpoint-api-6: Calculating REAL consensus from', successfulResults.length, 'AI results');

    // STEP 4: REAL CONSENSUS ENGINE - Replace mock consensus with actual comparison
    try {
      const comparisonEngine = new ConsensusComparisonEngine();
      const consensusResult = comparisonEngine.compareTranscriptions(successfulResults);
      
      console.log('@phazzie-checkpoint-api-7: Consensus calculation completed successfully');
      console.log(`@phazzie-checkpoint-api-7b: Selected "${consensusResult.finalText.substring(0, 50)}..." with ${(consensusResult.consensusConfidence * 100).toFixed(1)}% confidence`);

      // ========= REGENERATION BOUNDARY END: Consensus Calculation =========

      // Return successful response with real AI consensus data
      console.log('@phazzie-checkpoint-api-8: Returning real AI consensus result');
      
      return json({
        success: true,
        result: consensusResult
      });

    } catch (consensusError) {
      console.error('@phazzie-error: Consensus calculation failed:', consensusError);
      
      // Fallback: Return the best individual result if consensus fails
      const bestResult = successfulResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      return json({
        success: true,
        result: {
          finalText: bestResult.text,
          consensusConfidence: bestResult.confidence,
          individualResults: successfulResults,
          disagreements: [],
          stats: {
            totalProcessingTimeMs: successfulResults.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0),
            servicesUsed: successfulResults.length,
            averageConfidence: successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length,
            disagreementCount: 0
          },
          reasoning: {
            steps: [{
              stepNumber: 1,
              description: `Fallback: Using best individual result from ${bestResult.serviceName} due to consensus engine error`,
              type: 'fallback' as const,
              data: { selectedService: bestResult.serviceName, confidence: bestResult.confidence },
              timestamp: new Date()
            }],
            decisionFactors: [],
            conflictResolution: [],
            qualityAssessment: [],
            finalReasoning: `Consensus engine failed, selected ${bestResult.serviceName} with ${(bestResult.confidence * 100).toFixed(1)}% confidence as fallback.`
          }
        }
      });
    }

  } catch (error) {
    console.error('@phazzie-error: API processing failed');
    console.error(error);

    return json({
      success: false,
      error: 'Unable to process audio file. Please try again or contact support if the issue persists.'
    }, { status: 500 });
  }
};

// ========= REGENERATION BOUNDARY END: API Handler =========