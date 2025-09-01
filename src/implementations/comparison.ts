/**
 * @file comparison.ts
 * @purpose Consensus comparison engine implementation
 * @phazzie-status working
 * @last-regenerated 2025-08-31
 * @dependencies processors.ts contract
 */

import type { ComparisonEngine, TranscriptionResult, ConsensusResult, Disagreement, ConsensusStats } from '../contracts/processors';

const AGREEMENT_THRESHOLD = 0.85; // Results with similarity below this are considered disagreements.

/**
 * A simplified comparison engine that selects the best transcription based on
 * average text similarity to other results.
 */
export class ConsensusComparisonEngine implements ComparisonEngine {
  public compareTranscriptions(results: TranscriptionResult[]): ConsensusResult {
    if (results.length === 0) {
      throw new Error('No valid transcription results provided for comparison.');
    }

    // If there's only one result, it's the consensus by default.
    if (results.length === 1) {
      const result = results[0];
      return {
        finalText: result.text,
        consensusConfidence: result.confidence ?? 0.75, // Default confidence for a single result
        individualResults: results,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: result.processingTimeMs,
          servicesUsed: 1,
          averageConfidence: result.confidence ?? 0,
          disagreementCount: 0
        },
        reasoning: {
          finalReasoning: 'Selected the only available transcription result.',
          steps: [{ stepNumber: 1, description: 'Only one result was provided.' }]
        }
      };
    }

    const consensusText = this.findBestConsensusText(results);
    const consensusConfidence = this.calculateConsensusConfidence(results, consensusText);
    const disagreements = this.findDisagreements(results, consensusText);
    const stats = this.calculateStats(results, disagreements);
    const selectedService = results.find(r => r.text === consensusText)?.serviceName || 'unknown';

    return {
      finalText: consensusText,
      consensusConfidence,
      individualResults: results,
      disagreements,
      stats,
      reasoning: {
        finalReasoning: `Selected text from "${selectedService}" based on the highest average text similarity.`,
        steps: [
          { stepNumber: 1, description: `Analyzed ${results.length} transcription results.` },
          { stepNumber: 2, description: 'Calculated pairwise text similarity to find the best consensus candidate.' },
          { stepNumber: 3, description: `Selected "${selectedService}" as the winner.` }
        ]
      }
    };
  }

  /**
   * Finds the transcription text that has the highest average similarity to all other transcriptions.
   */
  private findBestConsensusText(results: TranscriptionResult[]): string {
    const resultsWithScores = results.map(candidate => {
      const otherResults = results.filter(r => r.id !== candidate.id);
      const totalSimilarity = otherResults.reduce((sum, other) => {
        return sum + this.calculateLevenshteinSimilarity(candidate.text, other.text);
      }, 0);
      const averageSimilarity = otherResults.length > 0 ? totalSimilarity / otherResults.length : 1.0;
      return { text: candidate.text, score: averageSimilarity };
    });

    // Sort by similarity score, descending.
    resultsWithScores.sort((a, b) => b.score - a.score);
    return resultsWithScores[0].text;
  }

  /**
   * Calculates a simple confidence score based on the average similarity of the winning text
   * to all other results, weighted by the winner's own confidence if available.
   */
  private calculateConsensusConfidence(results: TranscriptionResult[], winningText: string): number {
    const winningResult = results.find(r => r.text === winningText)!;
    const otherResults = results.filter(r => r.text !== winningText);

    const averageSimilarity = otherResults.reduce((sum, other) => {
      return sum + this.calculateLevenshteinSimilarity(winningText, other.text);
    }, 0) / (otherResults.length || 1);

    // Weight the final confidence by the winner's own confidence score, if it exists.
    const winnerConfidence = winningResult.confidence;
    return winnerConfidence ? (averageSimilarity * 0.8) + (winnerConfidence * 0.2) : averageSimilarity;
  }

  /**
   * Identifies which results disagree with the winning text.
   */
  private findDisagreements(results: TranscriptionResult[], winningText: string): Disagreement[] {
    return results
      .filter(r => r.text !== winningText)
      .map(r => ({
        position: 0, // Simplified: disagreement is for the whole text
        serviceTexts: {
          [r.serviceName]: r.text,
          'consensus': winningText
        },
        severity: 1 - this.calculateLevenshteinSimilarity(r.text, winningText)
      }))
      .filter(d => d.severity > (1 - AGREEMENT_THRESHOLD));
  }

  /**
   * Calculates basic statistics about the consensus process.
   */
  private calculateStats(results: TranscriptionResult[], disagreements: Disagreement[]): ConsensusStats {
    const resultsWithConfidence = results.filter(r => r.confidence !== undefined);
    const averageConfidence = resultsWithConfidence.length > 0
      ? resultsWithConfidence.reduce((sum, r) => sum + r.confidence!, 0) / resultsWithConfidence.length
      : 0;

    return {
      totalProcessingTimeMs: Math.max(...results.map(r => r.processingTimeMs)),
      servicesUsed: results.length,
      averageConfidence,
      disagreementCount: disagreements.length
    };
  }

  /**
   * Calculates the similarity of two strings using the Levenshtein distance.
   * The result is a value between 0 (completely different) and 1 (identical).
   */
  private calculateLevenshteinSimilarity(a: string, b: string): number {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const maxLength = Math.max(a.length, b.length);
    const distance = this.levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j++) { matrix[j][0] = j; }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,        // Deletion
          matrix[j - 1][i] + 1,        // Insertion
          matrix[j - 1][i - 1] + cost  // Substitution
        );
      }
    }
    return matrix[b.length][a.length];
  }
}
