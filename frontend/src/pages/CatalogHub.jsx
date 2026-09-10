import React, { useState } from 'react';
import Tabs from '../components/Tabs';
import ProductAnalytics from './ProductAnalytics';
import SellerPerformance from './SellerPerformance';

export default function CatalogHub() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Product & Category' },
    { id: 'sellers', label: 'Seller Performance' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'products' && <ProductAnalytics />}
        {activeTab === 'sellers' && <SellerPerformance />}
      </div>
    </div>
  );
}
