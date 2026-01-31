import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getVendorOrders, getOrderStats } from '../../slices/orderSlice';
import { getVendorProducts } from '../../slices/productSlice';
import {
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const VendorDashboard = () => {
  const dispatch = useDispatch();
  const { orders, stats, isLoading } = useSelector((state) => state.orders);
  const { products } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(getVendorOrders({ limit: 5 }));
    dispatch(getOrderStats());
    dispatch(getVendorProducts({ limit: 5 }));
  }, [dispatch]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Rentals',
      value: stats?.byStatus?.find((s) => s._id === 'active')?.count || 0,
      icon: FiClock,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Products',
      value: products?.length || 0,
      icon: FiPackage,
      color: 'bg-orange-500',
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      active: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-error',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your overview</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary">
          Add New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${order.pricing?.total?.toLocaleString()}
                    </p>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            )}
          </div>
        </div>

        {/* My Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Products</h2>
            <Link to="/vendor/products" className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {products.length > 0 ? (
              products.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      ${product.pricing?.daily}/day • {product.inventory?.availableQuantity} available
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      product.isActive ? 'badge-success' : 'badge-error'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No products yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
