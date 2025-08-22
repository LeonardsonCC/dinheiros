import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useAnalytics } from './hooks/useAnalytics';
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
import api from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track page views
  useAnalytics();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Try to make a simple authenticated request to verify token validity
        await api.get('/api/users/me');
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/accept-invitation" element={isAuthenticated ? <AcceptInvitation /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts">
            <Route index element={<Accounts />} />
            <Route path="new" element={<NewAccount />} />
            <Route path=":accountId/edit" element={<EditAccount />} />
            <Route path=":accountId/transactions" element={<Transactions />} />
            <Route path=":accountId/transactions/new" element={<NewTransaction />} />
            <Route path=":accountId/transactions/import" element={<ImportTransactions />} />
            <Route path="transactions/import" element={<ImportTransactions />} />
            <Route path=":accountId/transactions/:transactionId/edit" element={<EditTransaction />} />
            <Route path="transactions/new" element={<NewTransaction />} />
            <Route path="transactions" element={<AllTransactions />} />
          </Route>
          
          {/* Sharing Routes */}
          <Route path="shared-accounts" element={<SharedAccounts />} />
          
          {/* Profile Route */}
          <Route path="profile" element={<Profile />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="categorization-rules" element={<CategorizationRules />} />
        </Route>
        
        {/* Authenticated routes that need Layout wrapper */}
        <Route path="/accounts" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<Accounts />} />
          <Route path="new" element={<NewAccount />} />
          <Route path=":accountId/edit" element={<EditAccount />} />
          <Route path=":accountId/transactions" element={<Transactions />} />
          <Route path=":accountId/transactions/new" element={<NewTransaction />} />
          <Route path=":accountId/transactions/import" element={<ImportTransactions />} />
          <Route path="transactions/import" element={<ImportTransactions />} />
          <Route path=":accountId/transactions/:transactionId/edit" element={<EditTransaction />} />
          <Route path="transactions/new" element={<NewTransaction />} />
          <Route path="transactions" element={<AllTransactions />} />
        </Route>
        
        <Route path="/shared-accounts" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<SharedAccounts />} />
        </Route>
        
        <Route path="/profile" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<Profile />} />
        </Route>
        
        <Route path="/statistics" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<Statistics />} />
        </Route>
        
        <Route path="/categories" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<CategoryManager />} />
        </Route>
        
        <Route path="/categorization-rules" element={isAuthenticated ? <Layout /> : <Navigate to="/" />}>
          <Route index element={<CategorizationRules />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;