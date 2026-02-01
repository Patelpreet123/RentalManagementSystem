import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, reset } from '../../slices/authSlice';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Use registrationComplete flag and pendingVerification for navigation
  const { 
    isLoading, 
    isError, 
    isSuccess, 
    isAuthenticated,
    message, 
    pendingVerification,
    registrationComplete 
  } = useSelector((state) => state.auth);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  // Handle successful registration - use registrationComplete flag
  useEffect(() => {
    if (registrationComplete) {
      if (pendingVerification) {
        // User needs to verify email
        toast.success('Registration successful! Please verify your email.');
        dispatch(reset()); // Reset flags but keep pendingVerification
        navigate('/verify-email', { 
          state: { 
            email: pendingVerification.email,
            emailSent: pendingVerification.emailSent
          },
          replace: true
        });
      } else if (isAuthenticated) {
        // Email verification was skipped - user is authenticated
        toast.success('Registration successful!');
        dispatch(reset());
        // Navigate based on role from the successful registration
        navigate('/', { replace: true });
      }
    }
  }, [registrationComplete, pendingVerification, isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { confirmPassword, ...userData } = formData;
    dispatch(register(userData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">

      {/* Main Card */}
      <div className="relative bg-white rounded-2xl sm:rounded-[2rem] shadow-xl sm:shadow-2xl overflow-hidden flex flex-col lg:flex-row max-w-4xl w-full min-h-0 lg:min-h-[600px] border border-gray-100 lg:border-0">
        {/* Left Side - Image & Text (Hidden on mobile, shown on lg+) */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
            <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-white rounded-full" />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center p-10 text-white">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            
            {/* Text Content */}
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Start Your<br />Journey Today
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-8">
              Join thousands of users who trust RentalHub for their rental needs. Whether you want to rent or list products, we've got you covered.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-xs text-gray-300">Active Users</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-xs text-gray-300">Products Listed</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">1K+</div>
                <div className="text-xs text-gray-300">Trusted Vendors</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">4.9★</div>
                <div className="text-xs text-gray-300">User Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[55%] p-6 sm:p-8 lg:p-10 flex flex-col justify-center overflow-y-auto">
          {/* Mobile Header with Logo */}
          <div className="lg:hidden text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <div className="max-w-sm mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Sign up</h1>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                Join RentalHub today and start renting or listing amazing products!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Email"
                  required
                />
              </div>

              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Phone Number (optional)"
                />
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all border-2 ${
                    formData.role === 'customer'
                      ? 'border-gray-900 bg-gray-100 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  🛒 Rent Products
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all border-2 ${
                    formData.role === 'vendor'
                      ? 'border-gray-900 bg-gray-100 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  📦 List Products
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all pr-12"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Confirm Password"
                  required
                />
              </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
              {/* Terms checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label className="text-xs text-gray-500">
                  I agree to the{' '}
                  <Link to="/terms" className="text-gray-900 hover:text-black underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-gray-900 hover:text-black underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-gray-900/30 hover:shadow-black/40"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Let's start!"
                )}
              </button>
            </form>

            {/* Sign in link */}
            <div className="text-center mt-5">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-gray-900 hover:text-black font-medium underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
