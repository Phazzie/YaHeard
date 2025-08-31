# Comprehensive Technical Debt Reduction Plan

This document outlines the 4-phase plan to address all 18 items from the technical debt audit report dated 2025-08-30.

---

### **Phase 1: Foundational Cleanup & Tooling (Immediate Priority)**

1.  **Remove Console Logs:** Systematically find and remove all `console.*` statements from the client-facing and server code to improve performance and security.
2.  **Add Linting & Formatting:** Install and configure ESLint and Prettier to enforce a consistent code style. I will also format the entire existing codebase to match the new rules.
3.  **Centralize Configuration:** Create a single source of truth for configuration values like file size limits. This will resolve the current inconsistency and make future changes easier.
4.  **Validate Environment Variables:** Implement a validation mechanism on server startup to ensure all required environment variables (for Vercel, AI services, etc.) are present and correctly formatted. This will prevent runtime errors due to misconfiguration.
5.  **Create `.env.example`:** Add or update an `.env.example` file to clearly document all necessary environment variables for future developers.

### **Phase 2: Testing & Dependency Management (Short Term Priority)**

6.  **Update Critical Dependencies:** Cautiously update major dependencies like Svelte, SvelteKit, and Vite to their latest stable versions, testing thoroughly for any breaking changes.
7.  **Add Unit Testing Framework:** Integrate `Vitest` into the project. I will write initial unit tests for core, complex logic like the `calculateConsensus` function to create a foundation for future test coverage.
8.  **Implement Proper Logging:** Introduce a structured, server-side logging library (like `pino` or `winston`). All server-side logging will be converted to use this library, while ensuring all client-side logs are removed from production builds.
9.  **Add Bundle Analysis:** Integrate a tool like `rollup-plugin-visualizer` to allow us to inspect the production bundle and identify any potential size issues.

### **Phase 3: Performance & Error Handling (Medium Term Priority)**

10. **Refactor Error Handling:** Standardize error handling across the application by creating custom error classes. All AI service implementations will be refactored to use these classes for consistent and predictable error responses.
11. **Implement Rate Limiting:** Add rate limiting to the public API endpoints to prevent abuse and protect our API quotas with the AI services.
12. **Implement Streaming for Large Files:** Refactor the Gemini service (and any others that apply) to use streaming for file processing, avoiding loading large files entirely into memory.
13. **Add Observability Hooks:** Add more detailed performance logging (e.g., timing how long each AI service takes to respond) to provide better observability into system performance.

### **Phase 4: Advanced Hardening & Testing (Long Term Priority)**

14. **Complete All Dependency Updates:** Update all remaining minor and development dependencies to their latest versions.
15. **Add End-to-End (E2E) Testing:** Integrate `Playwright` to run E2E tests that simulate a full user journey: uploading a file, polling for the result, and seeing it displayed on the page.
16. **Strengthen Input Validation:** Improve security by adding more robust input validation, such as checking file magic bytes to verify file types beyond their extension.
17. **Sanitize Production Errors:** Ensure that no sensitive or detailed error information is ever leaked to the client in a production environment.
18. **Add Comprehensive Test Suite:** Continue to build out the unit and E2E test suites to cover all critical components and user flows.
