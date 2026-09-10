import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import { formatNumber } from '../utils/formatters';
import { AlertCircle, Target, GitCompare } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ZAxis
} from 'recharts';

export default function SupplyDemandAnalysis() {
  const { filters } = useFilters();
  const [categoryData, setCategoryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSupplyDemand = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, stateRes] = await Promise.all([
          getFilteredData('/supply_demand/category', filters),
          getFilteredData('/supply_demand/state', filters)
        ]);
        
        if (isMounted) {
          setCategoryData(catRes);
          setStateData(stateRes);
        }
      } catch (err) {
        if (isMounted) setError('Unable to load Supply & Demand data. Please check your connection.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSupplyDemand();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading Supply & Demand Analysis...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', padding: '2rem' }}>
        <AlertCircle /> {error}
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return <div style={{ padding: '2rem' }}>No data available for selected filters.</div>;
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Opportunity': return 'var(--color-success)';
      case 'Competitive': return 'var(--color-warning)';
      case 'Oversupplied': return 'var(--color-danger)';
      default: return 'var(--text-muted)';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{data.category || data.state}</p>
          <p>Demand Proxy (Orders): {formatNumber(data.demand_proxy_orders)}</p>
          <p>Supply Proxy (Sellers): {formatNumber(data.supply_proxy_sellers)}</p>
          <p>Status: <span style={{ color: getStatusColor(data.gap_status), fontWeight: 'bold' }}>{data.gap_status}</span></p>
        </div>
      );
    }
    return null;
  };

  const opportunities = categoryData.filter(d => d.gap_status === 'Opportunity').slice(0, 3);
  const oversupplied = categoryData.filter(d => d.gap_status === 'Oversupplied').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Supply & Demand Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze market opportunities by comparing demand (orders) with supply (active sellers).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Insights Box */}
        <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}>
            <Target size={18} /> Strategic Opportunities
          </h3>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
            {opportunities.length > 0 ? (
              <li>
                <strong>High Demand, Low Supply:</strong> The categories {opportunities.map(o => `'${o.category}'`).join(', ')} show strong demand but below-average seller coverage. These are prime areas for seller acquisition.
              </li>
            ) : (
              <li>No significant underserved opportunities identified in the current selection.</li>
            )}
            {oversupplied.length > 0 && (
              <li>
                <strong>Oversupplied Markets:</strong> The categories {oversupplied.map(o => `'${o.category}'`).join(', ')} have high seller activity but low demand. Consider reducing seller acquisition efforts here.
              </li>
            )}
          </ul>
        </div>
        
        <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
           <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <GitCompare size={18} /> Gap Analysis Matrix Guide
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
            <div style={{ border: `1px solid var(--color-warning)`, padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>Competitive</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High Demand / High Supply</div>
            </div>
            <div style={{ border: `1px solid var(--color-success)`, padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>Opportunity</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High Demand / Low Supply</div>
            </div>
            <div style={{ border: `1px solid var(--text-muted)`, padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>Underserved</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Low Demand / Low Supply</div>
            </div>
            <div style={{ border: `1px solid var(--color-danger)`, padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>Oversupplied</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Low Demand / High Supply</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Category Gap Analysis (Supply vs Demand)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="supply_index" name="Supply Index" label={{ value: 'Supply Index (Active Sellers vs Avg)', position: 'bottom' }} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis type="number" dataKey="demand_index" name="Demand Index" label={{ value: 'Demand Index (Orders vs Avg)', angle: -90, position: 'left' }} tick={{ fill: 'var(--text-muted)' }} />
                <ZAxis type="number" dataKey="revenue" range={[60, 400]} name="Revenue" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Scatter name="Categories" data={categoryData}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.gap_status)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
