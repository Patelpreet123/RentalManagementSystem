import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrders, getOrderStats } from '../../slices/orderSlice';
import {
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { orders, stats, isLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getAllOrders({ limit: 5 }));
    dispatch(getOrderStats());
  }, [dispatch]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: FiDollarSign,
      color: 'bg-green-500',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'bg-blue-500',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Active Rentals',
      value: stats?.byStatus?.find((s) => s._id === 'active')?.count || 0,
      icon: FiPackage,
      color: 'bg-purple-500',
      trend: '+5.3%',
      trendUp: true,
    },
    {
      title: 'Total Users',
      value: '1,234',
      icon: FiUsers,
      color: 'bg-orange-500',
      trend: '+15.8%',
      trendUp: true,
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      'picked-up': 'badge-info',
      active: 'badge-success',
      returned: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your rental platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trendUp ? (
                    <FiTrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <FiTrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-sm text-gray-400">vs last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <div className="space-y-4">
            {stats?.byStatus?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(item._id)}`}>
                    {item._id}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{item.count} orders</p>
                  <p className="text-sm text-gray-500">
                    ${item.totalRevenue?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
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
      </div>
    </div>
  );
};

export default AdminDashboard;
