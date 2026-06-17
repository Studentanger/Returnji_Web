'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await register(name, email, password, phone);
      toast.success('Account created! Welcome to Returnji 🛡️');
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');

      if (redirect) {
        router.push(redirect);
      } else if (data?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.message.includes('email-already') ? 'Email already in use' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      toast.success('Account created! Welcome to Returnji 🛡️');
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');

      if (redirect) {
        router.push(redirect);
      } else if (data?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to register with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ede8de] flex flex-col md:flex-row items-center justify-center">

      {/* Left side branding */}
      <div className="hidden md:flex md:w-1/2 h-screen bg-[#3b5034] flex-col justify-between p-12 text-white relative overflow-hidden order-2 md:order-1">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10">
          <div className="mb-16">
            <img src="/logo.png" alt="Returnji Logo" className="h-12 w-auto brightness-0 invert" />
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Join the Returnji<br />Recovery Network.
          </h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Create an account to protect your belongings with smart QR tags and enable secure item recovery whenever something goes missing.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 max-w-md">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Privacy-First Protection</p>
              <p className="text-xs text-blue-100">Your personal information remains private. Finders only see the details needed to help return your item safely.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 order-1 md:order-2 h-screen overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in relative z-10 my-auto py-8">

          {/* Mobile Header (only visible on small screens) */}
          <div className="md:hidden flex items-center justify-center mb-56 -mt-16">
            <img src="/logo.png" alt="Returnji Logo" className="h-20 w-auto" />
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Create Account</h2>
            <p className="text-gray-500 text-sm font-medium">Join the Returnji Recovery Network.</p>
          </div>

          <div className="bg-[#ffffff] rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-8 font-medium">
              Sign up securely using your Google account to get started.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email/Password registration removed as requested */}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#ffffff] hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-3 font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15 1 12 1 7.28 1 3.25 3.73 1.34 7.72l3.86 3C6.12 7.74 8.84 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.92 3.42-8.69z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.2 14.28a7.17 7.17 0 0 1 0-4.56l-3.86-3a11.96 11.96 0 0 0 0 10.56l3.86-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.16 0-5.88-2.7-6.8-5.96l-3.86 3C3.25 20.27 7.28 23 12 23z"
                  />
                </svg>
                Google
              </button>
            </form>

            <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed px-4">
              By creating an account you agree to our <br /><Link href="/terms" className="font-bold text-gray-500 hover:text-gray-800 transition-colors">Terms of Service</Link> and <Link href="/terms" className="font-bold text-gray-500 hover:text-gray-800 transition-colors">Privacy Policy</Link>.
            </p>

            <p className="text-center text-sm text-gray-600 mt-6 font-medium">
              Already have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/login' + window.location.search);
                }}
                className="font-bold text-[#3b5034] hover:text-blue-800 transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
