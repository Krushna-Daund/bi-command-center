import React, { useState, useEffect } from 'react';
import { Shield, Plus, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import api from '../api';

const AlertsConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Revenue',
    metric: '',
    condition: 'LESS_THAN',
    threshold: '',
    severity: 'WARNING',
    is_enabled: true
  });

  const fetchConfigs = async () => {
    try {
      const { data } = await api.get('/alerts/config');
      setConfigs(data);
    } catch (error) {
      console.error('Failed to fetch alert configs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.patch(`/alerts/config/${id}?is_enabled=${!currentStatus}`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to toggle config');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alerts/config', formData);
      setShowForm(false);
      setFormData({
        name: '', category: 'Revenue', metric: '', condition: 'LESS_THAN', threshold: '', severity: 'WARNING', is_enabled: true
      });
      fetchConfigs();
    } catch (error) {
      console.error('Failed to create config');
    }
  };

  const runEvaluation = async () => {
    try {
      await api.post('/alerts/evaluate');
      alert('Alert evaluation triggered manually.');
    } catch (error) {
      console.error('Failed to trigger evaluation');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate flex items-center">
            <Shield className="h-8 w-8 mr-3 text-indigo-600" />
            Alerts Configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage automated business intelligence alerts and thresholds.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={runEvaluation}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
          >
            <Settings className="-ml-1 mr-2 h-5 w-5 text-slate-500" />
            Run Evaluation Engine
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Alert
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg mb-8 border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">Create New Alert Rule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Alert Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. Delivery Risk" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                    <option>Revenue</option><option>Growth</option><option>Orders</option><option>Delivery</option><option>Supply</option><option>Demand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Metric Key</label>
                  <input required type="text" value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. on_time_delivery_rate" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Condition</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                      <option value="LESS_THAN">&lt; Less Than</option>
                      <option value="GREATER_THAN">&gt; Greater Than</option>
                      <option value="EQUALS">= Equals</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Threshold</label>
                    <input required type="number" step="0.01" value={formData.threshold} onChange={e => setFormData({...formData, threshold: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Severity</label>
                  <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                    <option value="INFO">INFO</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alert Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Condition</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">Loading configs...</td></tr>
            ) : configs.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">No alert rules configured.</td></tr>
            ) : (
              configs.map((config) => (
                <tr key={config.id} className={!config.is_enabled ? 'bg-slate-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{config.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{config.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="font-mono bg-slate-100 px-1 rounded">{config.metric}</span> {config.condition === 'LESS_THAN' ? '<' : config.condition === 'GREATER_THAN' ? '>' : '='} {config.threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      config.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      config.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {config.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleToggle(config.id, config.is_enabled)}
                      className={`flex items-center justify-end w-full ${config.is_enabled ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      {config.is_enabled ? (
                        <><span className="mr-2">Enabled</span><ToggleRight className="h-6 w-6" /></>
                      ) : (
                        <><span className="mr-2">Disabled</span><ToggleLeft className="h-6 w-6" /></>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsConfig;
