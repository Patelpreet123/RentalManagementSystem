import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { selectCartItemsCount } from '../slices/cartSlice';
import {
  FiHome,
  FiGrid,
  FiShoppingCart,
  FiPackage,
  FiFileText,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiHeart,
  FiHelpCircle,
  FiSearch,
} from 'react-icons/fi';

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const cartItemsCount = useSelector(selectCartItemsCount);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { path: '/customer/dashboard', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/customer/products', icon: FiGrid, label: 'Browse Products' },
    { path: '/customer/cart', icon: FiShoppingCart, label: 'Cart', badge: cartItemsCount },
    { path: '/customer/orders', icon: FiPackage, label: 'My Orders' },
    { path: '/customer/invoices', icon: FiFileText, label: 'Invoices' },
  ];

  const secondaryItems = [
    { path: '/customer/profile', icon: FiUser, label: 'My Profile' },
    { path: '/customer/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-white border-r border-gray-200`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">RentalHub</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Main Menu Label */}
            <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Main Menu
            </p>
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`
                      flex items-center justify-center text-xs font-medium rounded-full ml-auto px-2 py-0.5
                      ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-gray-200" />

            {/* Secondary Menu Label */}
            <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Account
            </p>

            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full mt-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Menu toggle & Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiMenu className="w-5 h-5" />
              </button>

              {/* Search Bar */}
              <div className="hidden md:block relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-64 h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg 
                    placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Cart - Mobile Quick Access */}
              <NavLink
                to="/customer/cart"
                className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <FiShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gray-900 rounded-full">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </NavLink>

              {/* Favorites */}
              <NavLink
                to="/customer/favorites"
                className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <FiHeart className="w-5 h-5" />
              </NavLink>

              {/* Help */}
              <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <FiHelpCircle className="w-5 h-5" />
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-2" />

              {/* User Quick Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <FiChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/customer/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiUser className="w-4 h-4 text-gray-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/customer/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiPackage className="w-4 h-4 text-gray-400" />
                        My Orders
                      </Link>
                      <Link
                        to="/customer/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FiSettings className="w-4 h-4 text-gray-400" />
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg 
                  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-white border-t border-gray-200">
          <div className="px-4 lg:px-6 h-12 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} RentalHub. All rights reserved.
            </p>
            <nav className="hidden sm:flex items-center gap-4">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Help Center
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Terms
              </a>
            </nav>
          </div>
        </footer>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerLayout;
