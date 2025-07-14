/**
 * SuperDuperAI Server-Only Configuration
 * Contains functions that require database access and can only run on server
 */
'use server';

import { getUserSuperduperAIToken, getUserById } from '@/lib/db/queries';
import { getSuperduperAIConfig, configureSuperduperAI, type SuperduperAIConfig } from './superduperai-client';

/**
 * Get SuperDuperAI configuration for specific user (server-only)
 * This function accesses the database and requires server environment
 */
export async function getSuperduperAIConfigForUser(userId?: string): Promise<SuperduperAIConfig & { isUserToken: boolean }> {
  if (!userId) {
    return { ...getSuperduperAIConfig(), isUserToken: false };
  }

  try {
    const userToken = await getUserSuperduperAIToken(userId);
    if (userToken) {
      return {
        ...getSuperduperAIConfig(),
        token: userToken,
        isUserToken: true
      };
    }
  } catch (error) {
    console.error('Failed to get user SuperDuperAI token:', error);
  }

  return { ...getSuperduperAIConfig(), isUserToken: false };
}

/**
 * Configure SuperDuperAI for specific user (server-only)
 * This function actually configures the OpenAPI client with user token
 */
export async function configureSuperduperAIForUser(userId?: string): Promise<SuperduperAIConfig> {
  const configWithTokenInfo = await getSuperduperAIConfigForUser(userId);
  
  // Фактически настраиваем OpenAPI клиент с токеном
  configureSuperduperAI(configWithTokenInfo);
  
  // ПРАВИЛЬНОЕ логирование - проверяем реально ли используется пользовательский токен
  const tokenType = configWithTokenInfo.isUserToken ? 'user' : 'system';
  const tokenPreview = configWithTokenInfo.token ? `${configWithTokenInfo.token.substring(0, 10)}...` : 'no-token';
  console.log(`🔑 Configured SuperDuperAI with ${tokenType} token: ${tokenPreview}`);
  
  // Возвращаем только базовый config без isUserToken для совместимости
  const { isUserToken, ...baseConfig } = configWithTokenInfo;
  return baseConfig;
}

/**
 * Create auth headers for specific user (server-only)
 */
export async function createAuthHeadersForUser(userId?: string): Promise<Record<string, string>> {
  const config = await getSuperduperAIConfigForUser(userId);
  return {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
  };
} 