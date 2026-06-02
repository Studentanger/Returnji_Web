'use client';

import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any Ghost tags to your cart yet. Secure your valuables today!</p>
        <Link href="/shop" className="inline-flex items-center gap-2 bg-[#0f4bb9] text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-900/10 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/shop" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-900 border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review your items before securing them</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 hover:border-gray-200 transition-all">
              <div className="w-24 h-24 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-1">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-500">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-gray-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-500">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-bold text-[#0f4bb9]">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 space-y-6 sticky top-24">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal ({cartCount} items)</span>
                <span className="text-gray-900 font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Shipping</span>
                <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">Free</span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Tax</span>
                <span className="text-gray-900 font-bold">₹0.00</span>
              </div> */}
              <div className="pt-4 border-t border-gray-50 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-[#0f4bb9]">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => router.push('/checkout')}
              className="w-full bg-[#0f4bb9] text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 mb-6"
            >
              <CreditCard className="w-5 h-5" /> Checkout Now
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Payments Powered by Ghost
            </div>
          </div>

          <div className="bg-[#f0f4ff] rounded-3xl p-6 border border-blue-100/50">
            <h3 className="text-blue-900 font-bold text-sm mb-2">Need Help?</h3>
            <p className="text-blue-700/70 text-xs leading-relaxed">
              Have questions about your order? Our support team is available 24/7 to assist you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
