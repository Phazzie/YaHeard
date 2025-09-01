/**
 * @file comparison.ts
 * @purpose Consensus comparison engine implementation
 * @phazzie-status working
 * @last-regenerated 2025-08-31
 * @dependencies processors.ts contract
 */

import type { ComparisonEngine } from '../contracts/processors.ts';
import type { TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats, AIReasoning } from '../contracts/transcription.ts';
import { validateTranscriptionResult, validateConsensusResult } from '../contracts/transcription';
import { CONSENSUS_CONFIG, ERROR_CONFIG, PERFORMANCE_CONFIG, QUALITY_CONFIG } from '../lib/config';

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
      const consensusConfidence = this.calculateConsensusConfidence(validResults, consensusText);
      const disagreements = this.findDisagreements(validResults);
      const stats = this.calculateStats(validResults);
      const textSimilarities = this.calculateOverallTextSimilarity(validResults);
      const processingTimeAnalysis = this.analyzeProcessingTimes(validResults);
      const selectedService = validResults.find(r => r.text === consensusText)?.serviceName || 'unknown';

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
          favoredServices: validResults
            .filter(r => typeof r.confidence === 'number')
            .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
            .slice(0, 2)
            .map(r => r.serviceName)
        }
      ];

      const resultsWithConfidence = validResults.filter(r => typeof r.confidence === 'number');
      const avgConfidenceForQuality = resultsWithConfidence.length > 0
          ? resultsWithConfidence.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / resultsWithConfidence.length
          : 0.5; // Neutral default if no service provides confidence

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
            const confidenceValue = typeof result.confidence === 'number' ? result.confidence : avgConfidenceForQuality;
            const qualityScore = (confidenceValue * CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE) + (processingScore * CONSENSUS_CONFIG.DECISION_WEIGHTS.PROCESSING_SPEED);
            return {
              serviceName: result.serviceName,
              qualityScore,
              strengths: this.identifyServiceStrengths(result, validResults),
              weaknesses: this.identifyServiceWeaknesses(result, validResults),
              recommendation: this.getServiceRecommendation(result, validResults),
              analysisNotes: `Confidence: ${typeof result.confidence === 'number' ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}, Processing: ${result.processingTimeMs}ms, Text length: ${result.text.length} chars`
            };
          }),
          finalReasoning: this.generateFinalReasoning(validResults, consensusText, consensusConfidence, disagreements, textSimilarities)
        }
      };

      if (!validateConsensusResult(consensusResult)) {
        console.error('Generated consensus result failed validation:', consensusResult);
        // Do not throw error, but log it. The fallback below is better for user experience.
      }

      console.log('@phazzie-checkpoint-comparison-3: Consensus calculation completed');
      return consensusResult;

    } catch (error) {
      console.error('Error in consensus comparison:', error);
      const fallbackResult = results.find(r => r.text && r.text.trim().length > 0) || results[0];
      const fallbackAvgConfidence = (() => {
            const withConf = results.filter(r => r.confidence !== undefined);
            return withConf.length
              ? withConf.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / withConf.length
              : 0;
          })();
      return {
        finalText: fallbackResult?.text || '',
        consensusConfidence: fallbackResult?.confidence || 0,
        individualResults: results,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs || 0)),
          servicesUsed: results.length,
          averageConfidence: fallbackAvgConfidence,
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
    if (results.length === 1) {
        if(results[0].text && results[0].text.trim().length > 0) {
            return results[0].text;
        }
        return '';
    }

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

    resultsWithScores.sort((a, b) => {
      if (a.averageSimilarity !== b.averageSimilarity) {
        return b.averageSimilarity - a.averageSimilarity;
      }
      const confidenceA = a.confidence ?? 0;
      const confidenceB = b.confidence ?? 0;
      if (confidenceB !== confidenceA) {
        return confidenceB - confidenceA;
      }
      const tieBreakerA = a.serviceName ?? a.id ?? '';
      const tieBreakerB = b.serviceName ?? b.id ?? '';
      return tieBreakerA.localeCompare(tieBreakerB);
    });

    const bestResult = resultsWithScores[0];

    console.log('@phazzie-checkpoint-comparison-5: Selected text from', bestResult.serviceName,
                'with similarity score', bestResult.averageSimilarity.toFixed(3));

    return bestResult.text;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const len1 = text1.length;
    const len2 = text2.length;
    
    if (len1 === 0 && len2 === 0) return 1.0;
    if (len1 === 0 || len2 === 0) return 0.0;

    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  calculateConsensusConfidence(results: TranscriptionResult[], winningText: string): number {
    console.log('@phazzie-checkpoint-comparison-5: Calculating consensus confidence');

    if (results.length === 0) return 0;

    const winningResult = results.find(r => r.text === winningText);
    if (!winningResult) {
        console.warn("No winning result found in consensus calculation. This may indicate a logic error or data inconsistency.");
        throw new Error("Consensus calculation failed: No winning result found.");
    }

    if (results.length === 1) return winningResult.confidence ?? 0.75; // High neutral default for single results

    const otherResults = results.filter(r => r.id !== winningResult.id);
    if (otherResults.length === 0) return winningResult.confidence ?? 0.75; // Consistent with single result case

    const totalSimilarity = otherResults.reduce((sum, other) => {
      return sum + this.calculateTextSimilarity(winningText, other.text);
    }, 0);
    
    const averageSimilarity = totalSimilarity / otherResults.length;

    const winnerConfidence = winningResult.confidence;
    if (winnerConfidence !== undefined) {
      return (averageSimilarity * 0.8) + (winnerConfidence * 0.2);
    }

    return averageSimilarity;
  }

  findDisagreements(results: TranscriptionResult[]): Disagreement[] {
    console.log('@phazzie-checkpoint-comparison-6: Finding disagreements');

    const disagreements: Disagreement[] = [];
    if (results.length < 2) return disagreements;

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const result1 = results[i];
        const result2 = results[j];
        
        const similarity = this.calculateTextSimilarity(result1.text, result2.text);
        
        if (similarity < CONSENSUS_CONFIG.AGREEMENT_THRESHOLD) {
          const severity = 1 - similarity;
          
          disagreements.push({
            position: 0,
            serviceTexts: {
              [result1.serviceName]: result1.text,
              [result2.serviceName]: result2.text
            },
            severity: Math.min(1.0, severity)
          });
        }
      }
    }

    const uniqueDisagreements = disagreements.reduce((acc, current) => {
      const currentServices = Object.keys(current.serviceTexts).sort();
      const existing = acc.find(d => {
        const existingServices = Object.keys(d.serviceTexts).sort();
        return JSON.stringify(currentServices) === JSON.stringify(existingServices);
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

    const resultsWithConfidence = results.filter(r => typeof r.confidence === 'number');
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

  private calculateOverallTextSimilarity(results: TranscriptionResult[]): any {
    if (results.length < 2) return { averageSimilarity: 1.0, highSimilarity: [] };

    let totalSimilarity = 0;
    let comparisonCount = 0;
    const similarities: Array<{ services: string[], similarity: number }> = [];

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity = this.calculateTextSimilarity(results[i].text, results[j].text);
        totalSimilarity += similarity;
        comparisonCount++;
        
        similarities.push({
          services: [results[i].serviceName, results[j].serviceName],
          similarity
        });
      }
    }

    const averageSimilarity = comparisonCount > 0 ? totalSimilarity / comparisonCount : 1.0;
    
    const highSimilarity = similarities
      .filter(s => s.similarity > 0.8)
      .flatMap(s => s.services)
      .filter((service, index, array) => array.indexOf(service) === index);

    return { averageSimilarity, highSimilarity, similarities };
  }

  private analyzeProcessingTimes(results: TranscriptionResult[]): any {
    const times = results.map(r => r.processingTimeMs || 0);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const fastestServices = results
      .filter(r => (r.processingTimeMs || 0) <= minTime * 1.1) 
      .map(r => r.serviceName);

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
    const maxReasonableTime = PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS;
    const fastThreshold = CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD;

    if (processingTimeMs <= fastThreshold) return 1.0;
    if (processingTimeMs >= maxReasonableTime) return 0.1;

    return 1.0 - ((processingTimeMs - fastThreshold) / (maxReasonableTime - fastThreshold)) * 0.9;
  }

  private identifyServiceStrengths(result: TranscriptionResult, allResults: TranscriptionResult[]): string[] {
    const strengths: string[] = [];

    if ((result.confidence ?? 0) > CONSENSUS_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
      strengths.push('Excellent confidence score');
    } else if ((result.confidence ?? 0) > CONSENSUS_CONFIG.ACCEPTABLE_CONFIDENCE_THRESHOLD) {
      strengths.push('Good confidence score');
    }

    if ((result.processingTimeMs || 0) < CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) {
      strengths.push('Fast processing speed');
    }

    const avgLength = allResults.reduce((sum, r) => sum + r.text.length, 0) / allResults.length;
    if (result.text.length > avgLength * 1.1) {
      strengths.push('Detailed transcription');
    }

    if (result.metadata?.language && result.metadata.language !== 'unknown') {
      strengths.push('Language detection');
    }

    return strengths;
  }

  private identifyServiceWeaknesses(result: TranscriptionResult, allResults: TranscriptionResult[]): string[] {
    const weaknesses: string[] = [];

    if (result.confidence !== undefined && result.confidence < CONSENSUS_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
      weaknesses.push('Low confidence score');
    } else if (result.confidence === undefined) {
      weaknesses.push('Missing confidence score');
    }

    if ((result.processingTimeMs || 0) > PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS * 0.5) {
      weaknesses.push('Slow processing');
    }

    const avgLength = allResults.reduce((sum, r) => sum + r.text.length, 0) / allResults.length;
    if (result.text.length < avgLength * 0.8) {
      weaknesses.push('Shorter than average result');
    }

    if (result.text.trim().length === 0) {
      weaknesses.push('Empty transcription');
    }

    return weaknesses;
  }

  private getServiceRecommendation(result: TranscriptionResult, allResults: TranscriptionResult[]): 'preferred' | 'acceptable' | 'avoid' {
    // Calculate average confidence from services that provide it, or use neutral 0.5
    const resultsWithConfidence = allResults.filter(r => r.confidence !== undefined);
    const avgConfidence = resultsWithConfidence.length 
      ? resultsWithConfidence.reduce((s, r) => s + (r.confidence ?? 0), 0) / resultsWithConfidence.length
      : 0.5; // neutral default
    
    const confidence = (result.confidence !== undefined) ? result.confidence : avgConfidence;
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
