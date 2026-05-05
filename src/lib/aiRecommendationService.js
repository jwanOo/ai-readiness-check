/* ═══════════════════════════════════════════════════════════════
   AI RECOMMENDATION SERVICE
   Matches SAP AI use cases to customer assessments
   Now with AI-powered intelligent recommendations
   ═══════════════════════════════════════════════════════════════ */

import { fetchUseCases, INDUSTRY_CATEGORY_MAP } from './sapAICatalogService';
import { callAI } from './aiService';

/**
 * SAP Products that can be detected in assessment answers
 */
export const SAP_PRODUCTS = [
  'SAP S/4HANA',
  'SAP S/4HANA Cloud',
  'SAP ECC',
  'SAP BTP',
  'SAP Business Technology Platform',
  'SAP Sales Cloud',
  'SAP Service Cloud',
  'SAP Commerce Cloud',
  'SAP Marketing Cloud',
  'SAP Customer Data Platform',
  'SAP SuccessFactors',
  'SAP Ariba',
  'SAP Fieldglass',
  'SAP Concur',
  'SAP IBP',
  'SAP Integrated Business Planning',
  'SAP Analytics Cloud',
  'SAP Datasphere',
  'SAP Build',
  'SAP Signavio',
  'SAP Joule',
  'SAP AI Core',
  'SAP AI Launchpad',
];

/**
 * Keywords that indicate GenAI/Joule interest
 */
const GENAI_KEYWORDS = [
  'genai', 'generative', 'joule', 'chatbot', 'llm', 'gpt', 'copilot',
  'natural language', 'conversational', 'assistant', 'ki-assistent',
];

/**
 * Keywords that indicate automation interest
 */
const AUTOMATION_KEYWORDS = [
  'automat', 'agent', 'rpa', 'workflow', 'dunkelverarbeitung',
  'straight-through', 'stp', 'bot', 'autonomous',
];

/**
 * Extract SAP products mentioned in assessment answers
 * @param {Object} answers - Assessment answers object
 * @returns {string[]} - Array of detected SAP products
 */
export function extractSAPProducts(answers) {
  if (!answers || typeof answers !== 'object') return [];
  
  const detectedProducts = new Set();
  const answersText = Object.values(answers)
    .filter(a => typeof a === 'string')
    .join(' ')
    .toLowerCase();
  
  SAP_PRODUCTS.forEach(product => {
    const searchTerm = product.toLowerCase();
    if (answersText.includes(searchTerm)) {
      detectedProducts.add(product);
    }
  });
  
  // Also check for common abbreviations
  if (answersText.includes('s/4') || answersText.includes('s4hana')) {
    detectedProducts.add('SAP S/4HANA');
  }
  if (answersText.includes('btp')) {
    detectedProducts.add('SAP BTP');
  }
  if (answersText.includes('successfactors') || answersText.includes('sf')) {
    detectedProducts.add('SAP SuccessFactors');
  }
  if (answersText.includes('sac') || answersText.includes('analytics cloud')) {
    detectedProducts.add('SAP Analytics Cloud');
  }
  
  return Array.from(detectedProducts);
}

/**
 * Check if answers indicate GenAI/Joule interest
 * @param {Object} answers - Assessment answers object
 * @returns {boolean}
 */
export function hasGenAIInterest(answers) {
  if (!answers || typeof answers !== 'object') return false;
  
  const answersText = Object.values(answers)
    .filter(a => typeof a === 'string')
    .join(' ')
    .toLowerCase();
  
  return GENAI_KEYWORDS.some(keyword => answersText.includes(keyword));
}

/**
 * Check if answers indicate automation interest
 * @param {Object} answers - Assessment answers object
 * @returns {boolean}
 */
export function hasAutomationInterest(answers) {
  if (!answers || typeof answers !== 'object') return false;
  
  const answersText = Object.values(answers)
    .filter(a => typeof a === 'string')
    .join(' ')
    .toLowerCase();
  
  return AUTOMATION_KEYWORDS.some(keyword => answersText.includes(keyword));
}

/**
 * Calculate recommendation score for a use case
 * @param {Object} useCase - SAP AI use case
 * @param {Object} context - Assessment context
 * @returns {number} - Score (higher = better match)
 */
export function calculateRecommendationScore(useCase, context) {
  const { industry, mentionedProducts, hasGenAI, hasAutomation, answers } = context;
  let score = 0;
  
  // 1. Availability bonus (GA is most valuable)
  switch (useCase.availability) {
    case 'Generally Available':
      score += 100;
      break;
    case 'Beta':
      score += 50;
      break;
    case 'Early Adopter Care (EAC)':
      score += 25;
      break;
    default:
      score += 10;
  }
  
  // 2. Industry category match
  const industryCategories = INDUSTRY_CATEGORY_MAP[industry] || [];
  if (industryCategories.includes(useCase.product_category)) {
    score += 80;
  }
  
  // 3. Product match bonus
  if (mentionedProducts && mentionedProducts.length > 0) {
    const productMatch = mentionedProducts.some(p => 
      useCase.product?.toLowerCase().includes(p.toLowerCase()) ||
      p.toLowerCase().includes(useCase.product?.toLowerCase())
    );
    if (productMatch) {
      score += 120; // Strong signal - customer already uses this product
    }
  }
  
  // 4. Joule/GenAI bonus
  if (hasGenAI && useCase.quick_filters?.toLowerCase().includes('joule')) {
    score += 60;
  }
  
  // 5. AI Agent bonus (if automation interest)
  if (hasAutomation && useCase.ai_type === 'AI Agent') {
    score += 50;
  }
  
  // 6. New/Featured bonus
  if (useCase.quick_filters?.toLowerCase().includes('new')) {
    score += 20;
  }
  if (useCase.quick_filters?.toLowerCase().includes('featured')) {
    score += 15;
  }
  
  // 7. Commercial type consideration
  // Base products are more accessible, Premium for enterprise
  if (useCase.commercial_type === 'Base') {
    score += 10;
  }
  
  return score;
}

/**
 * Get recommended AI use cases based on assessment
 * @param {Object} assessment - Assessment object with industry
 * @param {Object} answers - Assessment answers
 * @param {Object} options - Additional options (limit, filters)
 * @returns {Promise<Object[]>} - Scored and ranked use cases
 */
export async function getRecommendedAIUseCases(assessment, answers, options = {}) {
  const {
    limit = 20,
    includeAllMatches = false,
    filters = {},
  } = options;
  
  try {
    // Get all use cases
    const allUseCases = await fetchUseCases(filters);
    
    if (!allUseCases || allUseCases.length === 0) {
      return [];
    }
    
    // Build context for scoring
    const industry = assessment?.industry || '';
    const mentionedProducts = extractSAPProducts(answers);
    const hasGenAI = hasGenAIInterest(answers);
    const hasAutomation = hasAutomationInterest(answers);
    
    const context = {
      industry,
      mentionedProducts,
      hasGenAI,
      hasAutomation,
      answers,
    };
    
    // Get industry categories for filtering
    const industryCategories = INDUSTRY_CATEGORY_MAP[industry] || [];
    
    // Filter and score use cases
    let recommendations = allUseCases.map(useCase => {
      const score = calculateRecommendationScore(useCase, context);
      
      // Determine match reasons
      const matchReasons = [];
      if (industryCategories.includes(useCase.product_category)) {
        matchReasons.push('industry');
      }
      if (mentionedProducts.some(p => useCase.product?.toLowerCase().includes(p.toLowerCase()))) {
        matchReasons.push('product');
      }
      if (hasGenAI && useCase.quick_filters?.toLowerCase().includes('joule')) {
        matchReasons.push('genai');
      }
      if (hasAutomation && useCase.ai_type === 'AI Agent') {
        matchReasons.push('automation');
      }
      
      return {
        ...useCase,
        score,
        matchReasons,
        isRecommended: score >= 100, // Threshold for "recommended"
      };
    });
    
    // Filter to only relevant matches (unless includeAllMatches)
    if (!includeAllMatches) {
      recommendations = recommendations.filter(r => r.score >= 50);
    }
    
    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);
    
    // Apply limit
    if (limit > 0 && !includeAllMatches) {
      recommendations = recommendations.slice(0, limit);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return [];
  }
}

/**
 * Get AI hints for a specific section during assessment
 * @param {string} sectionId - Current section ID
 * @param {string} industry - Selected industry
 * @param {Object} answers - Current answers
 * @param {number} limit - Max hints to show
 * @returns {Promise<Object[]>} - Relevant AI use cases for hints
 */
export async function getSectionAIHints(sectionId, industry, answers, limit = 3) {
  // Map sections to relevant product categories
  const sectionCategoryMap = {
    general: [], // No specific category
    landscape: ['Cloud ERP applications', 'Technology Platform'],
    licensing: ['Cloud ERP applications'],
    btp: ['Technology Platform'],
    cloud: ['Cloud ERP applications', 'Technology Platform'],
    aiSap: ['Technology Platform', 'Cloud ERP applications'],
    aiNonSap: ['Technology Platform'],
    data: ['Technology Platform', 'Cloud ERP applications'],
    security: ['Technology Platform'],
    org: ['Human Capital Management'],
    useCases: [], // All categories
  };
  
  const sectionCategories = sectionCategoryMap[sectionId] || [];
  
  try {
    // Get recommendations with section-specific filtering
    const recommendations = await getRecommendedAIUseCases(
      { industry },
      answers,
      {
        limit: limit * 2, // Get more to filter
        filters: sectionCategories.length > 0 
          ? { productCategories: sectionCategories }
          : {},
      }
    );
    
    // Prioritize AI Agents for automation-related sections
    const automationSections = ['aiSap', 'aiNonSap', 'useCases'];
    if (automationSections.includes(sectionId)) {
      recommendations.sort((a, b) => {
        if (a.ai_type === 'AI Agent' && b.ai_type !== 'AI Agent') return -1;
        if (b.ai_type === 'AI Agent' && a.ai_type !== 'AI Agent') return 1;
        return b.score - a.score;
      });
    }
    
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error getting section AI hints:', error);
    return [];
  }
}

/**
 * Generate SAP AI Estimator URL with selected use cases
 * @param {Object[]} selectedUseCases - Array of selected use cases
 * @returns {string} - URL to SAP AI Estimator
 */
export function generateAIEstimatorURL(selectedUseCases) {
  // SAP AI Estimator base URL
  const baseURL = 'https://www.sap.com/products/artificial-intelligence/ai-estimator.html';
  
  // If we have use case identifiers, we could potentially pass them
  // For now, just return the base URL
  // In the future, SAP might support deep linking with pre-selected use cases
  
  if (selectedUseCases && selectedUseCases.length > 0) {
    // Create a summary for reference
    const useCaseNames = selectedUseCases.map(uc => uc.name).join(', ');
    console.log('Selected use cases for AI Estimator:', useCaseNames);
  }
  
  return baseURL;
}

/**
 * Format recommendation for display
 * @param {Object} recommendation - Recommendation with score
 * @returns {Object} - Formatted recommendation
 */
export function formatRecommendation(recommendation) {
  return {
    ...recommendation,
    scoreLabel: getScoreLabel(recommendation.score),
    scoreColor: getScoreColor(recommendation.score),
    typeIcon: recommendation.ai_type === 'AI Agent' ? '🤖' : '✨',
    commercialIcon: recommendation.commercial_type === 'Premium' ? '💎' : '📦',
    matchLabel: getMatchLabel(recommendation.matchReasons),
  };
}

/**
 * Get human-readable score label
 */
function getScoreLabel(score) {
  if (score >= 250) return 'Excellent Match';
  if (score >= 180) return 'Strong Match';
  if (score >= 100) return 'Good Match';
  if (score >= 50) return 'Potential Match';
  return 'Low Match';
}

/**
 * Get score color
 */
function getScoreColor(score) {
  if (score >= 250) return '#27AE60';
  if (score >= 180) return '#2ECC71';
  if (score >= 100) return '#3498DB';
  if (score >= 50) return '#F39C12';
  return '#95A5A6';
}

/**
 * Get match reason label
 */
function getMatchLabel(matchReasons) {
  if (!matchReasons || matchReasons.length === 0) return '';
  
  const labels = {
    industry: '🏢 Industry',
    product: '📦 Product',
    genai: '🤖 GenAI',
    automation: '⚡ Automation',
  };
  
  return matchReasons.map(r => labels[r] || r).join(' • ');
}

/**
 * Export selected use cases to a summary object
 * @param {Object[]} selectedUseCases - Selected use cases
 * @param {Object} assessment - Assessment data
 * @returns {Object} - Export summary
 */
export function exportRecommendationsSummary(selectedUseCases, assessment) {
  return {
    assessmentId: assessment?.id,
    customerName: assessment?.customer_name,
    industry: assessment?.industry,
    exportDate: new Date().toISOString(),
    totalSelected: selectedUseCases.length,
    useCases: selectedUseCases.map(uc => ({
      name: uc.name,
      aiType: uc.ai_type,
      product: uc.product,
      productCategory: uc.product_category,
      commercialType: uc.commercial_type,
      availability: uc.availability,
      score: uc.score,
      url: uc.url,
    })),
    summary: {
      aiAgents: selectedUseCases.filter(uc => uc.ai_type === 'AI Agent').length,
      aiFeatures: selectedUseCases.filter(uc => uc.ai_type === 'AI Feature').length,
      premium: selectedUseCases.filter(uc => uc.commercial_type === 'Premium').length,
      base: selectedUseCases.filter(uc => uc.commercial_type === 'Base').length,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   AI-POWERED INTELLIGENT RECOMMENDATIONS
   Uses LLM to analyze assessment and recommend relevant SAP AI features
   ═══════════════════════════════════════════════════════════════ */

// Cache for AI recommendations to avoid repeated API calls
const aiRecommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get AI-powered recommendations for SAP AI features
 * Uses LLM to intelligently analyze assessment context and recommend relevant features
 * 
 * @param {string} sectionId - Current section ID
 * @param {string} industry - Selected industry key
 * @param {Object} answers - Current assessment answers
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - AI recommendations with explanations
 */
export async function getAIPoweredRecommendations(sectionId, industry, answers, options = {}) {
  const {
    limit = 5,
    language = 'de',
    includeExplanations = true,
  } = options;

  // Create cache key
  const cacheKey = `${sectionId}_${industry}_${JSON.stringify(answers)}_${limit}_${language}`;
  
  // Check cache
  const cached = aiRecommendationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // First, get all available use cases
    const allUseCases = await fetchUseCases();
    
    if (!allUseCases || allUseCases.length === 0) {
      return { recommendations: [], error: 'No use cases available' };
    }

    // Prepare use case summaries for the AI (limit to avoid token overflow)
    const useCaseSummaries = allUseCases.slice(0, 100).map(uc => ({
      id: uc.id || uc.identifier,
      name: uc.name,
      type: uc.ai_type,
      product: uc.product,
      category: uc.product_category,
      availability: uc.availability,
      description: uc.description?.substring(0, 150) || '',
    }));

    // Build context from answers
    const answersContext = Object.entries(answers || {})
      .filter(([_, value]) => value && value.trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Build the AI prompt
    const systemPrompt = language === 'en' 
      ? getEnglishSystemPrompt()
      : getGermanSystemPrompt();

    const userPrompt = buildUserPrompt(sectionId, industry, answersContext, useCaseSummaries, limit, language);

    // Call the AI service
    const aiResponse = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.3, // Lower temperature for more consistent recommendations
      max_tokens: 1500,
    });

    if (!aiResponse.success) {
      console.warn('AI recommendation failed, falling back to rule-based:', aiResponse.error);
      // Fallback to rule-based recommendations
      const fallbackRecs = await getSectionAIHints(sectionId, industry, answers, limit);
      return {
        recommendations: fallbackRecs.map(r => ({
          ...formatRecommendation(r),
          aiExplanation: null,
          isAIPowered: false,
        })),
        isAIPowered: false,
        fallbackReason: aiResponse.error,
      };
    }

    // Parse AI response
    const parsedRecommendations = parseAIRecommendations(aiResponse.content, allUseCases, language);

    // Cache the result
    const result = {
      recommendations: parsedRecommendations,
      isAIPowered: true,
      generatedAt: new Date().toISOString(),
    };
    
    aiRecommendationCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error in AI-powered recommendations:', error);
    
    // Fallback to rule-based recommendations
    const fallbackRecs = await getSectionAIHints(sectionId, industry, answers, limit);
    return {
      recommendations: fallbackRecs.map(r => ({
        ...formatRecommendation(r),
        aiExplanation: null,
        isAIPowered: false,
      })),
      isAIPowered: false,
      fallbackReason: error.message,
    };
  }
}

/**
 * German system prompt for AI recommendations
 */
function getGermanSystemPrompt() {
  return `Du bist ein SAP AI-Experte bei adesso. Deine Aufgabe ist es, basierend auf einem AI Readiness Assessment die relevantesten SAP AI Features und Agents zu empfehlen.

Du erhältst:
1. Den aktuellen Abschnitt des Assessments
2. Die Branche des Kunden
3. Die bisherigen Antworten
4. Eine Liste verfügbarer SAP AI Use Cases

Analysiere den Kontext und wähle die passendsten SAP AI Features aus. Erkläre kurz, WARUM jedes Feature für diesen Kunden relevant ist.

Antworte NUR mit einem gültigen JSON-Objekt im folgenden Format:
{
  "recommendations": [
    {
      "id": "use_case_id",
      "relevance": "high|medium|low",
      "explanation": "Kurze Erklärung warum dieses Feature relevant ist (max 100 Zeichen)"
    }
  ]
}

Wichtige Kriterien:
- Priorisiere "Generally Available" Features
- Berücksichtige die Branche des Kunden
- Achte auf erwähnte SAP-Produkte in den Antworten
- AI Agents sind besonders relevant für Automatisierung
- Joule-Features sind relevant wenn GenAI/Copilot erwähnt wird`;
}

/**
 * English system prompt for AI recommendations
 */
function getEnglishSystemPrompt() {
  return `You are an SAP AI expert at adesso. Your task is to recommend the most relevant SAP AI Features and Agents based on an AI Readiness Assessment.

You receive:
1. The current assessment section
2. The customer's industry
3. Previous answers
4. A list of available SAP AI Use Cases

Analyze the context and select the most suitable SAP AI features. Briefly explain WHY each feature is relevant for this customer.

Respond ONLY with a valid JSON object in the following format:
{
  "recommendations": [
    {
      "id": "use_case_id",
      "relevance": "high|medium|low",
      "explanation": "Brief explanation why this feature is relevant (max 100 chars)"
    }
  ]
}

Important criteria:
- Prioritize "Generally Available" features
- Consider the customer's industry
- Pay attention to SAP products mentioned in answers
- AI Agents are especially relevant for automation
- Joule features are relevant when GenAI/Copilot is mentioned`;
}

/**
 * Build the user prompt with context
 */
function buildUserPrompt(sectionId, industry, answersContext, useCaseSummaries, limit, language) {
  const sectionNames = {
    general: language === 'de' ? 'Allgemeine Informationen' : 'General Information',
    landscape: language === 'de' ? 'SAP-Systemlandschaft' : 'SAP System Landscape',
    licensing: language === 'de' ? 'Lizenzierung' : 'Licensing',
    btp: language === 'de' ? 'SAP BTP' : 'SAP BTP',
    cloud: language === 'de' ? 'Cloud & Integration' : 'Cloud & Integration',
    aiSap: language === 'de' ? 'KI im SAP-Umfeld' : 'AI in SAP Environment',
    aiNonSap: language === 'de' ? 'Non-SAP KI' : 'Non-SAP AI',
    data: language === 'de' ? 'Datengrundlage' : 'Data Foundation',
    security: language === 'de' ? 'Compliance & Governance' : 'Compliance & Governance',
    org: language === 'de' ? 'Organisation & Kompetenzen' : 'Organization & Skills',
    useCases: language === 'de' ? 'Use Cases & Priorisierung' : 'Use Cases & Prioritization',
  };

  const industryNames = {
    insurance: language === 'de' ? 'Versicherungen' : 'Insurance',
    banking: language === 'de' ? 'Banken' : 'Banking',
    healthcare: language === 'de' ? 'Gesundheitswesen' : 'Healthcare',
    automotive: language === 'de' ? 'Automobil' : 'Automotive',
    manufacturing: language === 'de' ? 'Fertigung' : 'Manufacturing',
    retail: language === 'de' ? 'Handel' : 'Retail',
    energy: language === 'de' ? 'Energie' : 'Energy',
    publicSector: language === 'de' ? 'Öffentlicher Sektor' : 'Public Sector',
    lifeSciences: language === 'de' ? 'Life Sciences' : 'Life Sciences',
  };

  const sectionName = sectionNames[sectionId] || sectionId;
  const industryName = industryNames[industry] || industry;

  if (language === 'de') {
    return `Aktueller Abschnitt: ${sectionName}
Branche: ${industryName}

Bisherige Antworten:
${answersContext || 'Noch keine Antworten erfasst.'}

Verfügbare SAP AI Use Cases (${useCaseSummaries.length} Stück):
${JSON.stringify(useCaseSummaries, null, 2)}

Wähle die ${limit} relevantesten SAP AI Features für diesen Kunden aus und erkläre kurz warum.`;
  }

  return `Current Section: ${sectionName}
Industry: ${industryName}

Previous Answers:
${answersContext || 'No answers captured yet.'}

Available SAP AI Use Cases (${useCaseSummaries.length} items):
${JSON.stringify(useCaseSummaries, null, 2)}

Select the ${limit} most relevant SAP AI features for this customer and briefly explain why.`;
}

/**
 * Parse AI response and match with actual use cases
 */
function parseAIRecommendations(aiContent, allUseCases, language) {
  try {
    // Extract JSON from response
    let jsonStr = aiContent;
    const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    const recommendations = parsed.recommendations || [];

    // Match AI recommendations with actual use cases
    return recommendations
      .map(rec => {
        // Find the matching use case
        const useCase = allUseCases.find(uc => 
          uc.id === rec.id || 
          uc.identifier === rec.id ||
          uc.name?.toLowerCase().includes(rec.id?.toLowerCase()) ||
          rec.id?.toLowerCase().includes(uc.name?.toLowerCase())
        );

        if (!useCase) {
          // Try fuzzy matching by name
          const fuzzyMatch = allUseCases.find(uc =>
            uc.name?.toLowerCase().includes(rec.name?.toLowerCase()) ||
            rec.name?.toLowerCase().includes(uc.name?.toLowerCase())
          );
          if (fuzzyMatch) {
            return {
              ...formatRecommendation(fuzzyMatch),
              aiExplanation: rec.explanation,
              aiRelevance: rec.relevance,
              isAIPowered: true,
            };
          }
          return null;
        }

        return {
          ...formatRecommendation(useCase),
          aiExplanation: rec.explanation,
          aiRelevance: rec.relevance,
          isAIPowered: true,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Error parsing AI recommendations:', error);
    return [];
  }
}

/**
 * Clear the AI recommendation cache
 */
export function clearAIRecommendationCache() {
  aiRecommendationCache.clear();
}
