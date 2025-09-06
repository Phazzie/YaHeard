# Large Audio Files: Strategies and APIs

This app supports two approaches for processing large audio files while staying within client and platform upload limits.

## 1) Server-side URL ingestion

Instead of uploading the audio, provide a publicly accessible URL. The server downloads the file and processes it.

Endpoint: `POST /api/transcribe`

Request (multipart/form-data):
- csrfToken: string
- audioUrl: string

Server behavior:
- Downloads the remote file using `fetch(audioUrl)`
- Validates size against `PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES`
- Wraps the downloaded bytes as a `File` and runs all configured processors

Pros:
- Minimal client work
- Avoids client upload limits entirely

Cons:
- Requires the audio to be publicly reachable by the server

## 2) Client-side chunking + server merge

Split the audio on the client into ~4MB WAV chunks and send each chunk to `/api/transcribe`. Then use `/api/merge-chunks` to assemble per-service texts into a final consensus.

UI behavior (see `src/routes/+page.svelte`):
- When the "Split large file into chunks" option is enabled and a file is selected, the client calls `chunkAudioFile(file, { targetBytes: 4MB, minSeconds: 10 })`.
- Each chunk is uploaded with its own `/api/transcribe` request including the CSRF token.
- After all chunks complete, the client POSTs to `/api/merge-chunks` with an array of `{ index, textsByService }` for every chunk.

Merge API: `POST /api/merge-chunks`

Request (application/json):
```
{
  "chunkTexts": [
    {
      "index": 0,
      "textsByService": {
        "Whisper": "...",
        "Deepgram": "..."
      }
    },
    {
      "index": 1,
      "textsByService": { /* ... */ }
    }
  ]
}
```

Response:
- A `ConsensusResult` computed from synthetic `TranscriptionResult[]` where each service’s text is its stitched concatenation across chunks.

Notes and trade-offs:
- Token-level word confidences and timestamps are not preserved by the merge step. The merge concatenates texts with simple overlap-aware stitching.
- Choose chunk size carefully; default target is ~4MB WAV with a minimum 10s duration per chunk to avoid too-short segments.
