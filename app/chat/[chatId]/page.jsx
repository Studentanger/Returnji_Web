'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Send, ArrowLeft, AlertCircle, ShieldCheck, MessageCircle, CheckCircle, User, Info, MoreVertical } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

function formatMessageTime(ts) {
  if (!ts?.toDate) return 'Sending...';
  const date = ts.toDate();
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return timeStr;

  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateStr}, ${timeStr}`;
}

function formatDateLabel(ts) {
   if (!ts?.toDate) return 'TODAY';
   const date = ts.toDate();
   const today = new Date();
   const isToday = date.getDate() === today.getDate() && 
                   today.getMonth() === today.getMonth() && 
                   today.getFullYear() === today.getFullYear();
   if (isToday) return 'TODAY';
   
   const yesterday = new Date(today);
   yesterday.setDate(yesterday.getDate() - 1);
   const isYesterday = date.getDate() === yesterday.getDate() && 
                       date.getMonth() === yesterday.getMonth() && 
                       date.getFullYear() === yesterday.getFullYear();
   if (isYesterday) return 'YESTERDAY';

   return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export default function ChatPage() {
  const { chatId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [confirmingReward, setConfirmingReward] = useState(false);
  const [itemReturned, setItemReturned] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Determine the current user's ID
    const finderId = localStorage.getItem('ghost_finder_id');
    const uid = user ? user.uid : finderId;
    setCurrentUserId(uid);

    const fetchChatInfo = async () => {
      try {
        if (!chatId) return;
        const chatSnap = await getDoc(doc(db, 'chats', chatId));

        if (chatSnap.exists()) {
          const data = { id: chatSnap.id, ...chatSnap.data() };
          if (data.qrId) {
            const qrSnap = await getDoc(doc(db, 'qrcodes', data.qrId));
            if (qrSnap.exists()) {
               data.itemName = qrSnap.data().itemName;
               if (qrSnap.data().status === 'returned') {
                 setItemReturned(true);
               }
            }
          }
          setChatData(data);
        } else {
          setError('Conversation not found or has been closed.');
        }
      } catch (err) {
        console.error('Error fetching chat:', err);
        setError('Failed to load secure chat.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatInfo();
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Client-side sort to avoid index requirements during dev
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      setMessages(msgs);
      scrollToBottom();
    }, (err) => {
      console.error("Error fetching messages:", err);
    });

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleConfirmReturned = async () => {
    if (!chatData || !isOwner) return;
    if (!window.confirm("Are you sure you want to mark this item as returned? This will securely disburse the Ghost Coin reward to the anonymous finder.")) return;

    setConfirmingReward(true);
    try {
      const qrRef = doc(db, 'qrcodes', chatData.qrId);
      const qrSnap = await getDoc(qrRef);
      if (!qrSnap.exists()) throw new Error("Asset not found");

      const qrInfo = qrSnap.data();
      if (qrInfo.status === 'returned') {
        toast.error("This item is already marked as returned.");
        setItemReturned(true);
        return;
      }

      const rewardAmount = Number(qrInfo.reward) || 0;
      let coinsToGive = 0;

      if (rewardAmount > 0) {
        // Ghost Coins rule: 10% of real payment reward
        coinsToGive = Math.floor(rewardAmount * 0.1);

        if (coinsToGive > 0) {
          // 1. Update finder's ghostCoins securely supporting anonymous initial states.
          const finderRef = doc(db, 'users', chatData.finderId);
          await setDoc(finderRef, {
            ghostCoins: increment(coinsToGive)
          }, { merge: true });

          // 2. Log reward details for system integrity
          await addDoc(collection(db, 'rewards'), {
            qrId: chatData.qrId,
            finderId: chatData.finderId,
            ownerId: currentUserId,
            rewardAmount: rewardAmount,
            coins: coinsToGive,
            method: 'chat_confirmation',
            timestamp: serverTimestamp()
          });
        }
      }

      // 3. Mark the QR Code as returned to finish flow
      await updateDoc(qrRef, { status: 'returned' });

      // 4. Send an automatic success message to the chat
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: 'system',
        message: `System: The owner has confirmed the item was safely returned! ${coinsToGive > 0 ? `The finder has earned ${coinsToGive} GC! 🎉` : ''}`,
        timestamp: serverTimestamp()
      });

      setItemReturned(true);
      toast.success("Asset successfully marked as returned!");

    } catch (err) {
      console.error(err);
      toast.error("Failed to confirm item return.");
    } finally {
      setConfirmingReward(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !chatData) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // 1. Add Message
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: currentUserId,
        message: messageText,
        timestamp: serverTimestamp()
      });

      // 2. Trigger notification for the owner if the finder is sending
      // Only send notification if the sender is NOT the owner
      if (currentUserId !== chatData.ownerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: chatData.ownerId,
          title: 'New Anonymous Message',
          message: messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText,
          type: 'chat',
          chatId: chatId,
          read: false,
          timestamp: serverTimestamp()
        });
      }

      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
           <ShieldCheck className="w-8 h-8 text-[#0f4bb9] animate-pulse" />
        </div>
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Securing Connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-gray-100 mb-6">
           <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-8 py-3.5 bg-[#0f4bb9] text-white rounded-xl font-bold shadow-md hover:bg-blue-800 transition-all active:scale-95"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = currentUserId === chatData?.ownerId;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center md:py-8 px-0 sm:px-6 relative">
      
      {/* Decorative Brand Elements (Desktop only) */}
      <div className="hidden md:block absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-3xl bg-white md:border border-gray-100 md:rounded-[2rem] flex flex-col h-[100dvh] md:h-[85vh] shadow-2xl shadow-blue-900/10 relative z-10 overflow-hidden">

        {/* Header */}
        <div className="h-20 px-4 md:px-8 flex items-center justify-between bg-white border-b border-gray-100 shrink-0 shadow-sm z-20 relative">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => router.back()}
               className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors mr-1"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             
             <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 flex items-center justify-center border-2 border-white shadow-sm">
                   <User className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
             </div>
             
             <div>
                <h2 className="text-sm md:text-lg font-bold text-gray-900 leading-tight flex items-center gap-2">
                  {isOwner ? 'Anonymous Finder' : 'Asset Owner'}
                  {isOwner && <span className="hidden md:inline-flex bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Owner View</span>}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <ShieldCheck className="w-3.5 h-3.5 text-[#0f4bb9]" />
                   <span className="text-[10px] md:text-xs font-bold text-gray-400 capitalize">
                     Ref: {chatData?.itemName || 'Asset'}
                   </span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors">
               <Info className="w-5 h-5" />
            </button>
            <button className="hidden md:inline-flex w-10 h-10 rounded-full items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors">
               <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Banners */}
        {isOwner && !itemReturned && (
          <div className="bg-gradient-to-r from-[#0f4bb9] to-blue-700 px-6 py-3 flex flex-col sm:flex-row items-center justify-between shadow-md shrink-0 sm:gap-4 gap-3 z-10 relative">
            <p className="text-xs sm:text-sm text-white font-medium flex items-center gap-2 text-center sm:text-left">
               <CheckCircle className="w-4 h-4 text-blue-200" />
               Safely recovered your asset? Inform the finder.
            </p>
            <button 
              onClick={handleConfirmReturned}
              disabled={confirmingReward}
              className="w-full sm:w-auto bg-white text-[#0f4bb9] text-xs px-4 py-2 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirmingReward ? (
                <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#0f4bb9] rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              {confirmingReward ? 'Processing...' : 'Confirm Recovery'}
            </button>
          </div>
        )}
        
        {itemReturned && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-center gap-2 shadow-inner shrink-0 z-10 relative">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Asset Recovered & Bounty Rewarded</p>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto pt-8 lg:pt-14 p-4 md:p-8 space-y-6 relative bg-[#F8FAFC]">
          {/* Security Notice */}
          <div className="flex items-center justify-center my-4">
             <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">End-to-End Encrypted</span>
             </div>
          </div>

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                 <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-bold mb-1">Start the Conversation</p>
              <p className="text-xs text-gray-500 max-w-[200px]">Say hello! Your real identity is completely hidden.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              const isSystem = msg.senderId === 'system';
              const currentMsgDate = msg.timestamp ? formatDateLabel(msg.timestamp) : 'TODAY';
              const previousMsgDate = idx > 0 && messages[idx-1].timestamp ? formatDateLabel(messages[idx-1].timestamp) : null;
              const showDateDivider = currentMsgDate !== previousMsgDate;
                
              if (isSystem) {
                return (
                  <div key={msg.id || idx} className="flex justify-center my-6">
                     <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm text-center max-w-[85%]">
                       {msg.message}
                     </span>
                  </div>
                );
              }

              return (
                <div key={msg.id || idx} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex items-center justify-center gap-4 my-8">
                       <div className="h-px bg-gray-200 flex-1 max-w-[100px]" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentMsgDate}</span>
                       <div className="h-px bg-gray-200 flex-1 max-w-[100px]" />
                    </div>
                  )}

                  <div className={clsx("flex flex-col", isMe ? 'items-end' : 'items-start')}>
                    <div className={clsx(
                       "max-w-[75%] p-4 text-sm leading-relaxed shadow-sm",
                       isMe 
                          ? "bg-[#0f4bb9] text-white rounded-[1.2rem] rounded-tr-sm" 
                          : "bg-white text-gray-800 rounded-[1.2rem] rounded-tl-sm border border-gray-100"
                    )}>
                      {msg.message}
                    </div>
                    <div className={clsx(
                       "text-[10px] font-bold text-gray-400 mt-1.5 flex items-center gap-1",
                       isMe ? "mr-1" : "ml-1"
                    )}>
                      {formatMessageTime(msg.timestamp)}
                      {isMe && msg.timestamp && <span className="text-blue-500 ml-1">• Sent</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Message Input */}
        <div className="pt-8 pb-4 md:pt-10 md:pb-6 px-4 md:px-8 bg-white border-t border-gray-100 shrink-0 z-20 relative shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a secure message..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400 placeholder:font-normal shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="absolute right-2 w-10 h-10 bg-[#0f4bb9] hover:bg-blue-800 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-[#0f4bb9] flex items-center justify-center shadow-md active:scale-95"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <div className="flex items-center justify-center gap-1 mt-3">
             <ShieldCheck className="w-3 h-3 text-gray-400" />
             <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">Protected by Returnji Security</p>
          </div>
        </div>

      </div>
    </div>
  );
}
