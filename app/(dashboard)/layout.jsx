'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Bell, HelpCircle, User, LogOut, ChevronRight, CheckCircle, Package, QrCode, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import clsx from 'clsx';

export default function DashboardLayout({ children }) {
  const { user, userData, loading, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [userData]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA;
      });
      setNotifications(data.slice(0, 5));
    }, (err) => {
      console.error("Error fetching notifications:", err);
    });
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const formatTime = (ts) => {
    if (!ts) return 'just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    switch(type) {
      case 'order': return <Package className="w-4 h-4" />;
      case 'qr': return <QrCode className="w-4 h-4" />;
      case 'dropzone': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600">
            <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-2 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 w-24 bg-gray-100 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-ghost-900 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-end px-8 bg-white/80 backdrop-blur-md border-b border-ghost-600 sticky top-0 z-30">
          
          <div className="flex items-center gap-6 ml-4">
            {/* Notifications Icon + Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => !isMobile && setShowNotifDropdown(true)}
              onMouseLeave={() => !isMobile && setShowNotifDropdown(false)}
            >
              <div 
                onClick={() => setIsMobile && setShowNotifDropdown(!showNotifDropdown)}
                className="relative cursor-pointer hover:text-blue-600 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                    {unreadCount}
                  </div>
                )}
              </div>

              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-[#0f4bb9] px-6 py-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Notifications</h3>
                        <p className="text-[10px] text-white/70">{unreadCount} unread</p>
                      </div>
                    </div>
                    <Link href="/notifications" className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 flex items-start gap-4 cursor-pointer group">
                          <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform", !n.read ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400")}>
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-[12px] font-bold text-gray-900 truncate pr-2">{n.title}</h4>
                              <span className="text-[10px] text-gray-400 font-medium">{formatTime(n.timestamp)}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">{n.message}</p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Link href="/notifications" className="block text-center py-4 text-xs font-bold text-[#0f4bb9] hover:bg-gray-50 transition-colors border-t border-gray-50">
                    See all notifications &rarr;
                  </Link>
                </div>
              )}
            </div>

            <Link href="/cart" className="relative cursor-pointer hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                  {cartCount}
                </div>
              )}
            </Link>

            <HelpCircle className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600 transition-colors" />

            {/* Profile Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => !isMobile && setShowUserDropdown(true)}
              onMouseLeave={() => !isMobile && setShowUserDropdown(false)}
            >
              <div 
                onClick={() => isMobile && setShowUserDropdown(!showUserDropdown)}
                className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-50 transition-all group shadow-sm"
              >
                {!imgErr && (userData?.photoURL || userData?.photoUrl) ? (
                  <img 
                    src={userData.photoURL || userData?.photoUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <User className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                )}
              </div>

              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-[#0f4bb9] px-8 py-8 text-white relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/20 border-2 border-white/20 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-500 p-4">
                       <User size={40} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-center mb-1">{userData?.name || 'User'}</h3>
                      <p className="text-xs text-white/70 text-center mb-3">{userData?.email}</p>
                      <div className="flex justify-center">
                         <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase">Member</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6 bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100 shadow-inner">
                       <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Coins</p>
                          <p className="text-sm font-black text-gray-900 flex items-center justify-center gap-1 focus:outline-none">
                             <span className="w-2 h-2 rounded-full bg-yellow-400" />
                             {userData?.ghostCoins || 0}
                          </p>
                       </div>
                       <div className="text-center border-x border-gray-200">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Joined</p>
                          <p className="text-sm font-black text-gray-900">
                             {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleString('default', { month: 'short', year: 'numeric' }) : '2026'}
                          </p>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Role</p>
                          <p className="text-sm font-black text-blue-700 capitalize">{userData?.role || 'User'}</p>
                       </div>
                    </div>

                    <Link 
                      href="/profile" 
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full bg-[#0f4bb9] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-900/10 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
                    >
                      <User size={16} /> Go to Profile
                    </Link>

                    <button 
                      onClick={handleLogout}
                      className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center gap-2 transition-all group"
                    >
                      <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

