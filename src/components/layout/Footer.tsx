// src/components/layout/Footer.tsx
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t border-gray-800 bg-gray-900/90 backdrop-blur-sm py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">
              PT. Berkah Adha Kreasindo
            </h3>
            <p className="text-xs text-gray-500">
              Solusi Teknologi untuk Pemantauan Lingkungan
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {currentYear} All rights reserved
            </p>
            <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Banjarbaru
            </p>
          </div>

          {/* Version */}
          <div className="text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
              <span className="text-xs text-gray-400">Version</span>
              <span className="text-xs font-semibold text-emerald-400">2.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;