'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chats', icon: MessageSquare, label: 'Chats' },
  { href: '/shop', icon: ShoppingBag, label: 'Shop' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, userData, logout } = useAuth();
  const { cartCount } = useCart();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
    } catch {
      toast.error('Logout failed');
    }
  };

  const items = userData?.role === 'admin'
    ? [...navItems, { href: '/admin', icon: ShieldCheck, label: 'Admin Panel' }]
    : navItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-ghost-600">
      {/* Brand Logo */}
      <div className={clsx(
        'flex flex-col p-6 pb-4',
        collapsed && 'items-center px-2'
      )}>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-blue-800 tracking-tight leading-none">Returnji</span>
              <span className="text-[10px] text-gray-500 font-medium lowercase tracking-widest">Digital Concierge</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                active
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              {!collapsed && <span className="text-sm">{label}</span>}
              {label === 'Notifications' && active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
              {label === 'Cart' && cartCount > 0 && !collapsed && (
                <div className="ml-auto bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cartCount}
                </div>
              )}
              {label === 'Cart' && cartCount > 0 && collapsed && (
                <div className="absolute top-1 right-2 w-4 h-4 bg-blue-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Action Area */}
      <div className="px-4 py-6 border-t border-ghost-600 space-y-4">
        {/* {!collapsed && (
          <button className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
             Register New Tag
          </button>
        )} */}

        <div className="space-y-1">
          <Link
            href="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all',
              collapsed && 'justify-center px-0'
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-all w-full',
              collapsed && 'justify-center px-0'
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={clsx(
        'lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64',
        'transform transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col h-full sticky top-0',
          'transition-all duration-300 ease-in-out',
          'relative flex-shrink-0',
          collapsed ? 'w-[80px]' : 'w-[260px]'
        )}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all z-10"
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
