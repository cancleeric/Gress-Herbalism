/**
 * 統計圖表組件
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import './StatsCharts.css';

/**
 * 簡易柱狀圖
 */
function BarChart({ data, title, maxValue, className }) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`stats-chart bar-chart ${className || ''}`}>
      {title && <h3 className="stats-chart__title">{title}</h3>}
      <div className="bar-chart__container">
        {data.map((item, index) => (
          <div key={item.label || index} className="bar-chart__item">
            <div className="bar-chart__bar-container">
              <div
                className="bar-chart__bar"
                style={{
                  height: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || 'var(--color-primary)',
                }}
              />
            </div>
            <span className="bar-chart__label">{item.label}</span>
            <span className="bar-chart__value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string,
  maxValue: PropTypes.number,
  className: PropTypes.string,
};

/**
 * 簡易圓餅圖
 */
function PieChart({ data, title, size = 200, className }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const segments = useMemo(() => {
    let currentAngle = 0;
    return data.map((item) => {
      const angle = total > 0 ? (item.value / total) * 360 : 0;
      const segment = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      };
      currentAngle += angle;
      return segment;
    });
  }, [data, total]);

  // 計算 SVG 路徑
  const createArcPath = (startAngle, endAngle, radius, innerRadius = 0) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const center = size / 2;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    if (innerRadius > 0) {
      const x1i = center + innerRadius * Math.cos(startRad);
      const y1i = center + innerRadius * Math.sin(startRad);
      const x2i = center + innerRadius * Math.cos(endRad);
      const y2i = center + innerRadius * Math.sin(endRad);

      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x2i} ${y2i} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;
    }

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className={`stats-chart pie-chart ${className || ''}`}>
      {title && <h3 className="stats-chart__title">{title}</h3>}
      <div className="pie-chart__container">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, index) =>
            segment.value > 0 ? (
              <path
                key={segment.label || index}
                d={createArcPath(segment.startAngle, segment.endAngle, size / 2 - 10)}
                fill={segment.color || `hsl(${index * 60}, 70%, 50%)`}
                className="pie-chart__segment"
              />
            ) : null
          )}
        </svg>
        <div className="pie-chart__legend">
          {segments.map((segment, index) => (
            <div key={segment.label || index} className="pie-chart__legend-item">
              <span
                className="pie-chart__legend-color"
                style={{ backgroundColor: segment.color || `hsl(${index * 60}, 70%, 50%)` }}
              />
              <span className="pie-chart__legend-label">{segment.label}</span>
              <span className="pie-chart__legend-value">{segment.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

PieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};

/**
 * 統計卡片
 */
function StatCard({ label, value, icon, subValue, trend, className }) {
  return (
    <div className={`stat-card ${className || ''}`}>
      {icon && <span className="stat-card__icon">{icon}</span>}
      <div className="stat-card__content">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
        {subValue && <span className="stat-card__sub-value">{subValue}</span>}
        {trend !== undefined && (
          <span className={`stat-card__trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string,
  subValue: PropTypes.string,
  trend: PropTypes.number,
  className: PropTypes.string,
};

/**
 * 統計卡片組
 */
function StatsCardGroup({ stats, className }) {
  return (
    <div className={`stats-card-group ${className || ''}`}>
      {stats.map((stat, index) => (
        <StatCard key={stat.label || index} {...stat} />
      ))}
    </div>
  );
}

StatsCardGroup.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.string,
      subValue: PropTypes.string,
      trend: PropTypes.number,
    })
  ).isRequired,
  className: PropTypes.string,
};

export { BarChart, PieChart, StatCard, StatsCardGroup };
export default { BarChart, PieChart, StatCard, StatsCardGroup };
