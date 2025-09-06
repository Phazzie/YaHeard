/**
 * @file comparison.ts
 * @purpose Advanced consensus comparison engine
 * @phazzie-status implemented-from-feedback
 * @last-regenerated 2025-09-01
 */

import type {
  ComparisonEngine,
  TranscriptionResult,
  ConsensusResult,
  Disagreement,
  ConsensusStats
} from '../contracts/processors';
import {
  validateConsensusResult,
  type AIReasoning,
  type ReasoningStep
} from '../contracts/transcription';
import { CONSENSUS_CONFIG } from '../lib/config';

/**
 * An advanced comparison engine that selects the best transcription based on a weighted
 * combination of text similarity, confidence scores, and other quality metrics.
 * This implementation is based on the feedback from PR #9.
 */
export class ConsensusComparisonEngine implements ComparisonEngine {
  public compareTranscriptions(results: TranscriptionResult[]): ConsensusResult {
    if (!results || results.length === 0) {
      throw new Error('No valid transcription results provided for comparison.');
    }

    // If there's only one result, it's the consensus by default.
    if (results.length === 1) {
      return this.createSingleResultConsensus(results[0]);
    }

    const validResults = results.filter(r => typeof r.text === 'string' && r.text.length > 0);
    if (validResults.length === 0) {
      throw new Error('All transcription results were empty or invalid.');
    }

    const consensusText = this.calculateConsensusText(validResults);
    const winningResult = validResults.find(r => r.text === consensusText);
    if (!winningResult) {
      // This should theoretically not happen if calculateConsensusText works correctly
      throw new Error('Consensus calculation failed: No winning result found.');
    }

    const consensusConfidence = this.calculateConsensusConfidence(validResults, consensusText);
    const disagreements = this.findDisagreements(validResults, consensusText);
    const stats = this.calculateStats(validResults, disagreements);
    const reasoning = this.buildReasoning(validResults, winningResult, consensusText, disagreements);

    const consensusResult: ConsensusResult = {
      finalText: consensusText,
      consensusConfidence,
      individualResults: validResults,
      disagreements,
      stats,
      reasoning,
    };

    if (!validateConsensusResult(consensusResult)) {
        console.warn("Consensus result failed validation", consensusResult);
        throw new Error("Generated an invalid ConsensusResult object.");
    }

    return consensusResult;
  }

  private createSingleResultConsensus(result: TranscriptionResult): ConsensusResult {
    const stats: ConsensusStats = {
      totalProcessingTimeMs: result.processingTimeMs,
      servicesUsed: 1,
      averageConfidence: result.confidence ?? 0,
      disagreementCount: 0,
    };

    const reasoning: AIReasoning = {
      finalReasoning: 'Selected the only available transcription result.',
      steps: [{ stepNumber: 1, description: 'Only one valid result was provided, so it was chosen as the consensus.' }],
    };

    return {
      finalText: result.text,
      consensusConfidence: result.confidence ?? 0.75, // Default confidence for a single result
      individualResults: [result],
      disagreements: [],
      stats,
      reasoning,
    };
  }

  /**
   * Calculates the consensus text using a similarity-first approach.
   */
  private calculateConsensusText(results: TranscriptionResult[]): string {
    const resultsWithScores = results.map(candidate => {
      const otherResults = results.filter(r => r.id !== candidate.id);
      const totalSimilarity = otherResults.reduce((sum, other) => {
        return sum + this.calculateEnhancedSimilarity(candidate.text, other.text);
      }, 0);
      const averageSimilarity = otherResults.length > 0 ? totalSimilarity / otherResults.length : 1.0;

      return {
        text: candidate.text,
        serviceName: candidate.serviceName,
        id: candidate.id,
        confidence: candidate.confidence,
        averageSimilarity,
      };
    });

    // Sort by similarity score, then confidence, then service name for stability
    resultsWithScores.sort((a, b) => {
      if (a.averageSimilarity !== b.averageSimilarity) {
        return b.averageSimilarity - a.averageSimilarity;
      }
      const confidenceA = a.confidence ?? 0;
      const confidenceB = b.confidence ?? 0;
      if (confidenceB !== confidenceA) {
        return confidenceB - confidenceA;
      }
      return a.serviceName.localeCompare(b.serviceName);
    });

    return resultsWithScores[0].text;
  }

  /**
   * Calculates a weighted confidence score for the consensus text.
   */
  private calculateConsensusConfidence(results: TranscriptionResult[], winningText: string): number {
    const winningResult = results.find(r => r.text === winningText)!;
    const otherResults = results.filter(r => r.text !== winningText);

    const averageSimilarity = otherResults.reduce((sum, other) => {
      return sum + this.calculateEnhancedSimilarity(winningText, other.text);
    }, 0) / (otherResults.length || 1);

    const winnerConfidence = winningResult.confidence;

    // Weighted average: 70% from similarity, 20% from winner's confidence, 10% from processing speed score
    const similarityComponent = averageSimilarity * CONSENSUS_CONFIG.DECISION_WEIGHTS.TEXT_SIMILARITY;

    const confidenceComponent = (winnerConfidence ?? this.getAverageConfidence(results)) * CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE;

    const processingScore = this.calculateProcessingScore(winningResult.processingTimeMs);
    const speedComponent = processingScore * CONSENSUS_CONFIG.DECISION_WEIGHTS.PROCESSING_SPEED;

    return Math.min(1.0, similarityComponent + confidenceComponent + speedComponent);
  }

  private findDisagreements(results: TranscriptionResult[], winningText: string): Disagreement[] {
    return results
      .filter(r => r.text !== winningText)
      .map(r => ({
        position: 0, // Simplified: disagreement is for the whole text
        serviceTexts: {
          [r.serviceName]: r.text,
          'consensus': winningText
        },
        severity: 1 - this.calculateEnhancedSimilarity(r.text, winningText)
      }))
      .filter(d => d.severity > (1 - CONSENSUS_CONFIG.AGREEMENT_THRESHOLD));
  }

  private calculateStats(results: TranscriptionResult[], disagreements: Disagreement[]): ConsensusStats {
    const averageConfidence = this.getAverageConfidence(results);

    return {
      totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs)),
      servicesUsed: results.length,
      averageConfidence,
      disagreementCount: disagreements.length
    };
  }

  private buildReasoning(results: TranscriptionResult[], winner: TranscriptionResult, consensusText: string, disagreements: Disagreement[]): AIReasoning {
    const steps: ReasoningStep[] = [];
    steps.push({
        stepNumber: 1,
        description: `Started consensus process with ${results.length} valid transcription results.`,
        data: { serviceNames: results.map(r => r.serviceName) }
    });
    steps.push({
        stepNumber: 2,
        description: "Calculated pairwise Levenshtein similarity for all results to find the best candidate.",
    });
    steps.push({
        stepNumber: 3,
        description: `Selected text from "${winner.serviceName}" as the winner based on the highest average similarity score.`,
        data: { winner: winner.serviceName, consensusText }
    });
    steps.push({
        stepNumber: 4,
        description: `Calculated final weighted consensus confidence score.`,
        data: { weights: CONSENSUS_CONFIG.DECISION_WEIGHTS }
    });
    if (disagreements.length > 0) {
        steps.push({
            stepNumber: 5,
            description: `Identified ${disagreements.length} disagreements with the consensus text.`,
            data: { disagreementCount: disagreements.length }
        });
    }

    const finalReasoning = `Selected text from "${winner.serviceName}" due to its high average similarity to other transcriptions. The final confidence score was weighted based on text similarity, the winner's own confidence, and processing speed.`;

    return { finalReasoning, steps };
  }

  private getAverageConfidence(results: TranscriptionResult[]): number {
    const resultsWithConfidence = results.filter(r => typeof r.confidence === 'number');
    if (resultsWithConfidence.length === 0) {
      return 0;
    }
    const sum = resultsWithConfidence.reduce((acc, r) => acc + r.confidence!, 0);
    return sum / resultsWithConfidence.length;
  }

  private calculateProcessingScore(processingTimeMs: number): number {
    if (processingTimeMs < CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) {
      return 1.0;
    }
    if (processingTimeMs > CONSENSUS_CONFIG.SLOW_PROCESSING_THRESHOLD) {
      return 0.0;
    }
    const range = CONSENSUS_CONFIG.SLOW_PROCESSING_THRESHOLD - CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD;
    const score = 1.0 - ((processingTimeMs - CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) / range);
    return score;
  }

  private calculateLevenshteinSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    const distance = this.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculates Jaccard similarity using word-level overlap detection.
   * This provides superior accuracy for transcription consensus by comparing
   * word sets rather than character sequences.
   */
  private calculateJaccardSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;

    // Tokenize into words and normalize
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(word => word.length > 0));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(word => word.length > 0));

    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    // Calculate intersection
    const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
    
    // Calculate union
    const union = new Set([...wordsA, ...wordsB]);

    // Jaccard similarity = |intersection| / |union|
    return intersection.size / union.size;
  }

  /**
   * Enhanced similarity calculation combining Levenshtein and Jaccard similarities.
   * Uses weighted approach: 60% Jaccard (word-level) + 40% Levenshtein (character-level)
   */
  private calculateEnhancedSimilarity(a: string, b: string): number {
    const jaccardSim = this.calculateJaccardSimilarity(a, b);
    const levenshteinSim = this.calculateLevenshteinSimilarity(a, b);
    
    // Weight: 60% word-level similarity, 40% character-level similarity
    return (jaccardSim * 0.6) + (levenshteinSim * 0.4);
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  }
}
