const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// Get all transactions
router.get('/', (req, res) => {
  const db = getDB();
  const { bucket_id, type, limit = 100, offset = 0 } = req.query;
  
  let query = `
    SELECT 
      t.*,
      b.name as bucket_name,
      b.type as bucket_type
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (bucket_id) {
    query += ' AND t.bucket_id = ?';
    params.push(bucket_id);
  }
  
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  const db = getDB();
  const query = `
    SELECT 
      t.*,
      b.name as bucket_name,
      b.type as bucket_type
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE t.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(row);
  });
});

// Create new transaction
router.post('/', (req, res) => {
  const db = getDB();
  const { bucket_id, type, amount, description, category, date } = req.body;
  
  if (!type || !['income', 'expense', 'transfer'].includes(type)) {
    res.status(400).json({ error: 'Invalid transaction type' });
    return;
  }
  
  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Amount must be positive' });
    return;
  }
  
  const query = `
    INSERT INTO transactions (bucket_id, type, amount, description, category, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const transactionDate = date || new Date().toISOString();
  
  db.run(query, [bucket_id, type, amount, description || '', category || '', transactionDate], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Transaction created successfully' });
  });
});

// Update transaction
router.put('/:id', (req, res) => {
  const db = getDB();
  const { bucket_id, type, amount, description, category, date } = req.body;
  
  if (type && !['income', 'expense', 'transfer'].includes(type)) {
    res.status(400).json({ error: 'Invalid transaction type' });
    return;
  }
  
  if (amount && amount <= 0) {
    res.status(400).json({ error: 'Amount must be positive' });
    return;
  }
  
  const query = `
    UPDATE transactions 
    SET bucket_id = ?, type = ?, amount = ?, description = ?, category = ?, date = ?
    WHERE id = ?
  `;
  
  db.run(query, [bucket_id, type, amount, description, category, date, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction updated successfully' });
  });
});

// Delete transaction
router.delete('/:id', (req, res) => {
  const db = getDB();
  
  db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

// Get transactions by bucket
router.get('/bucket/:bucket_id', (req, res) => {
  const db = getDB();
  const { limit = 50, offset = 0 } = req.query;
  
  const query = `
    SELECT 
      t.*,
      b.name as bucket_name,
      b.type as bucket_type
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE t.bucket_id = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [req.params.bucket_id, parseInt(limit), parseInt(offset)], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get monthly transactions summary
router.get('/monthly/:year/:month', (req, res) => {
  const db = getDB();
  const { year, month } = req.params;
  
  const query = `
    SELECT 
      t.type,
      b.type as bucket_type,
      t.category,
      SUM(t.amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?
    GROUP BY t.type, b.type, t.category
    ORDER BY total_amount DESC
  `;
  
  db.all(query, [year, month.padStart(2, '0')], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get transaction categories
router.get('/categories/list', (req, res) => {
  const db = getDB();
  const query = `
    SELECT DISTINCT category
    FROM transactions
    WHERE category IS NOT NULL AND category != ''
    ORDER BY category
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.category));
  });
});

module.exports = router;