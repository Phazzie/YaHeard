import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import FileUpload from './FileUpload.svelte';

// Helper to create a mock File
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['a'.repeat(size)], name, { type });
  return file;
};

describe('FileUpload.svelte', () => {
  it('should render the default upload zone', () => {
    render(FileUpload);
    expect(screen.getByText('🎵 Drop Your Audio Here 🎵')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('should dispatch a fileUploaded event when a valid file is selected via click', async () => {
    const { component } = render(FileUpload);
    const mockFn = vi.fn();
    component.$on('fileUploaded', mockFn);

    const fileInput = screen.getByLabelText(/upload audio file/i).previousElementSibling as HTMLInputElement;
    const validFile = createMockFile('audio.mp3', 1024, 'audio/mp3');

    // Simulate user selecting a file
    await fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(mockFn).toHaveBeenCalledTimes(1);
    const eventDetail = mockFn.mock.calls[0][0].detail;
    expect(eventDetail.file.name).toBe('audio.mp3');
    expect(eventDetail.result.success).toBe(true);
  });

  it('should show an error message for a file that is too large', async () => {
    // Set max size to 1MB for the test
    render(FileUpload, { props: { maxSize: 1024 * 1024 } });
    const fileInput = screen.getByLabelText(/upload audio file/i).previousElementSibling as HTMLInputElement;
    // Create a 2MB file
    const largeFile = createMockFile('large.wav', 2 * 1024 * 1024, 'audio/wav');

    await fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it('should show an error message for an unsupported file type', async () => {
    render(FileUpload);
    const fileInput = screen.getByLabelText(/upload audio file/i).previousElementSibling as HTMLInputElement;
    const unsupportedFile = createMockFile('document.txt', 1024, 'text/plain');

    await fireEvent.change(fileInput, { target: { files: [unsupportedFile] } });

    expect(screen.getByText(/unsupported format/i)).toBeInTheDocument();
  });

  it('should handle drag and drop of a valid file', async () => {
    const { component } = render(FileUpload);
    const mockFn = vi.fn();
    component.$on('fileUploaded', mockFn);

    const dropZone = screen.getByRole('button', { name: /upload audio file/i });
    const validFile = createMockFile('dropped.flac', 1024, 'audio/flac');

    // Simulate drag over
    await fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [validFile] },
    });
    expect(dropZone).toHaveClass('drag-over');

    // Simulate drop
    await fireEvent.drop(dropZone, {
      dataTransfer: { files: [validFile] },
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0].detail.file.name).toBe('dropped.flac');
    expect(dropZone).not.toHaveClass('drag-over');
  });

  it('should be disabled and not interactive when disabled prop is true', async () => {
    render(FileUpload, { props: { disabled: true } });
    const dropZone = screen.getByRole('button', { name: /upload audio file/i });

    expect(dropZone).toHaveClass('opacity-50');
    expect(dropZone).toHaveClass('cursor-not-allowed');

    // Clicking should not open the file dialog (which we can't test directly, but we can check the click handler logic)
    const fileInput = screen.getByLabelText(/upload audio file/i).previousElementSibling as HTMLInputElement;
    expect(fileInput).toBeDisabled();

    // Attempting to click should not trigger anything
    const clickSpy = vi.spyOn(fileInput, 'click');
    await fireEvent.click(dropZone);
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
