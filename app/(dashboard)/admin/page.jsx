'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, QrCode, ShoppingBag, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Download, MapPin, Plus, Trash2, Search, FileText,
  PackageCheck, Key, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { setDoc } from 'firebase/firestore';


const statusBadge = (status, collection = 'qr') => {
  const map = {
    created: 'status-created',
    printed: 'status-printed',
    delivered: 'status-delivered',
    pending: 'status-pending',
    ready: 'status-ready',
    user: 'bg-blue-50 text-blue-700',
    admin: 'bg-yellow-100 text-yellow-700',
  };
  return <span className={`badge ${map[status] || 'status-created'}`}>{status}</span>;
};

export default function AdminPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [qrs, setQrs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dropzones, setDropzones] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Dropzone Form State
  const [newDzName, setNewDzName] = useState('');
  const [newDzLat, setNewDzLat] = useState('');
  const [newDzLng, setNewDzLng] = useState('');
  const [newDzAddress, setNewDzAddress] = useState('');
  const [submittingDz, setSubmittingDz] = useState(false);
  const [fetchingCoords, setFetchingCoords] = useState(false);

  // QR Generation State
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateType, setGenerateType] = useState('sticker'); // 'sticker' or 'keychain'
  const [generateFrom, setGenerateFrom] = useState('');
  const [generateTo, setGenerateTo] = useState('');
  const [generatingQrs, setGeneratingQrs] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);

  useEffect(() => {
    if (!userData) return;
    if (userData.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubQrs = onSnapshot(
      query(collection(db, 'qrcodes'), orderBy('createdAt', 'desc')),
      snap => setQrs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders')),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubDropzones = onSnapshot(
      query(collection(db, 'dropzones')),
      snap => setDropzones(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubSubmissions = onSnapshot(
      query(collection(db, 'dropSubmissions')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Client-side sort to support both old and new field names efficiently
        docs.sort((a, b) => (b.createdAt?.toMillis() || b.timestamp?.toMillis() || 0) - (a.createdAt?.toMillis() || a.timestamp?.toMillis() || 0));
        setSubmissions(docs);
      }
    );

    return () => {
      unsubUsers(); unsubQrs(); unsubOrders(); unsubDropzones(); unsubSubmissions();
    };
  }, [userData, router]);

  const updateQrStatus = async (id, ownerId, itemName, status) => {
    try {
      await updateDoc(doc(db, 'qrcodes', id), { status });

      if (ownerId) {
        let displayStatus = status;
        if (status === 'printed') displayStatus = 'ready';

        await addDoc(collection(db, 'notifications'), {
          userId: ownerId,
          title: 'Product Status Updated',
          message: `Your product for ${itemName || 'item'} is now ${displayStatus}.`,
          type: 'qr',
          read: false,
          timestamp: serverTimestamp()
        });
      }

      toast.success(`QR status → ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const updateOrderStatus = async (orderId, userId, productType, status, qrId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });

      // Auto-activate QR code if order is delivered
      if (status === 'delivered' && qrId) {
        await updateDoc(doc(db, 'qrcodes', qrId), { status: 'active' });
        toast.success(`QR Profile ${qrId.slice(0, 8)} activated!`);
      }

      if (userId) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'Order Status Updated',
          message: `Your order for ${productType || 'item'} is now ${status}.${status === 'delivered' ? ' Your Returnji is now ACTIVE!' : ''}`,
          type: 'order',
          read: false,
          timestamp: serverTimestamp()
        });
      }
      toast.success(`Order status → ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const fetchCoordinates = async () => {
    if (!newDzName) return toast.error('Enter a location name first');
    setFetchingCoords(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newDzName)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setNewDzLat(data[0].lat);
        setNewDzLng(data[0].lon);
        if (!newDzAddress) setNewDzAddress(data[0].display_name);
        toast.success('Coordinates found!');
      } else {
        toast.error('Location not found. Please enter manually.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch coordinates');
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleAddDropzone = async (e) => {
    e.preventDefault();
    if (!newDzName || !newDzLat || !newDzLng) return toast.error('Name, Lat, and Lng are required');
    setSubmittingDz(true);
    try {
      await addDoc(collection(db, 'dropzones'), {
        name: newDzName,
        lat: parseFloat(newDzLat),
        lng: parseFloat(newDzLng),
        address: newDzAddress,
        createdAt: serverTimestamp()
      });
      toast.success('Dropzone added successfully!');
      setNewDzName('');
      setNewDzLat('');
      setNewDzLng('');
      setNewDzAddress('');
    } finally {
      setSubmittingDz(false);
    }
  };

  const handleReceiveItem = async (submission) => {
    const enteredOtp = window.prompt(`Enter Finder's OTP for ${submission.itemName}:`);
    if (!enteredOtp) return;

    if (enteredOtp !== submission.otp) {
      return toast.error("Invalid OTP! Item cannot be received.");
    }

    try {
      // 1. Generate new OTP for Owner
      const ownerOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Update submission status
      await updateDoc(doc(db, 'dropSubmissions', submission.id), {
        status: 'received',
        ownerOtp: ownerOtp,
        receivedAt: serverTimestamp()
      });

      // 3. Find dropzone name for notification
      const dz = dropzones.find(d => d.id === submission.dropzoneId);
      const zoneName = dz?.name || 'the dropzone';

      // 4. Notify Owner
      await addDoc(collection(db, 'notifications'), {
        userId: submission.ownerId,
        title: 'Item Received at Dropzone!',
        message: `Your item "${submission.itemName}" has been safely received at ${zoneName}. You can collect it using OTP: ${ownerOtp}`,
        type: 'dropzone',
        read: false,
        timestamp: serverTimestamp()
      });

      toast.success("Item received! Owner has been notified.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to receive item.");
    }
  };

  const handleCompleteReturn = async (submission) => {
    const enteredOtp = window.prompt(`Enter Owner's OTP to release ${submission.itemName}:`);
    if (!enteredOtp) return;

    if (enteredOtp !== submission.ownerOtp) {
      return toast.error("Invalid OTP! Item cannot be released.");
    }

    try {
      // 1. Update submission status to 'returned'
      await updateDoc(doc(db, 'dropSubmissions', submission.id), {
        status: 'returned',
        returnedAt: serverTimestamp()
      });

      // 2. Reactivate the QR code
      if (submission.qrId) {
        await updateDoc(doc(db, 'qrcodes', submission.qrId), {
          status: 'active'
        });
      }

      // 3. Notify Owner of success
      await addDoc(collection(db, 'notifications'), {
        userId: submission.ownerId,
        title: 'Item Recovered!',
        message: `Your item "${submission.itemName}" has been successfully returned to you. Your Returnji is now ACTIVE!`,
        type: 'qr',
        read: false,
        timestamp: serverTimestamp()
      });

      toast.success("Item returned successfully! QR Reactivated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete return.");
    }
  };

  const deleteDropzone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dropzone?')) return;
    try {
      await deleteDoc(doc(db, 'dropzones', id));
      toast.success('Dropzone deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete dropzone');
    }
  };

  const sanitizeFilePart = (value) =>
    (value || 'qr-code')
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const downloadQR = (qrId, itemName) => {
    const svg = document.getElementById(`qr-svg-${qrId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgMarkup = svgData.includes('xmlns="http://www.w3.org/2000/svg"')
      ? svgData
      : svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const fileName = `Returnji-${sanitizeFilePart(itemName)}-${qrId.slice(0, 8)}.svg`;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadTag = async (qr) => {
    const ownerName = users.find(u => u.id === qr.ownerId)?.name || 'Ghost User';

    const svg = document.getElementById(`qr-svg-${qr.id}`);
    if (!svg) return toast.error('QR code not found');

    const svgData = new window.XMLSerializer().serializeToString(svg);
    const svgMarkup = svgData.includes('xmlns="http://www.w3.org/2000/svg"')
      ? svgData
      : svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

    const qrBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const qrUrl = URL.createObjectURL(qrBlob);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = '/sticker_new.png';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const qrImg = new Image();
      qrImg.onload = () => {
        // The sticker_new.png design is exactly 2 inches wide
        const dpi = canvas.width / 2.0;
        const qrSize = 0.68 * dpi;
        const x = 0.76 * dpi;
        const y = 0.76 * dpi;

        const rotateRad = 0; // Rotate 0 as requested

        ctx.save();
        ctx.translate(x + qrSize / 2, y + qrSize / 2);
        ctx.rotate(rotateRad);

        // Draw white background if needed (optional since the template background is off-white)
        // ctx.fillStyle = "#FFFFFF";
        // ctx.fillRect(-qrSize / 2, -qrSize / 2, qrSize, qrSize);

        ctx.drawImage(qrImg, -qrSize / 2, -qrSize / 2, qrSize, qrSize);
        ctx.restore();

        // Removed owner name text as per new template

        const finalUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = finalUrl;
        const typeStr = qr.type || (qr.id.startsWith('st') ? 'sticker' : 'keychain');
        link.download = `Returnji-${typeStr}-${qr.id}.png`;
        link.click();

        URL.revokeObjectURL(qrUrl);
      };
      qrImg.src = qrUrl;
    };
    img.onerror = () => toast.error('Please save template.png or sticker_new.png to the public folder first!');
  };

  const downloadAllTagsAsZip = async (currentFilteredQrs, tabName) => {
    if (currentFilteredQrs.length === 0) return toast.error('No tags to download');

    setGeneratingZip(true);
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = '/sticker_new.png';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Template image not found'));
      });

      for (const qr of currentFilteredQrs) {
        const svg = document.getElementById(`qr-svg-${qr.id}`);
        if (!svg) continue;

        const svgData = new window.XMLSerializer().serializeToString(svg);
        const svgMarkup = svgData.includes('xmlns="http://www.w3.org/2000/svg"')
          ? svgData
          : svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

        const qrBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
        const qrUrl = URL.createObjectURL(qrBlob);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const qrImg = new Image();
        qrImg.src = qrUrl;

        await new Promise((resolve) => {
          qrImg.onload = () => {
            const dpi = canvas.width / 2.0;
            const qrSize = 0.68 * dpi;
            const x = 0.76 * dpi;
            const y = 0.76 * dpi;

            ctx.save();
            ctx.translate(x + qrSize / 2, y + qrSize / 2);
            ctx.drawImage(qrImg, -qrSize / 2, -qrSize / 2, qrSize, qrSize);
            ctx.restore();

            const finalUrl = canvas.toDataURL('image/png');
            const base64Data = finalUrl.replace(/^data:image\/png;base64,/, "");
            const typeStr = qr.type || (qr.id.startsWith('st') ? 'sticker' : 'keychain');
            zip.file(`Returnji-${typeStr}-${qr.id}.png`, base64Data, { base64: true });
            URL.revokeObjectURL(qrUrl);
            resolve();
          };
        });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Returnji-Tags-${tabName}.zip`);
      toast.success('Downloaded ZIP successfully');

    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ZIP');
    } finally {
      setGeneratingZip(false);
    }
  };

  const downloadOrderBill = async (order) => {
    const { jsPDF } = await import('jspdf');
    const orderUser = users.find(u => u.id === order.userId);
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237); // Ghost purple
    doc.text("RETURNJI - INVOICE", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: "center" });

    // Divider
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Bill Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Order Details", 20, 45);

    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: #${order.id.slice(0, 10)}`, 20, 55);
    doc.text(`Tracking ID: ${order.orderId || 'N/A'}`, 20, 62);
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 69);
    doc.text(`Date: ${order.createdAt?.toDate().toLocaleDateString() || 'N/A'}`, 20, 76);

    // Customer Details
    doc.setFont("helvetica", "bold");
    doc.text("Customer Info", 120, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${orderUser?.name || 'Ghost User'}`, 120, 55);
    doc.text(`Email: ${orderUser?.email || 'N/A'}`, 120, 62);

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 90, 170, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Product", 25, 96);
    doc.text("QR Link ID", 80, 96);
    doc.text("Price", 170, 96, { align: "right" });

    // Table Row
    doc.setFont("helvetica", "normal");
    doc.text(order.productType || 'QR Product', 25, 108);
    doc.text(order.qrId || 'N/A', 80, 108);
    doc.text(`INR ${order.amount || 0}.00`, 170, 108, { align: "right" });

    // Footer divider
    doc.line(20, 120, 190, 120);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 130, 130);
    doc.text(`INR ${order.amount || 0}.00`, 190, 130, { align: "right" });

    // Ghost Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for choosing Returnji. Protecting your belongings, invisibly.", 105, 280, { align: "center" });

    doc.save(`Returnji-Invoice-${order.id.slice(0, 8)}.pdf`);
  };

  const handleGenerateQrs = async (e) => {
    e.preventDefault();
    const from = parseInt(generateFrom);
    const to = parseInt(generateTo);
    if (isNaN(from) || isNaN(to) || from > to) return toast.error('Invalid range');
    if (to - from + 1 > 50) return toast.error('Max 50 QRs per generation');
    setGeneratingQrs(true);
    try {
      const prefix = generateType === 'sticker' ? 'st' : 'ky';
      for (let i = from; i <= to; i++) {
        const idStr = String(i).padStart(5, '0');
        const docId = `${prefix}${idStr}`;
        await setDoc(doc(db, 'qrcodes', docId), {
          qrId: docId,
          status: 'unregistered',
          type: generateType,
          createdAt: serverTimestamp()
        });
      }
      toast.success(`Generated ${to - from + 1} QRs successfully`);
      setGenerateModalOpen(false);
      setGenerateFrom('');
      setGenerateTo('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate QRs');
    } finally {
      setGeneratingQrs(false);
    }
  };



  if (!userData) return null;
  if (userData.role !== 'admin') return null;

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'qr_stickers', label: 'Stickers', icon: QrCode, count: qrs.filter(q => q.type === 'sticker' || q.id.startsWith('st')).length },
    { id: 'qr_keychains', label: 'Keychains', icon: QrCode, count: qrs.filter(q => q.type === 'keychain' || q.id.startsWith('ky')).length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'dropsubmissions', label: 'Drop Items', icon: PackageCheck, count: submissions.filter(s => s.status === 'pending').length },
    { id: 'dropzones', label: 'Dropzones', icon: MapPin, count: dropzones.length },
    { id: 'generate_qr', label: 'Generate QR', icon: QrCode, count: 0 },
  ];

  const maxStickerId = qrs.filter(q => q.id.startsWith('st')).reduce((max, q) => Math.max(max, parseInt(q.id.replace('st', '')) || 0), 0);
  const maxKeychainId = qrs.filter(q => q.id.startsWith('ky')).reduce((max, q) => Math.max(max, parseInt(q.id.replace('ky', '')) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-yellow-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage users, QR codes, and orders</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-primary-500 bg-primary-50', border: 'border-primary-100' },
          { label: 'QR Codes', value: qrs.length, icon: QrCode, color: 'text-blue-600 bg-gray-100', border: 'border-gray-200' },
          { label: 'Pending Orders', value: orders.filter(o => o.status !== 'delivered').length, icon: ShoppingBag, color: 'text-yellow-700 bg-yellow-50', border: 'border-yellow-100' },
        ].map(s => (
          <div key={s.label} className={clsx("stat-card p-6 flex items-center gap-5 border", s.border)}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl w-fit shadow-sm">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300',
              tab === t.id
                ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/30 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={clsx(
              'text-[10px] px-2 py-0.5 rounded-full font-black',
              tab === t.id ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-700'
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Users Table */}
            {tab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">User Info</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-widest">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-900">{u.name || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs hidden sm:table-cell">{u.email}</td>
                        <td className="px-5 py-4">{statusBadge(u.role || 'user')}</td>
                        <td className="px-5 py-4 text-right text-yellow-400 font-medium hidden md:table-cell">{u.ghostCoins ?? 0} 🪙</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* QR Codes Table */}
            {(tab === 'qr_stickers' || tab === 'qr_keychains') && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const filteredQrs = tab === 'qr_stickers' ? qrs.filter(q => q.type === 'sticker' || q.id.startsWith('st')) : qrs.filter(q => q.type === 'keychain' || q.id.startsWith('ky'));
                      downloadAllTagsAsZip(filteredQrs, tab);
                    }}
                    disabled={generatingZip}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0f4bb9] px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Download className={clsx("w-4 h-4", generatingZip && "animate-bounce")} />
                    <span>{generatingZip ? 'Bundling ZIP...' : `Download All ${tab === 'qr_stickers' ? 'Sticker' : 'Keychain'} Tags`}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Item Info</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-widest">Reward</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(tab === 'qr_stickers' ? qrs.filter(q => q.type === 'sticker' || q.id.startsWith('st')) : qrs.filter(q => q.type === 'keychain' || q.id.startsWith('ky'))).map(qr => (
                        <tr key={qr.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">{qr.itemName}</p>
                            <p className="text-xs text-gray-500 font-medium">{users.find(u => u.id === qr.ownerId)?.name || 'Ghost User'}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <select
                              value={qr.status}
                              onChange={(e) => updateQrStatus(qr.id, qr.ownerId, qr.itemName, e.target.value)}
                              className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 cursor-pointer hover:border-blue-400 transition-colors focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                              <option value="created">created</option>
                              <option value="printed">printed</option>
                              <option value="active">active</option>
                              <option value="found">found</option>
                              <option value="deactivated">deactivated</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-center text-yellow-600 font-medium">{qr.reward || 0} 🪙</td>
                          <td className="px-5 py-4 flex items-center justify-end gap-3">

                            <button
                              onClick={() => downloadQR(qr.id, qr.itemName)}
                              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                              title="Download SVG"
                            >
                              <Download className="w-4 h-4" />
                              <span>SVG</span>
                            </button>
                            <button
                              onClick={() => downloadTag(qr)}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
                              title="Download Templated PNG"
                            >
                              <Download className="w-4 h-4" />
                              <span>PNG Tag</span>
                            </button>
                            <div className="hidden">
                              <QRCodeSVG id={`qr-svg-${qr.id}`} value={`https://returnji-web.vercel.app/scan/${qr.id}`} size={400} level="H" fgColor="#000000" bgColor="#f1ede0" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders Table */}
            {tab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Order Details</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-widest">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{order.productType}</p>
                          <p className="text-xs text-gray-400 font-mono">ID: #{order.id.slice(0, 10)}</p>
                        </td>
                        <td className="px-5 py-4">{statusBadge(order.status)}</td>
                        <td className="px-5 py-4 text-gray-700 font-medium">INR {order.amount || 0}.00</td>
                        <td className="px-5 py-4 flex items-center justify-end gap-3">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, order.userId, order.productType, e.target.value, order.qrId)}
                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 cursor-pointer"
                          >
                            <option value="pending">pending</option>
                            <option value="ready">ready</option>
                            <option value="delivered">delivered</option>
                          </select>

                          <button
                            onClick={() => downloadOrderBill(order)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-blue-600 transition-all group"
                            title="Download Bill PDF"
                          >
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Dropzones Table & Form */}
            {tab === 'dropzones' && (
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* List */}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Active Dropzones</h3>
                    {dropzones.length === 0 ? (
                      <p className="text-sm text-gray-400">No dropzones configured yet.</p>
                    ) : (
                      <div className="grid gap-3">
                        {dropzones.map(dz => (
                          <div key={dz.id} className="glass p-4 flex items-center gap-4 bg-white/50">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <MapPin className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">{dz.name}</p>
                              <p className="text-xs text-gray-400 truncate">{dz.address || 'No address provided'}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{dz.lat}, {dz.lng}</p>
                            </div>
                            <button
                              onClick={() => deleteDropzone(dz.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                              title="Delete dropzone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Form */}
                  <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="glass p-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        Add New Dropzone
                      </h3>
                      <form onSubmit={handleAddDropzone} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Location Keywords</label>
                          <div className="flex gap-2">
                            <input required value={newDzName} onChange={e => setNewDzName(e.target.value)} className="ghost-input py-2 text-sm flex-1" placeholder="e.g. SRM University, Chennai" />
                            <button
                              type="button"
                              onClick={fetchCoordinates}
                              disabled={fetchingCoords}
                              className="p-2 rounded-lg bg-white border border-gray-200 hover:border-ghost-accent text-blue-700 hover:text-blue-600 transition-all disabled:opacity-50 shadow-sm"
                              title="Fetch Coordinates"
                            >
                              <Search className={clsx("w-4 h-4", fetchingCoords && "animate-spin")} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Latitude</label>
                            <input required type="number" step="any" value={newDzLat} onChange={e => setNewDzLat(e.target.value)} className="ghost-input py-2 text-sm font-mono" placeholder="Auto-filled" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Longitude</label>
                            <input required type="number" step="any" value={newDzLng} onChange={e => setNewDzLng(e.target.value)} className="ghost-input py-2 text-sm font-mono" placeholder="Auto-filled" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Address Context (Optional)</label>
                          <textarea value={newDzAddress} onChange={e => setNewDzAddress(e.target.value)} className="ghost-input py-2 text-sm min-h-[60px]" placeholder="Specific instructions for finding the drop box..." />
                        </div>
                        <button type="submit" disabled={submittingDz} className="btn-ghost w-full py-2 text-sm disabled:opacity-60">
                          {submittingDz ? 'Adding...' : 'Add Dropzone'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Drop Submissions Table */}
            {tab === 'dropsubmissions' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Item Info</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Dropzone</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-xs italic">
                          No drop submissions found.
                        </td>
                      </tr>
                    ) : submissions.map(s => {
                      const dz = dropzones.find(d => d.id === s.dropzoneId);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">{s.itemName || 'Unnamed Item'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {s.qrId.slice(0, 8)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700 text-xs">{dz?.name || 'Unknown Zone'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={clsx(
                              "badge text-[10px]",
                              s.status === 'pending' ? "status-pending" : "bg-green-500/20 text-green-400"
                            )}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {s.status === 'pending' ? (
                              <button
                                onClick={() => handleReceiveItem(s)}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/40"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                Receive From Finder
                              </button>
                            ) : s.status === 'received' ? (
                              <div className="flex flex-col items-end gap-2">
                                <button
                                  onClick={() => handleCompleteReturn(s)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-500 transition-all shadow-lg shadow-green-900/40"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Handover to Owner
                                </button>
                                <p className="text-[10px] text-gray-400">Owner OTP: <span className="text-gray-700 font-mono font-bold bg-gray-100 px-1 rounded">{s.ownerOtp}</span></p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold italic">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Returned to Owner
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Lifecycle Completed</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Generate QR Table */}
            {tab === 'generate_qr' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stickers Section */}
                  <div className="glass p-6 bg-white/50 border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                      <QrCode className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Stickers</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      {maxStickerId > 0 ? `Highest generated: st${String(maxStickerId).padStart(5, '0')}` : 'No qr generated yet'}
                    </p>
                    <button
                      onClick={() => { setGenerateType('sticker'); setGenerateModalOpen(true); }}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                    >
                      Generate Sticker QRs
                    </button>
                  </div>

                  {/* Keychains Section */}
                  <div className="glass p-6 bg-white/50 border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 shadow-sm border border-teal-100">
                      <Key className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Keychains</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      {maxKeychainId > 0 ? `Highest generated: ky${String(maxKeychainId).padStart(5, '0')}` : 'No qr generated yet'}
                    </p>
                    <button
                      onClick={() => { setGenerateType('keychain'); setGenerateModalOpen(true); }}
                      className="px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/30"
                    >
                      Generate Keychain QRs
                    </button>
                  </div>
                </div>

                {/* Generate Modal Overlay */}
                {generateModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                      <button onClick={() => setGenerateModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer basically, we can use X icon but we didn't import it */}
                        <span className="text-xl leading-none">&times;</span>
                      </button>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 capitalize">Generate {generateType}s</h3>
                      <p className="text-xs text-gray-500 mb-6">Enter sequence range (max 50 at a time).</p>

                      <form onSubmit={handleGenerateQrs} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From Number</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={generateFrom}
                              onChange={e => setGenerateFrom(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="e.g. 1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">To Number</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={generateTo}
                              onChange={e => setGenerateTo(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="e.g. 50"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Will generate IDs: {generateType === 'sticker' ? 'st' : 'ky'}{String(generateFrom || '1').padStart(5, '0')} to {generateType === 'sticker' ? 'st' : 'ky'}{String(generateTo || '50').padStart(5, '0')}
                        </p>
                        <button
                          type="submit"
                          disabled={generatingQrs}
                          className="w-full bg-[#0f4bb9] text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-all shadow-md mt-2 disabled:opacity-50"
                        >
                          {generatingQrs ? 'Generating...' : 'Confirm Generate'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
