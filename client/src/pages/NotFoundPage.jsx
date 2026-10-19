import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#090909] flex items-center justify-center p-6 text-center text-[#F5F5F5]">
      <div className="max-w-md">
        <span className="text-6xl font-extrabold text-[#F5F5F5] font-mono block mb-2">404</span>
        <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
        <p className="text-xs text-[#777777] mb-6 leading-relaxed">
          The requested page could not be found. Please check the URL or return to the Hirevoxa platform.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="secondary" size="sm" icon={Home}>
              Public Home
            </Button>
          </Link>
          <Link to="/app">
            <Button variant="primary" size="sm" icon={ArrowLeft}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
