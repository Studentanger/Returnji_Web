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
      if (data?.role === 'admin') {
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
      if (data?.role === 'admin') {
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row items-center justify-center">

      {/* Left side branding */}
      <div className="hidden md:flex md:w-1/2 h-screen bg-[#0f4bb9] flex-col justify-between p-12 text-white relative overflow-hidden order-2 md:order-1">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-[#0f4bb9]" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight leading-none block">Returnji</span>
              <span className="text-xs text-blue-200 font-medium tracking-widest uppercase">Digital Concierge</span>
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Join the global<br />recovery network.
          </h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Create an account to protect your valuables with our ecosystem of digital tags and anonymous finding.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 max-w-md">
          <div className="flex gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Bank-level Security</p>
              <p className="text-xs text-blue-100">Your details are encrypted and never shared with finders directly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 order-1 md:order-2 h-screen overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in relative z-10 my-auto py-8">

          {/* Mobile Header (only visible on small screens) */}
          <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#0f4bb9] flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Returnji</span>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Digital Concierge</span>
            </div>
          </div>

          <div className="mb-8 p-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500 text-sm">Fill in your details to get started with Returnji.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="Atharva Sonawane"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="+91"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f4bb9] hover:bg-blue-800 text-white rounded-xl py-3.5 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-3 font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
              By creating an account you agree to our <br /><Link href="#" className="font-bold text-gray-500 hover:text-gray-800 transition-colors">Terms of Service</Link> and <Link href="#" className="font-bold text-gray-500 hover:text-gray-800 transition-colors">Privacy Policy</Link>.
            </p>

            <p className="text-center text-sm text-gray-600 mt-6 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#0f4bb9] hover:text-blue-800 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
