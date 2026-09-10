import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatPercent } from '../utils/formatters';
import { ShoppingCart, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function OrderAnalytics() {
  const { filters } = useFilters();
  const [data, setData] = useState({ kpis: null, status: [], trend: [], state: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, statusRes, trendRes, stateRes] = await Promise.all([
          getFilteredData('/kpis', filters),
          getFilteredData('/orders/status', filters),
          getFilteredData('/orders/trend', filters),
          getFilteredData('/orders/state', filters)
        ]);
        
        if (isMounted) {
          setData({ kpis: kpisRes.orders, status: statusRes, trend: trendRes, state: stateRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load order data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Order Analytics...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.kpis) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10States = data.state.slice(0, 10);
  
  const deliveredRate = data.kpis.total_orders > 0 
    ? (data.kpis.delivered_orders / data.kpis.total_orders) * 100 
    : 0;

  const cancellationRate = data.kpis.total_orders > 0 
    ? (data.kpis.canceled_orders / data.kpis.total_orders) * 100 
    : 0;

  const unavailableRate = data.kpis.total_orders > 0 
    ? (data.kpis.unavailable_orders / data.kpis.total_orders) * 100 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Detailed breakdown of order volume, statuses, and geography.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Total Orders" 
          value={formatNumber(data.kpis.total_orders)} 
          icon={ShoppingCart}
        />
        <KPICard 
          title="Delivered Rate" 
          value={formatPercent(deliveredRate)} 
          subtitle={`${formatNumber(data.kpis.delivered_orders)} orders`}
          icon={CheckCircle}
          color="var(--color-success)"
        />
        <KPICard 
          title="Cancellation Rate" 
          value={formatPercent(cancellationRate)} 
          subtitle={`${formatNumber(data.kpis.canceled_orders)} orders`}
          icon={XCircle}
          color="var(--color-danger)"
        />
        <KPICard 
          title="Unavailable Rate" 
          value={formatPercent(unavailableRate)} 
          subtitle={`${formatNumber(data.kpis.unavailable_orders)} orders`}
          icon={AlertTriangle}
          color="var(--color-warning)"
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white' }}>Automated Business Insights</h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            Total order volume sits at <strong>{formatNumber(data.kpis.total_orders)}</strong>.
          </li>
          <li>
            The delivery success rate is strong at <strong>{formatPercent(deliveredRate)}</strong>, while cancellations account for <strong>{formatPercent(cancellationRate)}</strong>.
          </li>
          {top10States.length > 0 && (
            <li>
              The highest volume of orders originates from <strong>{top10States[0].state}</strong> ({formatNumber(top10States[0].total_orders)} orders).
            </li>
          )}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Monthly Order Trend</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} />
                <Line type="monotone" dataKey="total_orders" stroke="var(--color-primary-light)" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Order Status Distribution</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status}
                  dataKey="count"
                  nameKey="order_status"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={2}
                >
                  {data.status.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.order_status === 'delivered' ? 'var(--color-success)' :
                            entry.order_status === 'canceled' ? 'var(--color-danger)' :
                            entry.order_status === 'shipped' ? 'var(--color-primary-light)' :
                            'var(--color-warning)'} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatNumber(value)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 States by Order Volume</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10States} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="total_orders" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
