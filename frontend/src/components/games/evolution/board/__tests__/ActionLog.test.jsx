/**
 * ActionLog 組件測試
 *
 * @module components/games/evolution/board/__tests__/ActionLog.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Import after mocks
const { ActionLog } = require('../ActionLog');

// Mock action data
const createMockAction = (type, overrides = {}) => ({
  id: `action-${Date.now()}-${Math.random()}`,
  type,
  timestamp: Date.now(),
  ...overrides,
});

describe('ActionLog', () => {
  describe('Rendering', () => {
    it('should render action log', () => {
      render(<ActionLog />);

      expect(screen.getByTestId('action-log')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<ActionLog />);

      expect(screen.getByTestId('action-log-header')).toBeInTheDocument();
      expect(screen.getByText('📜 行動日誌')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ActionLog className="custom-class" />);

      expect(screen.getByTestId('action-log')).toHaveClass('custom-class');
    });
  });

  describe('Expand/Collapse', () => {
    it('should be expanded by default', () => {
      render(<ActionLog />);

      expect(screen.getByTestId('action-log-content')).toBeInTheDocument();
      expect(screen.getByTestId('action-log')).toHaveClass(
        'action-log--expanded'
      );
    });

    it('should be collapsed when collapsed prop is true', () => {
      render(<ActionLog collapsed />);

      expect(screen.queryByTestId('action-log-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('action-log')).not.toHaveClass(
        'action-log--expanded'
      );
    });

    it('should toggle on header click', () => {
      render(<ActionLog />);

      // Initially expanded
      expect(screen.getByTestId('action-log-content')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByTestId('action-log-header'));
      expect(screen.queryByTestId('action-log-content')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByTestId('action-log-header'));
      expect(screen.getByTestId('action-log-content')).toBeInTheDocument();
    });

    it('should call onToggle when toggled', () => {
      const handleToggle = jest.fn();
      render(<ActionLog onToggle={handleToggle} />);

      fireEvent.click(screen.getByTestId('action-log-header'));

      expect(handleToggle).toHaveBeenCalledWith(false);
    });

    it('should show count when collapsed', () => {
      const actions = [
        createMockAction('feed', { playerName: 'Alice' }),
        createMockAction('feed', { playerName: 'Bob' }),
      ];
      render(<ActionLog actions={actions} collapsed />);

      expect(screen.getByTestId('action-count')).toHaveTextContent('(2)');
    });

    it('should not show count when expanded', () => {
      const actions = [createMockAction('feed', { playerName: 'Alice' })];
      render(<ActionLog actions={actions} />);

      expect(screen.queryByTestId('action-count')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no actions', () => {
      render(<ActionLog actions={[]} />);

      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText('尚無行動記錄')).toBeInTheDocument();
    });
  });

  describe('Action Display', () => {
    it('should render action items', () => {
      const actions = [
        createMockAction('feed', { playerName: 'Alice' }),
        createMockAction('attack', {
          attackerName: 'Bob',
          defenderName: 'Charlie',
        }),
      ];
      render(<ActionLog actions={actions} />);

      expect(screen.getByTestId('action-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('action-item-1')).toBeInTheDocument();
    });

    it('should display createCreature action', () => {
      const actions = [createMockAction('createCreature', { playerName: 'Alice' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('Alice 創建了一隻生物')).toBeInTheDocument();
    });

    it('should display addTrait action', () => {
      const actions = [
        createMockAction('addTrait', { playerName: 'Bob', traitName: '肉食' }),
      ];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('Bob 為生物添加了「肉食」')).toBeInTheDocument();
    });

    it('should display feed action', () => {
      const actions = [createMockAction('feed', { playerName: 'Charlie' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('Charlie 的生物進食了')).toBeInTheDocument();
    });

    it('should display attack action', () => {
      const actions = [
        createMockAction('attack', {
          attackerName: 'Alice',
          defenderName: 'Bob',
        }),
      ];
      render(<ActionLog actions={actions} />);

      expect(
        screen.getByText('Alice 攻擊了 Bob 的生物')
      ).toBeInTheDocument();
    });

    it('should display killed action', () => {
      const actions = [createMockAction('killed', { playerName: 'Dave' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('Dave 的生物被殺死')).toBeInTheDocument();
    });

    it('should display pass action', () => {
      const actions = [createMockAction('pass', { playerName: 'Eve' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('Eve 跳過了回合')).toBeInTheDocument();
    });

    it('should display phase action', () => {
      const actions = [createMockAction('phase', { phaseName: '進食' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('進入「進食」階段')).toBeInTheDocument();
    });

    it('should display round action', () => {
      const actions = [createMockAction('round', { round: 3 })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('第 3 回合開始')).toBeInTheDocument();
    });

    it('should display custom message for unknown type', () => {
      const actions = [createMockAction('unknown', { message: '自定義訊息' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByText('自定義訊息')).toBeInTheDocument();
    });
  });

  describe('Action Icons', () => {
    it('should show correct icon for each action type', () => {
      const actions = [
        createMockAction('createCreature', { playerName: 'A' }),
        createMockAction('feed', { playerName: 'B' }),
        createMockAction('attack', { attackerName: 'C', defenderName: 'D' }),
      ];
      render(<ActionLog actions={actions} />);

      const icons = screen.getAllByTestId('action-icon');
      expect(icons[0]).toHaveTextContent('🦎');
      expect(icons[1]).toHaveTextContent('🍖');
      expect(icons[2]).toHaveTextContent('⚔️');
    });
  });

  describe('Max Items', () => {
    it('should limit displayed items to maxItems', () => {
      const actions = Array.from({ length: 10 }, (_, i) =>
        createMockAction('feed', { playerName: `Player${i}` })
      );
      render(<ActionLog actions={actions} maxItems={5} />);

      // Should only show last 5 items
      expect(screen.queryByTestId('action-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('action-item-4')).toBeInTheDocument();
      expect(screen.queryByTestId('action-item-5')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply action type class', () => {
      const actions = [createMockAction('attack', { attackerName: 'A', defenderName: 'B' })];
      render(<ActionLog actions={actions} />);

      expect(screen.getByTestId('action-item-0')).toHaveClass(
        'action-log__item--attack'
      );
    });
  });
});
