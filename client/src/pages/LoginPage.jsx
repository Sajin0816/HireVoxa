import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import FieldError from '../components/common/FieldError';
import { isValidEmail, getInputErrorClass, focusFirstError } from '../utils/validation';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/app';

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const validate = () => {
    const errs = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Please enter your work email.';
    } else if (!isValidEmail(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs, { email: emailInputRef, password: passwordInputRef });
      return;
    }

    setLoading(true);
    const res = await login({ email: email.trim(), password });
    setLoading(false);
    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (res.user?.role === 'candidate') {
        navigate('/candidate', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setFieldErrors({});
    const res = await demoLogin(role);
    if (res?.success) {
      navigate(from, { replace: true });
    } else {
      setError(res?.error || 'Demo login failed');
    }
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
            Sign in to access your recruitment pipeline and candidate matches.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                placeholder="Enter your email address"
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.email
                )} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
            </div>
            <FieldError id="email-error" error={fieldErrors.email} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium text-[#A3A3A3]">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                placeholder="Enter your password"
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.password
                )} rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F5F5F5] focus:outline-none focus:text-[#F5F5F5] transition-colors p-0.5 rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError id="password-error" error={fieldErrors.password} />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-2 font-semibold text-xs py-2.5"
          >
            Sign In
          </Button>
        </form>

        {/* Explicit local demo login is hidden unless enabled by the client environment. */}
        {import.meta.env.VITE_ALLOW_DEMO_LOGIN === 'true' && <div className="mt-6 pt-6 border-t border-[#303030]">
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
              <p className="text-[10px] text-[#777777]">Preview employer workspace</p>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('candidate')}
              className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#303030] text-left text-xs transition-colors"
            >
              <p className="font-semibold text-[#F5F5F5]">LatAm Engineer</p>
              <p className="text-[10px] text-[#777777]">Preview talent portal</p>
            </button>
          </div>
        </div>}

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
