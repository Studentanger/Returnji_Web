'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function CircularQR({ value, size = 200, logo, id }) {
  const margin = 10; // Extra white space for the circular frame
  const qrSize = size - (margin * 2);

  return (
    <div className="relative inline-block" id={id}>
      {/* Outer circular frame */}
      <div 
        className="rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-blue-600/10"
        style={{ width: size, height: size, backgroundColor: '#f1ede0' }}
      >
        <div className="p-2" style={{ backgroundColor: '#f1ede0' }}>
          <QRCodeSVG
            value={value}
            size={qrSize}
            level="H"
            fgColor="#c9b79e"
            bgColor="#f1ede0"
            includeMargin={false}
            imageSettings={logo ? {
              src: logo,
              x: undefined,
              y: undefined,
              height: qrSize * 0.2,
              width: qrSize * 0.2,
              excavate: true,
            } : undefined}
          />
        </div>
      </div>
      
      {/* Ghost Accent Rings */}
      <div className="absolute inset-0 rounded-full border border-blue-500/5 animate-pulse" />
      <div className="absolute -inset-2 rounded-full border border-blue-500/5" />
    </div>
  );
}
