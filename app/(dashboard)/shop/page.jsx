'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart, QrCode, ArrowUpDown, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const products = [
   {
      id: 'Ghost-stickers',
      name: 'Ghost QR Stickers',
      description: '1 weather-proof industrial grade sticker. Perfect for bottles, documents, backpacks and flat surfaces.',
      price: 29.00,
      image: '/GhostQR.png', // Sticker representation
      badge: 'Best Seller',
      badgeColor: 'bg-teal-100 text-teal-700',
   },
   {
      id: 'keychains',
      name: 'Ghost QR Keychain',
      description: 'Laser-etched aerospace-grade acrylic tag for keys and backpacks. Indestructible.',
      price: 89.00,
      image: '/keychain_1.png', // keychain representation
      badge: 'Premium',
      badgeColor: 'bg-indigo-100 text-indigo-700',
   },
   {
      id: 'travel-bundle',
      name: 'Ultimate Travel Kit',
      description: 'Includes 2 Ghost QR Keychains and 10 Ghost QR Stickers. Complete protection for your next trip.',
      price: 369.00,
      image: '/bundle_mockup.png', // travel kit representation
      badge: 'Save 20%',
      badgeColor: 'bg-blue-100 text-blue-700',
   },
   {
      id: 'sticker-bundle',
      name: 'Sticker Bundle',
      description: 'Pack of 10 weather-proof industrial grade stickers. Perfect for bottles, and flat surfaces.',
      price: 239,
      image: 'sticker_mockup.png', // pet tag reference
      badge: 'Bundle Save 20%',
   },
   {
      id: 'customize-sticker',
      name: 'Customize Your QR-Sticker',
      description: 'Design your own QR sticker with custom colors, sizes, and more.',
      price: 29.00,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400', // laptop back reference
      badge: 'New Arrival',
      badgeColor: 'bg-emerald-100 text-emerald-700',
   },
   {
      id: 'customize-keychain',
      name: 'Customize Your QR-Keychain',
      description: 'Design your own QR keychain with custom colors, sizes, and more.',
      price: 129.00,
      image: 'https://images.unsplash.com/photo-1627384113972-f4c0392fe5aa?auto=format&fit=crop&q=80&w=400', // leather wallet reference
      badge: 'New Arrival',
      badgeColor: 'bg-emerald-100 text-emerald-700',
   },
];

export default function ShopPage() {
   const { user } = useAuth();
   const { addToCart } = useCart();
   const router = useRouter();
   const [ordering, setOrdering] = useState(false);
   const [qrs, setQrs] = useState([]);
   const [loadingQrs, setLoadingQrs] = useState(true);

   // Modal State
   const [selectedProduct, setSelectedProduct] = useState(null);
   const [selectedQrId, setSelectedQrId] = useState('');
   const [activeTab, setActiveTab] = useState('All Products');
   const [sortBy, setSortBy] = useState('Popular'); // Popular, Price: Low to High, Price: High to Low

   useEffect(() => {
      if (!user) return;
      const qrQuery = query(collection(db, 'qrcodes'), where('ownerId', '==', user.uid));
      const unsub = onSnapshot(qrQuery, (snap) => {
         const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
         setQrs(data);
         setLoadingQrs(false);
      }, (err) => {
         console.error(err);
         setLoadingQrs(false);
      });
      return () => unsub();
   }, [user]);

   const initiateOrder = (product) => {
      router.push(`/checkout?productId=${product.id}`);
   };

   // Filtering and Sorting Logic
   const filteredProducts = products.filter(p => {
      if (activeTab === 'All Products') return true;
      if (activeTab === 'Stickers') return p.id.includes('stickers') || p.id.includes('skin');
      if (activeTab === 'Keychains') return p.id.includes('keychains');
      if (activeTab === 'Bundles') return p.id.includes('bundle');
      if (activeTab === 'Customize') return p.id.includes('customize');
      return true;
   });

   const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      return 0; // Default: Popular (original order)
   });

   const toggleSort = () => {
      const sorts = ['Popular', 'Price: Low to High', 'Price: High to Low'];
      const nextIdx = (sorts.indexOf(sortBy) + 1) % sorts.length;
      setSortBy(sorts[nextIdx]);
   };

   return (
      <div className="max-w-6xl mx-auto pb-16">

         {/* Search Header Area */}
         {/* Already in layout, but leaving vertical space here if needed, or we adapt the top */}

         {/* Hero Banner inside the content */}
         {/* <div className="bg-[#0f4bb9] rounded-[2rem] p-0 flex flex-col md:flex-row items-center overflow-hidden mb-8 shadow-xl shadow-blue-900/10 h-auto md:h-80 w-[calc(100%+32px)] -ml-4 sm:ml-0 sm:w-full">

            {/* <div className="p-10 md:w-1/2 z-10">
               <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                  Limited Edition
               </div>
               <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                  Secure What <br /> Matters
               </h1>
               <p className="text-blue-100 mb-8 max-w-sm">
                  Premium hardware tags with unique QR identifiers. Connect your valuables to our digital concierge in seconds.
               </p>
               <div className="flex items-center gap-4">
                  <button className="bg-white text-[#0f4bb9] px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                     Explore Bundles
                  </button>
                  <button className="bg-transparent text-white border border-white/30 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                     How it works
                  </button>
               </div>
            </div> */}

         {/* <div className="md:w-1/2 h-64 md:h-full relative w-full border-t md:border-t-0 md:border-l border-white/10 bg-black/20">
               <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="w-48 h-48 rounded-full border-4 border-white/30 flex flex-col items-center justify-center relative backdrop-blur-sm shadow-2xl">
                     {/* Decorative internal circles */}
         {/* <div className="absolute inset-2 border-2 border-white/10 rounded-full" />
                     <div className="absolute inset-4 border border-white/5 rounded-full" />

                     <span className="text-white/60 font-bold uppercase tracking-widest text-xs mb-1">Safe</span>
                     <span className="text-white font-bold tracking-wider text-sm whitespace-nowrap">Safe For Work</span>
                     <div className="mt-3 text-white/50">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1 14H11v2h2v-2zm0-10H11v8h2V6z" />
                        </svg>
                     </div>
                  </div> */}

         {/* Reflection element */}
         {/* <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-10 w-3/4 h-1 bg-white/20 blur-sm rounded-full" />
               </div>
            </div>
         </div> */}

         {/* Filtering Navigation */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
               {['All Products', 'Stickers', 'Keychains', 'Bundles', 'Customize'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab
                        ? 'bg-blue-50 text-[#0f4bb9]'
                        : 'text-gray-500 hover:bg-gray-100'
                        }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
               {/* <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  <SlidersHorizontal className="w-4 h-4" /> Filter
               </button> */}
               <button
                  onClick={toggleSort}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
               >
                  <ArrowUpDown className="w-4 h-4" /> Sort: {sortBy}
               </button>
            </div>
         </div>

         {/* Products Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 px-2">
            {sortedProducts.map(product => (
               <div key={product.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_45px_-15px_rgba(0,0,0,0.15)] flex flex-col group hover:shadow-[0_30px_60px_-15px_rgba(15,75,185,0.15)] hover:-translate-y-2 transition-all duration-500 ease-out relative border border-white">

                  {/* Product Image Area */}
                  <div className="h-64 rounded-[2rem] m-3 mb-0 bg-gray-50 relative overflow-hidden shadow-inner">
                     <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                     {product.badge && (
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${product.badgeColor || 'bg-white/80 text-gray-900 border border-white/20'}`}>
                           {product.badge}
                        </div>
                     )}
                  </div>

                  {/* Product Body */}
                  <div className="p-5 flex-1 flex flex-col">
                     <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
                        <span className="font-bold text-[#0f4bb9] text-lg shrink-0">₹{product.price.toFixed(2)}</span>
                     </div>

                     <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-1">
                        {product.description}
                     </p>

                     <div className="flex items-center gap-3 mt-auto">
                        <button
                           onClick={() => initiateOrder(product)}
                           className="flex-1 bg-[#0f4bb9] hover:bg-blue-800 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
                        >
                           Buy Now
                        </button>
                        <button
                           onClick={() => addToCart(product)}
                           className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0"
                        >
                           <ShoppingCart className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Load More Button */}
         {/* <div className="flex justify-center mb-16">
            <button className="bg-white border text-sm font-bold border-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all shadow-sm">
               Load More Products
            </button>
         </div> */}

         {/* Footer Banner */}
         <div className="bg-gray-50 border-t border-gray-100 rounded-3xl p-12 text-center w-[calc(100%+32px)] -ml-4 sm:ml-0 sm:w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Never lose anything again.</h2>
            {/* <p className="text-gray-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Join <span className="font-bold text-gray-900">50,000+</span> users who trust Returnji to protect their valuables. Get 10% off your first order when you sign up.
         </p> */}

            <form className="max-w-md mx-auto flex gap-3">
               <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
               />
               <button type="button" className="bg-[#0f4bb9] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">
                  Subscribe
               </button>
            </form>
         </div>

      </div>
   );
}
