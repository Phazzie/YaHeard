/**
 * Custom error classes for the application.
 */

// Base class for all application-specific errors
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when an AI transcription service fails.
 */
export class TranscriptionServiceError extends AppError {
  public readonly serviceName: string;

  constructor(serviceName: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.serviceName = serviceName;
  }
}

/**
 * Thrown when there is a configuration issue.
 */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when there is an issue with file handling, e.g. blob storage.
 */
export class FileStorageError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }
}
