/**
 * TouchCardDetail 組件測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TouchCardDetail } from '../TouchCardDetail';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock useHapticFeedback
jest.mock('../../../../../hooks/useTouch', () => ({
  useHapticFeedback: () => ({
    isSupported: true,
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock trait visuals
jest.mock('../../constants/traitVisuals', () => ({
  TRAIT_ICONS: {
    carnivore: '🥩',
    camouflage: '🌿',
  },
  TRAIT_COLORS: {
    carnivore: '#D32F2F',
    defense: '#1976D2',
    special: '#F57C00',
  },
  TRAIT_NAMES: {
    carnivore: '肉食',
    camouflage: '偽裝',
  },
  TRAIT_CATEGORY_MAP: {
    carnivore: 'carnivore',
    camouflage: 'defense',
  },
  TRAIT_FOOD_BONUS: {
    carnivore: 1,
    camouflage: 0,
  },
  TRAIT_DESCRIPTIONS: {
    carnivore: '必須攻擊其他生物獲得食物',
    camouflage: '需要銳目才能被攻擊',
  },
}));

describe('TouchCardDetail', () => {
  const mockCard = {
    instanceId: 'card-1',
    frontTrait: 'carnivore',
    backTrait: 'camouflage',
  };

  const defaultProps = {
    visible: true,
    card: mockCard,
    position: { x: 200, y: 300 },
    onClose: jest.fn(),
    onPlayAsCreature: jest.fn(),
    onPlayAsTrait: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByTestId('touch-card-detail')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<TouchCardDetail {...defaultProps} visible={false} />);

    expect(screen.queryByTestId('touch-card-detail')).not.toBeInTheDocument();
  });

  it('should display front trait info', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByText('肉食')).toBeInTheDocument();
    expect(screen.getByText('必須攻擊其他生物獲得食物')).toBeInTheDocument();
  });

  it('should display back trait info', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByText('偽裝')).toBeInTheDocument();
    expect(screen.getByText('需要銳目才能被攻擊')).toBeInTheDocument();
  });

  it('should display food bonus for traits with bonus', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<TouchCardDetail {...defaultProps} />);

    const backdrop = screen.getByTestId('touch-card-detail');
    fireEvent.click(backdrop);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    render(<TouchCardDetail {...defaultProps} />);

    const closeButton = screen.getByLabelText('關閉');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onPlayAsCreature when creature button is clicked', () => {
    render(<TouchCardDetail {...defaultProps} />);

    const creatureButton = screen.getByText('作為生物');
    fireEvent.click(creatureButton);

    expect(defaultProps.onPlayAsCreature).toHaveBeenCalledWith('card-1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onPlayAsTrait when trait button is clicked', () => {
    render(<TouchCardDetail {...defaultProps} />);

    const traitButton = screen.getByText('作為性狀');
    fireEvent.click(traitButton);

    expect(defaultProps.onPlayAsTrait).toHaveBeenCalledWith('card-1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close on Escape key', () => {
    render(<TouchCardDetail {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not render if card is null', () => {
    render(<TouchCardDetail {...defaultProps} card={null} />);

    expect(screen.queryByTestId('touch-card-detail')).not.toBeInTheDocument();
  });

  it('should display side labels', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByText('正面')).toBeInTheDocument();
    expect(screen.getByText('背面')).toBeInTheDocument();
  });

  it('should display divider between sides', () => {
    render(<TouchCardDetail {...defaultProps} />);

    expect(screen.getByText('或')).toBeInTheDocument();
  });
});
