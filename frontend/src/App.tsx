import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/accept-invitation" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        
        {/* Account Routes */}
        <Route path="accounts">
          <Route index element={<Accounts />} />
          <Route path="new" element={<NewAccount />} />
          <Route path=":accountId/edit" element={<EditAccount />} />
          <Route path=":accountId/transactions" element={<Transactions />} />
          <Route path=":accountId/transactions/new" element={<NewTransaction />} />
          <Route path=":accountId/transactions/import" element={<ImportTransactions />} />
          <Route path=":accountId/transactions/:transactionId/edit" element={<EditTransaction />} />
        </Route>
        
        {/* Transaction Routes */}
        <Route path="transactions">
          <Route index element={<AllTransactions />} />
          <Route path="new" element={<NewTransaction />} />
          <Route path="import" element={<ImportTransactions />} />
        </Route>
        
        {/* Other Routes */}
        <Route path="shared-accounts" element={<SharedAccounts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="categorization-rules" element={<CategorizationRules />} />
      </Route>
      
      {/* Legacy Routes for Compatibility */}
      <Route path="/accounts" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
      
      <Route path="/shared-accounts" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<SharedAccounts />} />
      </Route>
      
      <Route path="/profile" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Profile />} />
      </Route>
      
      <Route path="/statistics" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Statistics />} />
      </Route>
      
      <Route path="/categories" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<CategoryManager />} />
      </Route>
      
      <Route path="/categorization-rules" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<CategorizationRules />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'dark:bg-gray-800 dark:text-white',
          }}
        />
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}

export default App;