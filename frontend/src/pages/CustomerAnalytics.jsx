import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatPercent, formatCurrency } from '../utils/formatters';
import { Users, UserPlus, Heart, Map as MapIcon, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export default function CustomerAnalytics() {
  const { filters } = useFilters();
  const [data, setData] = useState({ summary: null, state: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, stateRes, segmentRes, cohortRes, distRes] = await Promise.all([
          getFilteredData('/customers/summary', filters),
          getFilteredData('/customers/state', filters),
          getFilteredData('/customers/segmentation', filters),
          getFilteredData('/customers/cohorts', filters),
          getFilteredData('/customers/value_distribution', filters)
        ]);
        
        if (isMounted) {
          setData({ summary: summaryRes, state: stateRes, segmentation: segmentRes, cohorts: cohortRes, valueDistribution: distRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load customer data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Customer Analytics...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.summary) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10States = data.state.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Customer Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze customer base, retention, and geographic distribution.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Total Unique Customers" 
          value={formatNumber(data.summary.total_customers)} 
          icon={Users}
        />
        <KPICard 
          title="Repeat Customers" 
          value={formatNumber(data.summary.repeat_customers)} 
          icon={UserPlus}
        />
        <KPICard 
          title="Repeat Customer Rate" 
          value={formatPercent(data.summary.repeat_rate)} 
          icon={Heart}
          color="var(--color-primary-light)"
        />
        <KPICard 
          title="Average Customer Value" 
          value={formatCurrency(data.summary.avg_value_per_customer)} 
          icon={MapIcon}
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white' }}>Automated Business Insights</h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            The business has served <strong>{formatNumber(data.summary.total_customers)}</strong> unique customers.
          </li>
          <li>
            Customer retention sits at <strong>{formatPercent(data.summary.repeat_rate)}</strong>, meaning {formatNumber(data.summary.repeat_customers)} customers have returned to make another purchase.
          </li>
          <li>
            On average, a customer spends <strong>{formatCurrency(data.summary.avg_value_per_customer)}</strong> over their lifetime with the business.
          </li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 States by Customer Count</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10States} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="unique_customers" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Customer Segmentation</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.segmentation} 
                  dataKey="num_customers" 
                  nameKey="segment" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {data.segmentation && data.segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-primary-light)'][index % 5]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val) => formatNumber(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Customer Value Distribution (Spend)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', height: '100%', alignItems: 'center', textAlign: 'center' }}>
             {data.valueDistribution && (
               <>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bottom 25%</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(data.valueDistribution.p25)}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Median (50%)</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(data.valueDistribution.median)}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top 25%</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(data.valueDistribution.p75)}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top 10%</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(data.valueDistribution.p90)}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top 5%</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(data.valueDistribution.p95)}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top 1%</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatCurrency(data.valueDistribution.p99)}</div>
                 </div>
                 <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mean Average</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatCurrency(data.valueDistribution.mean)}</div>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
