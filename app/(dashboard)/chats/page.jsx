'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Send, Search, Phone, MoreVertical, CheckCheck, User, PlusCircle, Smile, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import EmojiPicker from 'emoji-picker-react';

function formatTime(ts) {
  if (!ts?.toDate) return '';
  const date = ts.toDate();
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (isToday) return timeStr;
  
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateStr}, ${timeStr}`;
}

function formatDateLabel(ts) {
  if (!ts?.toDate) return 'TODAY';
  const date = ts.toDate();
  const today = new Date();
  const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  if (isToday) return 'TODAY';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'YESTERDAY';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}


export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [hasSelectedInitial, setHasSelectedInitial] = useState(false);
  const bottomRef = useRef(null);

  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount_owner || 0), 0);

  // Mark active chat as read
  useEffect(() => {
    if (!activeChat || !activeChat.id) return;
    if (activeChat.unreadCount_owner > 0) {
      updateDoc(doc(db, 'chats', activeChat.id), { unreadCount_owner: 0 }).catch(console.error);
    }
  }, [activeChat]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, snap => {
      const realChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChats(realChats);

      // Auto-select first chat only on initial load for desktop
      if (!hasSelectedInitial && realChats.length > 0) {
        if (window.innerWidth >= 1024) {
          setActiveChat(realChats[0]);
        }
        setHasSelectedInitial(true);
      }
    });

    return () => unsub();
  }, [user, hasSelectedInitial]);

  // Keep active chat content in sync with the latest data from chats list
  useEffect(() => {
    if (!activeChat) return;
    const latest = chats.find(c => c.id === activeChat.id);
    if (latest && (
      latest.lastMessageTime?.toMillis() !== activeChat.lastMessageTime?.toMillis() ||
      latest.unreadCount_owner !== activeChat.unreadCount_owner
    )) {
      setActiveChat(latest);
    }
  }, [chats, activeChat?.id]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChat.id)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [activeChat, user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;

    setSending(true);
    setShowEmojiPicker(false);
    try {
      const txt = newMsg.trim();
      await Promise.all([
        addDoc(collection(db, 'messages'), {
          chatId: activeChat.id,
          senderId: user.uid,
          message: txt,
          timestamp: serverTimestamp(),
        }),
        updateDoc(doc(db, 'chats', activeChat.id), {
          unreadCount_finder: increment(1),
          lastMessage: txt,
          lastMessageTime: serverTimestamp()
        })
      ]);
      setNewMsg('');
    } finally {
      setSending(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMsg(prevInput => prevInput + emojiObject.emoji);
  };

  const handleDeleteChat = async () => {
    if (!window.confirm("Are you sure you want to completely delete this conversation?")) return;
    try {
      await deleteDoc(doc(db, 'chats', activeChat.id));
      setActiveChat(null);
      setShowMenu(false);
      setShowChatList(true);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-120px)] lg:h-[calc(100vh-100px)] bg-white lg:rounded-3xl overflow-hidden shadow-sm border border-gray-100">

      {/* 1. Sidebar - Chat List */}
      <div className={clsx(
        "w-full lg:w-[380px] flex-shrink-0 flex flex-col border-r border-gray-100 bg-gray-50/30",
        !showChatList && "hidden lg:flex"
      )}>

        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Messages</h1>
            {totalUnread > 0 ? (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">{totalUnread} Unread</span>
            ) : (
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">Empty</span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chats.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-10 px-4">
              No conversations found. Chats will appear automatically when someone scans your items.
            </div>
          ) : chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setActiveChat(chat);
                setShowChatList(false);
              }}
              className={clsx(
                'w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group',
                activeChat?.id === chat.id
                  ? 'bg-white shadow-sm ring-1 ring-gray-100'
                  : 'hover:bg-gray-100/50'
              )}
            >
              <div className="relative shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                {!!chat.unreadCount_owner && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold leading-none">{chat.unreadCount_owner}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={clsx("font-bold truncate", activeChat?.id === chat.id ? "text-gray-900" : "text-gray-700")}>
                    {chat.finderId ? 'Anonymous Finder' : 'Anonymous User'}
                  </h3>
                  <span className={clsx("text-[10px] font-bold shrink-0", chat.unreadCount_owner ? "text-blue-600" : "text-gray-400")}>
                    {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : (chat.createdAt ? formatTime(chat.createdAt) : '')}
                  </span>
                </div>
                <p className="text-[12px] font-bold text-blue-800 mb-1 truncate">
                  Regarding: {chat.itemName || 'Asset'}
                </p>
                <p className={clsx("text-xs truncate", chat.unreadCount_owner ? "text-gray-900 font-medium" : "text-gray-500")}>
                  {chat.lastMessage || 'Open to view messages'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-[#F8F9FB] relative",
        showChatList && "hidden lg:flex"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-4 lg:px-8 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowChatList(true)}
                  className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-teal-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-gray-900 leading-tight">Anonymous Finder</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 relative">
                <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                    <button onClick={handleDeleteChat} className="w-full text-left px-4 py-3 text-sm text-red-600 font-bold hover:bg-red-50 transition-colors">
                      Delete this Chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto pt-8 lg:pt-12 p-4 lg:p-8 space-y-6">

              {messages.map((m, idx) => {
                const isMine = m.senderId === user?.uid;
                const currentMsgDate = m.timestamp ? formatDateLabel(m.timestamp) : 'TODAY';
                const previousMsgDate = idx > 0 && messages[idx-1].timestamp ? formatDateLabel(messages[idx-1].timestamp) : null;
                const showDateDivider = currentMsgDate !== previousMsgDate;

                return (
                  <div key={m.id || idx} className="flex flex-col w-full">
                    {showDateDivider && (
                      <div className="flex items-center justify-center gap-4 my-6">
                        <div className="h-px bg-gray-200 flex-1 max-w-[80px]" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentMsgDate}</span>
                        <div className="h-px bg-gray-200 flex-1 max-w-[80px]" />
                      </div>
                    )}

                    <div className={clsx("flex w-full mt-2", isMine ? "justify-end" : "justify-start")}>
                      <div className={clsx("flex flex-col max-w-[85%] md:max-w-[75%]", isMine ? "items-end" : "items-start")}>
                        <div className={clsx(
                          "px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                          isMine
                            ? "bg-[#3b5034] text-white rounded-[1.2rem] rounded-tr-sm"
                            : "bg-white text-gray-800 rounded-[1.2rem] rounded-tl-sm border border-gray-100"
                        )}>
                          {m.message}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1 mx-1">
                          {formatTime(m.timestamp)}
                          {isMine && <span className="text-blue-500">• Sent</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {messages.length > 0 && messages[messages.length - 1].senderId !== user?.uid && (
                <div className="flex items-center gap-2 self-start ml-4 text-[11px] font-medium text-gray-400 mt-2 opacity-0 transition-opacity">
                  {/* Hidden by default, hook up to real-time typing status if available */}
                </div>
              )}

              <div ref={bottomRef} className="h-4" />
            </div>

            {/* Message Input Area */}
            <div className="pt-8 pb-4 lg:pt-10 lg:pb-6 px-4 lg:px-6 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={sendMessage} className="relative flex items-center">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl lg:rounded-[2rem] py-3 lg:py-4 pl-4 lg:pl-6 pr-24 lg:pr-32 text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                />

                <div className="absolute right-2 flex items-center gap-2">
                  <div className="relative">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 right-0 z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} searchDisabled skinTonesDisabled />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!newMsg.trim() || sending}
                    className="w-10 h-10 rounded-full bg-[#3b5034] flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-800 transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </form>
              <p className="text-[10px] text-center text-gray-400 font-medium mt-4">
                Your identity is protected by Returnji Secure Anonymous Chat.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:p-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inset">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Conversation Selected</h3>
            <p className="text-gray-500 text-sm max-w-sm">Choose a chat from the left sidebar to securely connect with owners or finders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
