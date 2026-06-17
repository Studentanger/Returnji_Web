'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DropzoneMap = dynamic(() => import('@/components/DropzoneMap'), { ssr: false, loading: () => <div className="w-full h-full rounded-2xl bg-gray-100 animate-pulse" /> });

export default function DropzonesPage() {
  const [dropzones, setDropzones] = useState([]);
  const router = useRouter();

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
    <>
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden lg:block max-w-6xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Secure Dropzones
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-tight mt-2">
              Find the nearest Returnji dropzone to drop off or collect items safely.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Coverage Network</h3>
                <p className="text-sm text-gray-500 font-medium">Active monitoring in these locations</p>
              </div>
            </div>
            <span className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="h-[400px] md:h-[600px] rounded-2xl overflow-hidden border border-gray-100 relative bg-gray-100">
            <DropzoneMap dropzones={dropzones} zoom={12} scrollWheelZoom={true} />
          </div>
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="lg:hidden fixed inset-0 z-40 bg-white pb-[70px] flex flex-col">
        {/* Custom Mobile Header */}
        <div className="bg-white px-4 py-3 flex items-center gap-4 shadow-sm z-10 relative">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-[17px] font-bold text-gray-900 flex items-center gap-2 leading-tight">
              <Navigation className="w-[18px] h-[18px] text-blue-600 flex-shrink-0" /> Select Secure Dropzone
            </h1>
            <p className="text-[12px] text-gray-500 font-medium mt-0.5 leading-tight pr-2">
              Choose a partnered location to safely stash the Bottle
            </p>
          </div>
        </div>

        {/* Full-bleed Map */}
        <div className="flex-1 relative z-0 bg-gray-100">
          <DropzoneMap dropzones={dropzones} zoom={15} scrollWheelZoom={true} />
        </div>
      </div>
    </>
  );
}
