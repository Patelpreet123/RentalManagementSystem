import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems,
  selectCartTotal,
  selectCartItemsCount,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../../slices/cartSlice';
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiPackage,
  FiArrowRight,
  FiCalendar,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemsCount);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success('Cart cleared');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please login to proceed to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our products and find something to rent!</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          Browse Products
          <FiArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">
            {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
        >
          <FiTrash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.product._id} className="card flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiPackage className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/products/${item.product._id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{item.product.category}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <FiCalendar className="w-4 h-4" />
                  <span>
                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>{item.days} day{item.days > 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      ${item.product.pricing?.daily}/day × {item.days} days
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ${item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 pb-4 border-b border-gray-200">
              {cartItems.map((item) => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-gray-500 line-clamp-1 flex-1">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="text-gray-900 font-medium ml-2">
                    ${item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Service Fee</span>
                <span className="text-gray-900">${(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Security Deposit</span>
                <span className="text-gray-900">Calculated at checkout</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${(cartTotal * 1.1).toFixed(2)}
                </span>
              </div>
              <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-center gap-2">
                Proceed to Checkout
                <FiArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/products"
                className="btn-secondary w-full mt-3 flex items-center justify-center"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Security deposit will be refunded after successful return of items
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
