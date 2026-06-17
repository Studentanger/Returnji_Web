'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  MapPin,
  User
} from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '@/context/CartContext';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/chats', icon: MessageSquare, label: 'Chats' },
  { href: '/shop', icon: ShoppingBag, label: 'Shop' },
  { href: '/dropzones', icon: MapPin, label: 'Dropzones' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-gray-200 px-2 py-2 rounded-[2rem] z-50 flex items-center gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/') && href !== '/dashboard' || (href === '/dashboard' && pathname === '/dashboard');
        
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center justify-center gap-2 relative rounded-full transition-all duration-300',
              active 
                ? 'bg-[#3b5034] text-[#ede8de] px-5 py-3 shadow-md' 
                : 'text-gray-500 hover:text-[#3b5034] hover:bg-gray-50 w-12 h-12'
            )}
          >
            <Icon 
              className={clsx(
                "w-5 h-5 transition-colors", 
                active ? "text-[#ede8de] fill-current" : "text-gray-500"
              )} 
              strokeWidth={active ? 2.5 : 2} 
            />
            {active && <span className="text-sm font-bold">{label}</span>}
            
            {label === 'Shop' && cartCount > 0 && !active && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
            {label === 'Shop' && cartCount > 0 && active && (
               <div className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full border border-[#3b5034]"></div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
