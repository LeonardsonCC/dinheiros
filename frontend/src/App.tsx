import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
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
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { Suspense } from 'react';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'backdrop-blur-sm',
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              },
              success: {
                style: {
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#065f46',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#991b1b',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
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
                <Route path="accept-invitation" element={<AcceptInvitation />} />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;