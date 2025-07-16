const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'finance.db');
const db = new sqlite3.Database(dbPath);

const init = () => {
  // Create buckets table
  db.run(`
    CREATE TABLE IF NOT EXISTS buckets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('short', 'medium', 'long')),
      target_amount REAL DEFAULT 0,
      current_amount REAL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bucket_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bucket_id) REFERENCES buckets (id)
    )
  `);

  // Create fire_settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS fire_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_age INTEGER NOT NULL,
      target_fire_age INTEGER NOT NULL,
      current_net_worth REAL DEFAULT 0,
      target_net_worth REAL NOT NULL,
      monthly_expenses REAL NOT NULL,
      expected_return_rate REAL DEFAULT 0.07,
      inflation_rate REAL DEFAULT 0.03,
      withdrawal_rate REAL DEFAULT 0.04,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create fire_projections table
  db.run(`
    CREATE TABLE IF NOT EXISTS fire_projections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      projected_net_worth REAL NOT NULL,
      monthly_contribution REAL NOT NULL,
      fire_number REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default buckets if none exist
  db.get("SELECT COUNT(*) as count FROM buckets", (err, row) => {
    if (err) {
      console.error('Error checking buckets:', err);
      return;
    }
    
    if (row.count === 0) {
      const defaultBuckets = [
        { name: 'Groceries', type: 'short', target_amount: 600, description: 'Monthly grocery expenses' },
        { name: 'Utilities', type: 'short', target_amount: 200, description: 'Monthly utility bills' },
        { name: 'Transportation', type: 'short', target_amount: 300, description: 'Gas, maintenance, public transport' },
        { name: 'Travel Fund', type: 'medium', target_amount: 5000, description: 'Vacation and travel expenses' },
        { name: 'Emergency Fund', type: 'medium', target_amount: 10000, description: '6-month emergency fund' },
        { name: 'ETF Investments', type: 'long', target_amount: 100000, description: 'Stock market investments' },
        { name: 'Retirement 401k', type: 'long', target_amount: 500000, description: 'Retirement savings' }
      ];

      defaultBuckets.forEach(bucket => {
        db.run(
          "INSERT INTO buckets (name, type, target_amount, description) VALUES (?, ?, ?, ?)",
          [bucket.name, bucket.type, bucket.target_amount, bucket.description]
        );
      });
    }
  });

  // Insert default FIRE settings if none exist
  db.get("SELECT COUNT(*) as count FROM fire_settings", (err, row) => {
    if (err) {
      console.error('Error checking fire_settings:', err);
      return;
    }
    
    if (row.count === 0) {
      db.run(`
        INSERT INTO fire_settings (
          current_age, target_fire_age, current_net_worth, target_net_worth,
          monthly_expenses, expected_return_rate, inflation_rate, withdrawal_rate
        ) VALUES (30, 50, 50000, 1000000, 4000, 0.07, 0.03, 0.04)
      `);
    }
  });

  console.log('Database initialized successfully');
};

const getDB = () => db;

module.exports = {
  init,
  getDB
};