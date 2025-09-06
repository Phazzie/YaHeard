# GitHub Copilot Instructions for YaHeard

## 1. The Core Philosophy: Contract-Driven Architecture
- **Contracts are Sacred (`src/contracts/`)**: These TypeScript interfaces are the source of truth. They are intentionally stable—do not modify them unless explicitly told to.
- **Implementations are Disposable (`src/implementations/`)**: These classes fulfill contracts. Your goal is to implement the contracts, and these files can be regenerated.

## 2. The Immutable Laws
- **Respect Regeneration Boundaries**: Code inside `// ========= REGENERATION BOUNDARY` comments should be regenerated, not patched. When changes are needed, regenerate the entire section based on its contract, not just the part that seems broken. The boundary comment should include the contract and dependencies.
  ```typescript
  // ========= REGENERATION BOUNDARY START: [Section Name] ==========
  // @contract: Must implement the `AudioProcessor` interface.
  // @dependencies: `src/contracts/processors.ts`
  
  // [CODE HERE]
  
  // ========= REGENERATION BOUNDARY END: [Section Name] ==========
  ```
- **Standard Workflows**: Use `npm run dev` to run the server.
- **Ask if Unsure**: If you are uncertain about a requirement or constraint, ask for clarification by adding a comment like: `// @copilot-question: [Your Question]`

## 3. The Collaborative Framework
When asked to design a new feature, **do not build it immediately.** Instead, follow this protocol to ensure we explore trade-offs and prevent low-context decisions.

**First, propose three strategies:**
1.  **The Pragmatic Solution**: The fastest, most direct 80/20 solution.
2.  **The Textbook Solution**: The ideal, "technical debt-free" solution with full testing and scalability.
3.  **The Unconventional Solution**: A creative, out-of-the-box approach.

**Then, ask which path to take.** This is mandatory.

**Finally, plan your work in a comment block before coding:**
```typescript
/* @copilot-plan
 *   Strategy: Textbook
 *   1. Create API endpoint `/api/email`.
 *   2. Use 'resend' for email.
 *   3. Add Zod validation.
 */
```