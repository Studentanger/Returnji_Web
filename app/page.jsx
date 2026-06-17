import Link from 'next/link';
import FaqAccordion from '@/components/landing/FaqAccordion';
import ReviewCard from '@/components/landing/ReviewCard';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function LandingPage() {
  const reviews = [
    { review: "I attached Returnji to my backpack and now I feel much safer carrying my laptop around campus.", author: "ADITYA GORE" },
    { review: "A simple idea that solves a real problem. Every student should have one.", author: "SHUBHAM YADAV" },
    { review: "The QR setup was easy and the concept is very practical for college life.", author: "AYUSH SHARMA" },
    { review: "I use it on my keys and ID card. It gives me peace of mind.", author: "Kiran Jhala" },
    { review: "Perfect for luggage and travel bags. Simple and effective.", author: "Aelisha Chouhan" },
    { review: "A smart solution that makes lost-and-found much easier.", author: "Sonam Giri" }
  ];

  return (
    <div className="min-h-screen bg-[#ede8de] text-[#3b5034] font-sans selection:bg-[#3b5034] selection:text-[#ede8de]">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 md:px-12 lg:px-24">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Returnji Logo" className="h-14 md:h-16 object-contain" />
        </div>
        <Link
          href="/dashboard"
          className="bg-[#3b5034] text-[#ede8de] px-6 py-2.5 rounded-full font-bold hover:bg-opacity-90 transition shadow-lg"
        >
          Go to App
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 pt-12 pb-0 md:py-20 flex flex-col md:flex-row items-center gap-6 md:gap-12 relative overflow-hidden">
        <div className="w-full md:w-1/2 z-10">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-none uppercase tracking-tighter text-[#3b5034]">
            Lost<br />Something
          </h1>
          <p className="mt-8 text-xl md:text-2xl font-bold max-w-md uppercase tracking-wide">
            Get your lost item back at your doorstep
          </p>
        </div>
        <div className="w-full md:w-1/2 relative h-auto md:h-[600px] z-10 flex justify-center items-center py-6 md:py-0">
          <img src="/landing-01.png" alt="Returnji Keychain" className="w-3/4 md:w-full max-w-lg object-contain transform rotate-12 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl" />
        </div>
      </section>

      {/* What is Returnji Section */}
      <section className="bg-[#3b5034] text-[#ede8de] px-6 md:px-12 lg:px-24 py-16 md:py-24 rounded-t-[3rem] mt-4 md:mt-12 flex flex-col md:flex-row items-center gap-16">
        <div className="w-full md:w-1/2">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-8">
            What is<br />Returnji?
          </h2>
          <p className="text-lg md:text-xl leading-relaxed opacity-90 max-w-xl">
            Returnji is transforming lost-and-found with smart QR technology. By attaching a unique Returnji QR tag to your belongings, you create a simple way for finders to help return them. Whether it's a backpack, laptop, keys, or ID card, Returnji bridges the gap between the finder and the owner, making the return process faster, safer, and more reliable.
          </p>
        </div>
        <div className="w-full md:w-1/2">
          <img src="/landing-02.png" alt="Returnji Items" className="w-full md:object-center h-96 md:h-[42rem] rounded-[2.5rem] object-cover shadow-2xl" />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-[#ede8de] px-6 md:px-12 lg:px-24 py-20 text-[#3b5034]">
        <div className="flex items-center gap-6 mb-16 justify-center">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-center">
            What Are<br />The Key Benefits?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-center">Secure Item Recovery</h3>
            <img src="/landing-03.png" alt="Secure Item Recovery" className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl border-4 border-[#3b5034]" />
            <p className="text-lg font-medium leading-relaxed">
              Every Returnji tag comes with a unique QR code that helps finders connect with owners without exposing personal information.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-center">Quick & Easy Returns</h3>
            <img src="/landing-04.png" alt="Quick Returns" className="w-full aspect-square object-contain rounded-[2.5rem] object-cover shadow-xl border-4 border-[#3b5034] bg-[#f8f5f0]  " />
            <p className="text-lg font-medium leading-relaxed">
              A simple scan starts the return process, making it faster and more convenient to recover lost belongings.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-center">Protect Everyday Essentials</h3>
            <img src="/landing-05.png" alt="Everyday Essentials" className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl border-4 border-[#3b5034]" />
            <p className="text-lg font-medium leading-relaxed">
              Perfect for bags, keys, laptops, ID cards, water bottles, luggage, and other valuable items you carry daily.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#3b5034] px-6 md:px-12 lg:px-24 py-20 md:py-32 flex flex-col md:flex-row gap-16 items-start rounded-b-[3rem]">
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-6xl md:text-8xl font-black text-[#ede8de] uppercase md:ml-20 tracking-tighter mb-4">FAQS</h2>
          <img src="/landing-06.png" alt="Returnji Sticker" className="w-64 md:w-96 object-contain transform -rotate-6 drop-shadow-2xl" />
        </div>
        <div className="w-full md:w-2/3">
          <FaqAccordion />
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-[#ede8de] px-6 md:px-12 lg:px-24 py-20 text-[#3b5034]">
        <div className="flex items-center gap-6 mb-16">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            Early<br />Reviews
          </h2>
          {/* Heart icon illustration placeholder */}
          <div className="ml-auto bg-white p-6 rounded-3xl shadow-xl transform rotate-6 border border-gray-100 hidden md:block">
            <svg className="w-16 h-16 text-red-400 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className={i >= 3 ? "hidden md:block" : "block"}>
              <ReviewCard review={r.review} author={r.author} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#3b5034] text-[#ede8de] px-6 md:px-12 lg:px-24 py-24 flex flex-col md:flex-row justify-between items-end relative overflow-hidden">
        {/* Abstract scribble decoration */}
        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
            <path d="M50 150 C 50 50, 150 50, 150 150 C 150 250, 50 250, 50 150 C 50 50, 100 50, 100 100 C 100 150, 50 150, 50 100" />
          </svg>
        </div>

        <div className="w-full md:w-1/2 z-10 mb-16 md:mb-0">
          <p className="text-2xl md:text-3xl mb-2 font-medium">GOT QUESTIONS?</p>
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-16">
            Get in touch<br />with us!
          </h2>
        </div>

        <div className="w-full md:w-1/2 z-10 flex flex-col gap-8 md:pl-24">

          <div className="flex items-center justify-between border-b border-[#ede8de]/20 pb-4">
            <span className="text-xl uppercase tracking-widest font-medium opacity-80">Email</span>
            <span className="text-xl md:text-2xl font-bold">returnji.app@gmail.com</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl uppercase tracking-widest font-medium opacity-80">Socials</span>
            <div className="flex gap-6">
              {/* <a href="#" className="hover:text-white transition"><Facebook className="w-6 h-6" /></a>
              <a href="#" className="hover:text-white transition"><Twitter className="w-6 h-6" /></a> */}
              <a href="https://www.instagram.com/returnji.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition"><Instagram className="w-6 h-6" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
