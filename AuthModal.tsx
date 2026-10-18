import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, IdCard, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}) => {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your college email address.');
          setLoading(false);
          return;
        }
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent to your email.');
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }

        await register(
          fullName.trim(),
          email.trim(),
          password,
          studentId.trim(),
          department
        );
      } else {
        await login(email.trim(), password);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMsg('Invalid email or password. Please verify and try again.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMsg('This college email is already registered. Please sign in instead.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('Password is too weak. Please use at least 6 characters.');
      } else if (msg.includes('operation-not-allowed')) {
        setErrorMsg('Email/Password provider is not yet enabled in this Firebase Project. Please click "Continue with Google" below, which is pre-configured and ready to use, or enable Email/Password in Firebase Console (Auth > Sign-in method).');
      } else {
        setErrorMsg(msg.replace(/^Firebase:\s*/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      setErrorMsg('Google sign-in failed. Please try again or use email/password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role: 'student' | 'admin') => {
    if (role === 'admin') {
      setEmail(ADMIN_EMAIL);
      setPassword('Admin123!@#');
      setFullName('Campus Administrator');
      setDepartment('Campus Safety & Security');
      setStudentId('ADMIN-01');
    } else {
      setEmail('student.demo@campus.edu');
      setPassword('CampusVault2026!');
      setFullName('Alex Rivera');
      setDepartment('School of Engineering');
      setStudentId('STU-88219');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'CampusVault Registration' : 'Reset Password'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (only for login / register) */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-100 bg-slate-50/60 p-1 m-3 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="px-6 pt-2 pb-6 space-y-3.5">
          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (One-Click)</span>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or with college email
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {successMsg}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student / Staff ID
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. 883921"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Sciences"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              College Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="student@campus.edu or name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In to CampusVault'
                  : mode === 'register'
                  ? 'Complete Registration'
                  : 'Send Reset Link'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Quick Demo Fill Buttons for Testing/Presentation */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
              Demo Presets (For Campus Evaluation)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('student')}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition-colors"
              >
                Student Demo Credentials
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-[11px] font-bold text-purple-700 transition-colors flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                Admin Credentials
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
