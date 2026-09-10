import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Search, Filter } from 'lucide-react';
import api from '../api';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = '/notifications?limit=100';
      if (filter === 'unread') {
        url += '&is_read=false';
      }
      const { data } = await api.get(url);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate flex items-center">
            <Bell className="h-8 w-8 mr-3 text-indigo-600" />
            Notification Center
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
          >
            <Check className="-ml-1 mr-2 h-5 w-5 text-slate-500" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mb-6 p-4 flex flex-col md:flex-row md:items-center justify-between border border-slate-100">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
        </div>
        <div className="mt-4 md:mt-0 relative rounded-md shadow-sm w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
            placeholder="Search notifications..."
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-100">
        <ul className="divide-y divide-slate-200">
          {loading ? (
            <li className="p-8 text-center text-slate-500">Loading notifications...</li>
          ) : notifications.length === 0 ? (
            <li className="p-8 text-center text-slate-500">No notifications found.</li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id} className={!notification.is_read ? 'bg-indigo-50/20' : ''}>
                <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <p className="ml-3 text-sm font-medium text-indigo-600 truncate">
                        {notification.title}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {!notification.is_read && (
                        <button 
                          onClick={() => handleMarkRead(notification.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                        >
                          Mark Read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="ml-2 text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-slate-500">
                        {notification.message}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                      <p>
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default NotificationsPage;
