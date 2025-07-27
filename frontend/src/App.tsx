import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import AllTransactions from './pages/AllTransactions';
import Login from './pages/Login';
import Register from './pages/Register';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/accept-invitation" element={isAuthenticated ? <AcceptInvitation /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
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
      </Routes>
    </div>
  );
}

export default App;
