'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
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
    found: 'bg-purple-100 text-purple-700',
    lost: 'bg-red-100 text-red-700'
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

  const toggleLostStatus = async (qrId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'lost' ? 'active' : 'lost';
      await updateDoc(doc(db, 'qrcodes', qrId), { status: newStatus });
      toast.success(newStatus === 'lost' ? 'Asset marked as lost' : 'Asset marked as active');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

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
                <h3 className="font-bold text-lg text-gray-900 truncate mb-1">{qr.itemName || 'Unnamed Asset'}</h3>
                {statusBadge(qr.status)}
              </div>
              
              <div>
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

              <div className="mt-auto pt-4 border-t border-gray-50">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={qr.status === 'lost'} 
                      onChange={() => toggleLostStatus(qr.id, qr.status)} 
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${qr.status === 'lost' ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${qr.status === 'lost' ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {qr.status === 'lost' ? 'Marked as Lost' : 'Mark as Lost'}
                  </div>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
