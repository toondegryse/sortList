const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// Get FIRE settings
router.get('/settings', (req, res) => {
  const db = getDB();
  const query = 'SELECT * FROM fire_settings ORDER BY id DESC LIMIT 1';
  
  db.get(query, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'FIRE settings not found' });
      return;
    }
    res.json(row);
  });
});

// Update FIRE settings
router.put('/settings', (req, res) => {
  const db = getDB();
  const {
    current_age,
    target_fire_age,
    current_net_worth,
    target_net_worth,
    monthly_expenses,
    expected_return_rate,
    inflation_rate,
    withdrawal_rate
  } = req.body;
  
  const query = `
    UPDATE fire_settings 
    SET 
      current_age = ?,
      target_fire_age = ?,
      current_net_worth = ?,
      target_net_worth = ?,
      monthly_expenses = ?,
      expected_return_rate = ?,
      inflation_rate = ?,
      withdrawal_rate = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM fire_settings ORDER BY id DESC LIMIT 1)
  `;
  
  db.run(query, [
    current_age,
    target_fire_age,
    current_net_worth,
    target_net_worth,
    monthly_expenses,
    expected_return_rate,
    inflation_rate,
    withdrawal_rate
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'FIRE settings not found' });
      return;
    }
    res.json({ message: 'FIRE settings updated successfully' });
  });
});

// Calculate FIRE projection
router.get('/projection', (req, res) => {
  const db = getDB();
  
  // Get current FIRE settings
  db.get('SELECT * FROM fire_settings ORDER BY id DESC LIMIT 1', (err, settings) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!settings) {
      res.status(404).json({ error: 'FIRE settings not found' });
      return;
    }
    
    // Get current long-term investments total
    const investmentQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_investments
      FROM buckets b
      LEFT JOIN transactions t ON b.id = t.bucket_id
      WHERE b.type = 'long'
    `;
    
    db.get(investmentQuery, (err, investmentRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const currentInvestments = investmentRow.current_investments || 0;
      const currentNetWorth = settings.current_net_worth + currentInvestments;
      const fireNumber = settings.monthly_expenses * 12 / settings.withdrawal_rate;
      const monthsToFire = settings.target_fire_age * 12 - settings.current_age * 12;
      
      // Calculate required monthly contribution
      const monthlyReturn = settings.expected_return_rate / 12;
      const futureValue = fireNumber;
      const presentValue = currentNetWorth;
      
      let requiredMonthlyContribution = 0;
      if (monthsToFire > 0 && monthlyReturn > 0) {
        // PMT calculation for annuity
        const denominator = (Math.pow(1 + monthlyReturn, monthsToFire) - 1) / monthlyReturn;
        const futureValueOfPresentAmount = presentValue * Math.pow(1 + monthlyReturn, monthsToFire);
        requiredMonthlyContribution = (futureValue - futureValueOfPresentAmount) / denominator;
      }
      
      // Calculate year-by-year projection
      const projections = [];
      let currentAmount = currentNetWorth;
      const startYear = new Date().getFullYear();
      
      for (let year = startYear; year <= startYear + (monthsToFire / 12); year++) {
        const yearlyContribution = requiredMonthlyContribution * 12;
        currentAmount = currentAmount * (1 + settings.expected_return_rate) + yearlyContribution;
        
        projections.push({
          year,
          age: settings.current_age + (year - startYear),
          projected_net_worth: Math.round(currentAmount),
          annual_contribution: Math.round(yearlyContribution),
          fire_number: Math.round(fireNumber),
          progress_percentage: Math.round((currentAmount / fireNumber) * 100)
        });
      }
      
      const result = {
        current_net_worth: Math.round(currentNetWorth),
        fire_number: Math.round(fireNumber),
        required_monthly_contribution: Math.round(requiredMonthlyContribution),
        months_to_fire: monthsToFire,
        years_to_fire: Math.round(monthsToFire / 12 * 10) / 10,
        fire_date: new Date(Date.now() + monthsToFire * 30.44 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress_percentage: Math.round((currentNetWorth / fireNumber) * 100),
        projections: projections
      };
      
      res.json(result);
    });
  });
});

// Get FIRE progress over time
router.get('/progress', (req, res) => {
  const db = getDB();
  
  // Get monthly net worth progression from long-term buckets
  const query = `
    SELECT 
      strftime('%Y', t.date) as year,
      strftime('%m', t.date) as month,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_contribution,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN buckets b ON t.bucket_id = b.id
    WHERE b.type = 'long'
    GROUP BY strftime('%Y-%m', t.date)
    ORDER BY year, month
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Calculate cumulative progression
    let cumulativeAmount = 0;
    const progression = rows.map(row => {
      cumulativeAmount += row.net_contribution;
      return {
        year: parseInt(row.year),
        month: parseInt(row.month),
        monthly_contribution: Math.round(row.net_contribution),
        cumulative_amount: Math.round(cumulativeAmount),
        transaction_count: row.transaction_count
      };
    });
    
    res.json(progression);
  });
});

// Calculate if FIRE is achievable
router.get('/feasibility', (req, res) => {
  const db = getDB();
  
  // Get current settings and income/expense data
  db.get('SELECT * FROM fire_settings ORDER BY id DESC LIMIT 1', (err, settings) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Get average monthly income and expenses from short-term buckets
    const incomeExpenseQuery = `
      SELECT 
        AVG(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as avg_income,
        AVG(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as avg_expense
      FROM transactions t
      LEFT JOIN buckets b ON t.bucket_id = b.id
      WHERE b.type = 'short' AND t.date >= date('now', '-12 months')
    `;
    
    db.get(incomeExpenseQuery, (err, incomeData) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const monthlyIncome = incomeData.avg_income || 0;
      const monthlyExpenses = incomeData.avg_expense || settings.monthly_expenses;
      const monthlySurplus = monthlyIncome - monthlyExpenses;
      
      const fireNumber = settings.monthly_expenses * 12 / settings.withdrawal_rate;
      const monthsToFire = settings.target_fire_age * 12 - settings.current_age * 12;
      
      // Calculate required vs available contribution
      const monthlyReturn = settings.expected_return_rate / 12;
      const futureValue = fireNumber;
      const presentValue = settings.current_net_worth;
      
      let requiredMonthlyContribution = 0;
      if (monthsToFire > 0 && monthlyReturn > 0) {
        const denominator = (Math.pow(1 + monthlyReturn, monthsToFire) - 1) / monthlyReturn;
        const futureValueOfPresentAmount = presentValue * Math.pow(1 + monthlyReturn, monthsToFire);
        requiredMonthlyContribution = (futureValue - futureValueOfPresentAmount) / denominator;
      }
      
      const isFeasible = monthlySurplus >= requiredMonthlyContribution;
      const shortfall = requiredMonthlyContribution - monthlySurplus;
      
      res.json({
        is_feasible: isFeasible,
        monthly_income: Math.round(monthlyIncome),
        monthly_expenses: Math.round(monthlyExpenses),
        monthly_surplus: Math.round(monthlySurplus),
        required_monthly_contribution: Math.round(requiredMonthlyContribution),
        monthly_shortfall: Math.round(shortfall),
        fire_number: Math.round(fireNumber),
        years_to_fire: Math.round(monthsToFire / 12 * 10) / 10,
        recommendations: isFeasible ? 
          ['You are on track to achieve FIRE!', 'Continue your current savings rate.'] :
          [
            `Increase monthly savings by $${Math.round(shortfall)}`,
            'Consider reducing monthly expenses',
            'Look for additional income sources',
            'Optimize investment returns'
          ]
      });
    });
  });
});

module.exports = router;