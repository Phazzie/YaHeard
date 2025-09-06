import type { PageServerLoad } from './$types';
import { generateCSRFToken } from '$lib/csrf';

/**
 * Generate CSRF token for form protection
 */
export const load: PageServerLoad = async () => {
  const csrfToken = generateCSRFToken();
  
  return {
    csrfToken
  };
};