import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  rentalPeriod: {
    startDate: null,
    endDate: null,
  },
  deliveryMethod: 'pickup',
  deliveryAddress: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        item => item.product._id === action.payload.product._id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        item => item.product._id !== action.payload
      );
    },
    updateQuantity: (state, action) => {
      const item = state.items.find(
        item => item.product._id === action.payload.productId
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    setRentalPeriod: (state, action) => {
      state.rentalPeriod = action.payload;
    },
    setDeliveryMethod: (state, action) => {
      state.deliveryMethod = action.payload;
    },
    setDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.rentalPeriod = { startDate: null, endDate: null };
      state.deliveryMethod = 'pickup';
      state.deliveryAddress = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setRentalPeriod,
  setDeliveryMethod,
  setDeliveryAddress,
  clearCart,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => {
  const { startDate, endDate } = state.cart.rentalPeriod;
  if (!startDate || !endDate) return 0;
  
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  
  return state.cart.items.reduce((total, item) => {
    return total + (item.product.pricing.daily * item.quantity * days);
  }, 0);
};
export const selectCartItemsCount = (state) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;
