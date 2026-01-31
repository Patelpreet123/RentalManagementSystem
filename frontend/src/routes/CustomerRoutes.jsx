import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import Home from '../pages/customer/Home';
import Products from '../pages/customer/Products';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import MyOrders from '../pages/customer/MyOrders';

// Placeholder components
const OrderDetail = () => <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Order Details</h1></div>;
const Profile = () => <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold">My Profile</h1></div>;

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
};

export default CustomerRoutes;
