/**
 * StatsCharts 測試
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarChart, PieChart, StatCard, StatsCardGroup } from '../StatsCharts';

describe('StatsCharts', () => {
  describe('BarChart', () => {
    const mockData = [
      { label: '一月', value: 10, color: '#4CAF50' },
      { label: '二月', value: 20, color: '#2196F3' },
      { label: '三月', value: 15, color: '#FF9800' },
    ];

    it('should render bar chart with data', () => {
      render(<BarChart data={mockData} title="測試圖表" />);

      expect(screen.getByText('測試圖表')).toBeInTheDocument();
      expect(screen.getByText('一月')).toBeInTheDocument();
      expect(screen.getByText('二月')).toBeInTheDocument();
      expect(screen.getByText('三月')).toBeInTheDocument();
    });

    it('should display values', () => {
      render(<BarChart data={mockData} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <BarChart data={mockData} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should handle maxValue prop', () => {
      const { container } = render(<BarChart data={mockData} maxValue={100} />);

      // 柱狀圖應該渲染
      expect(container.querySelector('.bar-chart__bar')).toBeInTheDocument();
    });

    it('should render without title', () => {
      const { container } = render(<BarChart data={mockData} />);

      expect(container.querySelector('.stats-chart__title')).not.toBeInTheDocument();
    });
  });

  describe('PieChart', () => {
    const mockData = [
      { label: '紅色', value: 30, color: '#F44336' },
      { label: '藍色', value: 50, color: '#2196F3' },
      { label: '綠色', value: 20, color: '#4CAF50' },
    ];

    it('should render pie chart with data', () => {
      render(<PieChart data={mockData} title="分布圖" />);

      expect(screen.getByText('分布圖')).toBeInTheDocument();
      expect(screen.getByText('紅色')).toBeInTheDocument();
      expect(screen.getByText('藍色')).toBeInTheDocument();
      expect(screen.getByText('綠色')).toBeInTheDocument();
    });

    it('should display percentages', () => {
      render(<PieChart data={mockData} />);

      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('should render SVG', () => {
      const { container } = render(<PieChart data={mockData} size={200} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '200');
    });

    it('should handle zero values', () => {
      const dataWithZero = [
        { label: 'A', value: 0 },
        { label: 'B', value: 100 },
      ];
      render(<PieChart data={dataWithZero} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle all zero values', () => {
      const allZero = [
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
      ];
      render(<PieChart data={allZero} />);

      expect(screen.getAllByText('0%').length).toBe(2);
    });
  });

  describe('StatCard', () => {
    it('should render stat card', () => {
      render(<StatCard label="勝場數" value={25} />);

      expect(screen.getByText('勝場數')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(<StatCard label="勝場數" value={25} icon="🏆" />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should render with subValue', () => {
      render(<StatCard label="勝率" value="60%" subValue="最近 10 場" />);

      expect(screen.getByText('最近 10 場')).toBeInTheDocument();
    });

    it('should render positive trend', () => {
      render(<StatCard label="勝率" value="60%" trend={5} />);

      expect(screen.getByText(/↑.*5%/)).toBeInTheDocument();
    });

    it('should render negative trend', () => {
      render(<StatCard label="勝率" value="40%" trend={-3} />);

      expect(screen.getByText(/↓.*3%/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatCard label="測試" value={10} className="custom" />
      );

      expect(container.firstChild).toHaveClass('custom');
    });
  });

  describe('StatsCardGroup', () => {
    const mockStats = [
      { label: '遊戲場數', value: 50, icon: '🎮' },
      { label: '勝場數', value: 25, icon: '🏆' },
      { label: '勝率', value: '50%', icon: '📊' },
    ];

    it('should render all stat cards', () => {
      render(<StatsCardGroup stats={mockStats} />);

      expect(screen.getByText('遊戲場數')).toBeInTheDocument();
      expect(screen.getByText('勝場數')).toBeInTheDocument();
      expect(screen.getByText('勝率')).toBeInTheDocument();
    });

    it('should render all values', () => {
      render(<StatsCardGroup stats={mockStats} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render all icons', () => {
      render(<StatsCardGroup stats={mockStats} />);

      expect(screen.getByText('🎮')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatsCardGroup stats={mockStats} className="custom-group" />
      );

      expect(container.firstChild).toHaveClass('custom-group');
    });
  });
});
