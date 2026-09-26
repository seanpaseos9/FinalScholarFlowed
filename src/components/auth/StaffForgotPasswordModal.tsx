import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Mail,
  ShieldQuestion,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface StaffForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (email: string) => void;
}

export const SECURITY_QUESTIONS_POOL = [
  'What is the name of your first elementary school?',
  'What city or municipality was your mother born in?',
  'What was your childhood nickname?',
  'What was the make or model of your first vehicle?',
  'What is your oldest sibling’s middle name?',
  'What was the name of your favorite high school teacher?',
  'In what city did you attend your undergraduate university?',
];

export const StaffForgotPasswordModal: React.FC<StaffForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setEmail('');
    setQuestions([]);
    setAnswer1('');
    setAnswer2('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Step 1: Submit Email and Find Security Questions
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }

    const savedQuestionsRaw = localStorage.getItem('staff_security_questions_' + cleanEmail);
    let userQuestions: { question: string; answer: string }[] = [];

    if (savedQuestionsRaw) {
      try {
        userQuestions = JSON.parse(savedQuestionsRaw);
      } catch {
        userQuestions = [];
      }
    }

    // Default demo questions fallback for standard university accounts (e.g. staff@meridian.edu)
    if (userQuestions.length === 0) {
      if (cleanEmail === 'staff@meridian.edu' || cleanEmail === 'staff' || cleanEmail.includes('meridian.edu')) {
        userQuestions = [
          { question: 'What is the name of your first elementary school?', answer: 'meridian' },
          { question: 'What city or municipality was your mother born in?', answer: 'manila' },
        ];
      }
    }

    if (userQuestions.length < 2) {
      setErrorMessage(
        `No security recovery questions have been configured yet for "${cleanEmail}". Please check your application tracking portal for your initial credentials, or contact IT Administration for password assistance.`
      );
      return;
    }

    setQuestions(userQuestions);
    setStep(2);
  };

  // Step 2: Verify Answers to Security Questions
  const handleAnswersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const a1 = answer1.trim().toLowerCase();
    const a2 = answer2.trim().toLowerCase();
    const exp1 = (questions[0]?.answer || '').trim().toLowerCase();
    const exp2 = (questions[1]?.answer || '').trim().toLowerCase();

    if (!a1 || !a2) {
      setErrorMessage('Please answer both security questions to proceed.');
      return;
    }

    if (a1 !== exp1 || a2 !== exp2) {
      setErrorMessage('One or more answers do not match our records. Please try again.');
      return;
    }

    // Success -> Proceed to New Password Entry
    setStep(3);
  };

  // Step 3: Set New Password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      localStorage.setItem('staff_custom_pwd_' + cleanEmail, newPassword);
      // Mark as setup
      localStorage.setItem('staff_security_setup_' + cleanEmail, 'true');
      setIsSubmitting(false);
      setStep(4);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Failed to save updated password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Staff Account Recovery</h2>
              <p className="text-xs text-blue-100">Self-Service Password Reset via Security Questions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="px-6 pt-4 pb-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className={step === 1 ? 'text-indigo-600 font-bold' : ''}>1. Email</span>
            <span>&rarr;</span>
            <span className={step === 2 ? 'text-indigo-600 font-bold' : ''}>2. Security Questions</span>
            <span>&rarr;</span>
            <span className={step === 3 ? 'text-indigo-600 font-bold' : ''}>3. New Password</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Enter your Meridian University institutional email address to begin account verification.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. staff@meridian.edu"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Answer Security Questions */}
          {step === 2 && (
            <form onSubmit={handleAnswersSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <ShieldQuestion className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Verify your identity by answering your security questions below.</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Question 1: {questions[0]?.question}
                  </label>
                  <input
                    type="text"
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                    placeholder="Enter answer"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Question 2: {questions[1]?.question}
                  </label>
                  <input
                    type="text"
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                    placeholder="Enter answer"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Back to Email</span>
                </button>
                <button
                  type="submit"
                  disabled={!answer1.trim() || !answer2.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Verify Answers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Verification confirmed! Enter a new, secure password for your account.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Updating...' : 'Set New Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center space-y-3 py-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Password Reset Successfully!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your password for <strong>{email}</strong> has been updated. You can now use your new password to sign into the staff portal.
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccessLogin) onSuccessLogin(email);
                    handleClose();
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
