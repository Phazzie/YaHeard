import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ResultsDisplay from './ResultsDisplay.svelte';
import type { ConsensusResult, TranscriptionResult } from '../../contracts/transcription';

// Mock the AIInsights child component to isolate the ResultsDisplay component
vi.mock('./AIInsights.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    // Mock Svelte component lifecycle methods if needed, for now an empty object is fine
  })),
}));

// Helper to create mock data
const createMockConsensus = (): ConsensusResult => ({
  finalText: 'This is the final consensus text.',
  consensusConfidence: 0.98,
  individualResults: [],
  disagreements: [],
  stats: {
    totalProcessingTimeMs: 2000,
    servicesUsed: 2,
    averageConfidence: 0.95,
    disagreementCount: 1,
  },
  reasoning: {
    finalReasoning: 'This is why.',
    steps: [],
  },
});

const createMockResults = (): TranscriptionResult[] => ([
  { id: 'r1', serviceName: 'ServiceA', text: 'This is text from A.', confidence: 0.99, processingTimeMs: 1800, timestamp: new Date() },
  { id: 'r2', serviceName: 'ServiceB', text: 'This is text from B.', confidence: 0.91, processingTimeMs: 2000, timestamp: new Date() },
]);


describe('ResultsDisplay.svelte', () => {
  it('should render the initial "Ready" message when no results are provided', () => {
    render(ResultsDisplay, { props: { results: [], consensus: null } });
    expect(screen.getByText('Ready for Audio Magic')).toBeInTheDocument();
  });

  it('should render the summary statistics when results are provided', () => {
    const mockResults = createMockResults();
    render(ResultsDisplay, { props: { results: mockResults, consensus: null } });

    expect(screen.getByText('🤖 AI Services')).toBeInTheDocument();
    // The value rendered is results.length
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display the consensus text in the Overview tab when a consensus is provided', async () => {
    const mockConsensus = createMockConsensus();
    render(ResultsDisplay, { props: { results: [], consensus: mockConsensus } });

    // Default tab is Overview
    expect(screen.getByText('Consensus Transcription')).toBeInTheDocument();
    expect(screen.getByText(mockConsensus.finalText)).toBeInTheDocument();
    // Check for formatted confidence
    expect(screen.getByText('98.0%')).toBeInTheDocument();
  });

  it('should display individual results in the Detailed tab', async () => {
    const mockResults = createMockResults();
    render(ResultsDisplay, { props: { results: mockResults, consensus: null } });

    const detailedTabButton = screen.getByRole('button', { name: /detailed/i });
    await fireEvent.click(detailedTabButton);

    expect(screen.getByText('Individual AI Results')).toBeInTheDocument();
    expect(screen.getByText('ServiceA')).toBeInTheDocument();
    expect(screen.getByText('This is text from A.')).toBeInTheDocument();
    expect(screen.getByText('ServiceB')).toBeInTheDocument();
    expect(screen.getByText('This is text from B.')).toBeInTheDocument();
  });

  it('should render the AIInsights component when the Insights tab is clicked', async () => {
    const mockConsensus = createMockConsensus();
    render(ResultsDisplay, { props: { results: createMockResults(), consensus: mockConsensus } });

    const insightsTabButton = screen.getByRole('button', { name: /ai insights/i });
    await fireEvent.click(insightsTabButton);

    // Check if the mocked AIInsights component was rendered
    // Since we can't see inside the mock, we check if the container is there.
    const insightsContainer = document.querySelector('.ai-insights');
    expect(insightsContainer).toBeInTheDocument();
  });
});
