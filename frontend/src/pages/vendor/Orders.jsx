import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getVendorOrders, updateOrderStatus } from '../../slices/orderSlice';
import { toast } from 'react-toastify';
import {
  FiPackage,
  FiCalendar,
  FiUser,
  FiPhone,
  FiMapPin,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiCheck,
  FiX,
  FiClock,
  FiTruck,
} from 'react-icons/fi';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending', icon: FiClock },
  confirmed: { color: 'bg-blue-100 text-blue-700', label: 'Confirmed', icon: FiCheck },
  'ready-for-pickup': { color: 'bg-purple-100 text-purple-700', label: 'Ready for Pickup', icon: FiPackage },
  'picked-up': { color: 'bg-indigo-100 text-indigo-700', label: 'Picked Up', icon: FiTruck },
  returned: { color: 'bg-green-100 text-green-700', label: 'Returned', icon: FiCheck },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed', icon: FiCheck },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled', icon: FiX },
};

const VendorOrders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.orders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(getVendorOrders());
  }, [dispatch]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order._id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      toast.success('Order status updated');
      setSelectedOrder(null);
    } catch (error) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'confirmed',
      confirmed: 'ready-for-pickup',
      'ready-for-pickup': 'picked-up',
      'picked-up': 'returned',
      returned: 'completed',
    };
    return flow[currentStatus];
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage your rental orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Order
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Items
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Rental Period
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">
                        #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">
                        {order.customer?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer?.email}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 bg-gray-100 rounded border-2 border-white overflow-hidden"
                            >
                              {item.product?.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FiPackage className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">
                        {formatDate(order.rentalPeriod?.startDate)}
                      </p>
                      <p className="text-sm text-gray-500">
                        to {formatDate(order.rentalPeriod?.endDate)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-gray-900">
                        ${order.pricing?.total?.toFixed(2) || '0.00'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {(() => {
                        const config = statusConfig[order.status] || statusConfig.pending;
                        const Icon = config.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSelectedOrder(selectedOrder === order._id ? null : order._id)
                          }
                          className="btn-secondary text-sm py-1.5 flex items-center gap-1"
                        >
                          Actions
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        {selectedOrder === order._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() =>
                                window.open(`/orders/${order._id}`, '_blank')
                              }
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              View Details
                            </button>
                            {getNextStatus(order.status) && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(order._id, getNextStatus(order.status))
                                }
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                              >
                                Mark as {statusConfig[getNextStatus(order.status)]?.label}
                              </button>
                            )}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {search || statusFilter
              ? 'Try adjusting your filters'
              : 'Orders will appear here when customers place them'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
