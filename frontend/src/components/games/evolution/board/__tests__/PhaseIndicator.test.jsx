/**
 * PhaseIndicator 組件測試
 *
 * @module components/games/evolution/board/__tests__/PhaseIndicator.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      span: React.forwardRef(({ children, ...props }, ref) => (
        <span ref={ref} {...props}>
          {children}
        </span>
      )),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Import after mocks
const { PhaseIndicator } = require('../PhaseIndicator');

describe('PhaseIndicator', () => {
  describe('Rendering', () => {
    it('should render phase indicator', () => {
      render(<PhaseIndicator />);

      expect(screen.getByTestId('phase-indicator')).toBeInTheDocument();
    });

    it('should render round info', () => {
      render(<PhaseIndicator round={3} />);

      expect(screen.getByTestId('round-info')).toBeInTheDocument();
      expect(screen.getByTestId('round-number')).toHaveTextContent('3');
    });

    it('should render phases progress', () => {
      render(<PhaseIndicator />);

      expect(screen.getByTestId('phases-progress')).toBeInTheDocument();
    });

    it('should render current phase info', () => {
      render(<PhaseIndicator currentPhase="evolution" />);

      expect(screen.getByTestId('current-phase-info')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<PhaseIndicator className="custom-class" />);

      expect(screen.getByTestId('phase-indicator')).toHaveClass('custom-class');
    });
  });

  describe('Round Display', () => {
    it('should display round 1 by default', () => {
      render(<PhaseIndicator />);

      expect(screen.getByTestId('round-number')).toHaveTextContent('1');
    });

    it('should display correct round number', () => {
      render(<PhaseIndicator round={5} />);

      expect(screen.getByTestId('round-number')).toHaveTextContent('5');
    });
  });

  describe('Phase Progress', () => {
    it('should render all four phases', () => {
      render(<PhaseIndicator />);

      expect(screen.getByTestId('phase-evolution')).toBeInTheDocument();
      expect(screen.getByTestId('phase-foodSupply')).toBeInTheDocument();
      expect(screen.getByTestId('phase-feeding')).toBeInTheDocument();
      expect(screen.getByTestId('phase-extinction')).toBeInTheDocument();
    });

    it('should mark current phase as active', () => {
      render(<PhaseIndicator currentPhase="feeding" />);

      expect(screen.getByTestId('phase-feeding')).toHaveClass(
        'phase-indicator__phase--active'
      );
    });

    it('should mark past phases', () => {
      render(<PhaseIndicator currentPhase="feeding" />);

      expect(screen.getByTestId('phase-evolution')).toHaveClass(
        'phase-indicator__phase--past'
      );
      expect(screen.getByTestId('phase-foodSupply')).toHaveClass(
        'phase-indicator__phase--past'
      );
    });

    it('should not mark future phases as past or active', () => {
      render(<PhaseIndicator currentPhase="evolution" />);

      expect(screen.getByTestId('phase-foodSupply')).not.toHaveClass(
        'phase-indicator__phase--active'
      );
      expect(screen.getByTestId('phase-foodSupply')).not.toHaveClass(
        'phase-indicator__phase--past'
      );
    });

    it('should render connectors between phases', () => {
      render(<PhaseIndicator />);

      expect(screen.getByTestId('connector-0')).toBeInTheDocument();
      expect(screen.getByTestId('connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('connector-2')).toBeInTheDocument();
    });

    it('should fill connectors for past phases', () => {
      render(<PhaseIndicator currentPhase="feeding" />);

      expect(screen.getByTestId('connector-0')).toHaveClass(
        'phase-indicator__connector--filled'
      );
      expect(screen.getByTestId('connector-1')).toHaveClass(
        'phase-indicator__connector--filled'
      );
      expect(screen.getByTestId('connector-2')).not.toHaveClass(
        'phase-indicator__connector--filled'
      );
    });
  });

  describe('Current Phase Info', () => {
    it('should display evolution phase info', () => {
      render(<PhaseIndicator currentPhase="evolution" />);

      expect(screen.getByTestId('current-phase-name')).toHaveTextContent(
        '演化階段'
      );
      expect(screen.getByTestId('current-phase-desc')).toHaveTextContent(
        '打出卡牌，建立生物或添加性狀'
      );
    });

    it('should display food supply phase info', () => {
      render(<PhaseIndicator currentPhase="foodSupply" />);

      expect(screen.getByTestId('current-phase-name')).toHaveTextContent(
        '食物供給階段'
      );
      expect(screen.getByTestId('current-phase-desc')).toHaveTextContent(
        '擲骰決定食物池數量'
      );
    });

    it('should display feeding phase info', () => {
      render(<PhaseIndicator currentPhase="feeding" />);

      expect(screen.getByTestId('current-phase-name')).toHaveTextContent(
        '進食階段'
      );
      expect(screen.getByTestId('current-phase-desc')).toHaveTextContent(
        '餵食你的生物'
      );
    });

    it('should display extinction phase info', () => {
      render(<PhaseIndicator currentPhase="extinction" />);

      expect(screen.getByTestId('current-phase-name')).toHaveTextContent(
        '滅絕階段'
      );
      expect(screen.getByTestId('current-phase-desc')).toHaveTextContent(
        '未吃飽的生物死亡'
      );
    });
  });

  describe('Current Player', () => {
    it('should not show player info when no currentPlayer', () => {
      render(<PhaseIndicator />);

      expect(screen.queryByTestId('current-player')).not.toBeInTheDocument();
    });

    it('should show other player name when not my turn', () => {
      render(<PhaseIndicator currentPlayer="Alice" isMyTurn={false} />);

      expect(screen.getByTestId('current-player')).toBeInTheDocument();
      expect(screen.getByTestId('waiting-indicator')).toHaveTextContent(
        '等待 Alice 行動'
      );
    });

    it('should show my turn indicator when isMyTurn', () => {
      render(<PhaseIndicator currentPlayer="Me" isMyTurn />);

      expect(screen.getByTestId('my-turn-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('my-turn-indicator')).toHaveTextContent(
        '⭐ 你的回合'
      );
    });

    it('should apply self class when isMyTurn', () => {
      render(<PhaseIndicator currentPlayer="Me" isMyTurn />);

      expect(screen.getByTestId('current-player')).toHaveClass(
        'phase-indicator__player--self'
      );
    });

    it('should not apply self class when not my turn', () => {
      render(<PhaseIndicator currentPlayer="Alice" isMyTurn={false} />);

      expect(screen.getByTestId('current-player')).not.toHaveClass(
        'phase-indicator__player--self'
      );
    });
  });

  describe('Phase Icons', () => {
    it('should render phase icons with colors', () => {
      render(<PhaseIndicator currentPhase="feeding" />);

      // Active and past phases should have colored backgrounds
      const evolutionIcon = screen.getByTestId('phase-icon-evolution');
      const feedingIcon = screen.getByTestId('phase-icon-feeding');
      const extinctionIcon = screen.getByTestId('phase-icon-extinction');

      expect(evolutionIcon).toHaveStyle({ backgroundColor: '#8b5cf6' });
      expect(feedingIcon).toHaveStyle({ backgroundColor: '#10b981' });
      expect(extinctionIcon).toHaveStyle({ backgroundColor: '#e2e8f0' });
    });
  });
});
