/**
 * SuperDuperAI API Configuration
 * Re-exports client-safe functions and adds server-only imports
 */

// Re-export all client-safe functions
export * from './superduperai-client';

// Re-export server-only functions for backward compatibility
export { 
  getSuperduperAIConfigForUser, 
  configureSuperduperAIForUser, 
  createAuthHeadersForUser 
} from './superduperai-server'; 