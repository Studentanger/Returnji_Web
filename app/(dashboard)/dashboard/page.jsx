'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, deleteDoc, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { QrCode, Map, Plus, ArrowRight, ShieldCheck, Box, Tag, Trophy, MoreVertical, Search, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CircularQR from '@/components/CircularQR';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const statusBadge = (status) => {
  const map = { created: 'bg-blue-100 text-blue-700', printed: 'bg-yellow-100 text-yellow-700', active: 'bg-emerald-100 text-emerald-700', lost: 'bg-red-100 text-red-700' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-700'}`}>{status === 'printed' ? 'pending' : status}</span>;
};

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

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

    let unsubOrders;
    let unsubUsers;
    if (userData?.role === 'admin') {
      unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => {
      unsubQr();
      if (unsubOrders) unsubOrders();
      if (unsubUsers) unsubUsers();
    };
  }, [user, userData?.role]);

  const calculateOrderData = () => {
    if (!orders.length) return [];
    const dataMap = {};
    orders.forEach(order => {
      const getMs = (dateObj) => {
        if (!dateObj) return 0;
        if (dateObj.toMillis) return dateObj.toMillis();
        if (dateObj.seconds) return dateObj.seconds * 1000;
        if (typeof dateObj === 'string' || typeof dateObj === 'number') return new Date(dateObj).getTime();
        return 0;
      };
      
      const ms = getMs(order.createdAt);
      if (ms === 0) return;
      
      const dateObj = new Date(ms);
      const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { name: dateStr, Orders: 0, ms: dateObj.setHours(0,0,0,0) };
      }
      dataMap[dateStr].Orders += 1;
    });
    
    return Object.values(dataMap).sort((a, b) => a.ms - b.ms);
  };
  
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  
  const orderGraphData = calculateOrderData();


  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-2">
            WELCOME BACK, {userData?.name?.split(' ')[0] || 'ALEX'}
          </h2>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            We Protect Your Things
          </h1>
          <h5 className="text-m ml-1 text-gray-900 tracking-tight"> Get Your Lost Items Back At Your Doorstep</h5>
        </div>

      </div>

      {/* Admin Graph & Stats */}
      {userData?.role === 'admin' && (
        <div className="space-y-6 mt-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex flex-col items-center justify-center">
                  <Box className="w-4 h-4 text-yellow-700" />
                </div>
                <span className="text-gray-600 font-medium">Pending Orders</span>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-gray-900">{pendingOrdersCount}</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-gray-600 font-medium">Delivered Orders</span>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-gray-900">{deliveredOrdersCount}</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex flex-col items-center justify-center">
                  <Trophy className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-gray-600 font-medium">Total Revenue</span>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          {/* Graph */}
          {orderGraphData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Orders Over Time</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="Orders" fill="#3b5034" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Admin Recent Orders Summary */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600" /> Recent Pending Orders
            </h3>
            {orders.filter(o => o.status === 'pending').length === 0 ? (
              <p className="text-sm text-gray-500">No pending orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-4 rounded-tl-lg">User</th>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4 rounded-tr-lg">Selected Dropzone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.filter(o => o.status === 'pending').slice(0, 5).map(order => {
                      const orderUser = allUsers.find(u => u.id === order.userId);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-900">{orderUser?.name || 'Anonymous'}</p>
                            <p className="text-[11px] text-gray-500">{orderUser?.email || 'No email'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-800">{order.productType || 'Unknown Product'}</p>
                            <p className="text-[11px] text-gray-400 font-mono">ID: #{order.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              <Map className="w-3.5 h-3.5 text-blue-500" />
                              {order.dropzone ? (
                                {
                                  'dz1': 'Tasty Vadapav, Old Food Court',
                                  'dz2': 'Jagdish Foods, New Food Court',
                                  'dz3': 'Mr. Puff, PIT',
                                  'dz4': 'Mogal Mug Pulav, PIT',
                                  'dz5': 'Sawariyaa Chaat Corner, PIT',
                                }[order.dropzone] || order.dropzone
                              ) : 'Not Selected'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {orders.filter(o => o.status === 'pending').length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
                      View all pending orders <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

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
      {userData?.role !== 'admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Left Column: Recent Items & Coverage */}
        <div className="xl:col-span-2 space-y-8">

          {/* Recent Item Tags */}
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Assets</h2>
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
                  <div key={qr.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-900 truncate pr-2 text-lg">{qr.itemName || 'Unnamed Asset'}</h3>
                      {statusBadge(qr.status)}
                    </div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{qr.category || 'Uncategorized'}</p>
                    
                    <div className="mt-2 pt-3 border-t border-gray-50">
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
                        <div className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {qr.status === 'lost' ? 'Marked as Lost' : 'Mark as Lost'}
                        </div>
                      </label>
                    </div>
                  </div>
                ))
              )}


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
      )}

    </div>
  );
}
