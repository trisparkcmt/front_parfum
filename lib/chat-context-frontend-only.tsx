/**
 * @file lib/chat-context-system.tsx
 * @description Frontend-only conversation context — extracts history and filters responses
 * NO BACKEND CHANGES NEEDED
 */

import type { ChatMessage, AiResponse } from '@/components/perfume/GeminiChat';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ConversationExchange {
  prompt: string;
  response: {
    productIds: string[];      // Parfums + Accessoires IDs
    productSlugs: string[];    // Parfum slugs
    essenceIds: string[];      // Pre-made essence IDs
  };
}

// ── Context Extraction ─────────────────────────────────────────────────────

/**
 * Extracts product IDs from AI response (perfumes + accessories)
 */
function extractProductIds(aiData?: AiResponse): string[] {
  const ids: string[] = [];
  
  if (aiData?.parfums_existants) {
    // Explicit type mapping inline prevents TS7006 implicit any warnings
    aiData.parfums_existants.forEach((p: { id: string | number }) => ids.push(String(p.id)));
  }
  if (aiData?.accessoires) {
    aiData.accessoires.forEach((a: { id: string | number }) => ids.push(String(a.id)));
  }
  
  return ids;
}

/**
 * Extracts product slugs from AI response
 */
function extractProductSlugs(aiData?: AiResponse): string[] {
  const slugs: string[] = [];
  
  if (aiData?.parfums_existants) {
    aiData.parfums_existants.forEach((p: { slug: string }) => slugs.push(p.slug));
  }
  
  return slugs;
}

/**
 * Extracts essence IDs from AI response
 */
function extractEssenceIds(aiData?: AiResponse): string[] {
  const ids: string[] = [];
  
  if (aiData?.essences_pre_faites) {
    aiData.essences_pre_faites.forEach((e: { id: string | number }) => ids.push(String(e.id)));
  }
  
  return ids;
}

/**
 * Gets all recommended product IDs from conversation history (flat list)
 */
function getAllRecommendedProductIds(messages: ChatMessage[]): Set<string> {
  const ids = new Set<string>();
  
  messages.forEach(msg => {
    if (msg.role === 'ai' && msg.aiData) {
      extractProductIds(msg.aiData).forEach(id => ids.add(id));
    }
  });
  
  return ids;
}

/**
 * Gets all recommended essence IDs from conversation history (flat list)
 */
function getAllRecommendedEssenceIds(messages: ChatMessage[]): Set<string> {
  const ids = new Set<string>();
  
  messages.forEach(msg => {
    if (msg.role === 'ai' && msg.aiData) {
      extractEssenceIds(msg.aiData).forEach(id => ids.add(id));
    }
  });
  
  return ids;
}

// ── FILTERING FUNCTIONS ────────────────────────────────────────────────────

/**
 * Filters AI response to exclude products already recommended in this session
 * * @param aiData - Original response from API
 * @param messages - Current chat history
 * @returns Filtered response with duplicates removed
 */
export function filterDuplicateRecommendations(
  aiData: AiResponse,
  messages: ChatMessage[]
): AiResponse {
  // Get all products & essences already recommended
  const recommendedProductIds = getAllRecommendedProductIds(messages);
  const recommendedEssenceIds = getAllRecommendedEssenceIds(messages);

  // Filter parfums (exclude if already recommended)
  const filteredParfums = aiData.parfums_existants?.filter(
    (p: { id: string | number }) => !recommendedProductIds.has(String(p.id))
  ) ?? [];

  // Filter essences (exclude if already recommended)
  const filteredEssences = aiData.essences_pre_faites?.filter(
    (e: { id: string | number }) => !recommendedEssenceIds.has(String(e.id))
  ) ?? [];

  // Filter accessories (exclude if already recommended)
  const filteredAccessories = aiData.accessoires?.filter(
    (a: { id: string | number }) => !recommendedProductIds.has(String(a.id))
  ) ?? [];

  // If we filtered everything, log warning but return original
  const hasResults = filteredParfums.length > 0 || 
                     filteredEssences.length > 0 || 
                     filteredAccessories.length > 0;

  if (!hasResults && (aiData.parfums_existants?.length ?? 0) > 0) {
    console.warn('⚠️ All products filtered as duplicates. Returning original response.');
    return aiData;
  }

  // Return filtered response
  return {
    ...aiData,
    parfums_existants: filteredParfums.length > 0 ? filteredParfums : undefined,
    essences_pre_faites: filteredEssences.length > 0 ? filteredEssences : undefined,
    accessoires: filteredAccessories.length > 0 ? filteredAccessories : undefined,
  };
}

/**
 * Builds conversation context for display/debugging
 */
export function buildConversationSummary(messages: ChatMessage[]): string {
  const exchanges = messages.filter(m => m.role === 'ai').length;
  const productIds = getAllRecommendedProductIds(messages);
  const essenceIds = getAllRecommendedEssenceIds(messages);

  return `
    📊 Session Summary:
    - ${exchanges} AI responses
    - ${productIds.size} unique products recommended
    - ${essenceIds.size} unique essences recommended
  `.trim();
}

/**
 * Check if a product was already recommended
 */
export function isProductRecommended(
  productId: string,
  messages: ChatMessage[]
): boolean {
  return getAllRecommendedProductIds(messages).has(String(productId));
}

/**
 * Check if an essence was already recommended
 */
export function isEssenceRecommended(
  essenceId: string,
  messages: ChatMessage[]
): boolean {
  return getAllRecommendedEssenceIds(messages).has(String(essenceId));
}

/**
 * Get list of all recommended product IDs (for reference)
 */
export function getRecommendedProductsList(messages: ChatMessage[]): string[] {
  return Array.from(getAllRecommendedProductIds(messages));
}

/**
 * Get list of all recommended essence IDs (for reference)
 */
export function getRecommendedEssencesList(messages: ChatMessage[]): string[] {
  return Array.from(getAllRecommendedEssenceIds(messages));
}