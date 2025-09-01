/**
 * @file comparison.ts
 * @purpose Consensus comparison engine implementation
 * @phazzie-status needs-regeneration
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies processors.ts contract
 */

import type { ComparisonEngine } from '../contracts/processors.ts';
import type { TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats, AIReasoning } from '../contracts/transcription.ts';
import { validateTranscriptionResult, validateConsensusResult } from '../contracts/transcription';
import { CONSENSUS_CONFIG, ERROR_CONFIG, PERFORMANCE_CONFIG, QUALITY_CONFIG } from '../lib/config';

// ========= REGENERATION BOUNDARY START: Comparison Engine Implementation =========
// @phazzie: This entire file can be regenerated independently
// @contract: Must implement ComparisonEngine interface
// @dependencies: processors.ts contract

export class ConsensusComparisonEngine implements ComparisonEngine {
  compareTranscriptions(results: TranscriptionResult[]): ConsensusResult {
    console.log('@phazzie-checkpoint-comparison-1: Starting consensus comparison');

    try {
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
      const selectedService = validResults.find(r => r.text === consensusText)?.serviceName || 'unknown';

      // Create a list of decision factors based on the new algorithm
      const decisionFactors = [
        {
          factor: 'Text Similarity',
          weight: CONSENSUS_CONFIG.DECISION_WEIGHTS.TEXT_SIMILARITY,
          impact: 'Primary factor for result selection, finding the text with the highest average agreement.',
          favoredServices: [selectedService]
        },
        {
          factor: 'Confidence Score',
          weight: CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE,
          impact: 'Used as a secondary factor or tie-breaker. Only applies to services that provide a score.',
          favoredServices: validResults.filter(r => r.confidence).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 2).map(r => r.serviceName)
        }
      ];

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
              description: `Processed ${validResults.length} valid transcription results.`,
              type: 'analysis',
              data: { resultCount: validResults.length },
              timestamp: new Date()
            },
            {
              stepNumber: 2,
              description: 'Calculated average text similarity for each result to find the best consensus.',
              type: 'comparison',
              data: {
                averageSimilarity: textSimilarities.averageSimilarity,
                disagreementCount: disagreements.length
              },
              timestamp: new Date()
            },
            {
              stepNumber: 3,
              description: 'Applied "Similarity-First" consensus algorithm.',
              type: 'decision',
              data: {
                algorithm: 'similarity-first-hybrid',
                consensusConfidence: consensusConfidence,
                selectedService: selectedService
              },
              timestamp: new Date()
            }
          ],
          decisionFactors,
          conflictResolution: disagreements.length > 0 ? [{
            conflictingServices: validResults.map(r => r.serviceName),
            conflictDescription: `${disagreements.length} disagreements found.`,
            resolutionMethod: 'Chose the result with the highest average similarity to all other results.',
            chosenResult: consensusText.substring(0, 50) + (consensusText.length > 50 ? '...' : ''),
            resolutionConfidence: consensusConfidence
          }] : [],
          qualityAssessment: validResults.map(result => {
            const processingScore = this.calculateProcessingScore(result.processingTimeMs);
            const qualityScore = (result.confidence ? (result.confidence * 0.7) : 0.5) + (processingScore * 0.3);
            return {
              serviceName: result.serviceName,
              qualityScore,
              strengths: this.identifyServiceStrengths(result, validResults),
              weaknesses: this.identifyServiceWeaknesses(result, validResults),
              recommendation: this.getServiceRecommendation(result, validResults),
              analysisNotes: `Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}, Processing: ${result.processingTimeMs}ms, Text length: ${result.text.length} chars`
            };
          }),
          finalReasoning: this.generateFinalReasoning(validResults, consensusText, consensusConfidence, disagreements, textSimilarities)
        }
      };

      if (!validateConsensusResult(consensusResult)) {
        console.error('Generated consensus result failed validation:', consensusResult);
        throw new Error('Generated consensus result is invalid');
      }

      console.log('@phazzie-checkpoint-comparison-3: Consensus calculation completed');
      return consensusResult;

    } catch (error) {
      console.error('Error in consensus comparison:', error);
      const fallbackResult = results.find(r => r.text && r.text.trim().length > 0) || results[0];
      return {
        finalText: fallbackResult?.text || '',
        consensusConfidence: fallbackResult?.confidence || 0,
        individualResults: results,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs || 0)),
          servicesUsed: results.length,
          averageConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / (results.filter(r => r.confidence).length || 1),
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

    if (results.length === 0) return '';
    if (results.length === 1) return results[0].text;

    // CONSENSUS ALGORITHM: Similarity-First Hybrid Selection
    // ======================================================
    // This new algorithm prioritizes agreement between services.
    // 1. SIMILARITY: Find the text that is most similar to all other texts.
    // 2. CONFIDENCE: Use the service's confidence score (if available) as a tie-breaker.
    //
    // WHY THIS APPROACH:
    // - It's a true "consensus" algorithm, favoring agreement above all.
    // - It's robust against services that don't provide confidence scores.
    // - It prevents a single, overconfident service from dominating the results.

    // STEP 1: Calculate average similarity for each result
    // ====================================================
    const resultsWithScores = results.map(candidate => {
      const otherResults = results.filter(r => r.id !== candidate.id);
      const totalSimilarity = otherResults.reduce((sum, other) => {
        return sum + this.calculateTextSimilarity(candidate.text, other.text);
      }, 0);
      const averageSimilarity = otherResults.length > 0 ? totalSimilarity / otherResults.length : 1.0;

      return {
        ...candidate,
        averageSimilarity
      };
    });

    // STEP 2: Sort by the new scoring model
    // =====================================
    // Primary sort key: averageSimilarity (descending)
    // Secondary sort key: confidence (descending, use a default for undefined)
    resultsWithScores.sort((a, b) => {
      if (a.averageSimilarity !== b.averageSimilarity) {
        return b.averageSimilarity - a.averageSimilarity;
      }
      // Similarity is the same, use confidence as a tie-breaker
      const confidenceA = a.confidence ?? 0;
      const confidenceB = b.confidence ?? 0;
      return confidenceB - confidenceA;
    });

    const bestResult = resultsWithScores[0];

    console.log('@phazzie-checkpoint-comparison-5: Selected text from', bestResult.serviceName,
                'with similarity score', bestResult.averageSimilarity.toFixed(3));

    return bestResult.text;
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
    if (results.length === 1) return results[0].confidence ?? 0.5;

    // CONSENSUS CONFIDENCE ALGORITHM: Similarity-Based Confidence
    // ===========================================================
    // The confidence in our consensus is a measure of how much the chosen
    // result agrees with the other results. A high degree of similarity
    // with other services implies a high-quality, reliable consensus.

    // STEP 1: Find the winning text using the main consensus algorithm
    // ================================================================
    const winningText = this.calculateConsensusText(results);
    const winningResult = results.find(r => r.text === winningText);
    if (!winningResult) return 0; // Should not happen

    // STEP 2: Calculate the winner's average similarity to all other results
    // ======================================================================
    const otherResults = results.filter(r => r.id !== winningResult.id);
    if (otherResults.length === 0) return winningResult.confidence ?? 1.0;

    const totalSimilarity = otherResults.reduce((sum, other) => {
      return sum + this.calculateTextSimilarity(winningText, other.text);
    }, 0);
    
    const averageSimilarity = totalSimilarity / otherResults.length;

    // STEP 3: Blend with the winner's native confidence, if it exists
    // ===============================================================
    // The final confidence is primarily the similarity score, but we can
    // factor in the winning service's own confidence as a bonus.
    const winnerConfidence = winningResult.confidence;
    if (winnerConfidence !== undefined) {
      // Hybrid score: 80% from consensus agreement, 20% from service's own confidence
      return (averageSimilarity * 0.8) + (winnerConfidence * 0.2);
    }

    // If the winner has no confidence score, the consensus confidence is purely its similarity score.
    return averageSimilarity;
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

    const resultsWithConfidence = results.filter(r => r.confidence !== undefined);
    const averageConfidence = resultsWithConfidence.length > 0
      ? resultsWithConfidence.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / resultsWithConfidence.length
      : 0;

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
    if ((result.confidence ?? 0) > CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      strengths.push('Excellent confidence score');
    } else if ((result.confidence ?? 0) > CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) {
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
    if ((result.confidence ?? 1.0) < CONSENSUS_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
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

    // Use confidence if available, otherwise use a neutral default (0.7)
    const confidence = result.confidence ?? 0.7;
    const qualityScore = (confidence * CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE) + (this.calculateProcessingScore(result.processingTimeMs || 0) * CONSENSUS_CONFIG.DECISION_WEIGHTS.PROCESSING_SPEED);

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
    // decision process based on the "Similarity-First" model.

    const selectedService = validResults.find(r => r.text === consensusText)?.serviceName || 'unknown';
    const avgSimilarity = textSimilarities.averageSimilarity || 0;

    let reasoning = `Selected transcription from "${selectedService}" based on the highest average text similarity of ${(avgSimilarity * 100).toFixed(1)}%. `;
    reasoning += `The final consensus confidence is ${(consensusConfidence * 100).toFixed(1)}%. `;

    if (disagreements.length > 0) {
      reasoning += `Found and resolved ${disagreements.length} disagreements. `;
    } else {
      reasoning += 'All services produced highly similar results. ';
    }

    const servicesWithConfidence = validResults.filter(r => r.confidence !== undefined);
    if (servicesWithConfidence.length > 0) {
      reasoning += `Confidence scores from ${servicesWithConfidence.length} service(s) were used as a secondary tie-breaker.`;
    } else {
      reasoning += 'No services provided confidence scores.';
    }

    return reasoning;
  }
}

// ========= REGENERATION BOUNDARY END: Comparison Engine Implementation =========