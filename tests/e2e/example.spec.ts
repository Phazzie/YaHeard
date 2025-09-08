import { test, expect } from '@playwright/test';

test.describe('File Upload and Transcription', () => {
  test('should allow a user to upload an audio file and see the transcription results', async ({ page }) => {
    // Mock the API response for the transcription
    await page.route('/api/transcribe', async (route) => {
      const json = {
        finalText: 'This is the final transcription.',
        consensusConfidence: 0.99,
        individualResults: [
          {
            id: 'mock-1',
            serviceName: 'MockService1',
            text: 'This is the final transcription.',
            confidence: 0.99,
            processingTimeMs: 100,
            timestamp: new Date(),
          },
        ],
        disagreements: [],
        stats: {
          totalProcessingTimeMs: 100,
          servicesUsed: 1,
          averageConfidence: 0.99,
          disagreementCount: 0,
        },
        reasoning: {
          finalReasoning: 'This is a mock reason.',
          steps: [],
        },
      };
      await route.fulfill({ json });
    });

    await page.goto('/');

    // Wait for the file input to be visible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Create a dummy file and upload it
    const filePayload = {
      name: 'test.mp3',
      mimeType: 'audio/mp3',
      buffer: Buffer.from('this is a test'),
    };
    await fileInput.setInputFiles(filePayload);

    // Wait for the results to be displayed
    const resultsDisplay = page.locator('text=This is the final transcription.');
    await expect(resultsDisplay).toBeVisible();
  });
});
