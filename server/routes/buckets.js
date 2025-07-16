const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// Get all buckets
router.get('/', (req, res) => {
  const db = getDB();
  const query = `
    SELECT 
      b.*,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_amount
    FROM buckets b
    LEFT JOIN transactions t ON b.id = t.bucket_id
    GROUP BY b.id
    ORDER BY 
      CASE b.type 
        WHEN 'short' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'long' THEN 3 
      END,
      b.name
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get bucket by ID
router.get('/:id', (req, res) => {
  const db = getDB();
  const query = `
    SELECT 
      b.*,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_amount
    FROM buckets b
    LEFT JOIN transactions t ON b.id = t.bucket_id
    WHERE b.id = ?
    GROUP BY b.id
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Bucket not found' });
      return;
    }
    res.json(row);
  });
});

// Create new bucket
router.post('/', (req, res) => {
  const db = getDB();
  const { name, type, target_amount, description } = req.body;
  
  if (!name || !type || !['short', 'medium', 'long'].includes(type)) {
    res.status(400).json({ error: 'Invalid bucket data' });
    return;
  }
  
  const query = `
    INSERT INTO buckets (name, type, target_amount, description)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(query, [name, type, target_amount || 0, description || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Bucket created successfully' });
  });
});

// Update bucket
router.put('/:id', (req, res) => {
  const db = getDB();
  const { name, type, target_amount, description } = req.body;
  
  if (type && !['short', 'medium', 'long'].includes(type)) {
    res.status(400).json({ error: 'Invalid bucket type' });
    return;
  }
  
  const query = `
    UPDATE buckets 
    SET name = ?, type = ?, target_amount = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [name, type, target_amount, description, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Bucket not found' });
      return;
    }
    res.json({ message: 'Bucket updated successfully' });
  });
});

// Delete bucket
router.delete('/:id', (req, res) => {
  const db = getDB();
  
  // First delete all transactions associated with this bucket
  db.run('DELETE FROM transactions WHERE bucket_id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Then delete the bucket
    db.run('DELETE FROM buckets WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Bucket not found' });
        return;
      }
      res.json({ message: 'Bucket deleted successfully' });
    });
  });
});

// Get buckets by type
router.get('/type/:type', (req, res) => {
  const db = getDB();
  const { type } = req.params;
  
  if (!['short', 'medium', 'long'].includes(type)) {
    res.status(400).json({ error: 'Invalid bucket type' });
    return;
  }
  
  const query = `
    SELECT 
      b.*,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_amount
    FROM buckets b
    LEFT JOIN transactions t ON b.id = t.bucket_id
    WHERE b.type = ?
    GROUP BY b.id
    ORDER BY b.name
  `;
  
  db.all(query, [type], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;