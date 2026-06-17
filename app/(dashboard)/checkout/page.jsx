'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ShieldCheck, CheckCircle2, Package, CreditCard, Minus, Plus, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

const products = [
  { id: 'returnji-sticker', name: 'Returnji QR Stickers', price: 29.00, image: '/returnji_sticker.jpg' },
  { id: 'returnji-keychain', name: 'Returnji QR Keychain', price: 89.00, image: '/returnji_keychain.jpg' },
  { id: 'returnji-bundle', name: 'Returnji Bundle', price: 369.00, image: '/returnji_bundle.jpg' },
  { id: 'returnji-student-bundle', name: 'Returnji Student Bundle', price: 239.00, image: '/returnji_student_bundle.jpg' },
  { id: 'returnji-custom-sticker', name: 'Customize Your QR-Sticker', price: 29.00, image: '/returnji_custom_sticker.png' },
  { id: 'returnji-custom-keychain', name: 'Customize Your QR-Keychain', price: 129.00, image: '/returnji_custom_keychain.png' },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartTotal, clearCart, updateQuantity } = useCart();

  const [ordering, setOrdering] = useState(false);
  const [singleProductQty, setSingleProductQty] = useState(1);
  const [isParulStudent, setIsParulStudent] = useState(true);
  const [selectedDropzone, setSelectedDropzone] = useState('');

  const dropzones = [
    { id: 'dz1', name: 'Tasty Vadapav, Old Food Court' },
    { id: 'dz2', name: 'Jagdish Foods, New Food Court' },
    { id: 'dz3', name: 'Mr. Puff, PIT' },
    { id: 'dz4', name: 'Mogal Mug Pulav, PIT' },
    { id: 'dz5', name: 'Sawariyaa Chaat Corner, PIT' },

  ];

  // For single product checkout
  const productId = searchParams.get('productId');
  const selectedProduct = productId ? products.find(p => p.id === productId) : null;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Basic validation
    if (!isParulStudent) {
      toast.error('Currently we only deliver to Parul University students.');
      return;
    }

    if (!selectedDropzone) {
      toast.error('Please select a dropzone to collect your order.');
      return;
    }

    setOrdering(true);
    try {
      if (selectedProduct) {
        // Single Item Checkout
        for (let i = 0; i < singleProductQty; i++) {
          await addDoc(collection(db, 'orders'), {
            orderId: `${Date.now()}-${selectedProduct.id}-${i}`,
            userId: user.uid,
            productType: selectedProduct.id,
            qrId: 'unlinked',
            status: 'pending',
            amount: selectedProduct.price,
            dropzone: selectedDropzone,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Cart Checkout
        for (const item of cart) {
          for (let i = 0; i < item.quantity; i++) {
            await addDoc(collection(db, 'orders'), {
              orderId: `${Date.now()}-${item.id}-${i}`,
              userId: user.uid,
              productType: item.id,
              qrId: 'unlinked',
              status: 'pending',
              amount: item.price, // Amount per unit
              dropzone: selectedDropzone,
              createdAt: serverTimestamp(),
            });
          }
        }
        clearCart();
      }

      toast.success('Secure order placed successfully! 🎉');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Payment processing failed. Try again.');
    } finally {
      setOrdering(false);
    }
  };

  const currentTotal = selectedProduct ? selectedProduct.price * singleProductQty : cartTotal;
  const shipping = currentTotal >= 150 ? 0 : 80;
  const finalTotal = currentTotal + shipping;
  const items = selectedProduct ? [selectedProduct] : cart;

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/shop');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-900 border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight text-center sm:text-left">Secure Checkout</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Finalize your order for digital protection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" /> Review Items
            </h2>
            <div className="space-y-4">
              {items.map((item, idx) => {
                const quantity = selectedProduct ? singleProductQty : (item.quantity || 1);

                return (
                  <div key={idx} className="space-y-3 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex gap-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <span className="font-bold text-blue-800">₹{(item.price * quantity).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Premium Returnji QR Hardware</p>
                        <div className="mt-3 flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-100 w-fit">
                          <button
                            onClick={() => selectedProduct ? setSingleProductQty(Math.max(1, singleProductQty - 1)) : updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold w-6 text-center text-gray-900">{quantity}</span>
                          <button
                            onClick={() => selectedProduct ? setSingleProductQty(singleProductQty + 1) : updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all text-gray-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-500" /> Delivery Options
            </h2>

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Are you currently studying in Parul University?</h3>
                <p className="text-xs text-gray-500">We currently only deliver within the campus.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isParulStudent}
                  onChange={(e) => setIsParulStudent(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b5034]"></div>
              </label>
            </div>

            {isParulStudent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Select Dropzone</label>
                  <select
                    value={selectedDropzone}
                    onChange={(e) => setSelectedDropzone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3b5034] focus:border-transparent transition-all bg-white"
                  >
                    <option value="" disabled>Choose a dropzone...</option>
                    {dropzones.map(dz => (
                      <option key={dz.id} value={dz.id}>{dz.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-xs text-green-800 font-medium">
                    You will collect your order from the selected dropzone. The time and date for collection will be messaged to you once your order is ready.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                <p className="text-sm font-bold text-red-600 mb-1">Delivery Not Available</p>
                <p className="text-xs text-red-500">We currently only support orders for Parul University students. We will notify you when we expand.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Buyer Protection
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your purchase is secured with Returnji 256-bit encryption. We ensure 100% genuine hardware.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" /> Express Delivery
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Free shipping on all Returnji hardware. Delivery within 3-5 business days nationwide.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-2xl shadow-blue-900/10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h2>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100/50">
              <p className="text-[11px] text-gray-500 leading-normal text-center">
                🚚 <span className="font-bold text-gray-700">Shipping Policy</span>: Free shipping on orders of <span className="font-bold text-[#3b5034]">₹150</span> and above. Under ₹150, shipping is <span className="font-bold text-gray-700">₹80</span>.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="text-gray-900 font-bold">₹{currentTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Shipping & Handling</span>
                {shipping === 0 ? (
                  <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded-lg">Free</span>
                ) : (
                  <span className="text-gray-900 font-bold">₹{shipping.toFixed(2)}</span>
                )}
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-black text-[#3b5034]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={ordering}
              className="w-full bg-[#3b5034] text-white py-5 rounded-[1.5rem] font-bold shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {ordering ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay & Secure Now
                </>
              )}
            </button>

            <div className="mt-8 pt-8 border-t border-gray-50">
              <div className="flex items-center justify-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all">
                <span className="font-black text-xl italic text-gray-900">VISA</span>
                <span className="font-black text-xl italic text-gray-900">UPI</span>
                <span className="font-black text-xl italic text-gray-900">RuPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
