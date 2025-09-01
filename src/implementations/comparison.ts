/**
 * @file comparison.ts
 * @purpose Consensus comparison engine implementation
 * @phazzie-status needs-regeneration
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies processors.ts contract
 */

import type { ComparisonEngine } from '../contracts/processors.ts';
import type { TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats, AIReasoning } from '../contracts/transcription.ts';
import { validateTranscriptionResult, validateConsensusResult } from '../contracts/transcription.js';
import { CONSENSUS_CONFIG, ERROR_CONFIG, PERFORMANCE_CONFIG, QUALITY_CONFIG } from '../lib/config.js';

// ========= REGENERATION BOUNDARY START: Comparison Engine Implementation =========
// @phazzie: This entire file can be regenerated independently
// @contract: Must implement ComparisonEngine interface
// @dependencies: processors.ts contract

export class ConsensusComparisonEngine implements ComparisonEngine {
  compareTranscriptions(results: TranscriptionResult[]): ConsensusResult {
    console.log('@phazzie-checkpoint-comparison-1: Starting consensus comparison');

    try {
      // Validate input data
      const validResults = results.filter(result => {
        const isValid = validateTranscriptionResult(result);
        if (!isValid && result) {
          console.warn(`Invalid transcription result from ${(result as any)?.serviceName || 'unknown service'}:`, result);
        }
        return isValid;
      });

      if (validResults.length === 0) {
        throw new Error('No valid transcription results provided for comparison');
      }

      console.log('@phazzie-checkpoint-comparison-2: Building consensus from', validResults.length, 'valid results');

      const consensusText = this.calculateConsensusText(validResults);
      const consensusConfidence = this.calculateConsensusConfidence(validResults);
      const disagreements = this.findDisagreements(validResults);
      const stats = this.calculateStats(validResults);

      const textSimilarities = this.calculateOverallTextSimilarity(validResults);
      const processingTimeAnalysis = this.analyzeProcessingTimes(validResults);
      
      const consensusResult: ConsensusResult = {
        finalText: consensusText,
        consensusConfidence,
        individualResults: validResults,
        disagreements,
        stats,
        reasoning: {
          steps: [
            {
              stepNumber: 1,
              description: `Processed ${validResults.length} valid transcription results (${results.length - validResults.length} invalid results filtered out)`,
              type: 'analysis',
              data: { 
                resultCount: validResults.length,
                filteredCount: results.length - validResults.length,
                validationErrors: results.length - validResults.length > 0,
                averageConfidence: validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
              },
              timestamp: new Date()
            },
            {
              stepNumber: 2,
              description: `Analyzed text similarity and processing performance across services`,
              type: 'comparison',
              data: { 
                textSimilarity: textSimilarities,
                processingAnalysis: processingTimeAnalysis,
                disagreementCount: disagreements.length
              },
              timestamp: new Date()
            },
            {
              stepNumber: 3,
              description: `Applied enhanced consensus algorithm with confidence and similarity weighting`,
              type: 'decision',
              data: {
                algorithm: 'confidence-similarity-hybrid',
                consensusConfidence: consensusConfidence,
                selectedService: validResults.find(r => r.text === consensusText)?.serviceName
              },
              timestamp: new Date()
            }
          ],
          decisionFactors: [
            {
              factor: 'Confidence Score',
              weight: CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE,
              impact: 'Primary factor for result selection with 70% weight',
              favoredServices: validResults.sort((a, b) => b.confidence - a.confidence).slice(0, 2).map(r => r.serviceName)
            },
            {
              factor: 'Text Similarity',
              weight: 0.3,
              impact: 'Secondary factor ensuring consensus among similar results',
              favoredServices: textSimilarities.highSimilarity || []
            },
            {
              factor: 'Processing Speed',
              weight: CONSENSUS_CONFIG.DECISION_WEIGHTS.PROCESSING_SPEED,
              impact: processingTimeAnalysis.impact,
              favoredServices: processingTimeAnalysis.fastestServices
            }
          ],
          conflictResolution: disagreements.length > 0 ? [{
            conflictingServices: validResults.map(r => r.serviceName),
            conflictDescription: `${disagreements.length} disagreements found with average severity ${(disagreements.reduce((sum, d) => sum + d.severity, 0) / disagreements.length).toFixed(2)}`,
            resolutionMethod: 'Confidence-weighted selection with similarity validation',
            chosenResult: consensusText.substring(0, 50) + (consensusText.length > 50 ? '...' : ''),
            resolutionConfidence: consensusConfidence
          }] : [],
          qualityAssessment: validResults.map(result => {
            const relativeConfidence = result.confidence / Math.max(...validResults.map(r => r.confidence));
            const processingScore = this.calculateProcessingScore(result.processingTimeMs);
            
            return {
              serviceName: result.serviceName,
              qualityScore: (result.confidence * 0.7) + (processingScore * 0.3),
              strengths: this.identifyServiceStrengths(result, validResults),
              weaknesses: this.identifyServiceWeaknesses(result, validResults),
              recommendation: this.getServiceRecommendation(result, validResults),
              analysisNotes: `Confidence: ${(result.confidence * 100).toFixed(1)}% (${(relativeConfidence * 100).toFixed(0)}% relative), Processing: ${result.processingTimeMs}ms, Text length: ${result.text.length} chars`
            };
          }),
          finalReasoning: this.generateFinalReasoning(validResults, consensusText, consensusConfidence, disagreements, textSimilarities)
        }
      };

      // Validate output
      if (!validateConsensusResult(consensusResult)) {
        console.error('Generated consensus result failed validation:', consensusResult);
        throw new Error('Generated consensus result is invalid');
      }

      console.log('@phazzie-checkpoint-comparison-3: Consensus calculation completed');
      return consensusResult;

    } catch (error) {
      console.error('Error in consensus comparison:', error);
      
      // Return fallback result
      const fallbackResult = results.find(r => r.text && r.text.trim().length > 0) || results[0];
      
      return {
        finalText: fallbackResult?.text || '',
        consensusConfidence: fallbackResult?.confidence || 0,
        individualResults: results,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs || 0)),
          servicesUsed: results.length,
          averageConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length,
          disagreementCount: 0
        },
        reasoning: {
          steps: [{
            stepNumber: 1,
            description: 'Consensus calculation failed, using fallback selection',
            type: 'analysis',
            data: { error: error instanceof Error ? error.message : 'Unknown error' },
            timestamp: new Date()
          }],
          decisionFactors: [],
          conflictResolution: [],
          qualityAssessment: [],
          finalReasoning: `Consensus calculation encountered an error. Using fallback result: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  private calculateConsensusText(results: TranscriptionResult[]): string {
    console.log('@phazzie-checkpoint-comparison-4: Calculating consensus text from', results.length, 'results');

    // Handle edge cases first - no results or single result
    if (results.length === 0) return '';
    if (results.length === 1) return results[0].text;

    // CONSENSUS ALGORITHM: Confidence-Similarity Hybrid Selection
    // ===========================================================
    // This algorithm balances two key factors:
    // 1. CONFIDENCE: How sure each AI service is about its result (0.0-1.0)
    // 2. SIMILARITY: How much the top results agree with each other
    //
    // WHY THIS APPROACH:
    // - Pure confidence selection can pick outliers when one AI is overconfident
    // - Pure similarity can favor mediocre results if they all agree poorly  
    // - Hybrid approach ensures both quality and consensus validation

    // STEP 1: Sort by confidence to identify the most confident results
    // ================================================================
    // We start with confidence as the primary signal because:
    // - AI services provide calibrated confidence scores
    // - Higher confidence usually correlates with better transcription quality
    // - Creates a baseline of "probably good" results to validate
    const sortedByConfidence = [...results].sort((a, b) => b.confidence - a.confidence);
    const primaryCandidate = sortedByConfidence[0]; // The most confident result

    // STEP 2: Analyze top candidates for text similarity
    // ==================================================  
    // We only look at the top 3 results (or all if fewer) because:
    // - Lower confidence results are unlikely to be optimal anyway
    // - Reduces computational complexity for large service counts
    // - Focuses similarity analysis on viable candidates
    const topResults = sortedByConfidence.slice(0, Math.min(3, results.length));
    
    // Calculate similarity and combined scores for each top candidate
    const similarityScores = topResults.map(result => {
      // Text similarity: How much this result agrees with the top confidence result
      const similarity = this.calculateTextSimilarity(primaryCandidate.text, result.text);
      
      // COMBINED SCORE FORMULA: 70% confidence + 30% similarity
      // ======================================================
      // Confidence gets higher weight (0.7) because:
      // - Individual AI confidence is a strong signal of transcription quality
      // - Similarity is validation, not the primary decision factor
      // - This ratio prevents low-confidence results from winning just because they're similar
      const combinedScore = result.confidence * 0.7 + similarity * 0.3;
      
      return {
        result,
        similarity,
        combinedScore
      };
    });

    // STEP 3: Select the result with the best combined score
    // =====================================================
    // This ensures we get the result that is both:
    // - Highly confident (AI thinks it did well)  
    // - Similar to other top results (consensus validation)
    const bestResult = similarityScores.reduce((best, current) => 
      current.combinedScore > best.combinedScore ? current : best
    );

    console.log('@phazzie-checkpoint-comparison-5: Selected text from', bestResult.result.serviceName, 
                'with combined score', bestResult.combinedScore.toFixed(3));

    return bestResult.result.text;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // TEXT SIMILARITY ALGORITHM: Word-Based Overlap Analysis
    // ======================================================
    // This algorithm measures how similar two transcription texts are by analyzing
    // the overlap of words between them. It's simpler than Levenshtein distance
    // but more robust than character-based comparison for speech transcription.
    //
    // WHY WORD-BASED APPROACH:
    // - Speech transcription differences are usually at word level, not character level
    // - Different AI services may use different punctuation but same words
    // - More tolerant of minor formatting differences (spaces, capitalization)
    // - Computationally efficient for real-time consensus calculation

    const len1 = text1.length;
    const len2 = text2.length;
    
    // Handle edge cases: empty texts
    if (len1 === 0 && len2 === 0) return 1.0; // Both empty = perfect match
    if (len1 === 0 || len2 === 0) return 0.0; // One empty = no similarity

    // STEP 1: Normalize and tokenize the texts
    // ========================================
    // Convert to lowercase to ignore capitalization differences
    // Split on whitespace to get individual words
    // This handles: "Hello World" vs "hello world" as identical
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    // STEP 2: Find common words between the texts
    // ===========================================
    // Use filter + includes for word overlap detection
    // This counts each word once, regardless of repetition frequency
    // Example: ["the", "cat"] vs ["the", "dog"] = 1 common word ("the")
    const commonWords = words1.filter(word => words2.includes(word));
    
    // STEP 3: Calculate similarity ratio
    // ==================================
    // Use the longer text as denominator to prevent inflation from short texts
    // Formula: common_words / max(words1, words2)
    // This ensures: short text matching part of long text gets appropriate score
    const totalWords = Math.max(words1.length, words2.length);
    
    // SIMILARITY SCORE INTERPRETATION:
    // 1.0 = Perfect match (all words identical)
    // 0.8+ = Very high similarity (minor differences)  
    // 0.5+ = Moderate similarity (same topic, different words)
    // 0.3+ = Low similarity (some common words)
    // 0.0 = No similarity (completely different)
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  calculateConsensusConfidence(results: TranscriptionResult[]): number {
    console.log('@phazzie-checkpoint-comparison-5: Calculating consensus confidence');

    if (results.length === 0) return 0;

    // CONSENSUS CONFIDENCE ALGORITHM: Variance-Adjusted Average
    // =========================================================
    // This algorithm calculates how confident we should be in the final consensus
    // by considering both individual AI confidence and agreement between services.
    //
    // WHY THIS APPROACH:
    // - Individual confidence alone can be misleading (overconfident AI)
    // - Agreement between services indicates reliable transcription
    // - Low variance (high agreement) should boost consensus confidence
    // - High variance (disagreement) should reduce consensus confidence

    // STEP 1: Calculate base confidence from individual AI services
    // ============================================================
    // Simple average gives equal weight to all AI services
    // This assumes all AI services are equally reliable (can be enhanced later)
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // STEP 2: Calculate confidence variance (measure of agreement)
    // ===========================================================
    // Low variance = AI services agree on confidence levels = more reliable
    // High variance = AI services disagree on confidence = less reliable
    const confidenceVariance = this.calculateConfidenceVariance(results);
    
    // STEP 3: Apply agreement bonus for low variance
    // =============================================
    // Agreement bonus formula: max(0, 0.1 - variance)
    // - If variance is 0 (perfect agreement): bonus = 0.1 (10% boost)
    // - If variance is 0.05 (good agreement): bonus = 0.05 (5% boost)  
    // - If variance is 0.1+ (poor agreement): bonus = 0 (no boost)
    //
    // WHY 0.1 THRESHOLD:
    // - Confidence scores typically range 0.7-0.95 for good transcriptions
    // - Variance of 0.1 means standard deviation of ~0.32, indicating disagreement
    // - Below 0.1 variance suggests services generally agree on quality
    const agreementBonus = Math.max(0, 0.1 - confidenceVariance);

    // FINAL CONFIDENCE CALCULATION:
    // =============================
    // Final = base_average + agreement_bonus (capped at 1.0)
    // This ensures consensus confidence reflects both individual quality and agreement
    return Math.min(1.0, averageConfidence + agreementBonus);
  }

  private calculateConfidenceVariance(results: TranscriptionResult[]): number {
    // CONFIDENCE VARIANCE CALCULATION: Standard Deviation of AI Confidence Scores  
    // ==========================================================================
    // This measures how much AI services disagree about their confidence levels.
    // Used to determine if there's consensus about transcription quality.
    //
    // LOW VARIANCE (< 0.05): Services agree on quality → boost consensus confidence
    // HIGH VARIANCE (> 0.1): Services disagree on quality → reduce consensus confidence

    if (results.length <= 1) return 0; // Can't calculate variance with single result

    // Calculate mean confidence across all AI services
    const mean = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    // Calculate variance: average of squared differences from mean
    const variance = results.reduce((sum, r) => sum + Math.pow(r.confidence - mean, 2), 0) / results.length;

    // Return standard deviation (square root of variance)
    // This gives us a measure in the same units as confidence scores (0.0-1.0)
    return Math.sqrt(variance);
  }

  findDisagreements(results: TranscriptionResult[]): Disagreement[] {
    console.log('@phazzie-checkpoint-comparison-6: Finding disagreements');

    // DISAGREEMENT DETECTION ALGORITHM: Pairwise Similarity Analysis
    // ==============================================================
    // This algorithm identifies when AI services produce significantly different
    // transcriptions by comparing every pair of results for text similarity.
    //
    // PURPOSE:
    // - Identify potential transcription quality issues
    // - Provide transparency about AI service disagreements
    // - Help users understand consensus reliability
    // - Enable manual review of contested transcriptions

    const disagreements: Disagreement[] = [];
    if (results.length < 2) return disagreements; // Need at least 2 results to compare

    // STEP 1: Pairwise comparison of all transcription results
    // =======================================================
    // We compare every possible pair of AI service results to find disagreements
    // Example with 3 services: A vs B, A vs C, B vs C (3 comparisons)
    // Example with 4 services: A vs B, A vs C, A vs D, B vs C, B vs D, C vs D (6 comparisons)
    //
    // WHY PAIRWISE: 
    // - Captures all possible disagreements between services
    // - Allows severity scoring based on how different the texts are
    // - Enables specific identification of which services disagree
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const result1 = results[i];
        const result2 = results[j];
        
        // STEP 2: Calculate text similarity between this pair
        // ==================================================
        // Use the same similarity algorithm as consensus calculation
        // This ensures consistency in how we measure agreement/disagreement
        const similarity = this.calculateTextSimilarity(result1.text, result2.text);
        
        // STEP 3: Determine if this constitutes a disagreement
        // ===================================================
        // AGREEMENT_THRESHOLD (typically 0.3) defines minimum acceptable similarity
        // Below this threshold = significant disagreement requiring attention
        //
        // WHY 0.3 THRESHOLD:
        // - 0.3 means only 30% word overlap between transcriptions
        // - Indicates genuinely different interpretations of the audio
        // - Allows for minor differences (articles, prepositions) while catching major issues
        if (similarity < CONSENSUS_CONFIG.AGREEMENT_THRESHOLD) {
          // STEP 4: Calculate disagreement severity
          // ======================================
          // Severity = 1 - similarity (inverse relationship)
          // - similarity 0.0 → severity 1.0 (maximum disagreement)
          // - similarity 0.2 → severity 0.8 (high disagreement) 
          // - similarity 0.29 → severity 0.71 (moderate disagreement just below threshold)
          const severity = 1 - similarity;
          
          // STEP 5: Create disagreement record
          // =================================
          // Record which services disagreed, their exact texts, and severity
          // Position could be enhanced later to show where in the text disagreement occurs
          disagreements.push({
            position: 0, // Future enhancement: could identify specific word positions where disagreement starts
            serviceTexts: {
              [result1.serviceName]: result1.text,
              [result2.serviceName]: result2.text
            },
            severity: Math.min(1.0, severity) // Cap at 1.0 for safety
          });
        }
      }
    }

    // Remove duplicate disagreements (same services, similar severity)
    const uniqueDisagreements = disagreements.reduce((acc, current) => {
      const existing = acc.find(d => {
        const currentServices = Object.keys(current.serviceTexts).sort();
        const existingServices = Object.keys(d.serviceTexts).sort();
        return JSON.stringify(currentServices) === JSON.stringify(existingServices) &&
               Math.abs(d.severity - current.severity) < 0.1;
      });
      
      if (!existing) {
        acc.push(current);
      }
      
      return acc;
    }, [] as Disagreement[]);

    console.log('@phazzie-checkpoint-comparison-7: Found', uniqueDisagreements.length, 'unique disagreements');
    return uniqueDisagreements;
  }

  private calculateStats(results: TranscriptionResult[]): ConsensusStats {
    console.log('@phazzie-checkpoint-comparison-8: Calculating statistics');

    const totalProcessingTime = results.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0);
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs || 0)),
      servicesUsed: results.length,
      averageConfidence,
      disagreementCount: this.findDisagreements(results).length
    };
  }

  // ========= ENHANCED ANALYSIS METHODS =========

  private calculateOverallTextSimilarity(results: TranscriptionResult[]): any {
    // OVERALL SIMILARITY ANALYSIS: Cross-Service Agreement Measurement
    // ================================================================
    // This algorithm analyzes how much all AI services agree with each other
    // by calculating similarity between every possible pair of transcriptions.
    //
    // PURPOSE:
    // - Measure overall consensus quality across all AI services
    // - Identify which services produce similar results (high agreement)
    // - Provide aggregate similarity metrics for decision making
    // - Support reasoning explanation with agreement statistics

    if (results.length < 2) return { averageSimilarity: 1.0, highSimilarity: [] };

    // STEP 1: Pairwise similarity calculation for all service combinations
    // ===================================================================
    // Same pairwise logic as disagreement detection, but focused on aggregate metrics
    // We collect all similarities to calculate overall agreement patterns
    let totalSimilarity = 0;
    let comparisonCount = 0;
    const similarities: Array<{ services: string[], similarity: number }> = [];

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity = this.calculateTextSimilarity(results[i].text, results[j].text);
        totalSimilarity += similarity;
        comparisonCount++;
        
        // Store individual comparison for detailed analysis
        similarities.push({
          services: [results[i].serviceName, results[j].serviceName],
          similarity
        });
      }
    }

    // STEP 2: Calculate average similarity across all pairs
    // ====================================================
    // This gives us the overall agreement level between AI services
    // High average (>0.8) = Strong consensus, reliable transcription
    // Medium average (0.5-0.8) = Moderate consensus, some differences
    // Low average (<0.5) = Poor consensus, significant disagreements
    const averageSimilarity = comparisonCount > 0 ? totalSimilarity / comparisonCount : 1.0;
    
    // STEP 3: Identify services with high similarity relationships
    // ===========================================================
    // Find services that frequently produce similar results (>0.8 similarity)
    // These services can be considered more reliable or consistent
    const highSimilarity = similarities
      .filter(s => s.similarity > 0.8) // High similarity threshold
      .flatMap(s => s.services) // Extract service names from pairs
      .filter((service, index, array) => array.indexOf(service) === index); // Remove duplicates

    return { averageSimilarity, highSimilarity, similarities };
  }

  private analyzeProcessingTimes(results: TranscriptionResult[]): any {
    // PROCESSING TIME ANALYSIS: Performance Assessment Across AI Services
    // ==================================================================== 
    // This algorithm analyzes processing speed performance to factor into
    // service quality assessment and consensus decision making.
    //
    // PURPOSE:
    // - Identify fastest and slowest AI services
    // - Factor processing speed into service recommendations
    // - Provide performance transparency in AI reasoning
    // - Support load balancing and service selection decisions

    const times = results.map(r => r.processingTimeMs || 0);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // STEP 1: Identify fastest services (within 10% of minimum time)
    // =============================================================
    // We use a 10% tolerance because:
    // - Network latency can cause small timing variations
    // - Services within 10% are effectively equivalent in speed
    // - Avoids over-optimizing for minimal speed differences
    const fastestServices = results
      .filter(r => (r.processingTimeMs || 0) <= minTime * 1.1) 
      .map(r => r.serviceName);

    // STEP 2: Determine processing speed impact on decision making
    // ===========================================================
    // Fast processing gets factored into service quality assessment
    // This creates incentive for using faster services when quality is similar
    const impact = minTime < CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD 
      ? 'Fast processing contributed to selection' 
      : 'Processing speed was not a significant factor';

    return {
      averageTime: avgTime,
      minTime,
      maxTime,
      fastestServices,
      impact
    };
  }

  private calculateProcessingScore(processingTimeMs: number): number {
    // PROCESSING SPEED SCORING: Convert Processing Time to Quality Score
    // ==================================================================
    // This algorithm converts raw processing time (milliseconds) into a normalized
    // quality score (0.0-1.0) that can be factored into overall service assessment.
    //
    // PURPOSE:
    // - Reward faster AI services in quality assessment
    // - Provide consistent scoring across different processing times  
    // - Balance speed vs accuracy in consensus decisions
    // - Enable performance-based service recommendations

    const maxReasonableTime = PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS; // Maximum acceptable time
    const fastThreshold = CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD; // What we consider "fast"

    // SCORING LOGIC:
    // - Processing ≤ fast threshold: Perfect score (1.0)
    // - Processing ≥ max time: Minimum score (0.1) 
    // - Between thresholds: Linear decay from 1.0 to 0.1
    if (processingTimeMs <= fastThreshold) return 1.0;
    if (processingTimeMs >= maxReasonableTime) return 0.1;

    // Linear decay formula: 1.0 - (excess_time / time_range) * 0.9
    // This ensures score drops from 1.0 to 0.1 as time increases from fast to max
    return 1.0 - ((processingTimeMs - fastThreshold) / (maxReasonableTime - fastThreshold)) * 0.9;
  }

  private identifyServiceStrengths(result: TranscriptionResult, allResults: TranscriptionResult[]): string[] {
    // SERVICE STRENGTH IDENTIFICATION: Analyze AI Service Performance Advantages
    // =========================================================================
    // This algorithm identifies what each AI service does well compared to others
    // and in absolute terms. Used for service recommendations and transparency.
    //
    // STRENGTH CATEGORIES:
    // 1. CONFIDENCE PERFORMANCE: High confidence scores indicate reliable transcription
    // 2. PROCESSING SPEED: Fast processing improves user experience
    // 3. TRANSCRIPTION DETAIL: Longer transcriptions may capture more nuance
    // 4. FEATURE CAPABILITIES: Language detection, metadata extraction, etc.

    const strengths: string[] = [];

    // CONFIDENCE STRENGTH ANALYSIS
    // ===========================
    // High confidence suggests the AI service is very sure about its transcription
    // We use two thresholds to distinguish excellent vs good performance
    if (result.confidence > CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      strengths.push('Excellent confidence score');
    } else if (result.confidence > CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) {
      strengths.push('Good confidence score');
    }

    // PROCESSING SPEED STRENGTH ANALYSIS  
    // ==================================
    // Fast processing improves user experience and system scalability
    // Services under the fast threshold get recognized for speed
    if ((result.processingTimeMs || 0) < CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) {
      strengths.push('Fast processing speed');
    }

    // TRANSCRIPTION DETAIL ANALYSIS
    // =============================
    // Compare transcription length to average across all services
    // 10% longer than average suggests more detailed/complete transcription
    // This can indicate better audio analysis or more thorough processing
    const avgLength = allResults.reduce((sum, r) => sum + r.text.length, 0) / allResults.length;
    if (result.text.length > avgLength * 1.1) {
      strengths.push('Detailed transcription');
    }

    // FEATURE CAPABILITY ANALYSIS
    // ===========================
    // Services that provide additional features like language detection
    // get recognized for enhanced capabilities beyond basic transcription
    if (result.metadata?.language && result.metadata.language !== 'unknown') {
      strengths.push('Language detection');
    }

    return strengths;
  }

  private identifyServiceWeaknesses(result: TranscriptionResult, allResults: TranscriptionResult[]): string[] {
    // SERVICE WEAKNESS IDENTIFICATION: Analyze AI Service Performance Issues
    // =====================================================================
    // This algorithm identifies areas where AI services underperform, enabling
    // honest assessment and informed service selection decisions.
    //
    // WEAKNESS CATEGORIES:
    // 1. LOW CONFIDENCE: Service unsure about transcription quality
    // 2. SLOW PROCESSING: Poor user experience and scalability  
    // 3. INCOMPLETE TRANSCRIPTION: Shorter than expected results
    // 4. FAILURE CASES: Empty or invalid transcriptions

    const weaknesses: string[] = [];

    // CONFIDENCE WEAKNESS ANALYSIS
    // ===========================
    // Low confidence suggests the AI service struggled with the audio
    // This could indicate poor audio quality, language issues, or service limitations
    if (result.confidence < CONSENSUS_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
      weaknesses.push('Low confidence score');
    }

    // PROCESSING SPEED WEAKNESS ANALYSIS
    // =================================
    // PROCESSING SPEED WEAKNESS ANALYSIS
    // =================================
    // Slow processing (>50% of timeout threshold) indicates performance issues
    // This affects user experience and system responsiveness
    if ((result.processingTimeMs || 0) > PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS * 0.5) {
      weaknesses.push('Slow processing');
    }

    // TRANSCRIPTION COMPLETENESS ANALYSIS
    // ===================================
    // Compare transcription length to average across all services
    // 20% shorter than average may indicate incomplete processing
    // This could suggest audio quality issues or service limitations
    const avgLength = allResults.reduce((sum, r) => sum + r.text.length, 0) / allResults.length;
    if (result.text.length < avgLength * 0.8) {
      weaknesses.push('Shorter than average result');
    }

    // FAILURE CASE ANALYSIS
    // ====================
    // Empty transcriptions indicate complete processing failure
    // This is the most severe weakness category
    if (result.text.trim().length === 0) {
      weaknesses.push('Empty transcription');
    }

    return weaknesses;
  }

  private getServiceRecommendation(result: TranscriptionResult, allResults: TranscriptionResult[]): 'preferred' | 'acceptable' | 'avoid' {
    // SERVICE RECOMMENDATION ENGINE: Quality-Based Service Classification
    // ==================================================================
    // This algorithm classifies AI services into recommendation categories based
    // on combined confidence and performance metrics for user guidance.
    //
    // SCORING METHODOLOGY:
    // - 70% weight on transcription confidence (accuracy indicator)
    // - 30% weight on processing speed score (user experience factor)
    // - Combined score determines recommendation tier
    //
    // RECOMMENDATION TIERS:
    // - PREFERRED: High-quality, reliable services (score ≥ preferred threshold)
    // - ACCEPTABLE: Adequate services with limitations (score ≥ acceptable threshold)
    // - AVOID: Poor performance services (score < acceptable threshold)

    // Calculate hybrid quality score combining accuracy and performance
    const qualityScore = (result.confidence * 0.7) + (this.calculateProcessingScore(result.processingTimeMs || 0) * 0.3);

    // Apply recommendation thresholds for user-friendly classification
    if (qualityScore >= QUALITY_CONFIG.QUALITY_THRESHOLDS.PREFERRED) return 'preferred';
    if (qualityScore >= QUALITY_CONFIG.QUALITY_THRESHOLDS.ACCEPTABLE) return 'acceptable';
    return 'avoid';
  }

  private generateFinalReasoning(
    validResults: TranscriptionResult[], 
    consensusText: string, 
    consensusConfidence: number, 
    disagreements: any[],
    textSimilarities: any
  ): string {
    // FINAL REASONING GENERATOR: Comprehensive Decision Explanation
    // ============================================================
    // This algorithm creates human-readable explanations of the consensus
    // decision process, helping users understand AI selection rationale.
    //
    // EXPLANATION COMPONENTS:
    // 1. SELECTION SUMMARY: Which service was chosen and why
    // 2. CONSENSUS QUALITY: How well services agreed with each other
    // 3. DISAGREEMENT ANALYSIS: Areas of significant AI differences
    // 4. CONFIDENCE ASSESSMENT: Overall reliability of the result
    // 5. SERVICE PERFORMANCE: Individual AI service evaluations

    // SELECTED SERVICE IDENTIFICATION
    // ==============================
    // Find which AI service provided the consensus text
    // This helps users understand the primary source of the transcription
    const selectedService = validResults.find(r => r.text === consensusText)?.serviceName || 'unknown';
    const avgSimilarity = textSimilarities.averageSimilarity || 0;

    // CORE SELECTION REASONING
    // =======================
    // Start with the fundamental decision: which service and confidence level
    let reasoning = `Selected ${selectedService} transcription with ${(consensusConfidence * 100).toFixed(1)}% confidence from ${validResults.length} valid results. `;

    // CONSENSUS QUALITY ANALYSIS
    // =========================
    // High similarity indicates strong agreement between AI services
    // This builds user confidence in the transcription accuracy
    if (avgSimilarity > 0.8) {
      reasoning += `High text similarity (${(avgSimilarity * 100).toFixed(1)}%) indicates strong consensus. `;
    } else if (avgSimilarity < 0.5) {
      reasoning += `Low text similarity (${(avgSimilarity * 100).toFixed(1)}%) indicates significant disagreement between services. `;
    }

    // DISAGREEMENT RESOLUTION TRANSPARENCY
    // ===================================
    // Report how conflicts between AI services were resolved
    // This transparency helps users understand reliability limitations
    if (disagreements.length > 0) {
      reasoning += `Resolved ${disagreements.length} disagreements using confidence-weighted selection with similarity validation. `;
    } else {
      reasoning += `No significant disagreements detected between services. `;
    }

    // HIGH CONFIDENCE SERVICE COUNT
    // ============================
    // Count services that achieved high confidence scores
    // Multiple high-confidence services increase overall reliability
    const highConfidenceCount = validResults.filter(r => r.confidence > CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD).length;
    if (highConfidenceCount > 0) {
      reasoning += `${highConfidenceCount} service${highConfidenceCount > 1 ? 's' : ''} achieved high confidence scores. `;
    }

    return reasoning;
  }
}

// ========= REGENERATION BOUNDARY END: Comparison Engine Implementation =========