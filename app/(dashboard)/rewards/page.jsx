'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Gift, Wallet, ArrowRight, CheckCircle, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const REWARDS = [
  { id: 'r1', name: 'Amazon Gift Card ₹500', type: 'giftcard', price: 500, image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=200' },
  { id: 'r2', name: 'Premium NFC Keychain', type: 'physical', price: 1200, image: 'https://images.unsplash.com/photo-1582208076045-31a89c988fce?auto=format&fit=crop&q=80&w=200' },
  { id: 'r3', name: '5x QR Sticker Pack', type: 'physical', price: 300, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=200' },
  { id: 'r4', name: 'Flipkart Voucher ₹1000', type: 'giftcard', price: 1000, image: 'https://images.unsplash.com/photo-1607524018265-e9cc505672ab?auto=format&fit=crop&q=80&w=200' },
];

export default function RewardsPage() {
  const { user, userData } = useAuth();
  const [redeeming, setRedeeming] = useState(null);

  const ghostCoins = userData?.ghostCoins ?? 0;

  const handleRedeem = async (reward) => {
    if (ghostCoins < reward.price) {
      toast.error('Not enough Ghost Coins!');
      return;
    }

    if (!window.confirm(`Are you sure you want to redeem ${reward.name} for ${reward.price} GC?`)) return;

    setRedeeming(reward.id);
    try {
      // Deduct coins
      await updateDoc(doc(db, 'users', user.uid), {
        ghostCoins: increment(-reward.price)
      });

      // Add to activities
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        title: reward.name,
        type: reward.type,
        status: 'Processing',
        date: new Date().toISOString(),
        timestamp: serverTimestamp()
      });

      toast.success(`Successfully redeemed ${reward.name}!`);
    } catch (error) {
       console.error(error);
       toast.error('Failed to redeem reward.');
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="bg-[#3b5034] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-900/20 mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/20">
                 <Gift className="w-3.5 h-3.5" /> Rewards Store
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Redeem your GC.</h1>
              <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                Turn your acts of kindness into real-world rewards. Every returned item brings you closer to exclusive gear and gift cards.
              </p>
           </div>
           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 min-w-[200px] text-center shrink-0 shadow-inner">
              <Wallet className="w-8 h-8 text-blue-200 mx-auto mb-3" />
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Your Balance</p>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl font-black">{ghostCoins}</span>
                <span className="text-blue-200 font-bold">GC</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {REWARDS.map(reward => (
           <div key={reward.id} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="w-full h-40 bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                 <img src={reward.image} alt={reward.name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-600" /> {reward.type}
                 </div>
              </div>
              <div className="flex-1 flex flex-col">
                 <h3 className="font-bold text-gray-900 mb-1 leading-tight">{reward.name}</h3>
                 <p className="text-blue-700 font-black text-lg mb-4">{reward.price} GC</p>
                 
                 <div className="mt-auto">
                   <button 
                     onClick={() => handleRedeem(reward)}
                     disabled={redeeming === reward.id || ghostCoins < reward.price}
                     className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        ghostCoins >= reward.price 
                        ? 'bg-[#3b5034] hover:bg-blue-800 text-white shadow-md hover:shadow-lg disabled:opacity-70' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                     }`}
                   >
                     {redeeming === reward.id ? 'Processing...' : (ghostCoins >= reward.price ? 'Redeem Now' : 'Not Enough GC')}
                   </button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
