import React, { useState, Suspense, lazy } from 'react';
import Tabs from '../components/Tabs';

const CustomerAnalytics = lazy(() => import('./CustomerAnalytics'));
const CustomerExperience = lazy(() => import('./CustomerExperience'));
const GeographicAnalysis = lazy(() => import('./GeographicAnalysis'));

export default function CustomerHub() {
  const [activeTab, setActiveTab] = useState('customers');

  const tabs = [
    { id: 'customers', label: 'Customer Analytics' },
    { id: 'experience', label: 'Experience & Reviews' },
    { id: 'geography', label: 'Geographic Analysis' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading section...</div>}>
          {activeTab === 'customers' && <CustomerAnalytics />}
          {activeTab === 'experience' && <CustomerExperience />}
          {activeTab === 'geography' && <GeographicAnalysis />}
        </Suspense>
      </div>
    </div>
  );
}
