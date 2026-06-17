'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  {
    question: 'HOW DOES RETURNJI WORK?',
    answer: 'Attach a Returnji QR tag to your belongings. If the item is lost, anyone who finds it can scan the QR code and initiate a secure return process.'
  },
  {
    question: 'WHAT ITEMS CAN I PROTECT WITH RETURNJI?',
    answer: 'You can use Returnji on backpacks, laptops, keys, ID cards, luggage, helmets, water bottles, and other personal belongings.'
  },
  {
    question: 'IS MY PERSONAL INFORMATION VISIBLE TO FINDERS?',
    answer: 'No. Returnji is designed to protect your privacy. Finders only see the information needed to help return your item safely.'
  }
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="w-full space-y-4">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div 
            key={idx} 
            className="bg-[#ede8de] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300"
            onClick={() => setOpenIndex(isOpen ? -1 : idx)}
          >
            <div className="p-6 md:p-8 flex items-center justify-between">
              <h3 className="font-black text-[#3b5034] text-lg md:text-xl md:w-1/2 uppercase tracking-wide">
                {faq.question}
              </h3>
              <div className="hidden md:block w-1/2 pl-8">
                {/* Desktop: Show answer side-by-side if open? Wait, PDF shows side-by-side! */}
                <p className="text-[#3b5034] text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
              <div className="md:hidden text-[#3b5034]">
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            
            {/* Mobile expanding answer */}
            <div className={clsx(
              "md:hidden px-6 pb-6 text-[#3b5034] transition-all duration-300",
              isOpen ? "block" : "hidden"
            )}>
              <p>{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
