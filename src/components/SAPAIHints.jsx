/* ═══════════════════════════════════════════════════════════════
   SAP AI HINTS COMPONENT
   Shows relevant AI use cases as hints during assessment
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getSectionAIHints, formatRecommendation, generateAIEstimatorURL, getAIPoweredRecommendations } from '../lib/aiRecommendationService';
import { getAvailabilityColor } from '../lib/sapAICatalogService';

/**
 * SAPAIHints - Collapsible panel showing AI recommendations during assessment
 */
export default function SAPAIHints({
  sectionId,
  industry,
  answers,
  selectedUseCases = [],
  onSelectUseCase,
  onDeselectUseCase,
  compact = false,
  useAI = true, // Enable AI-powered recommendations by default
}) {
  const { t, language } = useLanguage();
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Load hints when section or answers change
  useEffect(() => {
    if (sectionId && industry) {
      loadHints();
    }
  }, [sectionId, industry, JSON.stringify(answers)]);

  const loadHints = useCallback(async () => {
    setLoading(true);
    setAiError(null);
    try {
      const limit = showAll ? 10 : 5;
      
      if (useAI) {
        // Try AI-powered recommendations first
        const aiResult = await getAIPoweredRecommendations(sectionId, industry, answers, {
          limit,
          language,
          includeExplanations: true,
        });
        
        if (aiResult.isAIPowered && aiResult.recommendations.length > 0) {
          setHints(aiResult.recommendations);
          setIsAIPowered(true);
        } else {
          // Fallback to rule-based
          const results = await getSectionAIHints(sectionId, industry, answers, limit);
          setHints(results.map(formatRecommendation));
          setIsAIPowered(false);
          if (aiResult.fallbackReason) {
            setAiError(aiResult.fallbackReason);
          }
        }
      } else {
        // Use rule-based recommendations
        const results = await getSectionAIHints(sectionId, industry, answers, limit);
        setHints(results.map(formatRecommendation));
        setIsAIPowered(false);
      }
    } catch (error) {
      console.error('Error loading AI hints:', error);
      setHints([]);
      setIsAIPowered(false);
    } finally {
      setLoading(false);
    }
  }, [sectionId, industry, answers, showAll, useAI, language]);

  const isSelected = (useCase) => {
    return selectedUseCases.some(uc => uc.id === useCase.id);
  };

  const handleToggleSelect = (useCase) => {
    if (isSelected(useCase)) {
      onDeselectUseCase?.(useCase);
    } else {
      onSelectUseCase?.(useCase);
    }
  };

  const handleOpenEstimator = () => {
    const url = generateAIEstimatorURL(selectedUseCases);
    window.open(url, '_blank');
  };

  if (!industry) {
    return null;
  }

  const translations = {
    de: {
      title: '💡 KI-empfohlene SAP AI Features',
      aiPowered: '🤖 KI-gestützt',
      ruleBased: '📋 Regelbasiert',
      loading: 'Lade Empfehlungen...',
      noHints: 'Keine passenden AI Features für diesen Bereich',
      showMore: 'Mehr anzeigen',
      showLess: 'Weniger anzeigen',
      addToEstimate: 'Zum Estimate hinzufügen',
      removeFromEstimate: 'Aus Estimate entfernen',
      selected: 'ausgewählt',
      openEstimator: 'SAP AI Estimator öffnen',
      agent: 'AI Agent',
      feature: 'AI Feature',
      premium: 'Premium',
      base: 'Basis',
      ga: 'Verfügbar',
      beta: 'Beta',
      eac: 'Early Adopter',
      matchScore: 'Match-Score',
    },
    en: {
      title: '💡 AI-Recommended SAP AI Features',
      aiPowered: '🤖 AI-Powered',
      ruleBased: '📋 Rule-Based',
      loading: 'Loading recommendations...',
      noHints: 'No matching AI features for this section',
      showMore: 'Show more',
      showLess: 'Show less',
      addToEstimate: 'Add to Estimate',
      removeFromEstimate: 'Remove from Estimate',
      selected: 'selected',
      openEstimator: 'Open SAP AI Estimator',
      agent: 'AI Agent',
      feature: 'AI Feature',
      premium: 'Premium',
      base: 'Base',
      ga: 'Available',
      beta: 'Beta',
      eac: 'Early Adopter',
      matchScore: 'Match Score',
    },
  };

  const tr = translations[language] || translations.de;

  if (compact) {
    return (
      <CompactHints
        hints={hints}
        loading={loading}
        selectedUseCases={selectedUseCases}
        onToggleSelect={handleToggleSelect}
        isSelected={isSelected}
        tr={tr}
      />
    );
  }

  return (
    <div className="sap-ai-hints" style={styles.container}>
      {/* Header */}
      <div 
        style={styles.header}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>{tr.title}</span>
          {isAIPowered && (
            <span style={styles.aiPoweredBadge}>{tr.aiPowered}</span>
          )}
          {!isAIPowered && hints.length > 0 && (
            <span style={styles.ruleBasedBadge}>{tr.ruleBased}</span>
          )}
        </div>
        <div style={styles.headerRight}>
          {selectedUseCases.length > 0 && (
            <span style={styles.selectedBadge}>
              {selectedUseCases.length} {tr.selected}
            </span>
          )}
          <span style={styles.expandIcon}>
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>
              <span className="spinner" style={styles.spinner}></span>
              {tr.loading}
            </div>
          ) : hints.length === 0 ? (
            <div style={styles.noHints}>{tr.noHints}</div>
          ) : (
            <>
              {/* Hint Cards */}
              <div style={styles.hintsList}>
                {hints.map((hint) => (
                  <HintCard
                    key={hint.id}
                    hint={hint}
                    isSelected={isSelected(hint)}
                    onToggleSelect={() => handleToggleSelect(hint)}
                    tr={tr}
                  />
                ))}
              </div>

              {/* Show More/Less */}
              <button
                style={styles.showMoreBtn}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? tr.showLess : tr.showMore}
              </button>

              {/* Estimator Button */}
              {selectedUseCases.length > 0 && (
                <button
                  style={styles.estimatorBtn}
                  onClick={handleOpenEstimator}
                >
                  🧮 {tr.openEstimator} ({selectedUseCases.length})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual hint card
 */
function HintCard({ hint, isSelected, onToggleSelect, tr }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
      style={{
        ...styles.hintCard,
        ...(isSelected ? styles.hintCardSelected : {}),
        ...(hint.isAIPowered ? styles.hintCardAIPowered : {}),
      }}
    >
      {/* Card Header */}
      <div style={styles.hintHeader}>
        <span style={styles.typeIcon}>{hint.typeIcon}</span>
        <span style={styles.hintName}>{hint.name}</span>
        {hint.isAIPowered && <span style={styles.aiIcon}>🤖</span>}
      </div>
      
      {/* AI Explanation */}
      {hint.aiExplanation && (
        <div style={styles.aiExplanation}>
          💡 {hint.aiExplanation}
        </div>
      )}

      {/* Badges */}
      <div style={styles.badges}>
        <span 
          style={{
            ...styles.badge,
            backgroundColor: hint.ai_type === 'AI Agent' ? '#9B59B6' : '#3498DB',
          }}
        >
          {hint.ai_type === 'AI Agent' ? tr.agent : tr.feature}
        </span>
        <span 
          style={{
            ...styles.badge,
            backgroundColor: getAvailabilityColor(hint.availability),
          }}
        >
          {hint.availability === 'Generally Available' ? tr.ga : 
           hint.availability === 'Beta' ? tr.beta : tr.eac}
        </span>
        {hint.commercial_type && (
          <span 
            style={{
              ...styles.badge,
              backgroundColor: hint.commercial_type === 'Premium' ? '#F39C12' : '#27AE60',
            }}
          >
            {hint.commercial_type === 'Premium' ? tr.premium : tr.base}
          </span>
        )}
      </div>

      {/* Score */}
      <div style={styles.scoreRow}>
        <span style={styles.scoreLabel}>{tr.matchScore}:</span>
        <span style={{ ...styles.scoreValue, color: hint.scoreColor }}>
          {hint.score} ⭐
        </span>
        <span style={styles.scoreText}>{hint.scoreLabel}</span>
      </div>

      {/* Match Reasons */}
      {hint.matchLabel && (
        <div style={styles.matchReasons}>{hint.matchLabel}</div>
      )}

      {/* Description (expandable) */}
      {showDetails && hint.description && (
        <div style={styles.description}>{hint.description}</div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={styles.detailsBtn}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲' : '▼'} Details
        </button>
        <button
          style={{
            ...styles.selectBtn,
            ...(isSelected ? styles.selectBtnSelected : {}),
          }}
          onClick={onToggleSelect}
        >
          {isSelected ? '✓ ' + tr.removeFromEstimate : '+ ' + tr.addToEstimate}
        </button>
      </div>

      {/* Link to SAP */}
      {hint.url && (
        <a
          href={hint.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.sapLink}
        >
          🔗 SAP Discovery Center
        </a>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
function CompactHints({ hints, loading, selectedUseCases, onToggleSelect, isSelected, tr }) {
  if (loading) {
    return <span style={styles.compactLoading}>⏳</span>;
  }

  if (hints.length === 0) {
    return null;
  }

  return (
    <div style={styles.compactContainer}>
      {hints.slice(0, 2).map((hint) => (
        <div
          key={hint.id}
          style={{
            ...styles.compactHint,
            ...(isSelected(hint) ? styles.compactHintSelected : {}),
          }}
          onClick={() => onToggleSelect(hint)}
          title={hint.description}
        >
          <span>{hint.typeIcon}</span>
          <span style={styles.compactName}>{hint.name}</span>
          {isSelected(hint) && <span>✓</span>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
    border: '1px solid #E9ECEF',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#E3F2FD',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  aiPoweredBadge: {
    backgroundColor: '#9B59B6',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
  },
  ruleBasedBadge: {
    backgroundColor: '#7F8C8D',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1565C0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  selectedBadge: {
    backgroundColor: '#27AE60',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  expandIcon: {
    fontSize: '10px',
    color: '#666',
  },
  content: {
    padding: '12px 16px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#666',
    fontSize: '13px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #E9ECEF',
    borderTopColor: '#3498DB',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  noHints: {
    color: '#999',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  hintsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  hintCard: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '12px',
    border: '1px solid #E9ECEF',
    transition: 'all 0.2s ease',
  },
  hintCardSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF4',
  },
  hintCardAIPowered: {
    borderLeft: '3px solid #9B59B6',
  },
  aiIcon: {
    fontSize: '12px',
  },
  aiExplanation: {
    fontSize: '12px',
    color: '#8E44AD',
    backgroundColor: '#F5EEF8',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '8px',
    fontStyle: 'italic',
  },
  hintHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  typeIcon: {
    fontSize: '18px',
  },
  hintName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#2C3E50',
    flex: 1,
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px',
  },
  badge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    color: 'white',
    fontWeight: '500',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    fontSize: '12px',
  },
  scoreLabel: {
    color: '#666',
  },
  scoreValue: {
    fontWeight: '600',
  },
  scoreText: {
    color: '#888',
    fontSize: '11px',
  },
  matchReasons: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '8px',
  },
  description: {
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.4',
    marginBottom: '8px',
    padding: '8px',
    backgroundColor: '#F8F9FA',
    borderRadius: '4px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  detailsBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: 'transparent',
    border: '1px solid #DDD',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#666',
  },
  selectBtn: {
    flex: 1,
    padding: '6px 12px',
    fontSize: '11px',
    backgroundColor: '#3498DB',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  selectBtnSelected: {
    backgroundColor: '#27AE60',
  },
  sapLink: {
    display: 'block',
    marginTop: '8px',
    fontSize: '11px',
    color: '#3498DB',
    textDecoration: 'none',
  },
  showMoreBtn: {
    width: '100%',
    padding: '8px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    border: '1px dashed #CCC',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#666',
    fontSize: '12px',
  },
  estimatorBtn: {
    width: '100%',
    padding: '10px',
    marginTop: '8px',
    backgroundColor: '#2C3E50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  // Compact styles
  compactContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  compactHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#E3F2FD',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  compactHintSelected: {
    backgroundColor: '#C8E6C9',
    borderColor: '#27AE60',
  },
  compactName: {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  compactLoading: {
    fontSize: '12px',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);