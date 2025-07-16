# 🔥 FIRE Finance Tracker

A comprehensive personal finance tracking application designed to help you achieve **Financial Independence, Retire Early (FIRE)**. Track your expenses across three time horizons: short-term monthly expenses, medium-term savings goals, and long-term investments.

## ✨ Features

### 📊 Three-Facet Financial Tracking
- **Short-term Buckets**: Monthly expenses like groceries, utilities, transportation
- **Medium-term Buckets**: Savings goals for travel, education, emergency funds
- **Long-term Buckets**: Investment tracking for ETFs, 401k, retirement accounts

### 🎯 FIRE Calculation & Projection
- Calculate your FIRE number based on monthly expenses and withdrawal rate
- Project timeline to reach financial independence
- Track progress with visual indicators
- Adjustable parameters (return rates, inflation, withdrawal rates)

### 📈 Analytics & Reporting
- Monthly and yearly financial reports
- Spending trends analysis
- Category-wise expense breakdown
- Savings rate tracking
- Net worth progression

### 💰 Transaction Management
- Add, edit, and delete income/expense transactions
- Categorize transactions for better tracking
- Link transactions to specific buckets
- Date-based transaction history

## 🛠️ Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Recharts for data visualization
- Axios for API communication

**Backend:**
- Node.js with Express
- SQLite database
- RESTful API architecture
- CORS enabled

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fire-finance-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Manual Setup

If you prefer to set up the servers manually:

1. **Backend setup:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Frontend setup (in a new terminal):**
   ```bash
   cd client
   npm install
   npm start
   ```

## 📱 Usage

### 1. Dashboard
- View your financial overview
- See monthly income/expense breakdown
- Track bucket progress
- Monitor recent transactions

### 2. Buckets Management
- Create buckets for different financial goals
- Set target amounts for each bucket
- Track progress towards goals
- Organize by short, medium, and long-term categories

### 3. Transaction Tracking
- Add income and expense transactions
- Categorize transactions
- Link to specific buckets
- Edit or delete existing transactions

### 4. FIRE Tracker
- Set your FIRE goals and parameters
- View projected timeline to financial independence
- Monitor progress with visual indicators
- Adjust assumptions and see updated projections

### 5. Analytics
- Generate monthly and yearly reports
- Analyze spending trends
- View category breakdowns
- Track savings rate over time

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- **buckets**: Store financial buckets (short/medium/long-term)
- **transactions**: Track income and expense transactions
- **fire_settings**: Store FIRE calculation parameters
- **fire_projections**: Historical projection data

## 🔧 Configuration

### FIRE Settings
You can customize various parameters:
- Current age and target FIRE age
- Current net worth
- Monthly expenses
- Expected investment return rate (default: 7%)
- Inflation rate (default: 3%)
- Withdrawal rate (default: 4%)

### Default Buckets
The application comes with pre-configured buckets:
- **Short-term**: Groceries, Utilities, Transportation
- **Medium-term**: Travel Fund, Emergency Fund
- **Long-term**: ETF Investments, Retirement 401k

## 🎨 Customization

### Styling
The application uses Tailwind CSS with custom color schemes:
- FIRE theme colors (orange gradients)
- Wealth theme colors (green gradients)
- Responsive design for mobile and desktop

### Adding New Features
The modular architecture makes it easy to add new features:
- Add new API endpoints in `server/routes/`
- Create new React components in `client/src/components/`
- Extend the database schema in `server/database.js`

## 📊 API Endpoints

### Buckets
- `GET /api/buckets` - Get all buckets
- `POST /api/buckets` - Create a new bucket
- `PUT /api/buckets/:id` - Update bucket
- `DELETE /api/buckets/:id` - Delete bucket

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### FIRE Tracking
- `GET /api/fire/settings` - Get FIRE settings
- `PUT /api/fire/settings` - Update FIRE settings
- `GET /api/fire/projection` - Get FIRE projection
- `GET /api/fire/progress` - Get progress data

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/monthly/:year/:month` - Get monthly report
- `GET /api/analytics/yearly/:year` - Get yearly report

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚨 Disclaimer

This application is for educational and personal use only. It should not be considered as financial advice. Always consult with a qualified financial advisor before making investment decisions.

## 🎯 Roadmap

- [ ] Import/Export functionality for data backup
- [ ] Mobile app version
- [ ] Integration with banking APIs
- [ ] Advanced investment tracking
- [ ] Goal-based savings recommendations
- [ ] Multi-currency support
- [ ] Data visualization improvements

## 🏆 Acknowledgments

- Inspired by the FIRE movement and financial independence community
- Built with modern web technologies for optimal performance
- Designed with user experience and accessibility in mind
