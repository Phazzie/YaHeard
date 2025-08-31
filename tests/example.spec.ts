import { test, expect } from '@playwright/test';
import path from 'path';

// Create a dummy file for uploading
const dummyAudioFile = {
  name: 'test.mp3',
  mimeType: 'audio/mpeg',
  buffer: Buffer.from('this is a dummy mp3 file'),
};

test('has title and can process a file', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Multi-AI Transcription Engine/);

  // Find the file input and set the dummy file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: dummyAudioFile.name,
    mimeType: dummyAudioFile.mimeType,
    buffer: dummyAudioFile.buffer,
  });

  // Wait for the "File ready" message to appear
  await expect(page.locator('text=✅ File ready')).toBeVisible();

  // Click the button to start the process
  await page.getByRole('button', { name: /Get Upload Link & Process/ }).click();

  // Wait for the final results to be displayed.
  // This can take a while due to the asynchronous nature of the process.
  // We'll wait for up to 2 minutes for the whole process to complete.
  const resultsHeader = page.locator('h2', { hasText: 'Transcription Results' });
  await expect(resultsHeader).toBeVisible({ timeout: 120000 });
});
