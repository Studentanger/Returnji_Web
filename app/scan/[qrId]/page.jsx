'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, User, FileText, MessageCircle, MapPin, Navigation, ShieldCheck, HelpCircle } from 'lucide-react';
import { getDistance, formatDistance } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ScanPage() {
  const { qrId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [nearestDropzone, setNearestDropzone] = useState(null);
  const [finderLocation, setFinderLocation] = useState(null);

  const handleStartChat = async () => {
    if (!qrData || !qrId) return;
    setStartingChat(true);

    try {
      // 1. Get or create finder ID
      let finderId = localStorage.getItem('ghost_finder_id');
      if (!finderId) {
        finderId = 'finder_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ghost_finder_id', finderId);
      }

      // 2. Check if a chat already exists for this QR and finder
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('qrId', '==', qrId), where('finderId', '==', finderId));
      const querySnapshot = await getDocs(q);

      let chatId;

      // 3. If exists, use it. If not, create it.
      if (!querySnapshot.empty) {
        chatId = querySnapshot.docs[0].id;
      } else {
        const newChatDoc = await addDoc(chatsRef, {
          qrId,
          itemName: qrData.itemName || 'Unknown Item',
          ownerId: qrData.ownerId,
          finderId,
          createdAt: serverTimestamp(),
        });
        chatId = newChatDoc.id;

        // Notify owner about the new chat initiation
        await addDoc(collection(db, 'notifications'), {
          userId: qrData.ownerId,
          title: 'Someone found your item!',
          message: `A finder has started an anonymous chat for your item: ${qrData.itemName}`,
          type: 'chat',
          chatId: chatId,
          read: false,
          timestamp: serverTimestamp()
        });
      }

      // 4. Redirect to the chat page
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    const fetchQRData = async () => {
      try {
        if (!qrId) return;

        const docRef = doc(db, 'qrcodes', qrId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'unregistered') {
            setRedirecting(true);
            setLoading(false); 
            router.push(`/generate?qrId=${qrId}`);
            return;
          }
          if (data.status !== 'active') {
            setError('This tag is currently inactive.');
            setLoading(false);
          } else {
            setQrData(data);
            setLoading(false);
          }
        } else {
          setError('Invalid tag QR code.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching QR data:', err);
        setError('Failed to load asset details.');
        setLoading(false);
      }
    };

    fetchQRData();
  }, [qrId, router]);

  useEffect(() => {
    if (!qrData || locationCaptured || user?.uid === qrData.ownerId) return;

    const captureLocationAndNotify = async (position) => {
      const { latitude, longitude } = position.coords;
      setFinderLocation({ lat: latitude, lng: longitude });
      setLocationCaptured(true);

      try {
        let finderId = localStorage.getItem('ghost_finder_id');
        if (!finderId) {
          finderId = 'finder_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('ghost_finder_id', finderId);
        }

        // 1. Log Scan
        await addDoc(collection(db, 'scans'), {
          qrId,
          finderId,
          latitude,
          longitude,
          timestamp: serverTimestamp()
        });

        // 2. Notify Owner
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        await addDoc(collection(db, 'notifications'), {
          userId: qrData.ownerId,
          title: 'Your item was scanned!',
          message: `Your item "${qrData.itemName}" was scanned at this location.`,
          type: 'scan_location',
          mapsLink,
          qrId,
          latitude,
          longitude,
          read: false,
          timestamp: serverTimestamp()
        });

        // 3. Update QR Document with last seen location
        await updateDoc(doc(db, 'qrcodes', qrId), {
          lastLatitude: latitude,
          lastLongitude: longitude,
          lastSeenAt: serverTimestamp()
        });

        // 4. Find Nearest Dropzone
        const dzSnap = await getDocs(collection(db, 'dropzones'));
        const dzs = dzSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (dzs.length > 0) {
          let closest = null;
          let minDistance = Infinity;

          dzs.forEach(dz => {
            const dist = getDistance(latitude, longitude, dz.lat, dz.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = { ...dz, distance: dist };
            }
          });

          setNearestDropzone(closest);
        }

      } catch (err) {
        console.error('Error logging scan or notifying owner:', err);
      }
    };

    const handleDenied = async () => {
      setLocationCaptured(true); // Mark as tried
      // Still notify owner that item was scanned (but no location)
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: qrData.ownerId,
          title: 'Your item was scanned',
          message: `Your item "${qrData.itemName}" was scanned, but the finder's location is unavailable.`,
          type: 'scan',
          qrId,
          read: false,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error('Error notifying owner:', err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(captureLocationAndNotify, handleDenied);
    } else {
      handleDenied();
    }
  }, [qrData, qrId, locationCaptured, user]);

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#ede8de]">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <Navigation className="w-8 h-8 text-[#3b5034] animate-bounce" />
        </div>
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Redirecting to Registration...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#ede8de]">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <ShieldCheck className="w-8 h-8 text-[#3b5034] animate-pulse" />
        </div>
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#ede8de] p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-gray-100 mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan Failed</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-8 py-3.5 bg-[#3b5034] text-white rounded-xl font-bold shadow-md hover:bg-blue-800 transition-all active:scale-95"
        >
          Return to Safety
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ede8de] flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">

      {/* Decorative Brand Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* Header Branding */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-[#3b5034] flex items-center justify-center shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Returnji</span>
          <span className="text-[10px] text-[#3b5034] font-bold tracking-widest uppercase">Digital Concierge</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-blue-900/5 relative z-10">

        {/* Top Asset Card */}
        <div className="p-8 pb-6 border-b border-gray-100 flex flex-col items-center text-center">
          {/* <div className="relative mb-6">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] border-2 border-white shadow-lg flex items-center justify-center overflow-hidden z-10 relative">
              {qrData?.photoUrl ? (
                <img src={qrData.photoUrl} alt="Asset" className="w-full h-full object-cover" />
              ) : (
                <HelpCircle className="w-10 h-10 text-gray-400" />
              )}
            </div>
            
            <div className="absolute inset-0 bg-blue-100 rounded-[2rem] scale-110 -z-10 animate-pulse" />
            <div className="absolute inset-0 bg-teal-50 rounded-[2rem] scale-125 -z-20" />
          </div> */}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            Active Claim
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{qrData?.itemName || 'Unknown Asset'}</h1>
          <p className="text-sm font-medium text-gray-500 max-w-[260px] mx-auto leading-relaxed">
            {user?.uid === qrData?.ownerId ? (
              <>This is your item. If it's lost, check the last known location below.</>
            ) : (
              <>You just scanned a lost item. The owner has been notified of its general location.</>
            )}
          </p>

          {user?.uid === qrData?.ownerId && qrData?.lastLatitude && (
            <div className="mt-6 w-full max-w-sm bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Last Seen Location</p>
                  <p className="text-xs font-bold text-gray-900">View item's latest position</p>
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps?q=${qrData.lastLatitude},${qrData.lastLongitude}`, '_blank')}
                className="bg-[#3b5034] text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-800 transition-colors shrink-0"
              >
                Track Now
              </button>
            </div>
          )}
        </div>

        <div className="p-8 space-y-6 bg-gray-50/50">

          {/* Details Box */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#3b5034]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Owner Notes</h3>
              <p className="text-sm text-gray-900 font-medium leading-relaxed">
                {qrData?.description || 'Please let me know where I can pick this up safely.'}
              </p>
            </div>
          </div>

          {/* Reward Alert */}
          {qrData?.reward > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Bounty Reward</h3>
                <p className="text-3xl font-black text-emerald-700 tracking-tight">
                  <span className="text-xl"></span>{qrData.reward}
                </p>
              </div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-emerald-50 rotate-12">
                <span className="text-2xl block -rotate-12" role="img" aria-label="money">🎉</span>
              </div>
            </div>
          )}

          {/* Dropzone Hint */}
          {nearestDropzone && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group transition-all hover:border-blue-200 hover:shadow-md cursor-pointer" onClick={() => router.push(`/dropzone/${qrId}`)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-16 translate-x-16 transition-transform group-hover:scale-110" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-[1rem] bg-[#3b5034] flex items-center justify-center shrink-0 shadow-md">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Secure Dropzone Nearby</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">
                      {formatDistance(nearestDropzone.distance)}
                    </span>
                  </div>
                  <p className="text-gray-900 font-bold mb-1">{nearestDropzone.name}</p>
                  <p className="text-gray-500 text-xs line-clamp-1">{nearestDropzone.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="pt-2">
            {/* Location Request Banner for Finders (Until Captured) */}
            {user?.uid !== qrData?.ownerId && !finderLocation && (
              <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-6 mb-4 text-center shadow-lg shadow-orange-900/5 animate-bounce-subtle">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4 border border-orange-100">
                   <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1 italic underline decoration-orange-300">Location Required</h3>
                <p className="text-[11px] text-gray-600 font-medium mb-5 leading-tight px-4">
                  Sharing your real-time location helps the owner find their item faster. Your identity remains 100% hidden.
                </p>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      toast.loading('Activating digital tracker...', { id: 'loc' });
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          toast.success('Owner notified of target coordinates!', { id: 'loc' });
                          const { latitude, longitude } = pos.coords;
                          setFinderLocation({ lat: latitude, lng: longitude });
                          setLocationCaptured(false);
                        },
                        (err) => {
                          if (err.code === 1) toast.error('Check browser location toggle.', { id: 'loc' });
                          else toast.error('Try moving outdoors for better signal.', { id: 'loc' });
                        },
                        { enableHighAccuracy: true, timeout: 5000 }
                      );
                    }
                  }}
                  className="w-full bg-orange-500 text-white font-black px-6 py-4 rounded-[1.5rem] shadow-xl shadow-orange-500/20 hover:scale-[1.03] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-[0_0_10px_white]" />
                  Share Current Location
                </button>
              </div>
            )}

            {/* Location Shared confirmation */}
            {finderLocation && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 flex items-center justify-center gap-2 animate-fade-in shadow-sm">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Target Coordinates Transmitted</span>
              </div>
            )}

            <p className="text-center text-gray-500 text-xs font-medium mb-4 px-4 bg-gray-50 border border-gray-100 py-3 rounded-xl border-dashed">
              Return this anonymously. We do not expose your personal details to the owner.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleStartChat}
                disabled={startingChat}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#3b5034] hover:bg-blue-800 text-white py-4 px-2 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
              >
                {startingChat ? (
                  <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <MessageCircle className="w-6 h-6" />
                )}
                <span className="text-xs">{startingChat ? 'Connecting...' : 'Secure Chat'}</span>
              </button>

              <button
                onClick={() => router.push(`/dropzone/${qrId}`)}
                className="flex-1 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 py-4 px-2 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <MapPin className="w-6 h-6 text-[#3b5034]" />
                <span className="text-xs">Find Dropzone</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-10 text-center flex flex-col items-center gap-2 relative z-10">
        <div className="flex items-center gap-2 text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Verified Return System</span>
        </div>
        <p className="text-[11px] text-gray-500 font-medium">Your identity is protected by end-to-end encryption.</p>
      </div>
    </div>
  );
}
