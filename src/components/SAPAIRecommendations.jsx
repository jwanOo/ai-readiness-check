/* ═══════════════════════════════════════════════════════════════
   SAP AI RECOMMENDATIONS COMPONENT
   Full recommendations view for assessment results
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getRecommendedAIUseCases,
  formatRecommendation,
  generateAIEstimatorURL,
  exportRecommendationsSummary,
  INDUSTRY_AI_NEEDS,
  getAIPoweredRecommendations,
} from '../lib/aiRecommendationService';
import {
  PRODUCT_CATEGORIES,
  AI_TYPES,
  AVAILABILITY_STATUSES,
  getAvailabilityColor,
} from '../lib/sapAICatalogService';

/**
 * SAPAIRecommendations - Full recommendations panel for results page
 */
export default function SAPAIRecommendations({
  assessment,
  answers,
  selectedUseCases = [],
  onSelectUseCase,
  onDeselectUseCase,
  onExport,
}) {
  const { t, language } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    productCategory: '',
    aiType: '',
    availability: '',
  });
  const [sortBy, setSortBy] = useState('score'); // 'score', 'name', 'type'
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'list'

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, [assessment?.industry, JSON.stringify(answers)]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getRecommendedAIUseCases(
        assessment,
        answers,
        { limit: 50, includeAllMatches: true }
      );
      setRecommendations(results.map(formatRecommendation));
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.product?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.productCategory) {
      filtered = filtered.filter(r => r.product_category === filters.productCategory);
    }

    // AI Type filter
    if (filters.aiType) {
      filtered = filtered.filter(r => r.ai_type === filters.aiType);
    }

    // Availability filter
    if (filters.availability) {
      filtered = filtered.filter(r => r.availability === filters.availability);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'type':
        filtered.sort((a, b) => {
          if (a.ai_type === b.ai_type) return b.score - a.score;
          return a.ai_type === 'AI Agent' ? -1 : 1;
        });
        break;
      case 'score':
      default:
        filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [recommendations, searchQuery, filters, sortBy]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: recommendations.length,
      filtered: filteredRecommendations.length,
      agents: recommendations.filter(r => r.ai_type === 'AI Agent').length,
      features: recommendations.filter(r => r.ai_type === 'AI Feature').length,
      selected: selectedUseCases.length,
    };
  }, [recommendations, filteredRecommendations, selectedUseCases]);

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

  const handleSelectAll = () => {
    filteredRecommendations.forEach(r => {
      if (!isSelected(r)) {
        onSelectUseCase?.(r);
      }
    });
  };

  const handleDeselectAll = () => {
    selectedUseCases.forEach(uc => {
      onDeselectUseCase?.(uc);
    });
  };

  const handleOpenEstimator = () => {
    const url = generateAIEstimatorURL(selectedUseCases);
    window.open(url, '_blank');
  };

  const handleExport = () => {
    const summary = exportRecommendationsSummary(selectedUseCases, assessment);
    onExport?.(summary);
  };

  const translations = {
    de: {
      title: '🎯 SAP AI Empfehlungen',
      subtitle: 'Basierend auf Ihrer Bewertung empfehlen wir diese AI Features und Agents',
      loading: 'Lade Empfehlungen...',
      error: 'Fehler beim Laden der Empfehlungen',
      noResults: 'Keine passenden AI Features gefunden',
      search: 'Suchen...',
      allCategories: 'Alle Kategorien',
      allTypes: 'Alle Typen',
      allAvailability: 'Alle Verfügbarkeiten',
      sortBy: 'Sortieren nach',
      sortScore: 'Match-Score',
      sortName: 'Name',
      sortType: 'Typ',
      viewCards: 'Karten',
      viewList: 'Liste',
      total: 'Gesamt',
      filtered: 'Gefiltert',
      agents: 'AI Agents',
      features: 'AI Features',
      selected: 'Ausgewählt',
      selectAll: 'Alle auswählen',
      deselectAll: 'Alle abwählen',
      addToEstimate: 'Zum Estimate',
      removeFromEstimate: 'Entfernen',
      openEstimator: 'SAP AI Estimator öffnen',
      exportSelected: 'Auswahl exportieren',
      matchScore: 'Match-Score',
      product: 'Produkt',
      category: 'Kategorie',
      availability: 'Verfügbarkeit',
      commercial: 'Lizenz',
      description: 'Beschreibung',
      viewDetails: 'Details',
      closeDetails: 'Schließen',
      openSAP: 'In SAP öffnen',
      excellentMatch: 'Exzellenter Match',
      strongMatch: 'Starker Match',
      goodMatch: 'Guter Match',
      potentialMatch: 'Potenzieller Match',
      agent: 'AI Agent',
      feature: 'AI Feature',
      premium: 'Premium',
      base: 'Basis',
      ga: 'Verfügbar',
      beta: 'Beta',
      eac: 'Early Adopter',
    },
    en: {
      title: '🎯 SAP AI Recommendations',
      subtitle: 'Based on your assessment, we recommend these AI features and agents',
      loading: 'Loading recommendations...',
      error: 'Error loading recommendations',
      noResults: 'No matching AI features found',
      search: 'Search...',
      allCategories: 'All Categories',
      allTypes: 'All Types',
      allAvailability: 'All Availability',
      sortBy: 'Sort by',
      sortScore: 'Match Score',
      sortName: 'Name',
      sortType: 'Type',
      viewCards: 'Cards',
      viewList: 'List',
      total: 'Total',
      filtered: 'Filtered',
      agents: 'AI Agents',
      features: 'AI Features',
      selected: 'Selected',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      addToEstimate: 'Add to Estimate',
      removeFromEstimate: 'Remove',
      openEstimator: 'Open SAP AI Estimator',
      exportSelected: 'Export Selected',
      matchScore: 'Match Score',
      product: 'Product',
      category: 'Category',
      availability: 'Availability',
      commercial: 'License',
      description: 'Description',
      viewDetails: 'Details',
      closeDetails: 'Close',
      openSAP: 'Open in SAP',
      excellentMatch: 'Excellent Match',
      strongMatch: 'Strong Match',
      goodMatch: 'Good Match',
      potentialMatch: 'Potential Match',
      agent: 'AI Agent',
      feature: 'AI Feature',
      premium: 'Premium',
      base: 'Base',
      ga: 'Available',
      beta: 'Beta',
      eac: 'Early Adopter',
    },
  };

  const tr = translations[language] || translations.de;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <span>{tr.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <span>❌ {tr.error}: {error}</span>
          <button onClick={loadRecommendations} style={styles.retryBtn}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{tr.title}</h2>
          <p style={styles.subtitle}>{tr.subtitle}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{stats.total}</span>
          <span style={styles.statLabel}>{tr.total}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>🤖 {stats.agents}</span>
          <span style={styles.statLabel}>{tr.agents}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>✨ {stats.features}</span>
          <span style={styles.statLabel}>{tr.features}</span>
        </div>
        <div style={{ ...styles.stat, backgroundColor: '#E8F5E9' }}>
          <span style={{ ...styles.statValue, color: '#27AE60' }}>
            ✓ {stats.selected}
          </span>
          <span style={styles.statLabel}>{tr.selected}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersBar}>
        {/* Search */}
        <input
          type="text"
          placeholder={tr.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        {/* Category Filter */}
        <select
          value={filters.productCategory}
          onChange={(e) => setFilters({ ...filters, productCategory: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="">{tr.allCategories}</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.aiType}
          onChange={(e) => setFilters({ ...filters, aiType: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="">{tr.allTypes}</option>
          {AI_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* Availability Filter */}
        <select
          value={filters.availability}
          onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
          style={styles.filterSelect}
        >
          <option value="">{tr.allAvailability}</option>
          {AVAILABILITY_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="score">{tr.sortScore}</option>
          <option value="name">{tr.sortName}</option>
          <option value="type">{tr.sortType}</option>
        </select>

        {/* View Mode */}
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewBtn,
              ...(viewMode === 'cards' ? styles.viewBtnActive : {}),
            }}
            onClick={() => setViewMode('cards')}
          >
            ▦
          </button>
          <button
            style={{
              ...styles.viewBtn,
              ...(viewMode === 'list' ? styles.viewBtnActive : {}),
            }}
            onClick={() => setViewMode('list')}
          >
            ≡
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div style={styles.bulkActions}>
        <button onClick={handleSelectAll} style={styles.bulkBtn}>
          ☑ {tr.selectAll} ({filteredRecommendations.length})
        </button>
        <button onClick={handleDeselectAll} style={styles.bulkBtn}>
          ☐ {tr.deselectAll}
        </button>
        {selectedUseCases.length > 0 && (
          <>
            <button onClick={handleOpenEstimator} style={styles.estimatorBtn}>
              🧮 {tr.openEstimator} ({selectedUseCases.length})
            </button>
            <button onClick={handleExport} style={styles.exportBtn}>
              📥 {tr.exportSelected}
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {filteredRecommendations.length === 0 ? (
        <div style={styles.noResults}>{tr.noResults}</div>
      ) : viewMode === 'cards' ? (
        <div style={styles.cardsGrid}>
          {filteredRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isSelected={isSelected(rec)}
              onToggleSelect={() => handleToggleSelect(rec)}
              onViewDetails={() => setSelectedDetail(rec)}
              tr={tr}
            />
          ))}
        </div>
      ) : (
        <div style={styles.listView}>
          {filteredRecommendations.map((rec) => (
            <RecommendationRow
              key={rec.id}
              recommendation={rec}
              isSelected={isSelected(rec)}
              onToggleSelect={() => handleToggleSelect(rec)}
              onViewDetails={() => setSelectedDetail(rec)}
              tr={tr}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <DetailModal
          recommendation={selectedDetail}
          isSelected={isSelected(selectedDetail)}
          onToggleSelect={() => handleToggleSelect(selectedDetail)}
          onClose={() => setSelectedDetail(null)}
          tr={tr}
        />
      )}
    </div>
  );
}

/**
 * Recommendation Card Component
 */
function RecommendationCard({ recommendation, isSelected, onToggleSelect, onViewDetails, tr }) {
  const rec = recommendation;

  return (
    <div
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
      }}
    >
      {/* Header */}
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}>{rec.typeIcon}</span>
        <span style={styles.cardTitle}>{rec.name}</span>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={styles.checkbox}
        />
      </div>

      {/* Badges */}
      <div style={styles.cardBadges}>
        <span
          style={{
            ...styles.badge,
            backgroundColor: rec.ai_type === 'AI Agent' ? '#9B59B6' : '#3498DB',
          }}
        >
          {rec.ai_type === 'AI Agent' ? tr.agent : tr.feature}
        </span>
        <span
          style={{
            ...styles.badge,
            backgroundColor: getAvailabilityColor(rec.availability),
          }}
        >
          {rec.availability === 'Generally Available' ? tr.ga :
           rec.availability === 'Beta' ? tr.beta : tr.eac}
        </span>
        {rec.commercial_type && (
          <span
            style={{
              ...styles.badge,
              backgroundColor: rec.commercial_type === 'Premium' ? '#F39C12' : '#27AE60',
            }}
          >
            {rec.commercial_type === 'Premium' ? tr.premium : tr.base}
          </span>
        )}
      </div>

      {/* Score */}
      <div style={styles.cardScore}>
        <span style={{ color: rec.scoreColor, fontWeight: '600' }}>
          {rec.score} ⭐
        </span>
        <span style={styles.scoreLabel}>{rec.scoreLabel}</span>
      </div>

      {/* Match Reasons */}
      {rec.matchLabel && (
        <div style={styles.matchLabel}>{rec.matchLabel}</div>
      )}

      {/* Product */}
      <div style={styles.cardProduct}>
        📦 {rec.product}
      </div>

      {/* Actions */}
      <div style={styles.cardActions}>
        <button onClick={onViewDetails} style={styles.detailsBtn}>
          {tr.viewDetails}
        </button>
        <button
          onClick={onToggleSelect}
          style={{
            ...styles.selectBtn,
            ...(isSelected ? styles.selectBtnSelected : {}),
          }}
        >
          {isSelected ? '✓ ' + tr.removeFromEstimate : '+ ' + tr.addToEstimate}
        </button>
      </div>
    </div>
  );
}

/**
 * Recommendation Row Component (List View)
 */
function RecommendationRow({ recommendation, isSelected, onToggleSelect, onViewDetails, tr }) {
  const rec = recommendation;

  return (
    <div
      style={{
        ...styles.row,
        ...(isSelected ? styles.rowSelected : {}),
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        style={styles.rowCheckbox}
      />
      <span style={styles.rowIcon}>{rec.typeIcon}</span>
      <span style={styles.rowName}>{rec.name}</span>
      <span style={styles.rowProduct}>{rec.product}</span>
      <span
        style={{
          ...styles.rowBadge,
          backgroundColor: getAvailabilityColor(rec.availability),
        }}
      >
        {rec.availability === 'Generally Available' ? 'GA' :
         rec.availability === 'Beta' ? 'Beta' : 'EAC'}
      </span>
      <span style={{ ...styles.rowScore, color: rec.scoreColor }}>
        {rec.score}
      </span>
      <button onClick={onViewDetails} style={styles.rowBtn}>
        👁
      </button>
      <button
        onClick={onToggleSelect}
        style={{
          ...styles.rowBtn,
          ...(isSelected ? { color: '#27AE60' } : {}),
        }}
      >
        {isSelected ? '✓' : '+'}
      </button>
    </div>
  );
}

/**
 * Detail Modal Component
 */
function DetailModal({ recommendation, isSelected, onToggleSelect, onClose, tr }) {
  const rec = recommendation;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <span style={styles.modalIcon}>{rec.typeIcon}</span>
          <h3 style={styles.modalTitle}>{rec.name}</h3>
          <button onClick={onClose} style={styles.modalClose}>✕</button>
        </div>

        {/* Badges */}
        <div style={styles.modalBadges}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: rec.ai_type === 'AI Agent' ? '#9B59B6' : '#3498DB',
            }}
          >
            {rec.ai_type}
          </span>
          <span
            style={{
              ...styles.badge,
              backgroundColor: getAvailabilityColor(rec.availability),
            }}
          >
            {rec.availability}
          </span>
          {rec.commercial_type && (
            <span
              style={{
                ...styles.badge,
                backgroundColor: rec.commercial_type === 'Premium' ? '#F39C12' : '#27AE60',
              }}
            >
              {rec.commercial_type}
            </span>
          )}
        </div>

        {/* Score */}
        <div style={styles.modalScore}>
          <span style={styles.modalScoreLabel}>{tr.matchScore}:</span>
          <span style={{ color: rec.scoreColor, fontWeight: '700', fontSize: '24px' }}>
            {rec.score} ⭐
          </span>
          <span style={styles.modalScoreText}>{rec.scoreLabel}</span>
        </div>

        {/* Match Reasons */}
        {rec.matchLabel && (
          <div style={styles.modalMatch}>{rec.matchLabel}</div>
        )}

        {/* Details */}
        <div style={styles.modalDetails}>
          <div style={styles.modalRow}>
            <span style={styles.modalLabel}>{tr.product}:</span>
            <span>{rec.product}</span>
          </div>
          <div style={styles.modalRow}>
            <span style={styles.modalLabel}>{tr.category}:</span>
            <span>{rec.product_category}</span>
          </div>
          {rec.description && (
            <div style={styles.modalDescription}>
              <span style={styles.modalLabel}>{tr.description}:</span>
              <p>{rec.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.modalActions}>
          <button
            onClick={onToggleSelect}
            style={{
              ...styles.modalBtn,
              ...(isSelected ? styles.modalBtnSelected : {}),
            }}
          >
            {isSelected ? '✓ ' + tr.removeFromEstimate : '+ ' + tr.addToEstimate}
          </button>
          {rec.url && (
            <a
              href={rec.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.modalLink}
            >
              🔗 {tr.openSAP}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#2C3E50',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#666',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px',
    color: '#666',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #E9ECEF',
    borderTopColor: '#3498DB',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px',
    color: '#E74C3C',
  },
  retryBtn: {
    padding: '8px 16px',
    backgroundColor: '#3498DB',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  stat: {
    padding: '12px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    textAlign: 'center',
    minWidth: '100px',
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  filtersBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: '1',
    minWidth: '200px',
    padding: '10px 14px',
    border: '1px solid #DDD',
    borderRadius: '6px',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1px solid #DDD',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #DDD',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  viewBtn: {
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  },
  viewBtnActive: {
    backgroundColor: '#3498DB',
    color: 'white',
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  bulkBtn: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #DDD',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  estimatorBtn: {
    padding: '8px 16px',
    backgroundColor: '#2C3E50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  exportBtn: {
    padding: '8px 16px',
    backgroundColor: '#27AE60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontStyle: 'italic',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  cardSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF4',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '12px',
  },
  cardIcon: {
    fontSize: '24px',
  },
  cardTitle: {
    flex: 1,
    fontWeight: '600',
    fontSize: '15px',
    color: '#2C3E50',
    lineHeight: '1.3',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  cardBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '12px',
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'white',
    fontWeight: '500',
  },
  cardScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#888',
  },
  matchLabel: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '8px',
  },
  cardProduct: {
    fontSize: '12px',
    color: '#555',
    marginBottom: '12px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  detailsBtn: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #DDD',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  selectBtn: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#3498DB',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  selectBtnSelected: {
    backgroundColor: '#27AE60',
  },
  // List view styles
  listView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid transparent',
  },
  rowSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF4',
  },
  rowCheckbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  rowIcon: {
    fontSize: '18px',
  },
  rowName: {
    flex: 1,
    fontWeight: '500',
    fontSize: '14px',
  },
  rowProduct: {
    width: '150px',
    fontSize: '12px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    color: 'white',
  },
  rowScore: {
    width: '50px',
    fontWeight: '600',
    textAlign: 'right',
  },
  rowBtn: {
    padding: '6px 10px',
    backgroundColor: 'transparent',
    border: '1px solid #DDD',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  modalIcon: {
    fontSize: '32px',
  },
  modalTitle: {
    flex: 1,
    margin: 0,
    fontSize: '20px',
    color: '#2C3E50',
  },
  modalClose: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  modalBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  modalScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#F8F9FA',
    borderRadius: '8px',
  },
  modalScoreLabel: {
    color: '#666',
  },
  modalScoreText: {
    color: '#888',
    fontSize: '14px',
  },
  modalMatch: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '16px',
  },
  modalDetails: {
    marginBottom: '20px',
  },
  modalRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  modalLabel: {
    fontWeight: '600',
    color: '#555',
    minWidth: '80px',
  },
  modalDescription: {
    marginTop: '12px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
  },
  modalBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#3498DB',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  modalBtnSelected: {
    backgroundColor: '#27AE60',
  },
  modalLink: {
    padding: '12px 20px',
    backgroundColor: '#F8F9FA',
    color: '#3498DB',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
  },
};