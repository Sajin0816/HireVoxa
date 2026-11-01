import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import FieldError from '../components/common/FieldError';
import { isValidEmail, getInputErrorClass, focusFirstError } from '../utils/validation';
import { Lock, Mail, User, Building, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('company');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const companyInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const validate = () => {
    const errs = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedCompany = companyName.trim();

    if (!trimmedName) {
      errs.name = 'Please enter your full name.';
    }

    if (!trimmedEmail) {
      errs.email = role === 'company' ? 'Please enter your work email.' : 'Please enter your email address.';
    } else if (!isValidEmail(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (role === 'company' && !trimmedCompany) {
      errs.companyName = 'Please enter your company name.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (password && confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    return errs;
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'candidate') {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated.companyName;
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs, {
        name: nameInputRef,
        email: emailInputRef,
        companyName: companyInputRef,
        password: passwordInputRef,
        confirmPassword: confirmPasswordInputRef
      });
      return;
    }

    setLoading(true);

    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      companyName: role === 'company' ? companyName.trim() : ''
    });

    setLoading(false);
    if (res.success) {
      navigate(role === 'candidate' ? '/candidate' : '/app');
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
            Create an account to start hiring or connect with technology teams.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#202020] border border-[#303030] rounded-xl mb-5" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'company'}
            onClick={() => handleRoleChange('company')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 border ${
              role === 'company'
                ? 'bg-[#171717] text-[#F5F5F5] shadow-sm border-[#303030]'
                : 'border-transparent text-[#777777] hover:text-[#A3A3A3]'
            }`}
          >
            Hiring Company
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'candidate'}
            onClick={() => handleRoleChange('candidate')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 border ${
              role === 'candidate'
                ? 'bg-[#171717] text-[#F5F5F5] shadow-sm border-[#303030]'
                : 'border-transparent text-[#777777] hover:text-[#A3A3A3]'
            }`}
          >
            LatAm Engineer
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                placeholder="Enter your full name"
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.name
                )} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
            </div>
            <FieldError id="name-error" error={fieldErrors.name} />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">
              {role === 'company' ? 'Work Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                placeholder={role === 'company' ? 'work@company.com' : 'you@example.com'}
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.email
                )} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
            </div>
            <FieldError id="email-error" error={fieldErrors.email} />
          </div>

          {role === 'company' && (
            <div>
              <label htmlFor="reg-company" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-company"
                  ref={companyInputRef}
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (fieldErrors.companyName) setFieldErrors((prev) => ({ ...prev, companyName: '' }));
                  }}
                  aria-invalid={!!fieldErrors.companyName}
                  aria-describedby={fieldErrors.companyName ? 'company-error' : undefined}
                  placeholder="Enter your company name"
                  className={`w-full bg-[#202020] border ${getInputErrorClass(
                    fieldErrors.companyName
                  )} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
                />
              </div>
              <FieldError id="company-error" error={fieldErrors.companyName} />
            </div>
          )}

          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  if (fieldErrors.confirmPassword && e.target.value === confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                placeholder="Create a password (min. 6 characters)"
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

          <div>
            <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-[#A3A3A3] mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-confirm-password"
                ref={confirmPasswordInputRef}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                placeholder="Re-enter your password"
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.confirmPassword
                )} rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F5F5F5] focus:outline-none focus:text-[#F5F5F5] transition-colors p-0.5 rounded"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError id="confirm-password-error" error={fieldErrors.confirmPassword} />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full mt-2 font-semibold text-xs py-2.5"
          >
            Create Account
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
