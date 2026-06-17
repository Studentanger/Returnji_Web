import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Returnji - Helping Lost Items Find Their Way Home',
  description: 'Never lose your belongings again. Create smart QR codes and get them back.',
  icons: {
    icon: '/web_logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-ghost-900 text-ghost-100 min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#ede8de',
                  color: '#2e1065',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  borderRadius: '10px',
                  fontSize: '13px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#ede8de' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#ede8de' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
