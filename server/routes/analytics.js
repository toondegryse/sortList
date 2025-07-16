const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// Get dashboard overview
router.get('/dashboard', (req, res) => {
  const db = getDB();
  
  // Get current month data
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const queries = {
    // Monthly expenses by bucket type
    monthlyExpenses: `
      SELECT 
        b.type as bucket_type,
        SUM(t.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions t
      LEFT JOIN buckets b ON t.bucket_id = b.id
      WHERE t.type = 'expense' 
        AND strftime('%Y', t.date) = ? 
        AND strftime('%m', t.date) = ?
      GROUP BY b.type
    `,
    
    // Monthly income by bucket type
    monthlyIncome: `
      SELECT 
        b.type as bucket_type,
        SUM(t.amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions t
      LEFT JOIN buckets b ON t.bucket_id = b.id
      WHERE t.type = 'income' 
        AND strftime('%Y', t.date) = ? 
        AND strftime('%m', t.date) = ?
      GROUP BY b.type
    `,
    
    // Bucket progress
    bucketProgress: `
      SELECT 
        b.id,
        b.name,
        b.type,
        b.target_amount,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_amount
      FROM buckets b
      LEFT JOIN transactions t ON b.id = t.bucket_id
      GROUP BY b.id, b.name, b.type, b.target_amount
    `,
    
    // Recent transactions
    recentTransactions: `
      SELECT 
        t.*,
        b.name as bucket_name,
        b.type as bucket_type
      FROM transactions t
      LEFT JOIN buckets b ON t.bucket_id = b.id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `
  };
  
  const results = {};
  let completedQueries = 0;
  const totalQueries = Object.keys(queries).length;
  
  // Execute all queries
  Object.keys(queries).forEach(key => {
    const query = queries[key];
    const params = key.includes('monthly') ? [currentYear.toString(), currentMonth.toString().padStart(2, '0')] : [];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        results[key] = [];
      } else {
        results[key] = rows;
      }
      
      completedQueries++;
      if (completedQueries === totalQueries) {
        // Process results
        const dashboard = {
          current_month: currentMonth,
          current_year: currentYear,
          monthly_expenses: results.monthlyExpenses,
          monthly_income: results.monthlyIncome,
          bucket_progress: results.bucketProgress.map(bucket => ({
            ...bucket,
            progress_percentage: bucket.target_amount > 0 ? 
              Math.round((bucket.current_amount / bucket.target_amount) * 100) : 0
          })),
          recent_transactions: results.recentTransactions,
          summary: {
            total_monthly_expenses: results.monthlyExpenses.reduce((sum, item) => sum + item.total_amount, 0),
            total_monthly_income: results.monthlyIncome.reduce((sum, item) => sum + item.total_amount, 0),
            net_worth: results.bucketProgress
              .filter(bucket => bucket.type === 'long')
              .reduce((sum, bucket) => sum + bucket.current_amount, 0)
          }
        };
        
        res.json(dashboard);
      }
    });
  });
});

// Get monthly report
router.get('/monthly/:year/:month', (req, res) => {
  const db = getDB();
  const { year, month } = req.params;
  
  const query = `
    SELECT 
      t.type,
      t.category,
      b.name as bucket_name,
      b.type as bucket_type,
      SUM(t.amount) as total_amount,
      COUNT(*) as transaction_count,
      AVG(t.amount) as avg_amount,
      MIN(t.amount) as min_amount,
      MAX(t.amount) as max_amount
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?
    GROUP BY t.type, t.category, b.name, b.type
    ORDER BY total_amount DESC
  `;
  
  db.all(query, [year, month.padStart(2, '0')], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Group by type and bucket type
    const grouped = {
      income: { short: [], medium: [], long: [] },
      expense: { short: [], medium: [], long: [] }
    };
    
    const totals = {
      income: { short: 0, medium: 0, long: 0 },
      expense: { short: 0, medium: 0, long: 0 }
    };
    
    rows.forEach(row => {
      const type = row.type;
      const bucketType = row.bucket_type || 'short';
      
      grouped[type][bucketType].push(row);
      totals[type][bucketType] += row.total_amount;
    });
    
    const report = {
      year: parseInt(year),
      month: parseInt(month),
      month_name: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      data: grouped,
      totals: totals,
      summary: {
        total_income: totals.income.short + totals.income.medium + totals.income.long,
        total_expenses: totals.expense.short + totals.expense.medium + totals.expense.long,
        net_savings: (totals.income.short + totals.income.medium + totals.income.long) - 
                    (totals.expense.short + totals.expense.medium + totals.expense.long),
        savings_rate: 0
      }
    };
    
    if (report.summary.total_income > 0) {
      report.summary.savings_rate = Math.round((report.summary.net_savings / report.summary.total_income) * 100);
    }
    
    res.json(report);
  });
});

// Get yearly summary
router.get('/yearly/:year', (req, res) => {
  const db = getDB();
  const { year } = req.params;
  
  const query = `
    SELECT 
      strftime('%m', t.date) as month,
      t.type,
      b.type as bucket_type,
      SUM(t.amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE strftime('%Y', t.date) = ?
    GROUP BY strftime('%m', t.date), t.type, b.type
    ORDER BY month
  `;
  
  db.all(query, [year], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Initialize monthly data
    const monthlyData = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        month_name: new Date(year, i - 1).toLocaleString('default', { month: 'long' }),
        income: { short: 0, medium: 0, long: 0 },
        expense: { short: 0, medium: 0, long: 0 }
      };
    }
    
    // Fill in data
    rows.forEach(row => {
      const month = parseInt(row.month);
      const type = row.type;
      const bucketType = row.bucket_type || 'short';
      
      monthlyData[month][type][bucketType] = row.total_amount;
    });
    
    // Calculate totals and trends
    const months = Object.values(monthlyData);
    const yearlyTotals = {
      income: { short: 0, medium: 0, long: 0 },
      expense: { short: 0, medium: 0, long: 0 }
    };
    
    months.forEach(month => {
      Object.keys(yearlyTotals).forEach(type => {
        Object.keys(yearlyTotals[type]).forEach(bucketType => {
          yearlyTotals[type][bucketType] += month[type][bucketType];
        });
      });
    });
    
    const summary = {
      year: parseInt(year),
      monthly_data: months,
      yearly_totals: yearlyTotals,
      total_income: yearlyTotals.income.short + yearlyTotals.income.medium + yearlyTotals.income.long,
      total_expenses: yearlyTotals.expense.short + yearlyTotals.expense.medium + yearlyTotals.expense.long,
      net_savings: (yearlyTotals.income.short + yearlyTotals.income.medium + yearlyTotals.income.long) - 
                  (yearlyTotals.expense.short + yearlyTotals.expense.medium + yearlyTotals.expense.long),
      average_monthly_income: 0,
      average_monthly_expenses: 0,
      savings_rate: 0
    };
    
    if (summary.total_income > 0) {
      summary.average_monthly_income = Math.round(summary.total_income / 12);
      summary.average_monthly_expenses = Math.round(summary.total_expenses / 12);
      summary.savings_rate = Math.round((summary.net_savings / summary.total_income) * 100);
    }
    
    res.json(summary);
  });
});

// Get spending trends
router.get('/trends/spending', (req, res) => {
  const db = getDB();
  const { months = 12 } = req.query;
  
  const query = `
    SELECT 
      strftime('%Y-%m', t.date) as period,
      t.category,
      b.type as bucket_type,
      SUM(t.amount) as total_amount,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE t.type = 'expense' 
      AND t.date >= date('now', '-${parseInt(months)} months')
    GROUP BY strftime('%Y-%m', t.date), t.category, b.type
    ORDER BY period DESC, total_amount DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Group by period
    const trends = {};
    rows.forEach(row => {
      if (!trends[row.period]) {
        trends[row.period] = {
          period: row.period,
          categories: {},
          bucket_types: { short: 0, medium: 0, long: 0 },
          total: 0
        };
      }
      
      if (!trends[row.period].categories[row.category]) {
        trends[row.period].categories[row.category] = 0;
      }
      
      trends[row.period].categories[row.category] += row.total_amount;
      trends[row.period].bucket_types[row.bucket_type] += row.total_amount;
      trends[row.period].total += row.total_amount;
    });
    
    res.json(Object.values(trends));
  });
});

// Get category breakdown
router.get('/categories/breakdown', (req, res) => {
  const db = getDB();
  const { months = 12 } = req.query;
  
  const query = `
    SELECT 
      t.category,
      t.type,
      SUM(t.amount) as total_amount,
      COUNT(*) as transaction_count,
      AVG(t.amount) as avg_amount
    FROM transactions t
    WHERE t.date >= date('now', '-${parseInt(months)} months')
      AND t.category IS NOT NULL 
      AND t.category != ''
    GROUP BY t.category, t.type
    ORDER BY total_amount DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const categories = {};
    rows.forEach(row => {
      if (!categories[row.category]) {
        categories[row.category] = {
          category: row.category,
          income: 0,
          expense: 0,
          net: 0,
          transactions: 0
        };
      }
      
      categories[row.category][row.type] = row.total_amount;
      categories[row.category].transactions += row.transaction_count;
    });
    
    // Calculate net for each category
    Object.values(categories).forEach(category => {
      category.net = category.income - category.expense;
    });
    
    res.json(Object.values(categories));
  });
});

module.exports = router;