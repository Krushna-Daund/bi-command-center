import React, { useState } from 'react';
import Tabs from '../components/Tabs';
import OrderAnalytics from './OrderAnalytics';
import DeliveryAnalytics from './DeliveryAnalytics';
import SupplyDemandAnalysis from './SupplyDemandAnalysis';

export default function OperationsHub() {
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { id: 'orders', label: 'Order Analytics' },
    { id: 'delivery', label: 'Delivery & Ops' },
    { id: 'supply', label: 'Supply & Demand' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'orders' && <OrderAnalytics />}
        {activeTab === 'delivery' && <DeliveryAnalytics />}
        {activeTab === 'supply' && <SupplyDemandAnalysis />}
      </div>
    </div>
  );
}
