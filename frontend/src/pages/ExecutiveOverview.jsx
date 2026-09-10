import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { ShoppingCart, DollarSign, Users, Truck, Star, AlertCircle, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

// Mock sparkline generators for visual effect
const generateSparkline = (base, variance, points = 10) => {
  return Array.from({ length: points }, () => ({
    value: Math.max(0, base + (Math.random() - 0.5) * variance)
  }));
};

export default function ExecutiveOverview() {
  const { filters } = useFilters();
  const [data, setData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchKPIs = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, revTrendRes, statusRes, healthRes] = await Promise.all([
          getFilteredData('/kpis', filters),
          getFilteredData('/revenue/trend', filters),
          getFilteredData('/orders/status', filters),
          getFilteredData('/health_score', filters)
        ]);
        
        if (isMounted) {
          setData(kpisRes);
          setRevenueTrend(revTrendRes);
          setOrderStatus(statusRes);
          setHealthData(healthRes);
        }
      } catch (err) {
        if (isMounted) setError('Unable to load KPI data. Please check your connection.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchKPIs();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) {
    return <div className="flex justify-center p-12 text-text-muted">Loading Executive Overview...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-danger p-8 bg-danger/10 rounded-lg">
        <AlertCircle /> {error}
      </div>
    );
  }

  if (!data || !data.orders) {
    return <div className="p-8 text-text-muted">No data available for selected filters.</div>;
  }

  const { orders, revenue, customers, delivery, reviews } = data;

  const deliverySuccessRate = (orders.delivered_orders + orders.canceled_orders) > 0 
    ? (orders.delivered_orders / (orders.delivered_orders + orders.canceled_orders)) * 100 
    : 0;

  const cancellationRate = orders.total_orders > 0
    ? (orders.canceled_orders / orders.total_orders) * 100
    : 0;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="flex flex-col gap-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-2">Executive Overview</h1>
        <p className="text-text-muted">High-level summary of business performance and operational health.</p>
      </motion.div>

      {healthData && (
        <motion.div variants={itemVariants} className="card flex flex-wrap gap-8 items-center bg-bg-sidebar border border-border-color shadow-lg relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

          <div className="flex-1 min-w-[200px] text-center p-4 border-r border-border-color z-10">
            <h3 className="text-sm font-semibold text-text-muted mb-2 flex items-center justify-center gap-2">
              <Activity size={16} /> Business Health
            </h3>
            <div className={`text-5xl font-bold ${healthData.overall_health > 75 ? 'text-success' : healthData.overall_health > 50 ? 'text-warning' : 'text-danger'}`}>
              {Math.round(healthData.overall_health)}<span className="text-2xl text-text-muted">/100</span>
            </div>
          </div>
          <div className="flex-[3_1_400px] flex flex-col gap-4 z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Revenue Health', val: healthData.revenue_health, color: 'bg-primary-light' },
                { label: 'Customer Health', val: healthData.customer_health, color: 'bg-primary' },
                { label: 'Operational Health', val: healthData.operational_health, color: 'bg-success' },
                { label: 'CX Health', val: healthData.cx_health, color: 'bg-warning' },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-sm font-bold">{Math.round(metric.val)}</span>
                  </div>
                  <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${metric.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.val}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KPICard 
          title="Total Revenue" 
          value={formatCurrency(revenue.total_order_value)} 
          subtitle="Includes freight"
          icon={DollarSign}
          sparklineData={generateSparkline(100, 40)}
          color="var(--color-primary)"
        />
        <KPICard 
          title="Total Orders" 
          value={formatNumber(orders.total_orders)} 
          subtitle={`${formatPercent(deliverySuccessRate)} success rate`}
          icon={ShoppingCart}
          sparklineData={generateSparkline(50, 15)}
          color="var(--color-primary-light)"
        />
        <KPICard 
          title="Average Order Value" 
          value={formatCurrency(revenue.aov)} 
          icon={DollarSign}
          sparklineData={generateSparkline(200, 20)}
          color="var(--color-success)"
        />
        <KPICard 
          title="Unique Customers" 
          value={formatNumber(customers.unique_customers)} 
          subtitle={`${formatPercent(customers.repeat_customer_rate)} repeat rate`}
          icon={Users}
          sparklineData={generateSparkline(80, 10)}
          color="var(--color-primary)"
        />
        <KPICard 
          title="On-Time Delivery" 
          value={formatPercent(delivery.on_time_rate)} 
          subtitle={`Avg: ${delivery.avg_days ? Number(delivery.avg_days).toFixed(1) : 0} days`}
          icon={Truck}
          trend={delivery.on_time_rate > 0.9 ? 'up' : 'down'}
          trendLabel="vs last month"
          color="var(--color-success)"
        />
        <KPICard 
          title="Cancellation Rate" 
          value={formatPercent(cancellationRate)} 
          icon={AlertCircle}
          color="var(--color-danger)"
          sparklineData={generateSparkline(5, 5)}
        />
        <KPICard 
          title="Average Review Score" 
          value={reviews.average_score ? Number(reviews.average_score).toFixed(2) : '0.00'} 
          subtitle={`${formatPercent(reviews.five_star_rate)} 5-star rating`}
          icon={Star}
          color="var(--color-warning)"
        />
      </motion.div>

      {/* Insights Box */}
      <motion.div variants={itemVariants} className="card bg-primary text-white border-none shadow-glow">
        <h3 className="text-lg flex items-center gap-2 mb-4 font-semibold">
          <Star size={20} className="text-warning" /> Automated Business Insights
        </h3>
        <ul className="pl-6 flex flex-col gap-2 opacity-90 list-disc">
          <li>
            The business has processed <strong>{formatNumber(orders.total_orders)}</strong> orders generating <strong>{formatCurrency(revenue.total_order_value)}</strong> in total value.
          </li>
          <li>
            Operational delivery health is strong with <strong>{formatPercent(deliverySuccessRate)}</strong> of completed orders successfully delivered and <strong>{formatPercent(delivery.on_time_rate)}</strong> of valid deliveries arriving on time.
          </li>
          <li>
            Customer retention indicates an opportunity, with a repeat rate of <strong>{formatPercent(customers.repeat_customer_rate)}</strong> among {formatNumber(customers.unique_customers)} unique buyers.
          </li>
          <li>
            Customer satisfaction remains stable at <strong>{reviews.average_score ? Number(reviews.average_score).toFixed(2) : 0}/5</strong> with {formatPercent(reviews.five_star_rate)} 5-star reviews and {formatPercent(reviews.negative_rate)} negative reviews.
          </li>
        </ul>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-[400px] flex flex-col group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Monthly Revenue Trend</h3>
            <button className="text-xs text-primary-light hover:text-primary transition-colors">Export CSV</button>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis 
                  dataKey="month_name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={(val) => `R$${(val / 1000000).toFixed(1)}M`}
                />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: 'var(--bg-hover)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                />
                <Bar dataKey="total_revenue" fill="var(--color-primary-light)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Order Status Distribution</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="order_status"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={70}
                  paddingAngle={5}
                >
                  {orderStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.order_status === 'delivered' ? 'var(--color-success)' :
                            entry.order_status === 'canceled' ? 'var(--color-danger)' :
                            entry.order_status === 'shipped' ? 'var(--color-primary-light)' :
                            'var(--color-warning)'} 
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => formatNumber(value)} 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
