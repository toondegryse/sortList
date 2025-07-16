import React, { useState, useEffect } from 'react';
import { fireApi, FireSettings, FireProjection, formatCurrency, formatPercentage } from '../services/api';

const FireTracker: React.FC = () => {
  const [settings, setSettings] = useState<FireSettings | null>(null);
  const [projection, setProjection] = useState<FireProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, projectionResponse] = await Promise.all([
        fireApi.getSettings(),
        fireApi.getProjection()
      ]);
      setSettings(settingsResponse.data);
      setProjection(projectionResponse.data);
    } catch (err) {
      setError('Failed to fetch FIRE data');
      console.error('FIRE error:', err);
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

  if (!settings || !projection) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">FIRE Tracker</h1>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="btn-primary"
        >
          Settings
        </button>
      </div>

      {/* FIRE Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-fire-50 to-fire-100 border-fire-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fire-700">Current Net Worth</p>
              <p className="text-2xl font-bold text-fire-900">
                {formatCurrency(projection.current_net_worth)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">FIRE Number</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(projection.fire_number)}
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Years to FIRE</p>
              <p className="text-2xl font-bold text-blue-900">
                {projection.years_to_fire}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Progress</p>
              <p className="text-2xl font-bold text-purple-900">
                {projection.progress_percentage}%
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">FIRE Progress</h3>
        <div className="progress-bar h-4 mb-2">
          <div 
            className="progress-fill bg-gradient-to-r from-fire-500 to-fire-600 h-4"
            style={{ width: `${Math.min(projection.progress_percentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatCurrency(projection.current_net_worth)}</span>
          <span>{formatCurrency(projection.fire_number)}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Required Monthly Investment</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(projection.required_monthly_contribution)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(settings.monthly_expenses)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Return Rate</span>
              <span className="font-semibold text-gray-900">
                {formatPercentage(settings.expected_return_rate * 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Withdrawal Rate</span>
              <span className="font-semibold text-gray-900">
                {formatPercentage(settings.withdrawal_rate * 100)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Age</span>
              <span className="font-semibold text-gray-900">{settings.current_age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Target FIRE Age</span>
              <span className="font-semibold text-gray-900">{settings.target_fire_age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Years to FIRE</span>
              <span className="font-semibold text-gray-900">{projection.years_to_fire}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated FIRE Date</span>
              <span className="font-semibold text-gray-900">
                {new Date(projection.fire_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wealth Projection</h3>
        <div className="space-y-4">
          {projection.projections.slice(0, 10).map((proj, index) => (
            <div key={proj.year} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{proj.age}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{proj.year}</div>
                  <div className="text-sm text-gray-500">Age {proj.age}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(proj.projected_net_worth)}
                </div>
                <div className="text-sm text-gray-500">
                  {proj.progress_percentage}% to FIRE
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

interface SettingsModalProps {
  settings: FireSettings;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    current_age: settings.current_age,
    target_fire_age: settings.target_fire_age,
    current_net_worth: settings.current_net_worth,
    target_net_worth: settings.target_net_worth,
    monthly_expenses: settings.monthly_expenses,
    expected_return_rate: settings.expected_return_rate,
    inflation_rate: settings.inflation_rate,
    withdrawal_rate: settings.withdrawal_rate
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await fireApi.updateSettings(formData);
      onSave();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">FIRE Settings</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
            <input
              type="number"
              value={formData.current_age}
              onChange={(e) => setFormData({ ...formData, current_age: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="18"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target FIRE Age</label>
            <input
              type="number"
              value={formData.target_fire_age}
              onChange={(e) => setFormData({ ...formData, target_fire_age: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="18"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Net Worth</label>
            <input
              type="number"
              value={formData.current_net_worth}
              onChange={(e) => setFormData({ ...formData, current_net_worth: parseFloat(e.target.value) || 0 })}
              className="input-field"
              min="0"
              step="1000"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
            <input
              type="number"
              value={formData.monthly_expenses}
              onChange={(e) => setFormData({ ...formData, monthly_expenses: parseFloat(e.target.value) || 0 })}
              className="input-field"
              min="0"
              step="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Rate (%)</label>
            <input
              type="number"
              value={formData.expected_return_rate * 100}
              onChange={(e) => setFormData({ ...formData, expected_return_rate: (parseFloat(e.target.value) || 0) / 100 })}
              className="input-field"
              min="0"
              max="50"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Rate (%)</label>
            <input
              type="number"
              value={formData.withdrawal_rate * 100}
              onChange={(e) => setFormData({ ...formData, withdrawal_rate: (parseFloat(e.target.value) || 0) / 100 })}
              className="input-field"
              min="0"
              max="10"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inflation Rate (%)</label>
            <input
              type="number"
              value={formData.inflation_rate * 100}
              onChange={(e) => setFormData({ ...formData, inflation_rate: (parseFloat(e.target.value) || 0) / 100 })}
              className="input-field"
              min="0"
              max="10"
              step="0.1"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FireTracker;