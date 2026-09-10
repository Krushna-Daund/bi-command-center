import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import DataTable from '../components/DataTable';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { MapIcon, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const stateCoordinates = {
  'AC': [-9.02, -70.81], 'AL': [-9.53, -36.66], 'AM': [-3.41, -65.85], 'AP': [1.41, -51.77],
  'BA': [-12.57, -41.70], 'CE': [-5.49, -39.32], 'DF': [-15.79, -47.88], 'ES': [-19.18, -40.30],
  'GO': [-15.82, -49.83], 'MA': [-4.96, -45.22], 'MT': [-12.68, -56.92], 'MS': [-20.44, -54.62],
  'MG': [-18.51, -44.55], 'PA': [-3.20, -52.00], 'PB': [-7.23, -36.78], 'PR': [-25.25, -52.02],
  'PE': [-8.81, -36.95], 'PI': [-7.71, -42.72], 'RJ': [-22.90, -43.20], 'RN': [-5.79, -36.52],
  'RS': [-30.03, -51.21], 'RO': [-11.50, -63.58], 'RR': [2.73, -62.05], 'SC': [-27.24, -50.21],
  'SP': [-23.55, -46.63], 'SE': [-10.50, -37.31], 'TO': [-10.17, -48.29]
};

export default function GeographicAnalysis() {
  const { filters } = useFilters();
  const [data, setData] = useState({ revenue: [], orders: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [revRes, ordRes, custRes] = await Promise.all([
          getFilteredData('/revenue/state', filters),
          getFilteredData('/orders/state', filters),
          getFilteredData('/customers/state', filters)
        ]);
        
        if (isMounted) {
          setData({ revenue: revRes, orders: ordRes, customers: custRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load geography data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Geographic Analysis...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;

  const top10Revenue = data.revenue.slice(0, 10);
  const top10Orders = data.orders.slice(0, 10);

  const tableColumns = [
    { key: 'state', label: 'State' },
    { key: 'total_revenue', label: 'Revenue', format: (val) => formatCurrency(val) }
  ];

  const orderTableColumns = [
    { key: 'state', label: 'State' },
    { key: 'total_orders', label: 'Total Orders', format: (val) => formatNumber(val) },
    { key: 'delivered_orders', label: 'Delivered', format: (val) => formatNumber(val) },
    { key: 'canceled_orders', label: 'Canceled', format: (val) => formatNumber(val) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Geographic Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze business penetration and performance across different states.</p>
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapIcon size={18} /> Automated Business Insights
        </h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          {top10Revenue.length > 0 && (
            <li>
              The most lucrative state is <strong>{top10Revenue[0].state}</strong>, generating <strong>{formatCurrency(top10Revenue[0].total_revenue)}</strong> in revenue.
            </li>
          )}
          {top10Orders.length > 0 && (
            <li>
              <strong>{top10Orders[0].state}</strong> leads in order volume with <strong>{formatNumber(top10Orders[0].total_orders)}</strong> orders.
            </li>
          )}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Geographic Revenue Hotspots</h3>
          <div style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 0 }}>
            {data.revenue && data.revenue.length > 0 && (
              <MapContainer 
                center={[-14.235, -51.925]} 
                zoom={4} 
                style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {data.revenue.map((stateData) => {
                  const coords = stateCoordinates[stateData.state];
                  if (!coords) return null;
                  
                  const maxRev = data.revenue[0].total_revenue;
                  const radius = Math.max(8, (stateData.total_revenue / maxRev) * 40);
                  
                  return (
                    <CircleMarker 
                      key={stateData.state}
                      center={coords} 
                      radius={radius}
                      fillOpacity={0.6}
                      fillColor="var(--color-primary)"
                      color="var(--color-primary-light)"
                      weight={2}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong>{stateData.state}</strong><br/>
                          Revenue: {formatCurrency(stateData.total_revenue)}<br/>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 States by Revenue</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Revenue} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} />
                <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} width={40} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="total_revenue" fill="var(--color-primary-light)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Tables */}
        <div style={{ height: '400px' }}>
          <DataTable 
            title="Revenue by State (Raw Data)" 
            columns={tableColumns} 
            data={data.revenue} 
            defaultSortKey="total_revenue" 
          />
        </div>
        <div style={{ height: '400px' }}>
          <DataTable 
            title="Orders by State (Raw Data)" 
            columns={orderTableColumns} 
            data={data.orders} 
            defaultSortKey="total_orders" 
          />
        </div>

      </div>
    </div>
  );
}
