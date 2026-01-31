import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getVendorProducts, deleteProduct } from '../../slices/productSlice';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';

const VendorProducts = () => {
  const dispatch = useDispatch();
  const { products, pagination, isLoading } = useSelector((state) => state.products);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(getVendorProducts({ status: statusFilter || undefined }));
  }, [dispatch, statusFilter]);

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 mt-1">Manage your rental products</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary inline-flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="card hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiPackage className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                  <span
                    className={`badge shrink-0 ${
                      product.isActive ? 'badge-success' : 'badge-error'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {product.inventory?.availableQuantity} / {product.inventory?.totalQuantity} available
                  </span>
                  <span className="font-semibold text-blue-600">
                    ${product.pricing?.daily}/day
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/vendor/products/${product._id}`}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/vendor/products/${product._id}/edit`}
                    className="flex-1 btn-outline text-sm flex items-center justify-center gap-1"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first rental product</p>
          <Link to="/vendor/products/new" className="btn-primary inline-flex items-center gap-2">
            <FiPlus className="w-5 h-5" />
            Add Your First Product
          </Link>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
