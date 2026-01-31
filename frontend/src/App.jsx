import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getMe } from './slices/authSlice';
import { ProtectedRoute, AdminRoutes, VendorRoutes, CustomerRoutes } from './routes';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is logged in on app load
    const userData = localStorage.getItem('user');
    if (userData) {
      const { token } = JSON.parse(userData);
      if (token) {
        dispatch(getMe());
      }
    }
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    user?.role === 'admin'
                      ? '/admin/dashboard'
                      : user?.role === 'vendor'
                      ? '/vendor/dashboard'
                      : '/'
                  }
                  replace
                />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    user?.role === 'admin'
                      ? '/admin/dashboard'
                      : user?.role === 'vendor'
                      ? '/vendor/dashboard'
                      : '/'
                  }
                  replace
                />
              ) : (
                <Register />
              )
            }
          />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>

          {/* Vendor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
            <Route path="/vendor/*" element={<VendorRoutes />} />
          </Route>

          {/* Customer Routes (accessible to all authenticated users and guests) */}
          <Route path="/*" element={<CustomerRoutes />} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
