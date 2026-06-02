'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { QrCode, Map, Plus, ArrowRight, ShieldCheck, Box, Tag, Trophy, MoreVertical, Search, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CircularQR from '@/components/CircularQR';

const DropzoneMap = dynamic(() => import('@/components/DropzoneMap'), { ssr: false, loading: () => <div className="w-full h-full rounded-2xl bg-gray-100 animate-pulse" /> });

const statusBadge = (status) => {
  const map = { created: 'bg-blue-100 text-blue-700', printed: 'bg-yellow-100 text-yellow-700', active: 'bg-emerald-100 text-emerald-700' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-700'}`}>{status === 'printed' ? 'pending' : status}</span>;
};

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [dropzones, setDropzones] = useState([]);
  const [loadingQrs, setLoadingQrs] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);



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

  useEffect(() => {
    const fetchDropzones = async () => {
      try {
        const dzSnap = await getDocs(collection(db, 'dropzones'));
        setDropzones(dzSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching dropzones:', err);
      }
    };
    fetchDropzones();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-2">
            WELCOME BACK, {userData?.name?.split(' ')[0] || 'ALEX'}
          </h2>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Your Digital Concierge
          </h1>
        </div>
        <Link href="/generate" className="btn-ghost px-6 py-3 text-sm inline-flex items-center gap-2 w-fit">
          <QrCode className="w-5 h-5" />
          Generate New QR
        </Link>
      </div>

      {/* 2. Stats Row */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex flex-col items-center justify-center">
              <Box className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-gray-600 font-medium">Total Items</span>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-900">{qrs.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex flex-col items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-gray-600 font-medium">Items Found</span>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-900">{qrs.filter(qr => qr.status === 'found').length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex flex-col items-center justify-center">
              <Trophy className="w-4 h-4 text-yellow-700" />
            </div>
            <span className="text-gray-600 font-medium">Rewards Earned</span>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-gray-900">🪙{userData?.ghostCoins || 0}</h3>

          </div>
        </div>
      </div> */}

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Left Column: Recent Items & Coverage */}
        <div className="xl:col-span-2 space-y-8">

          {/* Recent Item Tags */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Item Tags</h2>
              <Link href="/assets" className="text-blue-700 text-sm font-bold hover:underline">View All Assets</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dynamic QRs mapping */}
              {loadingQrs ? (
                <div className="col-span-1 md:col-span-2 text-center text-sm text-gray-500 py-8">
                  Loading tags...
                </div>
              ) : qrs.length === 0 ? (
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <Tag className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No assets found</p>
                </div>
              ) : (
                qrs.map(qr => (
                  <div key={qr.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      {qr.photoUrl ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${qr.photoUrl})` }} />
                      ) : (
                        <div className="scale-[0.85]">
                          <CircularQR value={`https://ghost-qr.vercel.app/scan/${qr.id}`} size={60} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-900 truncate pr-2">{qr.itemName}</h3>
                        {statusBadge(qr.status)}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-medium">{qr.category}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {qr.status === 'created' ? (
                          <Link href="/shop" className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">Order Tag</Link>
                        ) : (
                          <button className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">Edit Details</button>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === qr.id ? null : qr.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
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
                                  <Plus className="w-3.5 h-3.5 rotate-45" />
                                  Delete Asset
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Add New Card */}
              <Link href="/generate" className="w-full text-left bg-gray-50/50 rounded-3xl p-5 border-2 border-dashed border-gray-200 flex flex-row items-center justify-center gap-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group col-span-1 md:col-span-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex flex-col items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all shadow-sm">
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Add another asset</h3>
                  <p className="text-[11px] text-gray-500">Secure your valuables in seconds</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Coverage Network Map */}
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Coverage Network</h3>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Active monitoring in your frequent locations</p>
              </div>
              <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-gray-100 relative bg-gray-100">
              <DropzoneMap dropzones={dropzones} zoom={12} scrollWheelZoom={false} />
            </div>
          </div>

        </div>

        {/* Right Column: Security Boost */}
        {/* <div className="xl:col-span-1">
          <div className="bg-[#0f3b9c] rounded-[2rem] p-8 text-white sticky top-24 shadow-xl shadow-blue-900/20">
            <div className="w-12 h-12 border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center mb-6 bg-white/10">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight leading-tight">Security Boost Available</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 opacity-90">
              Increase your recovery chance by 40% by adding contact secondary phone numbers to your tags.
            </p>
            <button className="w-full bg-white text-[#0f3b9c] py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95">
              Update Security
            </button>
          </div>
        </div> */}

      </div>

    </div>
  );
}
