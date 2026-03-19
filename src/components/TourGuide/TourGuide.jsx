/**
 * TourGuide Component - Interactive visual tour for the AI Readiness Check application
 * 
 * Features:
 * - Interactive navigation (guides user through pages)
 * - Spotlight effect on target elements
 * - Custom action buttons for navigation
 * - Progress indicator
 * - Keyboard navigation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTour, TOUR_TYPES } from '../../contexts/TourContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './TourGuide.css';

// Calculate tooltip position based on target element and placement
const calculatePosition = (targetRect, placement, tooltipSize) => {
  const padding = 16;
  const arrowSize = 12;
  
  if (!targetRect || placement === 'center') {
    // Center of screen if no target
    return {
      top: window.innerHeight / 2 - tooltipSize.height / 2,
      left: window.innerWidth / 2 - tooltipSize.width / 2,
      arrowPosition: 'none',
    };
  }
  
  let top, left, arrowPosition;
  
  switch (placement) {
    case 'top':
      top = targetRect.top - tooltipSize.height - arrowSize - padding;
      left = targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
      arrowPosition = 'bottom';
      break;
    case 'bottom':
      top = targetRect.bottom + arrowSize + padding;
      left = targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
      arrowPosition = 'top';
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
      left = targetRect.left - tooltipSize.width - arrowSize - padding;
      arrowPosition = 'right';
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipSize.height / 2;
      left = targetRect.right + arrowSize + padding;
      arrowPosition = 'left';
      break;
    default:
      top = targetRect.bottom + arrowSize + padding;
      left = targetRect.left + targetRect.width / 2 - tooltipSize.width / 2;
      arrowPosition = 'top';
  }
  
  // Keep tooltip within viewport
  const viewportPadding = 20;
  if (left < viewportPadding) left = viewportPadding;
  if (left + tooltipSize.width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - tooltipSize.width - viewportPadding;
  }
  if (top < viewportPadding) top = viewportPadding;
  if (top + tooltipSize.height > window.innerHeight - viewportPadding) {
    top = window.innerHeight - tooltipSize.height - viewportPadding;
  }
  
  return { top, left, arrowPosition };
};

// Spotlight overlay component
const Spotlight = ({ targetRect, isVisible }) => {
  if (!isVisible || !targetRect) return null;
  
  const padding = 8;
  const borderRadius = 12;
  
  return (
    <div className="tour-spotlight-container">
      {/* Dark overlay with hole */}
      <svg className="tour-spotlight-svg" width="100%" height="100%">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>
      
      {/* Highlight border around target */}
      <div
        className="tour-spotlight-highlight"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          borderRadius: borderRadius,
        }}
      />
    </div>
  );
};

// Tooltip component
const Tooltip = ({ 
  step, 
  position, 
  onNext, 
  onPrev, 
  onSkip, 
  currentIndex, 
  totalSteps, 
  progress,
  isFirstStep,
  isLastStep,
  language,
}) => {
  const tooltipRef = useRef(null);
  const isDE = language === 'de';
  
  // Check if step has a navigation action
  const hasAction = step?.action?.type === 'navigate';
  const actionButtonText = step?.action?.buttonText || (isDE ? 'Weiter' : 'Next');
  const isFinalStep = step?.isFinal;
  
  return (
    <div
      ref={tooltipRef}
      className={`tour-tooltip tour-tooltip-arrow-${position.arrowPosition}`}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="tour-tooltip-header">
        <h3 className="tour-tooltip-title">{step.title}</h3>
        <button className="tour-tooltip-close" onClick={onSkip} title={isDE ? 'Tour beenden' : 'End tour'}>
          ✕
        </button>
      </div>
      
      {/* Content */}
      <div className="tour-tooltip-content">
        <p>{step.content}</p>
      </div>
      
      {/* Progress bar */}
      <div className="tour-tooltip-progress">
        <div className="tour-tooltip-progress-bar">
          <div 
            className="tour-tooltip-progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="tour-tooltip-progress-text">
          {currentIndex + 1} / {totalSteps}
        </span>
      </div>
      
      {/* Actions */}
      <div className="tour-tooltip-actions">
        <div className="tour-tooltip-nav">
          {!isFirstStep && (
            <button className="tour-btn tour-btn-text" onClick={onPrev}>
              ← {isDE ? 'Zurück' : 'Back'}
            </button>
          )}
        </div>
        <div className="tour-tooltip-nav">
          {!isFinalStep && (
            <button className="tour-btn tour-btn-text" onClick={onSkip}>
              {isDE ? 'Überspringen' : 'Skip'}
            </button>
          )}
          <button 
            className={`tour-btn ${hasAction ? 'tour-btn-action' : 'tour-btn-primary'}`}
            onClick={onNext}
          >
            {hasAction ? actionButtonText : (
              isLastStep 
                ? (isDE ? '🎉 Fertig!' : '🎉 Done!') 
                : (isDE ? 'Weiter →' : 'Next →')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main TourGuide component
export default function TourGuide() {
  const { 
    isActive, 
    currentStep, 
    currentStepIndex, 
    totalSteps, 
    progress,
    nextStep, 
    prevStep, 
    endTour,
    isStepOnCurrentPage,
  } = useTour();
  
  const { language } = useLanguage();
  
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 400, height: 280 });
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Find and track target element
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null);
      return;
    }
    
    // Only look for target if we're on the correct page
    if (!isStepOnCurrentPage(currentStep)) {
      setTargetRect(null);
      return;
    }
    
    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
      
      // Scroll element into view if needed
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Update rect after scroll
        setTimeout(() => {
          const newRect = element.getBoundingClientRect();
          setTargetRect({
            top: newRect.top,
            left: newRect.left,
            width: newRect.width,
            height: newRect.height,
            bottom: newRect.bottom,
            right: newRect.right,
          });
        }, 500);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep?.target, isStepOnCurrentPage, currentStep]);
  
  // Update target rect when step changes
  useEffect(() => {
    if (!isActive) return;
    
    setIsAnimating(true);
    
    // Wait for element to appear (especially after navigation)
    const checkElement = () => {
      updateTargetRect();
    };
    
    // Initial check
    checkElement();
    
    // Retry a few times in case element is loading
    const retryTimeouts = [100, 300, 500, 1000, 1500].map(delay => 
      setTimeout(checkElement, delay)
    );
    
    // Animation complete
    const animTimeout = setTimeout(() => setIsAnimating(false), 300);
    
    return () => {
      retryTimeouts.forEach(clearTimeout);
      clearTimeout(animTimeout);
    };
  }, [isActive, currentStepIndex, updateTargetRect]);
  
  // Update on window resize
  useEffect(() => {
    if (!isActive) return;
    
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, updateTargetRect]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          endTour(false);
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTour]);
  
  // Don't render if tour is not active
  if (!isActive || !currentStep) return null;
  
  // Calculate tooltip position
  const position = calculatePosition(
    targetRect,
    currentStep.placement || 'bottom',
    tooltipSize
  );
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  // Render using portal to ensure it's on top of everything
  return createPortal(
    <div className={`tour-overlay ${isAnimating ? 'tour-animating' : ''}`}>
      {/* Spotlight */}
      <Spotlight 
        targetRect={targetRect} 
        isVisible={currentStep.spotlight !== false && targetRect !== null}
      />
      
      {/* Tooltip */}
      <Tooltip
        step={currentStep}
        position={position}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={() => endTour(false)}
        currentIndex={currentStepIndex}
        totalSteps={totalSteps}
        progress={progress}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        language={language}
      />
    </div>,
    document.body
  );
}

// Start Tour Button component (for header)
export function StartTourButton() {
  const tourContext = useTour();
  const { language } = useLanguage();
  
  const isDE = language === 'de';
  
  // Safety check - if tour context is not available, don't render
  if (!tourContext) {
    console.warn('StartTourButton: TourContext not available');
    return null;
  }
  
  const { startTour, isActive, hasCompletedTour } = tourContext;
  
  // Hide button while tour is active
  if (isActive) return null;
  
  return (
    <div className="start-tour-container" data-tour="start-tour-button" style={{ position: 'relative' }}>
      <button 
        className="start-tour-button"
        onClick={() => startTour(TOUR_TYPES.FULL)}
        title={isDE ? 'Interaktive Tour starten' : 'Start Interactive Tour'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: hasCompletedTour 
            ? 'linear-gradient(135deg, #28a745 0%, #218838 100%)'
            : 'linear-gradient(135deg, #0070f2 0%, #0054b4 100%)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: '#fff',
          transition: 'all 0.2s ease',
          boxShadow: hasCompletedTour 
            ? '0 2px 8px rgba(40, 167, 69, 0.3)'
            : '0 2px 8px rgba(0, 112, 242, 0.3)',
        }}
      >
        <span style={{ fontSize: '16px' }}>{hasCompletedTour ? '✅' : '🎯'}</span>
        <span style={{ fontWeight: '600' }}>
          {isDE ? 'Tour starten' : 'Start Tour'}
        </span>
      </button>
    </div>
  );
}