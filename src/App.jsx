import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
} from './contexts/AuthContext';

import Homepage from './pages/Homepage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import SetPassword from './components/auth/SetPassword';

import AdminDashboard from './components/admin/AdminDashboard';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import ClientDashboard from './components/client/ClientDashboard';

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({
  children,
  allowedRole,
}) => {
  const {
    user,
    userRole,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRole &&
    userRole !== allowedRole
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};

/* =========================================================
   APP
========================================================= */

const App = () => {
  return (
    <Router>
      <AuthProvider>

        <Routes>

          {/* ===========================================
              PUBLIC
          ============================================ */}

          <Route
            path="/"
            element={<Homepage />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* ===========================================
              PASSWORD SETUP
              
              This must match the redirect URL
              used by the password setup email.
          ============================================ */}

          <Route
            path="/set-password"
            element={<SetPassword />}
          />

          {/* ===========================================
              ADMIN
          ============================================ */}

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ===========================================
              EMPLOYEE
          ============================================ */}

          <Route
            path="/employee/*"
            element={
              <ProtectedRoute
                allowedRole="employee"
              >
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* ===========================================
              CLIENT
          ============================================ */}

          <Route
            path="/client/*"
            element={
              <ProtectedRoute
                allowedRole="client"
              >
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* ===========================================
              FALLBACK
          ============================================ */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>
    </Router>
  );
};

export default App;