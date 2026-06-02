'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, ArrowLeft, Loader2, CheckCircle2, Copy, ShieldCheck, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { getDistance } from '@/lib/utils';
import clsx from 'clsx';

// Dynamically import map without SSR to prevent window/navigator undefined errors
const DropzoneMap = dynamic(() => import('@/components/DropzoneMap'), { ssr: false });

export default function DropzonePage() {
  const { qrId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dropzones, setDropzones] = useState([]);
  const [qrData, setQrData] = useState(null);

  const [submittingId, setSubmittingId] = useState(null);
  const [successOTP, setSuccessOTP] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestId, setNearestId] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!qrId) return;

        // Fetch QR details to get ownerId
        const qrRef = doc(db, 'qrcodes', qrId);
        const qrSnap = await getDoc(qrRef);
        if (qrSnap.exists() && qrSnap.data().status === 'active') {
          setQrData(qrSnap.data());
        }

        // Fetch Dropzones
        const dzSnap = await getDocs(collection(db, 'dropzones'));
        setDropzones(dzSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [qrId]);

  useEffect(() => {
    if (dropzones.length === 0 || userLocation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        let closestId = null;
        let minDistance = Infinity;

        dropzones.forEach(dz => {
          const dist = getDistance(latitude, longitude, dz.lat, dz.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = dz.id;
          }
        });
        setNearestId(closestId);
      });
    }
  }, [dropzones, userLocation]);

  const handleSelectDropzone = async (dropzoneId) => {
    if (!qrId || !qrData) return;
    setSubmittingId(dropzoneId);

    try {
      // 1. Get/verify finder ID
      let finderId = localStorage.getItem('ghost_finder_id');
      if (!finderId) {
        finderId = 'finder_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ghost_finder_id', finderId);
      }

      // 2. Generate random 6 character OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Create drop submission document
      await addDoc(collection(db, 'dropSubmissions'), {
        qrId,
        itemName: qrData.itemName || 'Unnamed Item',
        ownerId: qrData.ownerId,
        finderId,
        dropzoneId,
        status: 'pending',
        otp,
        createdAt: serverTimestamp()
      });

      // 4. Send notification to owner
      await addDoc(collection(db, 'notifications'), {
        userId: qrData.ownerId,
        title: 'Item Submitted to Dropzone',
        message: 'Your item has been submitted to a dropzone. Check the app for location and picking instructions.',
        type: 'dropzone',
        read: false,
        timestamp: serverTimestamp()
      });

      // 5. Show success screen
      setSuccessOTP(otp);

    } catch (err) {
      console.error('Error submitting to dropzone:', err);
      toast.error('Failed to submit item. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
           <MapPin className="w-8 h-8 text-[#0f4bb9] animate-bounce" />
        </div>
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Locating Dropzones...</p>
      </div>
    );
  }

  if (successOTP) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        
        {/* Decorative elements */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative z-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Item Submitted!</h1>
          <p className="text-gray-500 text-sm mb-8 font-medium max-w-[280px] mx-auto leading-relaxed">
            Hand over your item to the Zone Manager and tell them this code to verify the secure drop-off.
          </p>

          <div className="bg-[#0f4bb9] rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-lg shadow-blue-900/10 group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-2xl rounded-full translate-x-20 -translate-y-10" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 blur-xl rounded-full -translate-x-10 translate-y-10" />
             
             <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                   <ShieldCheck className="w-3 h-3" /> Secure Verification Code
                </p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-5xl sm:text-6xl font-black text-white tracking-[0.1em]">{successOTP}</p>
                </div>
                <button 
                   onClick={() => {
                     navigator.clipboard.writeText(successOTP);
                     toast.success('Code Copied!');
                   }}
                   className="mt-4 px-4 py-2 rounded-xl bg-white text-[#0f4bb9] font-bold text-xs hover:bg-blue-50 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                 >
                   <Copy className="w-4 h-4" /> Copy Code
                </button>
             </div>
          </div>

          <div className="space-y-4 text-left bg-gray-50/50 border border-gray-100 p-5 rounded-2xl">
             <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black shadow-sm">1</div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">Show this page and hand over the item to the <span className="font-bold text-gray-900">authorized staff</span> at the dropzone desk.</p>
             </div>
             <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black shadow-sm">2</div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">The owner will be automatically notified once the item is logged by staff into the secure vault.</p>
             </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl py-4 font-bold tracking-wide transition-all active:scale-[0.98] border border-gray-200"
          >
            I'm Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:p-8 px-0 h-[100dvh]">
      
      {/* Decorative desktop elements */}
      <div className="hidden md:block absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto flex flex-col h-full bg-white md:border border-gray-100 md:rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">

        {/* Header */}
        <div className="p-4 md:p-6 flex items-center gap-4 bg-white border-b border-gray-100 shrink-0 z-20 shadow-sm relative">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-0.5">
                <Navigation className="w-4 h-4 text-[#0f4bb9]" />
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-none">Select Secure Dropzone</h1>
             </div>
            <p className="text-xs font-medium text-gray-500">Choose a partnered location to safely stash the {qrData?.itemName || 'item'}</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Partners
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 p-0 relative overflow-hidden bg-gray-100">
           {/* Loader Overlay */}
           {loading && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                 <Loader2 className="w-10 h-10 text-[#0f4bb9] animate-spin mb-4" />
                 <p className="font-bold text-gray-600 text-sm tracking-widest uppercase">Initializing Map...</p>
             </div>
           )}
           <DropzoneMap
             dropzones={dropzones}
             onSelectDropzone={handleSelectDropzone}
             submittingId={submittingId}
             userLocation={userLocation}
           />
        </div>

      </div>
    </div>
  );
}
