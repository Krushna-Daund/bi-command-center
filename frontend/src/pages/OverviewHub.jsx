import React, { useState, Suspense, lazy } from 'react';
import Tabs from '../components/Tabs';

const ExecutiveOverview = lazy(() => import('./ExecutiveOverview'));
const GrowthAnalysis = lazy(() => import('./GrowthAnalysis'));
const StatisticalAnalysis = lazy(() => import('./StatisticalAnalysis'));

export default function OverviewHub() {
  const [activeTab, setActiveTab] = useState('executive');

  const tabs = [
    { id: 'executive', label: 'Executive Summary' },
    { id: 'growth', label: 'Growth Trends' },
    { id: 'statistics', label: 'Statistical Analysis' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading section...</div>}>
          {activeTab === 'executive' && <ExecutiveOverview />}
          {activeTab === 'growth' && <GrowthAnalysis />}
          {activeTab === 'statistics' && <StatisticalAnalysis />}
        </Suspense>
      </div>
    </div>
  );
}
