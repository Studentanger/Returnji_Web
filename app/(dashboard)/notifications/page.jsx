'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  QrCode, 
  MessageSquare, 
  MapPin, 
  Gift, 
  History,
  MoreVertical,
  Trash2,
  User
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ICON_MAP = {
  qr: { icon: QrCode, color: 'bg-blue-100 text-blue-600' },
  chat: { icon: MessageSquare, color: 'bg-teal-100 text-teal-600' },
  scan: { icon: QrCode, color: 'bg-blue-100 text-blue-600' },
  scan_location: { icon: MapPin, color: 'bg-red-100 text-red-600' },
  dropzone: { icon: MapPin, color: 'bg-purple-100 text-purple-600' },
  location: { icon: MapPin, color: 'bg-slate-100 text-slate-600' },
  reward: { icon: Gift, color: 'bg-emerald-100 text-emerald-600' },
  default: { icon: Bell, color: 'bg-gray-100 text-gray-600' },
};

function timeAgo(ts) {
  if (!ts?.toDate) return '';
  const now = new Date();
  const date = ts.toDate();
  const diff = (now.getTime() - date.getTime()) / 1000;
  
  if (diff < 60) return 'JUST NOW';
  if (diff < 3600) return `${Math.floor(diff / 60)} MINS AGO`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} HOUR AGO`;
  if (diff < 172800) return 'YESTERDAY';
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setNotifications(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    if (unread.length > 0) toast.success('All marked as read');
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
    if (n.type === 'chat' && n.chatId) {
      router.push(`/chats`);
    } else if (n.type === 'scan_location' && n.mapsLink) {
      window.open(n.mapsLink, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-gray-500 mt-2 font-medium">
            Stay updated on your secured belongings and concierge activity.
          </p>
        </div>
        <button 
          onClick={markAllRead}
          className="text-blue-700 font-bold text-sm hover:underline transition-all"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse h-32" />
          ))
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
             <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-900 font-bold text-lg">All caught up!</p>
             <p className="text-gray-500 mt-1">New notifications will appear here.</p>
          </div>
        ) : (
          notifications.map(n => {
            const config = ICON_MAP[n.type] || ICON_MAP.default;
            const Icon = config.icon;
            
            return (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={clsx(
                  "bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer relative group",
                  n.read ? "border-gray-100 opacity-80" : "border-blue-100 ring-1 ring-blue-50"
                )}
              >
                <div className="flex gap-5">
                  <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", config.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{n.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider tabular-nums">
                          {timeAgo(n.timestamp)}
                        </span>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-1 leading-relaxed text-[15px]">
                      {n.message}
                    </p>

                    {/* Action Buttons based on type */}
                    <div className="mt-4 flex items-center gap-3">
                      {n.type === 'qr' || n.type === 'scan' || n.type === 'scan_location' || n.type === 'dropzone' ? (
                        <>
                          {(n.mapsLink || n.type === 'scan_location') && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (n.mapsLink) window.open(n.mapsLink, '_blank');
                                else if (n.latitude && n.longitude) window.open(`https://www.google.com/maps?q=${n.latitude},${n.longitude}`, '_blank');
                              }}
                              className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5" /> View Map
                            </button>
                          )}
                          {/* <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/chats');
                            }}
                            className="text-blue-700 font-bold text-sm px-2 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Contact Finder
                          </button> */}
                        </>
                      ) : n.type === 'chat' ? (
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-white">
                              <User className="w-full h-full p-1.5 text-gray-400" />
                           </div>
                           <button className="bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-900 transition-colors">
                            Open Chat
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Empty State for History */}
      <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-12 text-center mt-12">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
           <History className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 leading-tight">Looking for older alerts?</h3>
        <p className="text-gray-500 mt-2 font-medium">Archive history is available for items up to 90 days.</p>
        <button className="mt-6 bg-white border border-gray-200 text-blue-700 font-bold px-8 py-3 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all active:scale-95">
          View Full History
        </button>
      </div>
    </div>
  );
}
