import React from 'react';

export default function ReviewCard({ review, author }) {
  return (
    <div className="bg-[#3b5034] text-[#ede8de] rounded-3xl p-8 flex flex-col justify-between h-full min-h-[250px] shadow-lg">
      <p className="text-lg md:text-xl font-medium leading-relaxed mb-8">
        {review}
      </p>
      <p className="text-right font-black tracking-widest uppercase mt-auto">
        {author}
      </p>
    </div>
  );
}
