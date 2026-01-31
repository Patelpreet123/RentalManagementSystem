import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyOrders } from '../../slices/orderSlice';
import {
  FiPackage,
  FiCalendar,
  FiMapPin,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
} from 'react-icons/fi';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: FiClock },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: FiCheckCircle },
  'ready-for-pickup': { color: 'bg-purple-100 text-purple-700', icon: FiPackage },
  'picked-up': { color: 'bg-indigo-100 text-indigo-700', icon: FiTruck },
  returned: { color: 'bg-green-100 text-green-700', icon: FiCheckCircle },
  completed: { color: 'bg-green-100 text-green-700', icon: FiCheckCircle },
  cancelled: { color: 'bg-red-100 text-red-700', icon: FiXCircle },
};

const MyOrders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getMyOrders());
  }, [dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">Track and manage your rental orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">
            Start exploring our products and place your first order!
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-gray-900">
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </p>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        {formatDate(order.rentalPeriod?.startDate)} -{' '}
                        {formatDate(order.rentalPeriod?.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiPackage className="w-4 h-4" />
                      <span>
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex items-center gap-2 mt-3">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    ${order.pricing?.total?.toFixed(2) || '0.00'}
                  </p>
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    View Details
                    <FiChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Timeline Progress */}
              {order.status !== 'cancelled' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    {['pending', 'confirmed', 'ready-for-pickup', 'picked-up', 'returned', 'completed'].map(
                      (step, idx, arr) => {
                        const currentIdx = arr.indexOf(order.status);
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                              } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                            />
                            {idx < arr.length - 1 && (
                              <div
                                className={`flex-1 h-0.5 ${
                                  idx < currentIdx ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Order</span>
                    <span className="text-xs text-gray-400">Completed</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
