import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { ArrowRight, Lock, Mail, User, Building, AlertCircle, Check } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('company');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register({
      name,
      email,
      password,
      role,
      companyName: role === 'company' ? companyName : ''
    });

    setLoading(false);
    if (res.success) {
      navigate('/app');
    } else {
      setError(res.error || 'Registration failed.');
    }
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Create your account</h1>
          <p className="text-xs text-[#A3A3A3] mt-1.5">
            Join Hirevoxa to hire or work across US and Latin American tech teams.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#202020] border border-[#303030] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setRole('company')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'company'
                ? 'bg-[#171717] text-[#F5F5F5] shadow-sm border border-[#303030]'
                : 'text-[#777777] hover:text-[#A3A3A3]'
            }`}
          >
            Hiring Company
          </button>
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'candidate'
                ? 'bg-[#171717] text-[#F5F5F5] shadow-sm border border-[#303030]'
                : 'text-[#777777] hover:text-[#A3A3A3]'
            }`}
          >
            LatAm Engineer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'company' ? 'e.g. Richard Feynman' : 'e.g. Camila Fernandez'}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#505050]"
              />
            </div>
          </div>

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

          {role === 'company' && (
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Technologies Inc."
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#505050]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
            Create Account & Enter
          </Button>
        </form>

        <p className="text-center text-xs text-[#777777] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#F5F5F5] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
