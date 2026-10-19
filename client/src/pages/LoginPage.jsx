import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { ArrowRight, Lock, Mail, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login({ email, password });
    setLoading(false);
    if (res.success) {
      navigate('/app');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleDemo = async (role) => {
    setError('');
    await demoLogin(role);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Logo Header */}
      <Link to="/" className="flex items-center justify-center mb-8 transition-opacity hover:opacity-90">
        <img
          src="/images/hirevoxa-logo.png"
          alt="Hirevoxa — Engineering Talent, Amplified"
          className="h-10 md:h-12 w-auto object-contain"
        />
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#171717] border border-[#303030] rounded-2xl p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Welcome back</h1>
          <p className="text-xs text-[#A3A3A3] mt-1.5">
            Sign in to access your recruitment workspace and LatAm shortlists.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#A3A3A3]">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#505050]"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-2 font-semibold text-xs py-2.5"
          >
            Sign In to Workspace
          </Button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-6 pt-6 border-t border-[#303030]">
          <span className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold block mb-3 text-center">
            Or quick demo sign-in
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemo('company')}
              className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#303030] text-left text-xs transition-colors"
            >
              <p className="font-semibold text-[#F5F5F5]">Hiring Manager</p>
              <p className="text-[10px] text-[#777777]">Richard Feynman</p>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('candidate')}
              className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#303030] text-left text-xs transition-colors"
            >
              <p className="font-semibold text-[#F5F5F5]">LatAm Engineer</p>
              <p className="text-[10px] text-[#777777]">Rodrigo Silva</p>
            </button>
          </div>
        </div>

        {/* Register Prompt */}
        <p className="text-center text-xs text-[#777777] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#F5F5F5] font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
