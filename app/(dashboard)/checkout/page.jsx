'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, QrCode, ArrowLeft, ShieldCheck, CheckCircle2, Package, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

const products = [
   { id: 'Ghost-stickers', name: 'Returnji QR Stickers', price: 29.00, image: '/returnji_sticker.jpg' },
   { id: 'keychains', name: 'Returnji QR Keychain', price: 89.00, image: '/returnji_keychain.jpg' },
   { id: 'travel-bundle', name: 'Returnji Bundle', price: 369.00, image: '/returnji_bundle.jpg' },
   { id: 'sticker-bundle', name: 'Returnji Student Bundle', price: 239.00, image: '/returnji_student_bundle.jpg' },
   { id: 'customize-sticker', name: 'Customize Your QR-Sticker', price: 29.00, image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400' },
   { id: 'customize-keychain', name: 'Customize Your QR-Keychain', price: 129.00, image: 'https://images.unsplash.com/photo-1627384113972-f4c0392fe5aa?auto=format&fit=crop&q=80&w=400' },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartTotal, clearCart } = useCart();
  
  const [qrs, setQrs] = useState([]);
  const [loadingQrs, setLoadingQrs] = useState(true);
  const [ordering, setOrdering] = useState(false);
  
  // For single product checkout
  const productId = searchParams.get('productId');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Map of item unit keys to selected QR IDs
  // Key format: product-id_index (e.g., 'sticker_0', 'sticker_1')
  const [linkedQrIds, setLinkedQrIds] = useState({});

  useEffect(() => {
    if (productId) {
      const p = products.find(p => p.id === productId);
      if (p) setSelectedProduct(p);
    }
  }, [productId]);

  useEffect(() => {
    if (!user) return;
    const qrQuery = query(collection(db, 'qrcodes'), where('ownerId', '==', user.uid));
    const unsub = onSnapshot(qrQuery, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQrs(data);
      setLoadingQrs(false);
    });
    return () => unsub();
  }, [user]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setOrdering(true);
    try {
      if (selectedProduct) {
        // Single Item Checkout
        const qrId = linkedQrIds[`${selectedProduct.id}_0`];
        if (!qrId) {
          setOrdering(false);
          return toast.error('Please select a QR profile to link');
        }
        await addDoc(collection(db, 'orders'), {
          orderId: `${Date.now()}`,
          userId: user.uid,
          productType: selectedProduct.id,
          qrId: qrId,
          status: 'pending',
          amount: selectedProduct.price,
          createdAt: serverTimestamp(),
        });
      } else {
        // Cart Checkout
        // Validate all items have a QR selected if required
        const allLinked = cart.every((item, itemIdx) => {
           for (let i = 0; i < item.quantity; i++) {
              if (!linkedQrIds[`${item.id}_${i}`]) return false;
           }
           return true;
        });

        if (!allLinked) {
           setOrdering(false);
           return toast.error('Please link a digital profile for every item');
        }

        for (const item of cart) {
          for (let i = 0; i < item.quantity; i++) {
            await addDoc(collection(db, 'orders'), {
              orderId: `${Date.now()}-${item.id}-${i}`,
              userId: user.uid,
              productType: item.id,
              qrId: linkedQrIds[`${item.id}_${i}`] || 'unlinked',
              status: 'pending',
              amount: item.price, // Amount per unit
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

  const currentTotal = selectedProduct ? selectedProduct.price : cartTotal;
  const shipping = currentTotal >= 150 ? 0 : 80;
  const finalTotal = currentTotal + shipping;
  const items = selectedProduct ? [selectedProduct] : cart;

  if (items.length === 0 && !loadingQrs) {
    router.replace('/shop');
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
                const quantity = item.quantity || 1;
                const units = Array.from({ length: quantity });
                
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
                        <div className="mt-3">
                           <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-gray-500 border border-gray-100">Qty: {quantity}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* QR Profile Selection for each unit */}
                    <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-blue-50 ml-10">
                      <div className="flex items-center gap-2 mb-1">
                         <QrCode className="w-3.5 h-3.5 text-blue-600" />
                         <span className="text-xs font-bold text-gray-900">Link Digital Profiles</span>
                      </div>
                      {units.map((_, unitIdx) => {
                        const unitKey = `${item.id}_${unitIdx}`;
                        return (
                          <div key={unitKey} className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] px-1">
                              Target Profile for {quantity > 1 ? `Unit #${unitIdx + 1}` : 'this item'}
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={linkedQrIds[unitKey] || ''}
                                onChange={e => setLinkedQrIds(prev => ({ ...prev, [unitKey]: e.target.value }))}
                                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-lg py-2.5 px-3 appearance-none text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer pr-10"
                              >
                                <option value="" disabled>Select Profile...</option>
                                <option value="unlinked">Link Later (Generic Tag)</option>
                                {qrs.map(qr => (
                                  <option key={qr.id} value={qr.id}>
                                    {qr.itemName} ({qr.category.toUpperCase()})
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                 </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
            <h2 className="text-xl font-bold text-gray-900 mb-8">Payment Summary</h2>
            
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
                <span className="text-3xl font-black text-[#0f4bb9]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={ordering || (selectedProduct && !linkedQrIds[`${selectedProduct.id}_0`])}
              className="w-full bg-[#0f4bb9] text-white py-5 rounded-[1.5rem] font-bold shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
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
