'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, Moon, LogOut, ChevronRight, HelpCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Manage your preferences and account</p>
      </div>
      
      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Account</h2>
          <div className="space-y-2">
            <Link href="/profile" className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3b5034] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Personal Details</h3>
                  <p className="text-xs text-gray-500">Update your name, email, and phone</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
            
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Security</h3>
                  <p className="text-xs text-gray-500">Change password and enable 2FA</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Preferences</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">Manage push and email alerts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
            
            <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Dark Mode</h3>
                  <p className="text-xs text-gray-500">Toggle dark theme</p>
                </div>
              </div>
              {/* Toggle switch placeholder */}
              <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Support & About */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Support & About</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Help Center</h3>
                  <p className="text-xs text-gray-500">FAQs and support tickets</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
            
            <Link href="/terms" className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Terms & Privacy</h3>
                  <p className="text-xs text-gray-500">Read our policies</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-[2rem] transition-colors mt-6"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>

      </div>
    </div>
  );
}
