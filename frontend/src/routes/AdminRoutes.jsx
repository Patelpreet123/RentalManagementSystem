import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import UsersManagement from '../pages/admin/UsersManagement';

// Placeholder components for remaining admin pages
const ProductsManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Products Management</h1></div>;
const OrdersManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Orders Management</h1></div>;
const InvoicesManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Invoices Management</h1></div>;
const Analytics = () => <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1></div>;
const Settings = () => <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1></div>;

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="products" element={<ProductsManagement />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="invoices" element={<InvoicesManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
