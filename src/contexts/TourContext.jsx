/**
 * Tour Context - Manages guided tour state for the AI Readiness Check application
 * 
 * Features:
 * - Interactive navigation (navigates user to different pages)
 * - Waits for elements to appear before showing spotlight
 * - Unified tour flow across all pages
 * - First-time user detection (auto-start tour)
 * - Bilingual support (DE/EN)
 * - Persistence via localStorage + Supabase
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

// Tour types
export const TOUR_TYPES = {
  QUICK: 'quick',
  FULL: 'full',
};

// Tour step targets (CSS selectors or element IDs)
export const TOUR_TARGETS = {
  // Dashboard
  DASHBOARD_HEADER: '[data-tour="dashboard-header"]',
  STATS_CARDS: '[data-tour="stats-cards"]',
  ANALYTICS_BUTTON: '[data-tour="analytics-button"]',
  AI_CATALOG_BUTTON: '[data-tour="ai-catalog-button"]',
  NEW_ASSESSMENT_BUTTON: '[data-tour="new-assessment-button"]',
  ASSESSMENT_LIST: '[data-tour="assessment-list"]',
  
  // Analytics
  ANALYTICS_HEADER: '[data-tour="analytics-header"]',
  ANALYTICS_CHARTS: '[data-tour="analytics-charts"]',
  ANALYTICS_AI: '[data-tour="analytics-ai"]',
  
  // AI Catalog
  CATALOG_HEADER: '[data-tour="catalog-header"]',
  CATALOG_FILTERS: '[data-tour="catalog-filters"]',
  USE_CASE_GRID: '[data-tour="use-case-grid"]',
};

// Define all tour steps with navigation and actions
const getTourSteps = (language) => {
  const isDE = language === 'de';
  
  return [
    // ===== WELCOME =====
    {
      id: 'welcome',
      page: '/',
      target: null,
      title: isDE ? '👋 Willkommen beim AI Readiness Check!' : '👋 Welcome to AI Readiness Check!',
      content: isDE 
        ? 'Diese interaktive Tour führt Sie durch alle wichtigen Funktionen der Anwendung. Wir werden gemeinsam das Dashboard, Analytics und den AI Katalog erkunden.'
        : 'This interactive tour will guide you through all the key features of the application. We\'ll explore the dashboard, Analytics, and the AI Catalog together.',
      placement: 'center',
      spotlight: false,
    },
    
    // ===== DASHBOARD SECTION =====
    {
      id: 'dashboard-header',
      page: '/',
      target: TOUR_TARGETS.DASHBOARD_HEADER,
      title: isDE ? '🏠 Dashboard Übersicht' : '🏠 Dashboard Overview',
      content: isDE
        ? 'Dies ist Ihr Dashboard. Hier sehen Sie alle Ihre Assessments, können neue erstellen und auf Analytics und den AI Katalog zugreifen.'
        : 'This is your dashboard. Here you can see all your assessments, create new ones, and access Analytics and the AI Catalog.',
      placement: 'bottom',
      spotlight: true,
    },
    {
      id: 'stats-cards',
      page: '/',
      target: TOUR_TARGETS.STATS_CARDS,
      title: isDE ? '📊 Ihre Statistiken' : '📊 Your Statistics',
      content: isDE
        ? 'Diese Karten zeigen Ihre wichtigsten Kennzahlen: Anzahl der Assessments, zugewiesene Abschnitte und abgeschlossene Bewertungen.'
        : 'These cards show your key metrics: number of assessments, assigned sections, and completed evaluations.',
      placement: 'bottom',
      spotlight: true,
    },
    {
      id: 'new-assessment-intro',
      page: '/',
      target: TOUR_TARGETS.NEW_ASSESSMENT_BUTTON,
      title: isDE ? '➕ Neues Assessment erstellen' : '➕ Create New Assessment',
      content: isDE
        ? 'Klicken Sie auf diesen Button, um ein neues AI Readiness Assessment zu erstellen. Wählen Sie die Branche und beantworten Sie die Fragen.'
        : 'Click this button to create a new AI Readiness Assessment. Select the industry and answer the questions.',
      placement: 'left',
      spotlight: true,
    },
    {
      id: 'assessment-list',
      page: '/',
      target: TOUR_TARGETS.ASSESSMENT_LIST,
      title: isDE ? '📋 Ihre Assessments' : '📋 Your Assessments',
      content: isDE
        ? 'Hier finden Sie alle Ihre Assessments. Klicken Sie auf ein Assessment, um es zu öffnen und zu bearbeiten.'
        : 'Here you\'ll find all your assessments. Click on an assessment to open and edit it.',
      placement: 'top',
      spotlight: true,
    },
    {
      id: 'analytics-button',
      page: '/',
      target: TOUR_TARGETS.ANALYTICS_BUTTON,
      title: isDE ? '📈 Analytics' : '📈 Analytics',
      content: isDE
        ? 'Klicken Sie hier, um Kunden zu vergleichen, Branchen-Benchmarks zu sehen und AI Readiness Scores zu analysieren. Lassen Sie uns dorthin navigieren!'
        : 'Click here to compare customers, view industry benchmarks, and analyze AI Readiness scores. Let\'s navigate there!',
      placement: 'bottom',
      spotlight: true,
      action: {
        type: 'navigate',
        path: '/analytics',
        buttonText: isDE ? 'Zu Analytics →' : 'Go to Analytics →',
      },
    },
    
    // ===== ANALYTICS SECTION =====
    {
      id: 'analytics-welcome',
      page: '/analytics',
      target: null,
      title: isDE ? '📊 Analytics Dashboard' : '📊 Analytics Dashboard',
      content: isDE
        ? 'Willkommen im Analytics-Bereich! Hier können Sie Kunden vergleichen, Branchen-Benchmarks sehen und Trends analysieren.'
        : 'Welcome to the Analytics section! Here you can compare customers, view industry benchmarks, and analyze trends.',
      placement: 'center',
      spotlight: false,
      waitForElement: false,
    },
    {
      id: 'analytics-charts',
      page: '/analytics',
      target: TOUR_TARGETS.ANALYTICS_CHARTS,
      title: isDE ? '📈 Vergleichsdiagramme' : '📈 Comparison Charts',
      content: isDE
        ? 'Diese Diagramme zeigen AI Readiness Scores im Vergleich. Wählen Sie mehrere Kunden aus, um sie nebeneinander zu vergleichen.'
        : 'These charts show AI Readiness scores in comparison. Select multiple customers to compare them side by side.',
      placement: 'bottom',
      spotlight: true,
      optional: true, // Skip if element not found
    },
    {
      id: 'go-to-catalog',
      page: '/analytics',
      target: null,
      title: isDE ? '🤖 Weiter zum AI Katalog' : '🤖 Continue to AI Catalog',
      content: isDE
        ? 'Exzellent! Lassen Sie uns nun den SAP AI Use Case Katalog erkunden, um passende AI-Lösungen für Ihre Kunden zu finden.'
        : 'Excellent! Let\'s now explore the SAP AI Use Case Catalog to find suitable AI solutions for your customers.',
      placement: 'center',
      spotlight: false,
      action: {
        type: 'navigate',
        path: '/ai-catalog',
        buttonText: isDE ? 'Zum AI Katalog →' : 'Go to AI Catalog →',
      },
    },
    
    // ===== AI CATALOG SECTION =====
    {
      id: 'catalog-welcome',
      page: '/ai-catalog',
      target: null,
      title: isDE ? '🤖 SAP AI Use Case Katalog' : '🤖 SAP AI Use Case Catalog',
      content: isDE
        ? 'Willkommen im AI Katalog! Hier finden Sie alle SAP AI Use Cases aus dem Discovery Center - direkt integriert in Ihre Readiness-Bewertung.'
        : 'Welcome to the AI Catalog! Here you\'ll find all SAP AI use cases from the Discovery Center - directly integrated into your readiness assessment.',
      placement: 'center',
      spotlight: false,
      waitForElement: false,
    },
    {
      id: 'catalog-filters',
      page: '/ai-catalog',
      target: TOUR_TARGETS.CATALOG_FILTERS,
      title: isDE ? '🔍 Filter & Suche' : '🔍 Filter & Search',
      content: isDE
        ? 'Filtern Sie Use Cases nach Kategorie, Typ, Verfügbarkeit und mehr. Die Suche hilft Ihnen, schnell relevante Lösungen zu finden.'
        : 'Filter use cases by category, type, availability, and more. The search helps you quickly find relevant solutions.',
      placement: 'bottom',
      spotlight: true,
      optional: true,
    },
    {
      id: 'catalog-grid',
      page: '/ai-catalog',
      target: TOUR_TARGETS.USE_CASE_GRID,
      title: isDE ? '📦 Use Case Übersicht' : '📦 Use Case Overview',
      content: isDE
        ? 'Klicken Sie auf einen Use Case, um Details zu sehen: Beschreibung, Implementierungshinweise, Voraussetzungen und wie er zu Ihrem Kunden passt.'
        : 'Click on a use case to see details: description, implementation guidance, prerequisites, and how it fits your customer.',
      placement: 'top',
      spotlight: true,
      optional: true,
    },
    
    // ===== TOUR COMPLETE =====
    {
      id: 'tour-complete',
      page: '/ai-catalog',
      target: null,
      title: isDE ? '🎉 Tour abgeschlossen!' : '🎉 Tour Complete!',
      content: isDE
        ? 'Herzlichen Glückwunsch! Sie kennen jetzt alle wichtigen Funktionen des AI Readiness Check. Starten Sie jetzt mit Ihrem ersten Assessment!'
        : 'Congratulations! You now know all the key features of the AI Readiness Check. Start with your first assessment now!',
      placement: 'center',
      spotlight: false,
      action: {
        type: 'navigate',
        path: '/',
        buttonText: isDE ? 'Zum Dashboard →' : 'Go to Dashboard →',
      },
      isFinal: true,
    },
  ];
};

// Context
const TourContext = createContext(null);

export function TourProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth() || {};
  const { language } = useLanguage();
  
  // Tour state
  const [isActive, setIsActive] = useState(false);
  const [tourType, setTourType] = useState(TOUR_TYPES.FULL);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isWaitingForElement, setIsWaitingForElement] = useState(false);
  
  // Ref to track if we're waiting for navigation
  const pendingNavigationRef = useRef(null);
  const elementCheckIntervalRef = useRef(null);
  
  // Get all tour steps
  const allSteps = useMemo(() => getTourSteps(language), [language]);
  
  // Current step
  const currentStep = allSteps[currentStepIndex] || null;
  const totalSteps = allSteps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;
  
  // Check if current step matches current page
  const isStepOnCurrentPage = useCallback((step) => {
    if (!step?.page) return true;
    const currentPath = location.pathname;
    return currentPath === step.page || currentPath.startsWith(step.page + '/');
  }, [location.pathname]);
  
  // Handle navigation completion and element waiting
  useEffect(() => {
    if (!isActive || !currentStep) return;
    
    // Clear any existing interval
    if (elementCheckIntervalRef.current) {
      clearInterval(elementCheckIntervalRef.current);
      elementCheckIntervalRef.current = null;
    }
    
    // Check if we're on the right page
    if (!isStepOnCurrentPage(currentStep)) {
      setIsNavigating(true);
      return;
    }
    
    setIsNavigating(false);
    
    // If step has a target, wait for it to appear
    if (currentStep.target && currentStep.waitForElement !== false) {
      setIsWaitingForElement(true);
      
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max
      
      elementCheckIntervalRef.current = setInterval(() => {
        attempts++;
        const element = document.querySelector(currentStep.target);
        
        if (element) {
          clearInterval(elementCheckIntervalRef.current);
          elementCheckIntervalRef.current = null;
          setIsWaitingForElement(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(elementCheckIntervalRef.current);
          elementCheckIntervalRef.current = null;
          setIsWaitingForElement(false);
          
          // If element not found and step is optional, skip to next
          if (currentStep.optional) {
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < allSteps.length) {
              setCurrentStepIndex(nextIndex);
            }
          }
        }
      }, 100);
    } else {
      setIsWaitingForElement(false);
    }
    
    return () => {
      if (elementCheckIntervalRef.current) {
        clearInterval(elementCheckIntervalRef.current);
        elementCheckIntervalRef.current = null;
      }
    };
  }, [isActive, currentStep, currentStepIndex, isStepOnCurrentPage, allSteps.length]);
  
  // Check if user has completed tour (on mount)
  useEffect(() => {
    checkTourStatus();
  }, [user?.id]);
  
  /**
   * Check if user has completed the tour
   */
  const checkTourStatus = async () => {
    if (!user?.id) {
      setHasCompletedTour(null);
      return;
    }
    
    try {
      const localKey = `tour_completed_${user.id}`;
      const localValue = localStorage.getItem(localKey);
      
      if (localValue === 'true') {
        setHasCompletedTour(true);
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_completed_tour')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.warn('Could not fetch tour status:', error);
        setHasCompletedTour(false);
        return;
      }
      
      const completed = profile?.has_completed_tour === true;
      setHasCompletedTour(completed);
      
      if (completed) {
        localStorage.setItem(localKey, 'true');
      }
    } catch (err) {
      console.error('Error checking tour status:', err);
      setHasCompletedTour(false);
    }
  };
  
  /**
   * Mark tour as completed
   */
  const markTourCompleted = async () => {
    if (!user?.id) return;
    
    try {
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
      setHasCompletedTour(true);
      
      await supabase
        .from('profiles')
        .update({ 
          has_completed_tour: true,
          tour_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Error marking tour completed:', err);
    }
  };
  
  /**
   * Start the tour
   */
  const startTour = useCallback((type = TOUR_TYPES.FULL) => {
    setTourType(type);
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsNavigating(false);
    setIsWaitingForElement(false);
    pendingNavigationRef.current = null;
    
    // Navigate to dashboard if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }
  }, [navigate, location.pathname]);
  
  /**
   * Execute step action (navigate, click, etc.)
   */
  const executeStepAction = useCallback((step) => {
    if (!step?.action) return false;
    
    const { type, path, selector } = step.action;
    
    switch (type) {
      case 'navigate':
        if (path) {
          setIsNavigating(true);
          pendingNavigationRef.current = path;
          navigate(path);
          return true;
        }
        break;
      case 'click':
        if (selector) {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
            return true;
          }
        }
        break;
      default:
        break;
    }
    
    return false;
  }, [navigate]);
  
  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    const step = allSteps[currentStepIndex];
    
    // If step has an action, execute it
    if (step?.action) {
      executeStepAction(step);
    }
    
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= allSteps.length) {
      // Tour complete
      endTour(true);
      return;
    }
    
    setCurrentStepIndex(nextIndex);
  }, [currentStepIndex, allSteps, executeStepAction]);
  
  /**
   * Go to previous step
   */
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStepData = allSteps[prevIndex];
      
      // Navigate to the previous step's page if needed
      if (prevStepData?.page && !isStepOnCurrentPage(prevStepData)) {
        navigate(prevStepData.page);
      }
      
      setCurrentStepIndex(prevIndex);
    }
  }, [currentStepIndex, allSteps, isStepOnCurrentPage, navigate]);
  
  /**
   * Skip to a specific step
   */
  const goToStep = useCallback((index) => {
    if (index >= 0 && index < allSteps.length) {
      const targetStep = allSteps[index];
      
      // Navigate to the step's page if needed
      if (targetStep?.page && !isStepOnCurrentPage(targetStep)) {
        navigate(targetStep.page);
      }
      
      setCurrentStepIndex(index);
    }
  }, [allSteps, isStepOnCurrentPage, navigate]);
  
  /**
   * End the tour
   */
  const endTour = useCallback((completed = false) => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setIsNavigating(false);
    setIsWaitingForElement(false);
    pendingNavigationRef.current = null;
    
    if (elementCheckIntervalRef.current) {
      clearInterval(elementCheckIntervalRef.current);
      elementCheckIntervalRef.current = null;
    }
    
    if (completed) {
      markTourCompleted();
    }
  }, []);
  
  /**
   * Reset tour status (for testing)
   */
  const resetTourStatus = async () => {
    if (!user?.id) return;
    
    localStorage.removeItem(`tour_completed_${user.id}`);
    setHasCompletedTour(false);
    
    try {
      await supabase
        .from('profiles')
        .update({ has_completed_tour: false })
        .eq('id', user.id);
    } catch (err) {
      console.error('Error resetting tour status:', err);
    }
  };
  
  const value = {
    // State
    isActive,
    tourType,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    hasCompletedTour,
    isNavigating,
    isWaitingForElement,
    allSteps,
    
    // Actions
    startTour,
    nextStep,
    prevStep,
    goToStep,
    endTour,
    resetTourStatus,
    executeStepAction,
    isStepOnCurrentPage,
    
    // Constants
    TOUR_TYPES,
    TOUR_TARGETS,
  };
  
  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export default TourContext;