import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import AIInsights from './AIInsights.svelte';
import type { AIReasoning } from '../../contracts/transcription';

// Helper to create mock AIReasoning data
const createMockReasoning = (stepCount: number): AIReasoning => ({
  finalReasoning: 'This is the final decision summary.',
  steps: Array.from({ length: stepCount }, (_, i) => ({
    stepNumber: i + 1,
    description: `This is step number ${i + 1}.`,
    data: { info: `data for step ${i + 1}` },
  })),
});

describe('AIInsights.svelte', () => {
  it('should render the "unavailable" message when reasoning is null', () => {
    render(AIInsights, { props: { reasoning: null } });
    expect(screen.getByText('AI Reasoning Unavailable')).toBeInTheDocument();
  });

  it('should render the reasoning summary and steps when data is provided', () => {
    const mockReasoning = createMockReasoning(3);
    render(AIInsights, { props: { reasoning: mockReasoning } });

    expect(screen.getByText('AI Decision Summary')).toBeInTheDocument();
    expect(screen.getByText('This is the final decision summary.')).toBeInTheDocument();
    expect(screen.getByText('This is step number 1.')).toBeInTheDocument();
    expect(screen.getByText('This is step number 2.')).toBeInTheDocument();
    expect(screen.getByText('This is step number 3.')).toBeInTheDocument();
  });

  it('should only show the first few steps and a "Show More" button if there are many steps', () => {
    const mockReasoning = createMockReasoning(10); // More than the INITIAL_STEPS_SHOWN of 5
    render(AIInsights, { props: { reasoning: mockReasoning } });

    expect(screen.getByText('This is step number 5.')).toBeInTheDocument();
    expect(screen.queryByText('This is step number 6.')).not.toBeInTheDocument();

    const showMoreButton = screen.getByRole('button', { name: /show 5 more steps/i });
    expect(showMoreButton).toBeInTheDocument();
  });

  it('should show all steps after clicking the "Show More" button', async () => {
    const mockReasoning = createMockReasoning(10);
    render(AIInsights, { props: { reasoning: mockReasoning } });

    const showMoreButton = screen.getByRole('button', { name: /show 5 more steps/i });
    await fireEvent.click(showMoreButton);

    expect(screen.getByText('This is step number 6.')).toBeInTheDocument();
    expect(screen.getByText('This is step number 10.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show 5 more steps/i })).not.toBeInTheDocument();
  });
});
