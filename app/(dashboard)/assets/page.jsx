'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Tag, MoreVertical, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import CircularQR from '@/components/CircularQR';

const statusBadge = (status) => {
  const map = { 
    created: 'bg-blue-100 text-blue-700', 
    printed: 'bg-yellow-100 text-yellow-700', 
    active: 'bg-emerald-100 text-emerald-700', 
    found: 'bg-purple-100 text-purple-700' 
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status === 'printed' ? 'pending' : status}
    </span>
  );
};

export default function AssetsPage() {
  const { user } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [loadingQrs, setLoadingQrs] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const qrQuery = query(collection(db, 'qrcodes'), where('ownerId', '==', user.uid));
    const unsubQr = onSnapshot(qrQuery, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setQrs(data);
      setLoadingQrs(false);
    }, (err) => {
      console.error(err);
      setLoadingQrs(false);
    });
    return () => unsubQr();
  }, [user]);

  const filteredQrs = qrs.filter(qr => 
    qr.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    qr.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteQR = async (qrId) => {
    if (!window.confirm('Are you sure you want to delete this asset? This will also cancel any pending orders for this tag.')) return;
    
    try {
      // 1. Delete the QR code document
      await deleteDoc(doc(db, 'qrcodes', qrId));
      
      // 2. Find and cancel any pending orders for this QR
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('qrId', '==', qrId), where('status', '==', 'pending'));
      const orderSnap = await getDocs(q);
      
      if (!orderSnap.empty) {
        const batch = writeBatch(db);
        orderSnap.forEach((orderDoc) => {
          batch.update(orderDoc.ref, { status: 'cancelled' });
        });
        await batch.commit();
        toast.success('Asset deleted and pending orders cancelled');
      } else {
        toast.success('Asset deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete asset');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-900 border border-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Assets</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and track all your registered items</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or category..." 
          className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingQrs ? (
          <div className="col-span-full text-center text-sm text-gray-500 py-12">
            Loading your assets...
          </div>
        ) : filteredQrs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <Tag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No assets found</h3>
            <p className="text-gray-500 text-sm font-medium">You haven't registered any items yet or none match your search.</p>
          </div>
        ) : (
          filteredQrs.map(qr => (
            <div key={qr.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 group">
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {qr.photoUrl ? (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${qr.photoUrl})` }} />
                  ) : (
                    <div className="scale-[0.8]">
                      <CircularQR value={`https://ghost-qr.vercel.app/scan/${qr.id}`} size={64} />
                    </div>
                  )}
                </div>
                {statusBadge(qr.status)}
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-gray-900 truncate mb-1">{qr.itemName || 'Unnamed Asset'}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{qr.category}</p>
                  {qr.reward > 0 && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100">
                      ₹{qr.reward} Reward
                    </span>
                  )}
                </div>
              </div>

              {qr.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {qr.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                {qr.status === 'created' ? (
                  <Link href="/shop" className="flex-1 text-center bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                    Order Tag
                  </Link>
                ) : (
                  <button className="flex-1 bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-100">
                    Edit Details
                  </button>
                )}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === qr.id ? null : qr.id);
                    }}
                    className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === qr.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button
                          onClick={() => {
                            handleDeleteQR(qr.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Delete Asset
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
