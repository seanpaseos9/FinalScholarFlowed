import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '../../types';
import { SECURITY_QUESTIONS_POOL } from './StaffForgotPasswordModal';

interface StaffFirstTimeSecurityModalProps {
  isOpen: boolean;
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
}

export const StaffFirstTimeSecurityModal: React.FC<StaffFirstTimeSecurityModalProps> = ({
  isOpen,
  user,
  onComplete,
}) => {
  const [question1, setQuestion1] = useState(SECURITY_QUESTIONS_POOL[0]);
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState(SECURITY_QUESTIONS_POOL[1]);
  const [answer2, setAnswer2] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const a1 = answer1.trim();
    const a2 = answer2.trim();

    if (!a1 || !a2) {
      setErrorMessage('Please provide answers for both security questions.');
      return;
    }

    if (question1 === question2) {
      setErrorMessage('Please select two distinct security questions.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMessage('If updating your password, it must be at least 6 characters.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = (user.email || '').trim().toLowerCase();

    try {
      // Save security questions
      const questionsData = [
        { question: question1, answer: a1.toLowerCase() },
        { question: question2, answer: a2.toLowerCase() },
      ];
      localStorage.setItem('staff_security_questions_' + cleanEmail, JSON.stringify(questionsData));
      localStorage.setItem('staff_security_setup_' + user.id, 'true');
      localStorage.setItem('staff_security_setup_' + cleanEmail, 'true');

      // Update password if specified
      if (newPassword) {
        localStorage.setItem('staff_custom_pwd_' + cleanEmail, newPassword);
      }

      const updatedUser: UserProfile = {
        ...user,
        security_questions: questionsData,
        security_questions_setup: true,
      };

      setIsSubmitting(false);
      onComplete(updatedUser);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('An error occurred while saving your security profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
                First-Time Staff Login
              </span>
              <h2 className="text-lg font-bold">Configure Account Security</h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            Welcome to the Meridian University Staff Portal! To ensure your account is protected and allow you to reset your password if you ever forget it, university policy requires setting up <strong>two security questions</strong>.
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security Question 1 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Security Question 1 <span className="text-rose-500">*</span>
            </label>
            <select
              value={question1}
              onChange={(e) => setQuestion1(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {SECURITY_QUESTIONS_POOL.map((q) => (
                <option key={q} value={q} disabled={q === question2}>
                  {q}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="Your answer to Question 1"
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Security Question 2 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Security Question 2 <span className="text-rose-500">*</span>
            </label>
            <select
              value={question2}
              onChange={(e) => setQuestion2(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {SECURITY_QUESTIONS_POOL.map((q) => (
                <option key={q} value={q} disabled={q === question1}>
                  {q}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="Your answer to Question 2"
              required
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Optional Immediate Password Change */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Change Initial Password <span className="text-slate-400 font-normal">(Recommended)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Replace your generated temporary password with a personalized secure password.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full p-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !answer1.trim() || !answer2.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Security Profile...' : 'Save & Enter Staff Portal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
