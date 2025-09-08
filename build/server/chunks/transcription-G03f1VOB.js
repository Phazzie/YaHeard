const SUPPORTED_AUDIO_FORMATS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
  ".flac",
  ".ogg"
];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
function validateConsensusResult(result) {
  if (!result || typeof result !== "object") return false;
  const r = result;
  return typeof r.finalText === "string" && typeof r.consensusConfidence === "number" && r.consensusConfidence >= 0 && r.consensusConfidence <= 1 && Array.isArray(r.individualResults) && Array.isArray(r.disagreements) && typeof r.stats === "object" && typeof r.reasoning === "object";
}

export { MAX_FILE_SIZE_BYTES as M, SUPPORTED_AUDIO_FORMATS as S, validateConsensusResult as v };
//# sourceMappingURL=transcription-G03f1VOB.js.map
