import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import AllTransactions from './pages/AllTransactions';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import NewAccount from './pages/NewAccount';
import EditAccount from './pages/EditAccount';
import NewTransaction from './pages/NewTransaction';
import EditTransaction from './pages/EditTransaction';
import ImportTransactions from './pages/ImportTransactions';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import CategoryManager from './pages/CategoryManager';
import CategorizationRules from './pages/CategorizationRules';
import SharedAccounts from './pages/SharedAccounts';
import AcceptInvitation from './pages/AcceptInvitation';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/accept-invitation" element={isAuthenticated ? <AcceptInvitation /> : <Navigate to="/login" />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
            <Route index element={<Dashboard />} />
            
            {/* Account routes */}
            <Route path="accounts">
              <Route index element={<Accounts />} />
              <Route path="new" element={<NewAccount />} />
              <Route path=":accountId/edit" element={<EditAccount />} />
              <Route path=":accountId/transactions" element={<Transactions />} />
              <Route path=":accountId/transactions/new" element={<NewTransaction />} />
              <Route path=":accountId/transactions/import" element={<ImportTransactions />} />
              <Route path=":accountId/transactions/:transactionId/edit" element={<EditTransaction />} />
              <Route path="transactions/new" element={<NewTransaction />} />
              <Route path="transactions" element={<AllTransactions />} />
              <Route path="transactions/import" element={<ImportTransactions />} />
            </Route>
            
            {/* Other routes */}
            <Route path="shared-accounts" element={<SharedAccounts />} />
            <Route path="profile" element={<Profile />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="categorization-rules" element={<CategorizationRules />} />
          </Route>
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;