import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col justify-center items-center px-4 py-12">
      <Link to="/" className="flex items-center justify-center mb-8 transition-opacity hover:opacity-90">
        <img
          src="/images/hirevoxa-logo.png"
          alt="Hirevoxa — Engineering Talent, Amplified"
          className="h-10 md:h-12 w-auto object-contain"
        />
      </Link>

      <div className="w-full max-w-md bg-[#171717] border border-[#303030] rounded-2xl p-8 shadow-xl">
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#F5F5F5]">Reset Link Dispatched</h2>
            <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
              If an account with <strong className="text-[#F5F5F5]">{email}</strong> exists, password reset instructions have been dispatched.
            </p>
            <div className="mt-6">
              <Link to="/login">
                <Button variant="secondary" size="md" icon={ArrowLeft} className="w-full text-xs">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Reset password</h1>
              <p className="text-xs text-[#A3A3A3] mt-1.5">
                Enter your registered work email and we will generate a recovery instruction.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#505050]"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full font-semibold text-xs py-2.5">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#303030] text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
