import { v as validateConsensusResult } from "./transcription.js";
const CONSENSUS_CONFIG = {
  /** Threshold for determining agreement between services (as percentage of average text length) */
  AGREEMENT_THRESHOLD: 0.3,
  /** Processing time threshold for "fast" services (milliseconds) */
  FAST_PROCESSING_THRESHOLD: 5e3,
  /** Processing time threshold for "slow" services (milliseconds) */
  SLOW_PROCESSING_THRESHOLD: 1e4,
  /** Decision factor weights for consensus calculation */
  DECISION_WEIGHTS: {
    TEXT_SIMILARITY: 0.7,
    CONFIDENCE_SCORE: 0.2,
    PROCESSING_SPEED: 0.1
  },
  /** Similarity algorithm weights for enhanced comparison */
  SIMILARITY_WEIGHTS: {
    JACCARD_WEIGHT: 0.6,
    // Word-level similarity weight
    LEVENSHTEIN_WEIGHT: 0.4
    // Character-level similarity weight
  }
};
const PERFORMANCE_CONFIG = {
  /** Maximum file size allowed for upload (bytes) - from original config */
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
  // 25MB - Vercel limit
  /** Timeout for individual AI service processing (milliseconds) */
  SERVICE_TIMEOUT_MS: 45e3,
  // 45 seconds - optimized for AI service response times
  /** Maximum number of reasoning steps to store */
  MAX_REASONING_STEPS: 100,
  /** Memory threshold for large object warnings (bytes) */
  LARGE_OBJECT_THRESHOLD: 1024 * 1024
  // 1MB
};
class ConsensusComparisonEngine {
  compareTranscriptions(results) {
    if (!results || results.length === 0) {
      throw new Error("No valid transcription results provided for comparison.");
    }
    if (results.length === 1) {
      return this.createSingleResultConsensus(results[0]);
    }
    const validResults = results.filter((r) => typeof r.text === "string" && r.text.length > 0);
    if (validResults.length === 0) {
      throw new Error("All transcription results were empty or invalid.");
    }
    const consensusText = this.calculateConsensusText(validResults);
    const winningResult = validResults.find((r) => r.text === consensusText);
    if (!winningResult) {
      throw new Error("Consensus calculation failed: No winning result found.");
    }
    const consensusConfidence = this.calculateConsensusConfidence(validResults, consensusText);
    const disagreements = this.findDisagreements(validResults, consensusText);
    const stats = this.calculateStats(validResults, disagreements);
    const reasoning = this.buildReasoning(validResults, winningResult, consensusText, disagreements);
    const consensusResult = {
      finalText: consensusText,
      consensusConfidence,
      individualResults: validResults,
      disagreements,
      stats,
      reasoning
    };
    if (!validateConsensusResult(consensusResult)) {
      console.warn("Consensus result failed validation", consensusResult);
      throw new Error("Generated an invalid ConsensusResult object.");
    }
    return consensusResult;
  }
  createSingleResultConsensus(result) {
    const stats = {
      totalProcessingTimeMs: result.processingTimeMs,
      servicesUsed: 1,
      averageConfidence: result.confidence ?? 0,
      disagreementCount: 0
    };
    const reasoning = {
      finalReasoning: "Selected the only available transcription result.",
      steps: [{ stepNumber: 1, description: "Only one valid result was provided, so it was chosen as the consensus." }]
    };
    return {
      finalText: result.text,
      consensusConfidence: result.confidence ?? 0.75,
      // Default confidence for a single result
      individualResults: [result],
      disagreements: [],
      stats,
      reasoning
    };
  }
  /**
   * Calculates the consensus text using a similarity-first approach.
   */
  calculateConsensusText(results) {
    const resultsWithScores = results.map((candidate) => {
      const otherResults = results.filter((r) => r.id !== candidate.id);
      const totalSimilarity = otherResults.reduce((sum, other) => {
        return sum + this.calculateEnhancedSimilarity(candidate.text, other.text);
      }, 0);
      const averageSimilarity = otherResults.length > 0 ? totalSimilarity / otherResults.length : 1;
      return {
        text: candidate.text,
        serviceName: candidate.serviceName,
        id: candidate.id,
        confidence: candidate.confidence,
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
      return a.serviceName.localeCompare(b.serviceName);
    });
    return resultsWithScores[0].text;
  }
  /**
   * Calculates a weighted confidence score for the consensus text.
   */
  calculateConsensusConfidence(results, winningText) {
    const winningResult = results.find((r) => r.text === winningText);
    const otherResults = results.filter((r) => r.text !== winningText);
    const averageSimilarity = otherResults.reduce((sum, other) => {
      return sum + this.calculateEnhancedSimilarity(winningText, other.text);
    }, 0) / (otherResults.length || 1);
    const winnerConfidence = winningResult.confidence;
    const similarityComponent = averageSimilarity * CONSENSUS_CONFIG.DECISION_WEIGHTS.TEXT_SIMILARITY;
    const confidenceComponent = (winnerConfidence ?? this.getAverageConfidence(results)) * CONSENSUS_CONFIG.DECISION_WEIGHTS.CONFIDENCE_SCORE;
    const processingScore = this.calculateProcessingScore(winningResult.processingTimeMs);
    const speedComponent = processingScore * CONSENSUS_CONFIG.DECISION_WEIGHTS.PROCESSING_SPEED;
    return Math.min(1, similarityComponent + confidenceComponent + speedComponent);
  }
  findDisagreements(results, winningText) {
    return results.filter((r) => r.text !== winningText).map((r) => ({
      position: 0,
      // Simplified: disagreement is for the whole text
      serviceTexts: {
        [r.serviceName]: r.text,
        "consensus": winningText
      },
      severity: 1 - this.calculateEnhancedSimilarity(r.text, winningText)
    })).filter((d) => d.severity > 1 - CONSENSUS_CONFIG.AGREEMENT_THRESHOLD);
  }
  calculateStats(results, disagreements) {
    const averageConfidence = this.getAverageConfidence(results);
    return {
      totalProcessingTimeMs: Math.max(...results.map((r) => r.processingTimeMs)),
      servicesUsed: results.length,
      averageConfidence,
      disagreementCount: disagreements.length
    };
  }
  buildReasoning(results, winner, consensusText, disagreements) {
    const steps = [];
    steps.push({
      stepNumber: 1,
      description: `Started consensus process with ${results.length} valid transcription results.`,
      data: { serviceNames: results.map((r) => r.serviceName) }
    });
    steps.push({
      stepNumber: 2,
      description: "Calculated pairwise Levenshtein similarity for all results to find the best candidate."
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
  getAverageConfidence(results) {
    const resultsWithConfidence = results.filter((r) => typeof r.confidence === "number");
    if (resultsWithConfidence.length === 0) {
      return 0;
    }
    const sum = resultsWithConfidence.reduce((acc, r) => acc + r.confidence, 0);
    return sum / resultsWithConfidence.length;
  }
  calculateProcessingScore(processingTimeMs) {
    if (processingTimeMs < CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) {
      return 1;
    }
    if (processingTimeMs > CONSENSUS_CONFIG.SLOW_PROCESSING_THRESHOLD) {
      return 0;
    }
    const range = CONSENSUS_CONFIG.SLOW_PROCESSING_THRESHOLD - CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD;
    const score = 1 - (processingTimeMs - CONSENSUS_CONFIG.FAST_PROCESSING_THRESHOLD) / range;
    return score;
  }
  calculateLevenshteinSimilarity(a, b) {
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
  calculateJaccardSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((word) => word.length > 0));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((word) => word.length > 0));
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    const intersection = new Set([...wordsA].filter((word) => wordsB.has(word)));
    const union = /* @__PURE__ */ new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }
  /**
   * Enhanced similarity calculation combining Levenshtein and Jaccard similarities.
   * Uses configurable weighted approach from CONSENSUS_CONFIG
   */
  calculateEnhancedSimilarity(a, b) {
    const jaccardSim = this.calculateJaccardSimilarity(a, b);
    const levenshteinSim = this.calculateLevenshteinSimilarity(a, b);
    const { JACCARD_WEIGHT, LEVENSHTEIN_WEIGHT } = CONSENSUS_CONFIG.SIMILARITY_WEIGHTS;
    return jaccardSim * JACCARD_WEIGHT + levenshteinSim * LEVENSHTEIN_WEIGHT;
  }
  levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }
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
function getClientIP(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return null;
}
function checkRateLimit(clientIP) {
  return { allowed: true };
}
function validateCsrfFromForm(formData, csrfCookie) {
  const csrfToken = formData.get("csrfToken") || "";
  return Boolean(csrfCookie) && csrfToken === csrfCookie;
}
function validateCsrfFromJson(body, csrfCookie) {
  const csrfToken = body?.csrfToken || "";
  return Boolean(csrfCookie) && csrfToken === csrfCookie;
}
export {
  ConsensusComparisonEngine as C,
  PERFORMANCE_CONFIG as P,
  validateCsrfFromForm as a,
  checkRateLimit as c,
  getClientIP as g,
  validateCsrfFromJson as v
};
