import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Users,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import {
  authenticateUserWithFirestore,
} from '../../lib/firebase';
import { StaffApplication, UserProfile } from '../../types';
import { ScholarFlowLogo } from '../common/ScholarFlowLogo';
import portalBgImg from '../../assets/images/scholarship_portal_bg_1788197531135.jpg';
import { StaffRegistrationModal } from './StaffRegistrationModal';
import { StaffAccountTrackerModal } from './StaffAccountTrackerModal';
import { StaffForgotPasswordModal } from './StaffForgotPasswordModal';
import { StaffFirstTimeSecurityModal } from './StaffFirstTimeSecurityModal';

interface StaffAdminLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBackToPortal: () => void;
  staffApplications?: StaffApplication[];
  users?: UserProfile[];
  onStaffApplicationSubmit?: (appData: Omit<StaffApplication, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<boolean>;
}

export const StaffAdminLogin: React.FC<StaffAdminLoginProps> = ({
  onLoginSuccess,
  onBackToPortal,
  staffApplications = [],
  users = [],
  onStaffApplicationSubmit,
}) => {
  // Step 1: null = role selection screen, 'staff' = staff sign in form, 'admin' = admin sign in form
  const [selectedRole, setSelectedRole] = useState<'staff' | 'admin' | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals for Staff Registration & Status Tracking
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Modals for Account Recovery & First-Time Security Questions Setup
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isFirstTimeSetupOpen, setIsFirstTimeSetupOpen] = useState(false);
  const [pendingFirstTimeUser, setPendingFirstTimeUser] = useState<UserProfile | null>(null);

  // When switching role, reset form inputs for written authentication
  const handleSelectRole = (role: 'staff' | 'admin') => {
    setSelectedRole(role);
    setErrorMessage(null);
    setShowPassword(false);
    setEmail('');
    setPassword('');
  };

  const handleBackToRolePicker = () => {
    setSelectedRole(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateUserWithFirestore(email.trim(), password);
      setLoading(false);

      if (result.error || !result.user) {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      if (selectedRole && result.user.role !== selectedRole) {
        setErrorMessage(
          `Credentials belong to an ${result.user.role === 'admin' ? 'Administrator' : 'Staff Coordinator'} account. Please sign in under the ${result.user.role === 'admin' ? 'System Admin' : 'Staff Coordinator'} portal.`
        );
        return;
      }

      // Check if staff member needs to set up their security questions (prompt on first-time login)
      const userEmail = (result.user.email || '').toLowerCase().trim();
      const isSecuritySetup = Boolean(
        result.user.security_questions_setup ||
        (typeof localStorage !== 'undefined' && (
          localStorage.getItem('staff_security_setup_' + result.user.id) === 'true' ||
          localStorage.getItem('staff_security_setup_' + userEmail) === 'true'
        ))
      );

      if (result.user.role === 'staff' && !isSecuritySetup) {
        setPendingFirstTimeUser(result.user);
        setIsFirstTimeSetupOpen(true);
        return;
      }

      onLoginSuccess(result.user);
    } catch {
      setLoading(false);
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    }
  };

  // Keyboard Accessibility: Escape key handling to cancel or go back
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRegisterOpen || isTrackerOpen || isForgotPasswordOpen) {
          setIsRegisterOpen(false);
          setIsTrackerOpen(false);
          setIsForgotPasswordOpen(false);
        } else if (selectedRole !== null) {
          handleBackToRolePicker();
        } else {
          onBackToPortal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRole, isRegisterOpen, isTrackerOpen, isForgotPasswordOpen]);

  const handleProceedFromTracker = (assignedEmail?: string) => {
    if (assignedEmail) {
      setSelectedRole('staff');
      setEmail(assignedEmail);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-70px)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-900">
      
      {/* Modern Meridian University Campus Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={portalBgImg}
          alt="Meridian University Campus Portal"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        {/* Soft, clean frosted gradient overlay */}
        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs" />
      </div>

      {/* Relocated Prominent Back to Portal Home Navigation Bar */}
      <div className="relative z-10 max-w-lg w-full mx-auto mb-3 flex items-center justify-start">
        <button
          type="button"
          onClick={selectedRole !== null ? handleBackToRolePicker : onBackToPortal}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md px-4 py-2 rounded-xl transition-all border border-slate-700/80 cursor-pointer shadow-md"
          title="Return to main institutional portal"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{selectedRole !== null ? 'Back to Role Selection' : 'Back to Portal Home'}</span>
        </button>

      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-lg w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center border-b border-slate-800 relative">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-md border border-slate-700/60 p-1.5">
            <ScholarFlowLogo size="lg" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Meridian <span className="text-indigo-400">University</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Institutional Scholarship &amp; Financial Aid Portal
          </p>
        </div>

        {/* Dynamic Content */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            
            {selectedRole === null ? (
              <motion.div
                key="role-picker"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    Step 1 of 2
                  </span>
                  <h3 className="text-base font-bold text-slate-900 pt-1">
                    Select Your Role
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Choose whether you are logging in as a Staff Coordinator or a System Administrator.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  
                  {/* Option 1: Staff Coordinator */}
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleSelectRole('staff')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-xl p-5 text-left transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          Staff
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        Staff Coordinator
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Review submissions, verify applicant documents, schedule interviews, and log decisions.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">
                        Continue to Sign In
                      </span>
                      <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>

                  {/* Option 2: System Admin */}
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleSelectRole('admin')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-900 rounded-xl p-5 text-left transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          Admin
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-900 transition-colors">
                        System Administrator
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Manage scholarship catalogs, configure quotas, view metrics, and export official reports.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Continue to Sign In
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>

                </div>

                {/* Staff Registration / Status Tracking Action Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">New Staff or Faculty Member?</span>
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Create a New Account
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs">
                    <span className="text-slate-500">Already submitted a registration?</span>
                    <button
                      type="button"
                      onClick={() => setIsTrackerOpen(true)}
                      className="font-medium text-slate-700 hover:text-indigo-600 underline transition"
                    >
                      Track your account application
                    </button>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-xs text-slate-400">
                    Restricted to authorized Meridian University faculty, staff, and administrators.
                  </p>
                </div>
              </motion.div>
            ) : (
              
              /* STEP 2: DEDICATED SIGN IN FORM */
              <motion.div
                key={`login-form-${selectedRole}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Role badge header */}
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                      selectedRole === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {selectedRole === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {selectedRole === 'admin' ? 'System Administrator Portal' : 'Staff Coordinator Portal'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Enter your credentials to continue
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToRolePicker}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 hover:underline cursor-pointer"
                  >
                    Change Role
                  </button>
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 text-rose-800 p-3.5 rounded-xl border border-rose-200 text-xs font-medium flex items-center space-x-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        maxLength={150}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={selectedRole === 'admin' ? 'admin@meridian.edu' : 'staff@meridian.edu'}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Password
                      </label>
                      {selectedRole === 'staff' && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition hover:underline cursor-pointer"
                        >
                          Forgot password
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={100}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-slate-900 hover:bg-indigo-600 shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {loading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-indigo-300" />
                        <span>
                          Sign In as {selectedRole === 'admin' ? 'System Administrator' : 'Staff Coordinator'}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Staff specific options */}
                  {selectedRole === 'staff' && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-center text-xs">
                      <div>
                        <span className="text-slate-500">Need a new staff account? </span>
                        <button
                          type="button"
                          onClick={() => setIsRegisterOpen(true)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 underline transition cursor-pointer"
                        >
                          Create a New Account
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-500">Submitted an application? </span>
                        <button
                          type="button"
                          onClick={() => setIsTrackerOpen(true)}
                          className="font-medium text-slate-700 hover:text-indigo-600 underline transition cursor-pointer"
                        >
                          Track your account application
                        </button>
                      </div>

                    </div>
                  )}

                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {/* Staff Registration Modal */}
      <StaffRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        staffApplications={staffApplications}
        users={users}
        onSubmitApplication={async (appData) => {
          if (onStaffApplicationSubmit) {
            return await onStaffApplicationSubmit(appData);
          }
          return true;
        }}
        onOpenTracker={() => {
          setIsRegisterOpen(false);
          setIsTrackerOpen(true);
        }}
      />

      {/* Staff Account Tracker Modal */}
      <StaffAccountTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        staffApplications={staffApplications}
        onProceedToLogin={handleProceedFromTracker}
      />

      {/* Staff Forgot Password Recovery Modal */}
      <StaffForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={(recoveredEmail) => {
          setSelectedRole('staff');
          setEmail(recoveredEmail);
        }}
      />

      {/* Mandatory First-Time Login Security Questions Setup */}
      {pendingFirstTimeUser && (
        <StaffFirstTimeSecurityModal
          isOpen={isFirstTimeSetupOpen}
          user={pendingFirstTimeUser}
          onComplete={(updatedUser) => {
            setIsFirstTimeSetupOpen(false);
            setPendingFirstTimeUser(null);
            onLoginSuccess(updatedUser);
          }}
        />
      )}

    </div>
  );
};
