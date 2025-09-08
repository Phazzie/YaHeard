import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ProgressBar from './ProgressBar.svelte';

describe('ProgressBar.svelte', () => {
  it('should render the progress bar with the correct initial width', () => {
    render(ProgressBar, { props: { progress: 50 } });

    // The progress bar itself is a div with a style attribute for width
    const progressBarFill = document.querySelector('.h-full.bg-gradient-to-r');
    expect(progressBarFill).toBeInTheDocument();
    expect(progressBarFill).toHaveStyle('width: 50%');
  });

  it('should display the percentage and status text when showPercentage is true', () => {
    render(ProgressBar, { props: { progress: 75, showPercentage: true } });

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Finalizing...')).toBeInTheDocument();
  });

  it('should not display the percentage and status text when showPercentage is false', () => {
    render(ProgressBar, { props: { progress: 75, showPercentage: false } });

    expect(screen.queryByText('75%')).not.toBeInTheDocument();
    expect(screen.queryByText('Finalizing...')).not.toBeInTheDocument();
  });

  it('should clamp progress values to the 0-100 range', () => {
    // Test value below 0
    const { rerender } = render(ProgressBar, { props: { progress: -20 } });
    let progressBarFill = document.querySelector('.h-full.bg-gradient-to-r');
    expect(progressBarFill).toHaveStyle('width: 0%');
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Test value above 100
    rerender({ progress: 150 });
    progressBarFill = document.querySelector('.h-full.bg-gradient-to-r');
    expect(progressBarFill).toHaveStyle('width: 100%');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should update the status text based on progress', () => {
    const { rerender } = render(ProgressBar, { props: { progress: 10 } });
    expect(screen.getByText('Starting...')).toBeInTheDocument();

    rerender({ progress: 40 });
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    rerender({ progress: 60 });
    expect(screen.getByText('Almost done...')).toBeInTheDocument();

    rerender({ progress: 90 });
    expect(screen.getByText('Finalizing...')).toBeInTheDocument();

    rerender({ progress: 100 });
    expect(screen.getByText('Complete!')).toBeInTheDocument();
  });
});
