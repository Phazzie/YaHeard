import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:5173")

            # Upload the dummy audio file using the hidden file input
            await page.locator("#file-input").set_input_files("jules-scratch/verification/silent.mp3")

            # Manually dispatch the change event
            await page.dispatch_event("#file-input", "change")

            # Start the transcription process
            await page.get_by_role("button", name="Start Processing").click()

            # Wait for the results to appear
            await expect(page.get_by_text("Transcription Complete")).to_be_visible(timeout=60000)

            # Take a screenshot of the results
            await page.screenshot(path="jules-scratch/verification/results.png")

            # Click on the "Raw" tab
            await page.get_by_role("button", name="raw").click()

            # Take a screenshot of the raw results
            await page.screenshot(path="jules-scratch/verification/raw_results.png")

        finally:
            await browser.close()

asyncio.run(main())
