/**
 * Answer quality detection and evaluation for RAG responses
 */
import { ConfidenceAssessment } from './types';

/**
 * Threshold values for different quality levels
 */
const THRESHOLDS = {
  LOW_CONFIDENCE: 0.4, // Below this is considered low confidence
  CALLBACK_THRESHOLD: 0.3, // Below this should trigger callback option
  MIN_CITATIONS: 2, // Minimum number of citations for a reliable answer
};

/**
 * Determine if the response quality is insufficient and requires a callback
 * 
 * @param confidence - Confidence assessment from the RAG system
 * @param citationsCount - Number of citations in the response
 * @param responseContent - The actual response content to analyze
 * @returns Object with needsCallback flag and reason
 */
export function detectLowQualityAnswer(
  confidence: ConfidenceAssessment | undefined,
  citationsCount: number = 0,
  responseContent: string = ''
): { needsCallback: boolean; reason: string } {
  // Case 1: No confidence score available (RAG might have failed)
  if (!confidence) {
    return {
      needsCallback: true,
      reason: 'No confidence information available from knowledge retrieval'
    };
  }

  // Case 2: Very low confidence score
  if (confidence.score < THRESHOLDS.CALLBACK_THRESHOLD) {
    return {
      needsCallback: true,
      reason: `Very low confidence score (${(confidence.score * 100).toFixed(1)}%)`
    };
  }

  // Case 3: Low confidence and few citations
  if (confidence.score < THRESHOLDS.LOW_CONFIDENCE && citationsCount < THRESHOLDS.MIN_CITATIONS) {
    return {
      needsCallback: true,
      reason: `Low confidence with insufficient citations (${citationsCount})`
    };
  }

  // Case 4: Response contains uncertainty indicators
  const uncertaintyIndicators = [
    "I don't have enough information",
    "I cannot provide a definitive answer",
    "insufficient information",
    "unable to determine",
    "I'm not sure",
    "I don't know",
    "more information is needed"
  ];

  if (uncertaintyIndicators.some(phrase => responseContent.toLowerCase().includes(phrase.toLowerCase()))) {
    return {
      needsCallback: true,
      reason: 'Response indicates uncertainty or incomplete information'
    };
  }

  // Answer quality is acceptable
  return {
    needsCallback: false,
    reason: 'Answer quality is acceptable'
  };
}

/**
 * Get a more detailed assessment of the answer quality
 * 
 * @param confidence - Confidence assessment from the RAG system
 * @param citationsCount - Number of citations in the response
 * @param responseContent - The actual response content to analyze
 * @returns Detailed quality assessment
 */
export function getAnswerQualityAssessment(
  confidence: ConfidenceAssessment | undefined,
  citationsCount: number = 0,
  responseContent: string = ''
): {
  qualityLevel: 'high' | 'medium' | 'low' | 'insufficient';
  score: number;
  explanation: string;
} {
  if (!confidence) {
    return {
      qualityLevel: 'insufficient',
      score: 0,
      explanation: 'No confidence information available'
    };
  }

  const { score } = confidence;
  
  // Calculate a weighted quality score
  const citationWeight = Math.min(citationsCount / THRESHOLDS.MIN_CITATIONS, 1) * 0.3;
  const contentLength = responseContent.length;
  const contentWeight = Math.min(contentLength / 500, 1) * 0.1; // Longer responses may have more value
  
  // Final quality score (70% confidence, 30% citations)
  const qualityScore = (score * 0.6) + citationWeight + contentWeight;
  
  // Determine quality level
  let qualityLevel: 'high' | 'medium' | 'low' | 'insufficient';
  let explanation: string;
  
  if (qualityScore >= 0.8) {
    qualityLevel = 'high';
    explanation = `High quality answer with good confidence (${(score * 100).toFixed(1)}%) and ${citationsCount} citations`;
  } else if (qualityScore >= 0.5) {
    qualityLevel = 'medium';
    explanation = `Medium quality answer with moderate confidence (${(score * 100).toFixed(1)}%) and ${citationsCount} citations`;
  } else if (qualityScore >= THRESHOLDS.CALLBACK_THRESHOLD) {
    qualityLevel = 'low';
    explanation = `Low quality answer with limited confidence (${(score * 100).toFixed(1)}%) and ${citationsCount} citations`;
  } else {
    qualityLevel = 'insufficient';
    explanation = `Insufficient answer quality with poor confidence (${(score * 100).toFixed(1)}%)`;
  }
  
  return {
    qualityLevel,
    score: qualityScore,
    explanation
  };
} 