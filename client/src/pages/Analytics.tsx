import React, { useState, useEffect } from 'react';
import { analyticsApi, formatCurrency, formatPercentage } from '../services/api';

const Analytics: React.FC = () => {
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [yearlyReport, setYearlyReport] = useState<any>(null);
  const [spendingTrends, setSpendingTrends] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedYear]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [monthlyResponse, yearlyResponse, trendsResponse, categoryResponse] = await Promise.all([
        analyticsApi.getMonthlyReport(selectedYear, selectedMonth),
        analyticsApi.getYearlyReport(selectedYear),
        analyticsApi.getSpendingTrends(12),
        analyticsApi.getCategoryBreakdown(12)
      ]);

      setMonthlyReport(monthlyResponse.data);
      setYearlyReport(yearlyResponse.data);
      setSpendingTrends(trendsResponse.data);
      setCategoryBreakdown(categoryResponse.data);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input-field w-32"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-field w-24"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Monthly Summary */}
      {monthlyReport && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {monthlyReport.month_name} {monthlyReport.year} Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700">Total Income</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(monthlyReport.summary.total_income)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-700">Total Expenses</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(monthlyReport.summary.total_expenses)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700">Net Savings</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(monthlyReport.summary.net_savings)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700">Savings Rate</div>
              <div className="text-2xl font-bold text-purple-900">
                {monthlyReport.summary.savings_rate}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Overview */}
      {yearlyReport && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {yearlyReport.year} Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-700">Total Income</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(yearlyReport.total_income)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-700">Total Expenses</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(yearlyReport.total_expenses)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700">Net Savings</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(yearlyReport.net_savings)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-700">Savings Rate</div>
              <div className="text-2xl font-bold text-purple-900">
                {yearlyReport.savings_rate}%
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Month</th>
                  <th className="text-right p-3">Income</th>
                  <th className="text-right p-3">Expenses</th>
                  <th className="text-right p-3">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {yearlyReport.monthly_data.map((month: any) => (
                  <tr key={month.month}>
                    <td className="p-3 font-medium">{month.month_name}</td>
                    <td className="p-3 text-right text-green-600">
                      {formatCurrency(month.income.short + month.income.medium + month.income.long)}
                    </td>
                    <td className="p-3 text-right text-red-600">
                      {formatCurrency(month.expense.short + month.expense.medium + month.expense.long)}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatCurrency((month.income.short + month.income.medium + month.income.long) - 
                                    (month.expense.short + month.expense.medium + month.expense.long))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spending Trends */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Spending Trends (Last 12 Months)</h2>
        <div className="space-y-4">
          {spendingTrends.slice(0, 6).map((trend, index) => (
            <div key={trend.period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{trend.period}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(trend.period + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    Short: {formatCurrency(trend.bucket_types.short || 0)} • 
                    Medium: {formatCurrency(trend.bucket_types.medium || 0)} • 
                    Long: {formatCurrency(trend.bucket_types.long || 0)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(trend.total)}</div>
                <div className="text-sm text-gray-500">Total Expenses</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Breakdown (Last 12 Months)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryBreakdown.slice(0, 8).map((category, index) => (
            <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{category.category}</h3>
                <span className="text-sm text-gray-500">{category.transactions} transactions</span>
              </div>
              <div className="space-y-1">
                {category.income > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Income</span>
                    <span className="text-green-600">{formatCurrency(category.income)}</span>
                  </div>
                )}
                {category.expense > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Expense</span>
                    <span className="text-red-600">{formatCurrency(category.expense)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                  <span>Net</span>
                  <span className={category.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(category.net)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;