'use client';

import { Suspense, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrCode, ArrowLeft, Shield, Package, Landmark, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function GenerateQRForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrId = searchParams.get('qrId');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'electronics',
    description: '',
    reward: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in');
    
    setLoading(true);
    try {
      if (qrId) {
        const docRef = doc(db, 'qrcodes', qrId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists() || docSnap.data().status !== 'unregistered') {
           setLoading(false);
           return toast.error('Invalid or already registered QR code');
        }
        await updateDoc(docRef, {
          ownerId: user.uid,
          itemName: formData.itemName || 'Unnamed Asset',
          category: formData.category,
          description: formData.description,
          reward: Number(formData.reward) || 0,
          status: 'active',
          registeredAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'qrcodes'), {
          ownerId: user.uid,
          itemName: formData.itemName || 'Unnamed Asset',
          category: formData.category,
          description: formData.description,
          reward: Number(formData.reward) || 0,
          status: 'created',
          createdAt: serverTimestamp()
        });
      }
      
      toast.success(qrId ? 'QR Profile claimed successfully!' : 'Digital QR Profile created successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate QR profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-900 border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{qrId ? 'Claim Pre-generated Asset' : 'Create Asset Profile'}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{qrId ? `Registering tag ${qrId}` : 'Register a new item to secure it with Returnji'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* Form Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-1">Asset Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium" 
                    placeholder="e.g. MacBook Pro, Travel Wallet" 
                    value={formData.itemName} 
                    onChange={e => setFormData({ ...formData, itemName: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-1">Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['electronics', 'accessories', 'keys', 'bags', 'pets', 'other'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          formData.category === cat 
                            ? 'bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-1">Finder's Reward (₹)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      min="0" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-5 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-gray-900" 
                      placeholder="0" 
                      value={formData.reward} 
                      onChange={e => setFormData({ ...formData, reward: e.target.value })} 
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 px-1">Higher rewards often lead to 3x faster returns.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-1">Recovery Instructions</label>
                  <textarea 
                    rows="4" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-gray-400 font-medium" 
                    placeholder="Provide details that will help a finder return your item. (e.g. 'Please drop it at the nearest security desk')" 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0f4bb9] text-white rounded-[1.5rem] py-5 font-bold shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:scale-[1.01] transition-all active:scale-95 mt-4 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'Creating Profile...' : (
                  <>
                    <QrCode className="w-5 h-5" /> {qrId ? 'Claim QR Profile' : 'Generate Digital QR Profile'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f4bb9] rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
               <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-3 tracking-tight">How it works?</h2>
            <div className="space-y-4">
               {[
                 { step: 1, title: 'Create Profile', desc: 'Add item details and a recovery reward.' },
                 { step: 2, title: 'Get Your Tag', desc: 'Order a physical tag or sticker from our shop.' },
                 { step: 3, title: 'Stay Secure', desc: 'If found, the finder scans the QR to notify you.' },
               ].map(s => (
                 <div key={s.step} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[10px] font-black">{s.step}</div>
                    <div>
                       <h3 className="text-sm font-bold">{s.title}</h3>
                       <p className="text-xs text-blue-100/70 mt-0.5">{s.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-blue-600" />
             </div>
             <h3 className="font-bold text-gray-900">Already have a tag?</h3>
             <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                If you recently purchased a physical tag, you can link it to this digital profile immediately after creation.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerateQRPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <GenerateQRForm />
    </Suspense>
  );
}
