import React, { useState, useEffect } from 'react';
import { analyticsApi, DashboardData, formatCurrency, formatDate } from '../services/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboard();
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="text-red-700 text-center">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const getBucketTypeColor = (type: string) => {
    switch (type) {
      case 'short': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'long': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBucketTypeLabel = (type: string) => {
    switch (type) {
      case 'short': return 'Short Term';
      case 'medium': return 'Medium Term';
      case 'long': return 'Long Term';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(data.summary.total_monthly_income)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(data.summary.total_monthly_expenses)}
              </p>
            </div>
            <div className="text-3xl">💸</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Net Worth</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(data.summary.net_worth)}
              </p>
            </div>
            <div className="text-3xl">🏦</div>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income</h3>
          <div className="space-y-3">
            {data.monthly_income.length > 0 ? (
              data.monthly_income.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getBucketTypeColor(item.bucket_type)}`}></div>
                    <span className="font-medium text-gray-900">{getBucketTypeLabel(item.bucket_type)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">{formatCurrency(item.total_amount)}</div>
                    <div className="text-sm text-gray-500">{item.transaction_count} transactions</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No income recorded this month</div>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses</h3>
          <div className="space-y-3">
            {data.monthly_expenses.length > 0 ? (
              data.monthly_expenses.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getBucketTypeColor(item.bucket_type)}`}></div>
                    <span className="font-medium text-gray-900">{getBucketTypeLabel(item.bucket_type)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-700">{formatCurrency(item.total_amount)}</div>
                    <div className="text-sm text-gray-500">{item.transaction_count} transactions</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No expenses recorded this month</div>
            )}
          </div>
        </div>
      </div>

      {/* Bucket Progress */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bucket Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.bucket_progress.map((bucket) => (
            <div key={bucket.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{bucket.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full text-white ${getBucketTypeColor(bucket.type)}`}>
                  {getBucketTypeLabel(bucket.type)}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatCurrency(bucket.current_amount)}</span>
                  <span>{formatCurrency(bucket.target_amount)}</span>
                </div>
                <div className="progress-bar mt-1">
                  <div 
                    className={`progress-fill ${getBucketTypeColor(bucket.type)}`}
                    style={{ width: `${Math.min(bucket.progress_percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {bucket.progress_percentage}% complete
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {data.recent_transactions.length > 0 ? (
            data.recent_transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? '📈' : '📉'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{transaction.description || 'No description'}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.bucket_name} • {formatDate(transaction.date)}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No recent transactions</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;