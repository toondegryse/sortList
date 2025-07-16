import React, { useState, useEffect } from 'react';
import { transactionApi, bucketApi, Transaction, Bucket, formatCurrency, formatDate } from '../services/api';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    Promise.all([fetchTransactions(), fetchBuckets()]);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionApi.getAll();
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Transactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuckets = async () => {
    try {
      const response = await bucketApi.getAll();
      setBuckets(response.data);
    } catch (err) {
      console.error('Buckets error:', err);
    }
  };

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setShowModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionApi.delete(id);
        await fetchTransactions();
      } catch (err) {
        setError('Failed to delete transaction');
        console.error('Delete error:', err);
      }
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={handleCreateTransaction}
          className="btn-primary"
        >
          + Add Transaction
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Transactions List */}
      <div className="card">
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? '📈' : '📉'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.description || 'No description'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.bucket_name} • {transaction.category} • {formatDate(transaction.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="btn-danger text-sm px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-12">
              No transactions found. Create your first transaction to get started!
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          buckets={buckets}
          onClose={() => setShowModal(false)}
          onSave={fetchTransactions}
        />
      )}
    </div>
  );
};

interface TransactionModalProps {
  transaction: Transaction | null;
  buckets: Bucket[];
  onClose: () => void;
  onSave: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, buckets, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    bucket_id: transaction?.bucket_id || (buckets[0]?.id || 0),
    type: transaction?.type || 'expense' as 'income' | 'expense',
    amount: transaction?.amount || 0,
    description: transaction?.description || '',
    category: transaction?.category || '',
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (transaction) {
        await transactionApi.update(transaction.id, formData);
      } else {
        await transactionApi.create(formData);
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
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bucket</label>
            <select
              value={formData.bucket_id}
              onChange={(e) => setFormData({ ...formData, bucket_id: parseInt(e.target.value) })}
              className="input-field"
              required
            >
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.name} ({bucket.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
              className="input-field"
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="input-field"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Transaction description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
              placeholder="e.g., Food, Transport, Investment"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
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

export default Transactions;