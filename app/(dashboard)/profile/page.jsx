'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Edit2, ShieldCheck, MapPin, Calendar, Wallet } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState([]);
  
  // Realtime Activities Fetch
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);
  
  // Form State
  const [firstName, setFirstName] = useState(userData?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(userData?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [bio, setBio] = useState(userData?.bio || '');
  
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error('Name cannot be empty'); return; }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim(),
        bio: bio.trim()
      });
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setFirstName(userData?.name?.split(' ')[0] || '');
    setLastName(userData?.name?.split(' ').slice(1).join(' ') || '');
    setPhone(userData?.phone || '');
    setBio(userData?.bio || '');
    setEditing(false);
  };

  const joinDate = userData?.createdAt?.toDate 
    ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'March 2023';

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* 1. Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* User Card */}
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
          
          {/* Avatar */}
          <div className="relative shrink-0">
             <div className="w-32 h-32 rounded-[2rem] bg-gray-900 flex items-center justify-center overflow-hidden shadow-lg shadow-gray-200">
                <img src={userData?.photoUrl || "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"} alt="User Avatar" className="w-full h-full object-cover" />
             </div>
             <button title="Edit Avatar" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center shadow-md hover:bg-blue-800 transition-colors border-2 border-white">
                <Edit2 className="w-3.5 h-3.5" />
             </button>
          </div>

          <div className="flex-1 text-center sm:text-left pt-2">
             {userData?.role === 'admin' && (
               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-wider mb-3">
                 <ShieldCheck className="w-3.5 h-3.5" />
                 Admin
               </div>
             )}
             
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
               {userData?.name || 'Alexander Sterling'}
             </h1>
             <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
               <span className="w-3.5 h-3.5 bg-gray-200 rounded-sm flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-sm" />
               </span>
               {user?.email || 'a.sterling@digitalconcierge.com'}
             </p>

             <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-700">
                   <Calendar className="w-4 h-4 text-blue-600" />
                   Joined {joinDate}
                </div>
             </div>
          </div>
        </div>

        {/* Coins Card */}
        <div className="bg-[#0f4bb9] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
             <div className="flex items-center justify-between">
                <span className="text-blue-100 font-medium text-sm">Ghost Coins Balance</span>
                <Wallet className="w-5 h-5 text-blue-200" />
             </div>
             
             <div>
               <div className="flex items-baseline gap-2 mb-1">
                 <h2 className="text-5xl font-bold tracking-tight">{userData?.ghostCoins ?? 0}</h2>
                 <span className="text-blue-200 font-bold">GC</span>
               </div>
               <p className="text-xs text-blue-100/80 leading-relaxed max-w-[200px]">
                 Earn more coins by returning lost items to their owners.
               </p>
             </div>

             <button onClick={() => router.push('/rewards')} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all backdrop-blur-sm shadow-sm active:scale-95">
               Redeem Rewards
             </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* left column: Forms */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
            <button 
              type="button" 
              onClick={() => editing ? discardChanges() : setEditing(true)} 
              className="text-blue-700 text-sm font-bold hover:underline"
            >
              {editing ? 'Discard Changes' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
             <div className="grid grid-cols-2 gap-5">
               <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    disabled={!editing}
                    className="w-full bg-gray-200/50 border-transparent rounded-xl py-3 px-4 text-gray-900 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
                    placeholder="Enter first name"
                  />
               </div>
               <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    disabled={!editing}
                    className="w-full bg-gray-200/50 border-transparent rounded-xl py-3 px-4 text-gray-900 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
                    placeholder="Enter last name"
                  />
               </div>
             </div>

             <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full bg-gray-200/50 border-transparent rounded-xl py-3 px-4 text-gray-900 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
                />
             </div>

             <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  disabled={!editing}
                  className="w-full bg-gray-200/50 border-transparent rounded-xl py-3 px-4 text-gray-900 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
                  placeholder="+44 20 7946 0123"
                />
             </div>

             <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wider">Biography</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  disabled={!editing}
                  rows={3}
                  className="w-full bg-gray-200/50 border-transparent rounded-xl py-3 px-4 text-gray-900 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all resize-none" 
                  placeholder="Technophile and urban explorer. Always happy to help items find their way back home."
                />
             </div>

             {editing && (
               <button 
                 type="submit" 
                 disabled={saving}
                 className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-60"
               >
                 {saving ? 'Saving...' : 'Save Profile Changes'}
               </button>
             )}
          </form>
        </div>

        {/* right column: Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <button className="text-blue-700 text-sm font-bold hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
             {activities.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6 border border-dashed border-gray-200 rounded-xl">No recent activity. Redeem a reward or secure an item to see it here!</div>
             ) : activities.map((act) => (
                <div key={act.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex gap-4 cursor-pointer hover:border-gray-200 transition-colors group">
                   <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                      {act.type === 'giftcard' ? (
                        <svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="8" width="18" height="12" rx="2" ry="2"></rect><path d="M12 8v13"></path><path d="M19 12H5"></path><path d="M12 8c0-3.31-2.69-6-6-6v4c2.21 0 4 1.79 4 4"></path><path d="M12 8c0-3.31 2.69-6 6-6v4c-2.21 0-4 1.79-4 4"></path>
                        </svg>
                      ) : (
                        <div className="w-6 h-6 bg-blue-700 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-1 bg-white rounded-full opacity-80" />
                        </div>
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                         <h3 className="font-bold text-gray-900 truncate">{act.title || 'Reward Redemption'}</h3>
                         <span className="bg-teal-100 text-teal-700 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0">{act.status || 'Processed'}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                         {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                      </p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-gray-300 self-center group-hover:text-gray-500 transition-colors" />
                </div>
             ))}
          </div>

          {/* Trust Score */}
          <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 mt-8">
             <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-gray-900">Trust Score: 98%</h3>
             </div>
             
             <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
               <div className="h-full bg-teal-700 rounded-full" style={{ width: '98%' }} />
             </div>
             
             <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
               Your high trust score is based on 12 successful returns. Keep helping the community to maintain your status.
             </p>
          </div>
        </div>

      </div>

      {/* Footer Links */}
      <div className="mt-20 pt-8 border-t border-gray-100 flex flex-col items-center justify-center gap-4 pb-4">
         <div className="flex items-center gap-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <Link href="#" className="hover:text-blue-700 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-blue-700 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-blue-700 transition-colors">Help Center</Link>
         </div>
         <p className="text-[10px] text-gray-400">© 2023 Returnji Digital Concierge. All rights reserved.</p>
      </div>

    </div>
  );
}

function ChevronRight(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
