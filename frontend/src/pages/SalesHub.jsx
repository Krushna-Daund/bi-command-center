import React, { useState, Suspense, lazy } from 'react';
import Tabs from '../components/Tabs';

const RevenueAnalysis = lazy(() => import('./RevenueAnalysis'));
const PaymentAnalytics = lazy(() => import('./PaymentAnalytics'));

export default function SalesHub() {
  const [activeTab, setActiveTab] = useState('revenue');

  const tabs = [
    { id: 'revenue', label: 'Revenue Analysis' },
    { id: 'payments', label: 'Payment Analytics' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading section...</div>}>
          {activeTab === 'revenue' && <RevenueAnalysis />}
          {activeTab === 'payments' && <PaymentAnalytics />}
        </Suspense>
      </div>
    </div>
  );
}
