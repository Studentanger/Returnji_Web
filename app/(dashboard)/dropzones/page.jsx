'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin } from 'lucide-react';

const DropzoneMap = dynamic(() => import('@/components/DropzoneMap'), { ssr: false, loading: () => <div className="w-full h-full rounded-2xl bg-gray-100 animate-pulse" /> });

export default function DropzonesPage() {
  const [dropzones, setDropzones] = useState([]);

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
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
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
  );
}
