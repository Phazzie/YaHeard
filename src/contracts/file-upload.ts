/**
 * =============================================================================
 * @file file-upload.ts - FILE UPLOAD CONTRACTS AND VALIDATION
 * =============================================================================
 *
 * WHY THIS FILE EXISTS:
 * =====================
 * File uploads are complex and error-prone. This contract defines exactly
 * how files should be handled, validated, and processed throughout the system.
 * By standardizing file upload behavior, we prevent security issues and
 * ensure consistent user experience.
 *
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies transcription.ts - Uses SUPPORTED_AUDIO_FORMATS and MAX_FILE_SIZE_BYTES
 */

import type { AudioFormat } from './transcription';

/**
 *
 * ARCHITECTURAL ROLE:
 * ===================
 * 1. SECURITY ENFORCEMENT: Validates file types and sizes
 * 2. USER EXPERIENCE: Consistent upload behavior across components
 * 3. ERROR PREVENTION: Centralized validation logic
 * 4. MAINTAINABILITY: Single source of truth for upload rules
 *
 * REGENERATION RULES:
 * ===================
 * ✅ Can be updated when adding new file formats
 * ✅ Can be modified when changing size limits
 * ✅ Should maintain backward compatibility
 * ✅ Update validation logic as needed
 *
 * SECURITY CONSIDERATIONS:
 * ========================
 * File uploads are a major security risk. This contract ensures:
 * - File type validation (not just extension checking)
 * - Size limits to prevent DoS attacks
 * - Server-side validation (client validation can be bypassed)
 * - Safe file handling practices
 *
 * USER EXPERIENCE CONSIDERATIONS:
 * ===============================
 * Good upload UX requires:
 * - Clear error messages for rejected files
 * - Progress indicators for large files
 * - Drag-and-drop support
 * - Format and size guidance
 */

/**
 * =============================================================================
 * FILE UPLOAD CONTRACT - THE MASTER INTERFACE FOR FILE HANDLING
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The complete specification for how file uploads should work in our system.
 * Any component that handles file uploads must implement this contract.
 *
 * WHY THESE METHODS:
 * ==================
 * - accept: What file types are allowed
 * - maxSize: Maximum file size to prevent abuse
 * - onUpload: The actual upload processing function
 * - validateFile: Pre-upload validation
 *
 * CONTRACT ENFORCEMENT:
 * =====================
 * All upload implementations MUST:
 * 1. Validate files before processing
 * 2. Provide clear error messages
 * 3. Handle large files appropriately
 * 4. Support all accepted formats
 * 5. Return consistent result format
 */
export interface FileUploadContract {
  /** Accepted file extensions */
  accept: AudioFormat[];

  /** Maximum file size in bytes */
  maxSize: number;

  /** Function to handle file upload */
  onUpload: (file: File) => Promise<UploadResult>;

  /** Function to validate file before upload */
  validateFile: (file: File) => ValidationResult;
}

/**
 * =============================================================================
 * UPLOAD RESULT - WHAT HAPPENS AFTER FILE PROCESSING
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The standardized result of a file upload operation. This tells the UI
 * whether the upload succeeded and provides all necessary information.
 *
 * WHY THESE FIELDS:
 * =================
 * - success: Did the upload work?
 * - fileId: Reference for the uploaded file
 * - error: What went wrong (if anything)
 * - readyForProcessing: Can we transcribe this file?
 * - metadata: Additional file information
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Consistent result format means:
 * 1. UI components can handle any upload result
 * 2. Error handling is standardized
 * 3. Success flows are predictable
 * 4. File tracking is reliable
 */
export interface UploadResult {
  /** Whether the upload was successful */
  success: boolean;

  /** Unique identifier for the uploaded file */
  fileId?: string;

  /** Error message if upload failed */
  error?: string;

  /** Whether the file is ready for processing */
  readyForProcessing: boolean;

  /** File metadata */
  metadata?: FileMetadata;
}

/**
 * =============================================================================
 * VALIDATION RESULT - PRE-UPLOAD FILE CHECKING
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The result of validating a file before upload. This allows us to catch
 * problems early and provide immediate feedback to users.
 *
 * WHY THESE FIELDS:
 * =================
 * - isValid: Can this file be uploaded?
 * - errors: List of problems found
 * - fileInfo: Details about the file
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Pre-upload validation provides:
 * 1. Immediate user feedback
 * 2. Reduced server load
 * 3. Better error messages
 * 4. Security through multiple checks
 */
export interface ValidationResult {
  /** Whether the file is valid */
  isValid: boolean;

  /** Validation errors */
  errors: string[];

  /** File information */
  fileInfo?: FileInfo;
}

/**
 * =============================================================================
 * FILE METADATA - DETAILED FILE INFORMATION
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Comprehensive information about an uploaded file for tracking,
 * debugging, and user interface purposes.
 *
 * WHY THESE FIELDS:
 * =================
 * - originalName: User's original filename
 * - size: File size for quota tracking
 * - mimeType: Actual file type (more reliable than extension)
 * - extension: File extension for display
 * - uploadedAt: When upload occurred
 * - hash: File integrity verification
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Rich metadata enables:
 * 1. Duplicate detection
 * 2. Quota management
 * 3. Audit trails
 * 4. Better user interfaces
 * 5. Security monitoring
 */
export interface FileMetadata {
  /** Original filename from user */
  originalName: string;

  /** File size in bytes */
  size: number;

  /** MIME type (more reliable than extension) */
  mimeType: string;

  /** File extension */
  extension: string;

  /** When the file was uploaded */
  uploadedAt: Date;

  /** MD5 hash of the file for integrity */
  hash?: string;
}

/**
 * =============================================================================
 * FILE INFO - BASIC FILE INFORMATION
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * Essential file information needed for validation and display.
 * Lightweight version of FileMetadata for validation purposes.
 *
 * WHY THESE FIELDS:
 * =================
 * - name: Filename for display
 * - size: Size for limit checking
 * - type: MIME type for validation
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Minimal interface for validation means:
 * 1. Faster validation
 * 2. Less data to process
 * 3. Clear separation of concerns
 * 4. Easier testing
 */
export interface FileInfo {
  /** File name */
  name: string;

  /** File size */
  size: number;

  /** MIME type */
  type: string;
}

/**
 * =============================================================================
 * DEFAULT FILE UPLOAD CONTRACT - STANDARD CONFIGURATION
 * =============================================================================
 *
 * WHAT THIS REPRESENTS:
 * =====================
 * The standard file upload configuration that most implementations
 * should use. This provides sensible defaults while allowing customization.
 *
 * WHY THIS EXISTS:
 * ================
 * - accept: Standard audio formats
 * - maxSize: Reasonable 10MB limit
 *
 * ARCHITECTURAL BENEFIT:
 * ======================
 * Default configuration ensures:
 * 1. Consistency across implementations
 * 2. Sensible security defaults
 * 3. Easy setup for new components
 * 4. Centralized configuration management
 */
export const DEFAULT_FILE_UPLOAD_CONTRACT: Omit<FileUploadContract, 'onUpload' | 'validateFile'> = {
  accept: ['.mp3', '.wav', '.m4a', '.webm'],
  maxSize: 10 * 1024 * 1024, // 10MB
};

/**
 * =============================================================================
 * CONTRACT COMPLIANCE GUARANTEES
 * =============================================================================
 *
 * By implementing these interfaces, file upload components guarantee:
 * 1. SECURITY: Proper validation and size limits
 * 2. RELIABILITY: Consistent error handling and results
 * 3. USER EXPERIENCE: Clear feedback and progress indication
 * 4. MAINTAINABILITY: Standardized implementation patterns
 *
 * This contract-driven approach ensures:
 * - All uploads behave consistently
 * - Security vulnerabilities are prevented
 * - Users get reliable feedback
 * - Developers can easily add new upload features
 */
