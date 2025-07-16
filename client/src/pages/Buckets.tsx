import React, { useState, useEffect } from 'react';
import { bucketApi, Bucket, formatCurrency } from '../services/api';

const Buckets: React.FC = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      setLoading(true);
      const response = await bucketApi.getAll();
      setBuckets(response.data);
    } catch (err) {
      setError('Failed to fetch buckets');
      console.error('Buckets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBucket = () => {
    setEditingBucket(null);
    setShowModal(true);
  };

  const handleEditBucket = (bucket: Bucket) => {
    setEditingBucket(bucket);
    setShowModal(true);
  };

  const handleDeleteBucket = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this bucket?')) {
      try {
        await bucketApi.delete(id);
        await fetchBuckets();
      } catch (err) {
        setError('Failed to delete bucket');
        console.error('Delete error:', err);
      }
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

  const groupedBuckets = buckets.reduce((acc, bucket) => {
    if (!acc[bucket.type]) {
      acc[bucket.type] = [];
    }
    acc[bucket.type].push(bucket);
    return acc;
  }, {} as Record<string, Bucket[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Buckets</h1>
        <button
          onClick={handleCreateBucket}
          className="btn-primary"
        >
          + Add Bucket
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Bucket Groups */}
      {Object.entries(groupedBuckets).map(([type, buckets]) => (
        <div key={type} className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {getBucketTypeLabel(type)} Buckets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <div key={bucket.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{bucket.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${getBucketTypeColor(bucket.type)}`}>
                    {getBucketTypeLabel(bucket.type)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{bucket.description}</p>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{formatCurrency(bucket.current_amount)}</span>
                    <span>{formatCurrency(bucket.target_amount)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getBucketTypeColor(bucket.type)}`}
                      style={{ width: `${Math.min((bucket.current_amount / bucket.target_amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((bucket.current_amount / bucket.target_amount) * 100)}% complete
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditBucket(bucket)}
                    className="btn-secondary text-sm px-3 py-1 flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBucket(bucket.id)}
                    className="btn-danger text-sm px-3 py-1 flex-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <BucketModal
          bucket={editingBucket}
          onClose={() => setShowModal(false)}
          onSave={fetchBuckets}
        />
      )}
    </div>
  );
};

interface BucketModalProps {
  bucket: Bucket | null;
  onClose: () => void;
  onSave: () => void;
}

const BucketModal: React.FC<BucketModalProps> = ({ bucket, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: bucket?.name || '',
    type: bucket?.type || 'short' as 'short' | 'medium' | 'long',
    target_amount: bucket?.target_amount || 0,
    description: bucket?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (bucket) {
        await bucketApi.update(bucket.id, formData);
      } else {
        await bucketApi.create(formData);
      }
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {bucket ? 'Edit Bucket' : 'Create Bucket'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'short' | 'medium' | 'long' })}
              className="input-field"
              required
            >
              <option value="short">Short Term</option>
              <option value="medium">Medium Term</option>
              <option value="long">Long Term</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
            <input
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
              className="input-field"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
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

export default Buckets;