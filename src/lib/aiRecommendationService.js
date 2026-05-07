/* ═══════════════════════════════════════════════════════════════
   AI RECOMMENDATION SERVICE
   Matches SAP AI use cases to customer assessments
   Enhanced with intelligent scoring and AI-powered recommendations
   
   Features:
   - Industry-specific AI needs mapping
   - Assessment answer analysis for pain points and goals
   - AI-powered personalized recommendation reasoning
   - Web search integration for industry AI trends
   ═══════════════════════════════════════════════════════════════ */

import { fetchUseCases, INDUSTRY_CATEGORY_MAP } from './sapAICatalogService';
import { callAI } from './aiService';

/**
 * INDUSTRY-SPECIFIC AI NEEDS MAPPING
 * Deep mapping of what each industry typically needs from AI
 * Based on industry research and SAP best practices
 */
export const INDUSTRY_AI_NEEDS = {
  insurance: {
    primaryNeeds: ['fraud_detection', 'claims_automation', 'underwriting', 'customer_service', 'risk_assessment'],
    painPoints: ['manual claims processing', 'fraud losses', 'slow underwriting', 'customer churn', 'regulatory compliance'],
    aiUseCases: ['Intelligent Claims Processing', 'Fraud Detection', 'Automated Underwriting', 'Customer 360', 'Risk Analytics'],
    keywords: ['claim', 'policy', 'premium', 'underwriting', 'fraud', 'risk', 'actuary', 'reinsurance', 'coverage'],
    sapProducts: ['SAP S/4HANA', 'SAP Analytics Cloud', 'SAP Customer Data Platform', 'SAP Signavio'],
    businessAreas: ['finance', 'service', 'analytics'],
  },
  banking: {
    primaryNeeds: ['fraud_detection', 'credit_scoring', 'aml_compliance', 'customer_analytics', 'process_automation'],
    painPoints: ['fraud losses', 'manual compliance', 'slow loan processing', 'customer experience', 'regulatory reporting'],
    aiUseCases: ['Fraud Detection', 'Credit Risk Assessment', 'AML Screening', 'Customer Insights', 'Intelligent Automation'],
    keywords: ['loan', 'credit', 'deposit', 'payment', 'compliance', 'aml', 'kyc', 'fraud', 'risk', 'treasury'],
    sapProducts: ['SAP S/4HANA', 'SAP Analytics Cloud', 'SAP Signavio', 'SAP Build Process Automation'],
    businessAreas: ['finance', 'analytics', 'service'],
  },
  healthcare: {
    primaryNeeds: ['patient_care', 'clinical_decision', 'resource_optimization', 'billing_automation', 'compliance'],
    painPoints: ['staff shortages', 'billing errors', 'patient wait times', 'documentation burden', 'regulatory compliance'],
    aiUseCases: ['Clinical Decision Support', 'Patient Flow Optimization', 'Revenue Cycle Management', 'Workforce Planning'],
    keywords: ['patient', 'clinical', 'diagnosis', 'treatment', 'hospital', 'physician', 'nurse', 'billing', 'ehr', 'emr'],
    sapProducts: ['SAP S/4HANA', 'SAP SuccessFactors', 'SAP Analytics Cloud', 'SAP Signavio'],
    businessAreas: ['hr', 'finance', 'service'],
  },
  automotive: {
    primaryNeeds: ['supply_chain', 'quality_control', 'predictive_maintenance', 'demand_forecasting', 'production_optimization'],
    painPoints: ['supply chain disruptions', 'quality issues', 'production downtime', 'inventory costs', 'demand volatility'],
    aiUseCases: ['Supply Chain Risk Management', 'Quality Inspection', 'Predictive Maintenance', 'Demand Sensing'],
    keywords: ['vehicle', 'production', 'assembly', 'supplier', 'parts', 'quality', 'oem', 'tier', 'logistics'],
    sapProducts: ['SAP S/4HANA', 'SAP IBP', 'SAP Digital Manufacturing', 'SAP Ariba'],
    businessAreas: ['supply_chain', 'manufacturing', 'procurement'],
  },
  manufacturing: {
    primaryNeeds: ['predictive_maintenance', 'quality_control', 'production_planning', 'supply_chain', 'energy_optimization'],
    painPoints: ['unplanned downtime', 'quality defects', 'production inefficiency', 'supply disruptions', 'energy costs'],
    aiUseCases: ['Predictive Maintenance', 'Visual Quality Inspection', 'Production Scheduling', 'Energy Management'],
    keywords: ['production', 'machine', 'equipment', 'maintenance', 'quality', 'shop floor', 'oee', 'downtime'],
    sapProducts: ['SAP S/4HANA', 'SAP Digital Manufacturing', 'SAP IBP', 'SAP Asset Performance Management'],
    businessAreas: ['manufacturing', 'supply_chain', 'analytics'],
  },
  retail: {
    primaryNeeds: ['demand_forecasting', 'personalization', 'inventory_optimization', 'customer_analytics', 'pricing'],
    painPoints: ['stockouts', 'overstock', 'customer churn', 'margin pressure', 'omnichannel complexity'],
    aiUseCases: ['Demand Forecasting', 'Personalized Recommendations', 'Dynamic Pricing', 'Inventory Optimization'],
    keywords: ['store', 'customer', 'inventory', 'merchandise', 'promotion', 'pricing', 'omnichannel', 'e-commerce'],
    sapProducts: ['SAP S/4HANA Retail', 'SAP Customer Data Platform', 'SAP Commerce Cloud', 'SAP Analytics Cloud'],
    businessAreas: ['sales', 'supply_chain', 'analytics'],
  },
  energy: {
    primaryNeeds: ['grid_optimization', 'predictive_maintenance', 'demand_forecasting', 'asset_management', 'sustainability'],
    painPoints: ['grid instability', 'asset failures', 'demand volatility', 'regulatory compliance', 'renewable integration'],
    aiUseCases: ['Grid Optimization', 'Predictive Maintenance', 'Load Forecasting', 'Asset Performance Management'],
    keywords: ['grid', 'power', 'energy', 'utility', 'meter', 'renewable', 'generation', 'distribution', 'transmission'],
    sapProducts: ['SAP S/4HANA Utilities', 'SAP Asset Performance Management', 'SAP Analytics Cloud'],
    businessAreas: ['supply_chain', 'analytics', 'finance'],
  },
  publicSector: {
    primaryNeeds: ['citizen_services', 'process_automation', 'fraud_detection', 'resource_optimization', 'compliance'],
    painPoints: ['citizen experience', 'manual processes', 'budget constraints', 'fraud/waste', 'legacy systems'],
    aiUseCases: ['Citizen Service Automation', 'Fraud Detection', 'Resource Planning', 'Document Processing'],
    keywords: ['citizen', 'government', 'public', 'agency', 'compliance', 'budget', 'grant', 'permit', 'license'],
    sapProducts: ['SAP S/4HANA', 'SAP Build Process Automation', 'SAP Analytics Cloud', 'SAP Signavio'],
    businessAreas: ['service', 'finance', 'hr'],
  },
  lifeSciences: {
    primaryNeeds: ['drug_discovery', 'clinical_trials', 'quality_compliance', 'supply_chain', 'regulatory'],
    painPoints: ['R&D costs', 'trial delays', 'compliance burden', 'supply chain complexity', 'serialization'],
    aiUseCases: ['Drug Discovery', 'Clinical Trial Optimization', 'Quality Management', 'Track & Trace'],
    keywords: ['pharma', 'drug', 'clinical', 'trial', 'fda', 'gxp', 'batch', 'serialization', 'validation'],
    sapProducts: ['SAP S/4HANA', 'SAP ATTP', 'SAP EHS', 'SAP Analytics Cloud'],
    businessAreas: ['manufacturing', 'supply_chain', 'analytics'],
  },
  lottery: {
    primaryNeeds: ['fraud_detection', 'player_protection', 'customer_analytics', 'operations_optimization', 'compliance'],
    painPoints: ['fraud', 'responsible gaming', 'player engagement', 'operational efficiency', 'regulatory compliance'],
    aiUseCases: ['Fraud Detection', 'Responsible Gaming', 'Player Analytics', 'Operations Optimization'],
    keywords: ['lottery', 'gaming', 'player', 'ticket', 'draw', 'jackpot', 'responsible', 'fraud'],
    sapProducts: ['SAP S/4HANA', 'SAP Analytics Cloud', 'SAP Customer Data Platform'],
    businessAreas: ['analytics', 'service', 'finance'],
  },
  transport: {
    primaryNeeds: ['route_optimization', 'predictive_maintenance', 'demand_forecasting', 'fleet_management', 'customer_service'],
    painPoints: ['delays', 'maintenance costs', 'capacity planning', 'customer complaints', 'fuel costs'],
    aiUseCases: ['Route Optimization', 'Predictive Maintenance', 'Demand Forecasting', 'Fleet Management'],
    keywords: ['transport', 'logistics', 'fleet', 'route', 'delivery', 'shipment', 'carrier', 'freight'],
    sapProducts: ['SAP TM', 'SAP S/4HANA', 'SAP Asset Performance Management', 'SAP Analytics Cloud'],
    businessAreas: ['supply_chain', 'service', 'analytics'],
  },
  media: {
    primaryNeeds: ['content_personalization', 'audience_analytics', 'ad_optimization', 'content_creation', 'subscription_management'],
    painPoints: ['content discovery', 'audience engagement', 'ad revenue', 'churn', 'content costs'],
    aiUseCases: ['Content Recommendation', 'Audience Analytics', 'Ad Optimization', 'Churn Prediction'],
    keywords: ['content', 'media', 'audience', 'subscriber', 'advertising', 'streaming', 'publishing'],
    sapProducts: ['SAP Customer Data Platform', 'SAP Analytics Cloud', 'SAP Emarsys'],
    businessAreas: ['sales', 'analytics', 'service'],
  },
  defense: {
    primaryNeeds: ['logistics_optimization', 'predictive_maintenance', 'resource_planning', 'security', 'compliance'],
    painPoints: ['readiness', 'maintenance costs', 'supply chain', 'security', 'budget constraints'],
    aiUseCases: ['Logistics Optimization', 'Predictive Maintenance', 'Resource Planning', 'Security Analytics'],
    keywords: ['defense', 'military', 'logistics', 'readiness', 'maintenance', 'security', 'classified'],
    sapProducts: ['SAP S/4HANA Defense', 'SAP Asset Performance Management', 'SAP Analytics Cloud'],
    businessAreas: ['supply_chain', 'manufacturing', 'hr'],
  },
  foodBeverage: {
    primaryNeeds: ['demand_forecasting', 'quality_control', 'supply_chain', 'traceability', 'sustainability'],
    painPoints: ['waste', 'quality issues', 'supply disruptions', 'traceability', 'compliance'],
    aiUseCases: ['Demand Forecasting', 'Quality Inspection', 'Supply Chain Optimization', 'Traceability'],
    keywords: ['food', 'beverage', 'recipe', 'batch', 'quality', 'shelf life', 'traceability', 'recall'],
    sapProducts: ['SAP S/4HANA', 'SAP IBP', 'SAP Digital Manufacturing', 'SAP Analytics Cloud'],
    businessAreas: ['manufacturing', 'supply_chain', 'analytics'],
  },
  construction: {
    primaryNeeds: ['project_management', 'resource_optimization', 'cost_control', 'safety', 'sustainability'],
    painPoints: ['project delays', 'cost overruns', 'resource allocation', 'safety incidents', 'documentation'],
    aiUseCases: ['Project Analytics', 'Resource Optimization', 'Cost Prediction', 'Safety Analytics'],
    keywords: ['construction', 'project', 'building', 'site', 'contractor', 'material', 'schedule'],
    sapProducts: ['SAP S/4HANA', 'SAP Analytics Cloud', 'SAP Build Process Automation'],
    businessAreas: ['finance', 'supply_chain', 'hr'],
  },
  tradeFairsSports: {
    primaryNeeds: ['event_planning', 'customer_engagement', 'revenue_optimization', 'operations', 'analytics'],
    painPoints: ['attendance prediction', 'customer experience', 'revenue management', 'operations', 'sponsorship'],
    aiUseCases: ['Demand Forecasting', 'Customer Analytics', 'Revenue Management', 'Operations Optimization'],
    keywords: ['event', 'venue', 'ticket', 'attendee', 'sponsor', 'exhibition', 'sports', 'fan'],
    sapProducts: ['SAP S/4HANA', 'SAP Customer Data Platform', 'SAP Analytics Cloud'],
    businessAreas: ['sales', 'service', 'analytics'],
  },
  telecom: {
    primaryNeeds: ['network_optimization', 'customer_analytics', 'churn_prediction', 'fraud_detection', 'service_automation'],
    painPoints: ['network issues', 'customer churn', 'fraud', 'service costs', 'competition'],
    aiUseCases: ['Network Optimization', 'Churn Prediction', 'Fraud Detection', 'Service Automation'],
    keywords: ['network', 'telecom', 'subscriber', 'bandwidth', 'coverage', '5g', 'fiber', 'mobile'],
    sapProducts: ['SAP S/4HANA', 'SAP Customer Data Platform', 'SAP Analytics Cloud', 'SAP Signavio'],
    businessAreas: ['service', 'analytics', 'sales'],
  },
  professionalServices: {
    primaryNeeds: ['resource_management', 'project_analytics', 'knowledge_management', 'client_insights', 'automation'],
    painPoints: ['utilization', 'project profitability', 'knowledge sharing', 'client retention', 'admin overhead'],
    aiUseCases: ['Resource Optimization', 'Project Analytics', 'Knowledge Management', 'Client Insights'],
    keywords: ['consulting', 'project', 'resource', 'utilization', 'billable', 'engagement', 'proposal'],
    sapProducts: ['SAP S/4HANA', 'SAP SuccessFactors', 'SAP Analytics Cloud', 'SAP Build'],
    businessAreas: ['hr', 'finance', 'analytics'],
  },
  chemical: {
    primaryNeeds: ['process_optimization', 'quality_control', 'safety_compliance', 'supply_chain', 'sustainability'],
    painPoints: ['yield optimization', 'quality issues', 'safety', 'regulatory compliance', 'energy costs'],
    aiUseCases: ['Process Optimization', 'Quality Prediction', 'Safety Analytics', 'Energy Management'],
    keywords: ['chemical', 'process', 'batch', 'formula', 'hazardous', 'ehs', 'yield', 'reactor'],
    sapProducts: ['SAP S/4HANA', 'SAP EHS', 'SAP Digital Manufacturing', 'SAP Analytics Cloud'],
    businessAreas: ['manufacturing', 'supply_chain', 'analytics'],
  },
};

/**
 * SAP Products that can be detected in assessment answers
 * Extended list with common variations and abbreviations
 */
export const SAP_PRODUCTS = [
  // Core ERP
  'SAP S/4HANA',
  'SAP S/4HANA Cloud',
  'SAP S/4HANA Public Cloud',
  'SAP S/4HANA Private Cloud',
  'SAP ECC',
  'SAP ERP',
  'RISE with SAP',
  'GROW with SAP',
  // Platform
  'SAP BTP',
  'SAP Business Technology Platform',
  'SAP AI Core',
  'SAP AI Launchpad',
  'SAP Datasphere',
  'SAP Data Intelligence',
  'SAP Integration Suite',
  'SAP Build',
  'SAP Build Apps',
  'SAP Build Process Automation',
  // CX
  'SAP Sales Cloud',
  'SAP Service Cloud',
  'SAP Commerce Cloud',
  'SAP Marketing Cloud',
  'SAP Customer Data Platform',
  'SAP Customer Data Cloud',
  'SAP Emarsys',
  // HCM
  'SAP SuccessFactors',
  'SAP HCM',
  'SAP HXM',
  // Spend Management
  'SAP Ariba',
  'SAP Fieldglass',
  'SAP Concur',
  // Supply Chain
  'SAP IBP',
  'SAP Integrated Business Planning',
  'SAP TM',
  'SAP Transportation Management',
  'SAP EWM',
  'SAP Extended Warehouse Management',
  'SAP Digital Manufacturing',
  'SAP ME',
  'SAP MII',
  // Analytics
  'SAP Analytics Cloud',
  'SAP SAC',
  'SAP BW/4HANA',
  'SAP Business Warehouse',
  // Process
  'SAP Signavio',
  'SAP Process Insights',
  // AI
  'SAP Joule',
  'SAP Business AI',
  // Industry
  'SAP IS-U',
  'SAP Utilities',
  'SAP IS-H',
  'SAP Healthcare',
  'SAP Banking',
  'SAP Insurance',
  'SAP Retail',
];

/**
 * Keywords that indicate GenAI/Joule interest
 */
const GENAI_KEYWORDS = [
  'genai', 'generative', 'joule', 'chatbot', 'llm', 'gpt', 'copilot',
  'natural language', 'conversational', 'assistant', 'ki-assistent',
  'sprachmodell', 'text generation', 'content generation', 'ai assistant',
  'intelligent assistant', 'virtual assistant', 'chat', 'nlp', 'nlu',
];

/**
 * Keywords that indicate automation interest
 */
const AUTOMATION_KEYWORDS = [
  'automat', 'agent', 'rpa', 'workflow', 'dunkelverarbeitung',
  'straight-through', 'stp', 'bot', 'autonomous', 'self-service',
  'automatisierung', 'prozessautomatisierung', 'intelligent automation',
  'hyperautomation', 'no-touch', 'touchless', 'hands-free',
];

/**
 * Keywords that indicate specific business areas
 */
const BUSINESS_AREA_KEYWORDS = {
  finance: ['finance', 'finanzen', 'accounting', 'buchhaltung', 'controlling', 'treasury', 'payment', 'invoice', 'billing', 'cash', 'credit', 'debit', 'gl', 'ap', 'ar'],
  hr: ['hr', 'human resources', 'personal', 'recruiting', 'talent', 'learning', 'payroll', 'employee', 'workforce', 'mitarbeiter'],
  sales: ['sales', 'vertrieb', 'crm', 'customer', 'kunde', 'lead', 'opportunity', 'quote', 'order', 'pricing'],
  service: ['service', 'support', 'ticket', 'case', 'incident', 'helpdesk', 'kundenservice', 'field service'],
  procurement: ['procurement', 'einkauf', 'purchasing', 'sourcing', 'supplier', 'lieferant', 'vendor', 'contract'],
  supply_chain: ['supply chain', 'logistics', 'logistik', 'warehouse', 'lager', 'inventory', 'bestand', 'transport', 'shipping', 'delivery'],
  manufacturing: ['manufacturing', 'fertigung', 'production', 'produktion', 'quality', 'qualität', 'maintenance', 'instandhaltung', 'shop floor'],
  analytics: ['analytics', 'reporting', 'dashboard', 'kpi', 'forecast', 'prognose', 'prediction', 'insight', 'bi', 'business intelligence'],
};

/**
 * Map business areas to SAP product categories
 */
const BUSINESS_AREA_TO_CATEGORY = {
  finance: ['Financial Management', 'Cloud ERP applications'],
  hr: ['Human Capital Management'],
  sales: ['Customer Relationship Management'],
  service: ['Customer Relationship Management'],
  procurement: ['Spend Management', 'Supplier Management'],
  supply_chain: ['Supply Chain Management'],
  manufacturing: ['Supply Chain Management', 'Product Lifecycle Management'],
  analytics: ['Technology Platform', 'Cloud ERP applications'],
};

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
 * ONLY shows recommendations relevant to customer's industry and licenses
 * 
 * @param {Object} assessment - Assessment object with industry
 * @param {Object} answers - Assessment answers
 * @param {Object} options - Additional options (limit, filters)
 * @returns {Promise<Object[]>} - Scored and ranked use cases
 */
export async function getRecommendedAIUseCases(assessment, answers, options = {}) {
  const {
    limit = 15,
    includeAllMatches = false,
    filters = {},
    minScore = 100, // Minimum score to be considered relevant
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
    
    // Get industry-specific needs
    const industryNeeds = INDUSTRY_AI_NEEDS[industry] || {};
    const industryKeywords = industryNeeds.keywords || [];
    const industryAIUseCases = industryNeeds.aiUseCases || [];
    const industrySAPProducts = industryNeeds.sapProducts || [];
    const industryBusinessAreas = industryNeeds.businessAreas || [];
    
    const context = {
      industry,
      mentionedProducts,
      hasGenAI,
      hasAutomation,
      answers,
      industryNeeds,
    };
    
    // Get industry categories for filtering
    const industryCategories = INDUSTRY_CATEGORY_MAP[industry] || [];
    
    // Filter and score use cases - ONLY include relevant ones
    let recommendations = allUseCases.map(useCase => {
      let score = 0;
      const matchReasons = [];
      
      // 1. Availability bonus (GA is most valuable)
      switch (useCase.availability) {
        case 'Generally Available':
          score += 50;
          break;
        case 'Beta':
          score += 25;
          break;
        case 'Early Adopter Care (EAC)':
          score += 10;
          break;
        default:
          score += 5;
      }
      
      // 2. CRITICAL: Product match - customer must have this product/license
      const productMatch = mentionedProducts.some(p => {
        const productLower = useCase.product?.toLowerCase() || '';
        const pLower = p.toLowerCase();
        return productLower.includes(pLower) || pLower.includes(productLower.split(' ')[0]);
      });
      
      if (productMatch) {
        score += 150; // Strong signal - customer has this product
        matchReasons.push('product');
      }
      
      // 3. Industry category match
      if (industryCategories.includes(useCase.product_category)) {
        score += 80;
        matchReasons.push('industry');
      }
      
      // 4. Industry-specific AI use case name match
      const useCaseNameLower = useCase.name?.toLowerCase() || '';
      const useCaseDescLower = useCase.description?.toLowerCase() || '';
      const industryUseCaseMatch = industryAIUseCases.some(iuc => 
        useCaseNameLower.includes(iuc.toLowerCase()) || 
        useCaseDescLower.includes(iuc.toLowerCase())
      );
      if (industryUseCaseMatch) {
        score += 100;
        matchReasons.push('industry_usecase');
      }
      
      // 5. Industry keyword match in description
      const keywordMatches = industryKeywords.filter(kw => 
        useCaseNameLower.includes(kw.toLowerCase()) || 
        useCaseDescLower.includes(kw.toLowerCase())
      );
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 20;
        matchReasons.push('keyword');
      }
      
      // 6. Business area match
      const businessAreaCategories = industryBusinessAreas.flatMap(ba => BUSINESS_AREA_TO_CATEGORY[ba] || []);
      if (businessAreaCategories.includes(useCase.product_category)) {
        score += 40;
        matchReasons.push('business_area');
      }
      
      // 7. Joule/GenAI bonus
      if (hasGenAI && useCase.quick_filters?.toLowerCase().includes('joule')) {
        score += 60;
        matchReasons.push('genai');
      }
      
      // 8. AI Agent bonus (if automation interest)
      if (hasAutomation && useCase.ai_type === 'AI Agent') {
        score += 50;
        matchReasons.push('automation');
      }
      
      // 9. Featured/New bonus
      if (useCase.quick_filters?.toLowerCase().includes('featured')) {
        score += 15;
      }
      if (useCase.quick_filters?.toLowerCase().includes('new')) {
        score += 10;
      }
      
      return {
        ...useCase,
        score,
        matchReasons,
        isRecommended: score >= minScore,
      };
    });
    
    // CRITICAL: Filter to ONLY relevant matches
    // Must have at least one match reason (industry, product, keyword, etc.)
    if (!includeAllMatches) {
      recommendations = recommendations.filter(r => 
        r.score >= minScore && r.matchReasons.length > 0
      );
    }
    
    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);
    
    // Apply limit
    if (limit > 0) {
      recommendations = recommendations.slice(0, limit);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return [];
  }
}

/**
 * Enhanced section to category and keyword mapping
 * Maps assessment sections to relevant SAP AI use cases
 */
const SECTION_AI_MAPPING = {
  general: {
    categories: [],
    keywords: [],
    preferAgents: false,
    description: 'General company information',
  },
  landscape: {
    categories: ['Cloud ERP applications', 'Technology Platform', 'Financial Management'],
    keywords: ['s/4hana', 'erp', 'sap', 'system', 'landscape', 'integration'],
    preferAgents: false,
    description: 'SAP system landscape',
  },
  licensing: {
    categories: ['Cloud ERP applications', 'Technology Platform'],
    keywords: ['license', 'cloud', 'subscription', 'rise', 'grow'],
    preferAgents: false,
    description: 'Licensing and cloud strategy',
  },
  btp: {
    categories: ['Technology Platform'],
    keywords: ['btp', 'platform', 'integration', 'extension', 'build', 'ai core'],
    preferAgents: true,
    description: 'SAP BTP and platform services',
  },
  cloud: {
    categories: ['Cloud ERP applications', 'Technology Platform'],
    keywords: ['cloud', 'migration', 'hybrid', 'integration'],
    preferAgents: false,
    description: 'Cloud and integration strategy',
  },
  aiSap: {
    categories: ['Technology Platform', 'Cloud ERP applications', 'Financial Management', 'Customer Relationship Management', 'Supply Chain Management', 'Human Capital Management'],
    keywords: ['ai', 'joule', 'agent', 'automation', 'intelligent', 'machine learning', 'copilot'],
    preferAgents: true,
    description: 'AI in SAP environment',
  },
  aiNonSap: {
    categories: ['Technology Platform'],
    keywords: ['ai', 'ml', 'genai', 'llm', 'chatgpt', 'copilot', 'automation'],
    preferAgents: true,
    description: 'Non-SAP AI and integration',
  },
  data: {
    categories: ['Technology Platform', 'Cloud ERP applications'],
    keywords: ['data', 'analytics', 'datasphere', 'warehouse', 'quality', 'governance'],
    preferAgents: false,
    description: 'Data foundation and analytics',
  },
  security: {
    categories: ['Technology Platform'],
    keywords: ['security', 'compliance', 'governance', 'audit', 'risk'],
    preferAgents: false,
    description: 'Security and compliance',
  },
  org: {
    categories: ['Human Capital Management', 'Technology Platform'],
    keywords: ['training', 'skills', 'team', 'organization', 'change', 'adoption'],
    preferAgents: true,
    description: 'Organization and skills',
  },
  useCases: {
    categories: [], // All categories
    keywords: ['use case', 'process', 'automation', 'efficiency', 'productivity'],
    preferAgents: true,
    description: 'Use cases and prioritization',
  },
  // Finance-specific sections
  finance: {
    categories: ['Financial Management', 'Cloud ERP applications'],
    keywords: ['finance', 'accounting', 'invoice', 'payment', 'cash', 'receivable', 'payable', 'accrual', 'dispute'],
    preferAgents: true,
    description: 'Finance and accounting',
  },
  // HR-specific sections
  hr: {
    categories: ['Human Capital Management'],
    keywords: ['hr', 'employee', 'recruiting', 'talent', 'performance', 'learning', 'payroll'],
    preferAgents: true,
    description: 'Human resources',
  },
  // Sales-specific sections
  sales: {
    categories: ['Customer Relationship Management'],
    keywords: ['sales', 'customer', 'lead', 'opportunity', 'quote', 'crm'],
    preferAgents: true,
    description: 'Sales and CRM',
  },
  // Service-specific sections
  service: {
    categories: ['Customer Relationship Management'],
    keywords: ['service', 'support', 'ticket', 'case', 'knowledge', 'customer service'],
    preferAgents: true,
    description: 'Customer service',
  },
  // Supply chain sections
  supplyChain: {
    categories: ['Supply Chain Management', 'Product Lifecycle Management'],
    keywords: ['supply chain', 'logistics', 'warehouse', 'inventory', 'transport', 'manufacturing', 'maintenance'],
    preferAgents: true,
    description: 'Supply chain and logistics',
  },
  // Procurement sections
  procurement: {
    categories: ['Spend Management', 'Supplier Management'],
    keywords: ['procurement', 'purchasing', 'supplier', 'expense', 'travel', 'invoice'],
    preferAgents: true,
    description: 'Procurement and spend management',
  },
};

/**
 * Extract relevant keywords from assessment answers
 * @param {Object} answers - Assessment answers
 * @returns {string[]} - Extracted keywords
 */
function extractKeywordsFromAnswers(answers) {
  if (!answers || typeof answers !== 'object') return [];
  
  const keywords = new Set();
  const answersText = Object.values(answers)
    .filter(a => typeof a === 'string')
    .join(' ')
    .toLowerCase();
  
  // Check for business area keywords
  Object.entries(BUSINESS_AREA_KEYWORDS).forEach(([area, areaKeywords]) => {
    areaKeywords.forEach(keyword => {
      if (answersText.includes(keyword.toLowerCase())) {
        keywords.add(area);
      }
    });
  });
  
  // Check for specific process keywords
  const processKeywords = [
    'invoice', 'payment', 'order', 'delivery', 'production', 'maintenance',
    'recruiting', 'onboarding', 'expense', 'travel', 'service', 'support',
    'sales', 'marketing', 'analytics', 'reporting', 'planning', 'forecast'
  ];
  
  processKeywords.forEach(keyword => {
    if (answersText.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  return Array.from(keywords);
}

/**
 * Get AI hints for a specific section during assessment
 * Enhanced version with better matching for AI Agents and Features
 * 
 * @param {string} sectionId - Current section ID
 * @param {string} industry - Selected industry
 * @param {Object} answers - Current answers
 * @param {number} limit - Max hints to show
 * @returns {Promise<Object[]>} - Relevant AI use cases for hints
 */
export async function getSectionAIHints(sectionId, industry, answers, limit = 5) {
  const sectionMapping = SECTION_AI_MAPPING[sectionId] || SECTION_AI_MAPPING.general;
  const sectionCategories = sectionMapping.categories;
  const sectionKeywords = sectionMapping.keywords;
  const preferAgents = sectionMapping.preferAgents;
  
  try {
    // Get all use cases first
    const allUseCases = await fetchUseCases();
    
    if (!allUseCases || allUseCases.length === 0) {
      return [];
    }
    
    // Extract keywords from answers
    const answerKeywords = extractKeywordsFromAnswers(answers);
    const allKeywords = [...sectionKeywords, ...answerKeywords];
    
    // Build context for scoring
    const mentionedProducts = extractSAPProducts(answers);
    const hasGenAI = hasGenAIInterest(answers);
    const hasAutomation = hasAutomationInterest(answers);
    
    // Get industry categories
    const industryCategories = INDUSTRY_CATEGORY_MAP[industry] || [];
    
    // Score and filter use cases
    let scoredUseCases = allUseCases.map(useCase => {
      let score = 0;
      const matchReasons = [];
      
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
      
      // 2. Section category match (high priority)
      if (sectionCategories.length > 0 && sectionCategories.includes(useCase.product_category)) {
        score += 80;
        matchReasons.push('section');
      }
      
      // 3. Industry category match
      if (industryCategories.includes(useCase.product_category)) {
        score += 60;
        matchReasons.push('industry');
      }
      
      // 4. Product match bonus
      if (mentionedProducts && mentionedProducts.length > 0) {
        const productMatch = mentionedProducts.some(p => 
          useCase.product?.toLowerCase().includes(p.toLowerCase()) ||
          p.toLowerCase().includes(useCase.product?.toLowerCase())
        );
        if (productMatch) {
          score += 120;
          matchReasons.push('product');
        }
      }
      
      // 5. Keyword match in name or description
      const useCaseText = `${useCase.name} ${useCase.description}`.toLowerCase();
      const keywordMatches = allKeywords.filter(kw => useCaseText.includes(kw.toLowerCase()));
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 30;
        matchReasons.push('keyword');
      }
      
      // 6. Joule/GenAI bonus
      if (hasGenAI && useCase.quick_filters?.toLowerCase().includes('joule')) {
        score += 60;
        matchReasons.push('genai');
      }
      
      // 7. AI Agent bonus (if section prefers agents or automation interest)
      if (useCase.ai_type === 'AI Agent') {
        if (preferAgents) {
          score += 50;
        }
        if (hasAutomation) {
          score += 40;
          matchReasons.push('automation');
        }
      }
      
      // 8. Featured bonus
      if (useCase.quick_filters?.toLowerCase().includes('featured')) {
        score += 25;
      }
      
      // 9. New bonus
      if (useCase.quick_filters?.toLowerCase().includes('new')) {
        score += 15;
      }
      
      return {
        ...useCase,
        score,
        matchReasons,
        isRecommended: score >= 100,
      };
    });
    
    // Filter to relevant matches
    scoredUseCases = scoredUseCases.filter(uc => uc.score >= 50);
    
    // Sort by score
    scoredUseCases.sort((a, b) => {
      // If section prefers agents, prioritize them
      if (preferAgents) {
        if (a.ai_type === 'AI Agent' && b.ai_type !== 'AI Agent') return -1;
        if (b.ai_type === 'AI Agent' && a.ai_type !== 'AI Agent') return 1;
      }
      return b.score - a.score;
    });
    
    // Ensure mix of Agents and Features if available
    const agents = scoredUseCases.filter(uc => uc.ai_type === 'AI Agent');
    const features = scoredUseCases.filter(uc => uc.ai_type === 'AI Feature');
    
    let result = [];
    
    if (preferAgents && agents.length > 0) {
      // Prioritize agents but include some features
      const agentCount = Math.min(Math.ceil(limit * 0.6), agents.length);
      const featureCount = Math.min(limit - agentCount, features.length);
      result = [...agents.slice(0, agentCount), ...features.slice(0, featureCount)];
    } else {
      // Mix based on score
      result = scoredUseCases.slice(0, limit);
    }
    
    // Re-sort by score
    result.sort((a, b) => b.score - a.score);
    
    return result.slice(0, limit);
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
