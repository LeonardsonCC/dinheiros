import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import Register from './pages/Register';
import NewAccount from './pages/NewAccount';
import NewTransaction from './pages/NewTransaction';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts">
            <Route index element={<Accounts />} />
            <Route path="new" element={<NewAccount />} />
            <Route path=":accountId/transactions" element={<Transactions />} />
            <Route path=":accountId/transactions/new" element={<NewTransaction />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
