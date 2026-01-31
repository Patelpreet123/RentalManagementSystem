import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import Home from '../pages/customer/Home';
import Products from '../pages/customer/Products';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import MyOrders from '../pages/customer/MyOrders';
import CustomerDashboard from '../pages/customer/Dashboard';
import Invoices from '../pages/customer/Invoices';
import Favorites from '../pages/customer/Favorites';

// Placeholder components
const OrderDetail = () => <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-lg p-6"><h1 className="text-xl font-semibold text-gray-900">Order Details</h1><p className="text-sm text-gray-500 mt-1">Order information will be displayed here</p></div></div>;
const Profile = () => <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-lg p-6"><h1 className="text-xl font-semibold text-gray-900">My Profile</h1><p className="text-sm text-gray-500 mt-1">Profile settings will be displayed here</p></div></div>;
const Settings = () => <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-lg p-6"><h1 className="text-xl font-semibold text-gray-900">Settings</h1><p className="text-sm text-gray-500 mt-1">Account settings will be displayed here</p></div></div>;

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
};

export default CustomerRoutes;
