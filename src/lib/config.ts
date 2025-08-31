// Centralized configuration for the application

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/mp3', // another for .mp3
  'audio/x-wav', // another for .wav
  'audio/m4a', // .m4a
  'audio/webm', // .webm
  'audio/flac', // .flac
  'audio/ogg' // .ogg
];
