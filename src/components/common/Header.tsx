import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  LogOut,
  Shield,
  GraduationCap,
  Home,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
  User,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { ScholarFlowLogo } from './ScholarFlowLogo';

interface HeaderProps {
  activeUser: UserProfile | null;
  onLogout: () => void;
  currentView: 'portal' | 'student' | 'login' | 'staff' | 'admin';
  onNavigate: (view: 'portal' | 'student' | 'login' | 'staff' | 'admin', tab?: 'catalog' | 'tracker') => void;
  onOpenGuide: (tab: 'requirements' | 'faq') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onLogout,
  currentView,
  onNavigate,
  onOpenGuide,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'portal' | 'student' | 'login' | 'staff' | 'admin', tab?: 'catalog' | 'tracker') => {
    setMobileMenuOpen(false);
    onNavigate(view, tab);
  };

  const handleGuideClick = (tab: 'requirements' | 'faq') => {
    setMobileMenuOpen(false);
    onOpenGuide(tab);
  };

  return (
    <>
      {/* Top Subtle Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-medium flex justify-between items-center z-50 relative border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
              A.Y. 2026–2027
            </span>
            <span className="text-slate-300 truncate hidden sm:inline">
              Institutional scholarship applications & committee evaluations are actively open.
            </span>
            <span className="text-slate-300 truncate sm:hidden text-[10px]">
              Scholarship Operations Active
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-700 text-[10px] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">Secure Gateway</span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-[70px]">
            
            {/* Brand Logo & Title */}
            <div
              onClick={() => {
                if (activeUser) {
                  onNavigate(activeUser.role === 'admin' ? 'admin' : 'staff');
                } else {
                  onNavigate('portal');
                }
              }}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1 group-hover:border-indigo-400 group-hover:shadow-xs transition-all duration-300 shrink-0">
                <ScholarFlowLogo size="md" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Scholar<span className="text-indigo-600">Flow</span>
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase border border-slate-200 shrink-0">
                    PORTAL
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden md:block">
                  Academic Scholarship & Grant Management
                </span>
              </div>
            </div>

            {/* Desktop Navigation Menu: Requirements & FAQs ONLY on Student Portal */}
            <nav className="hidden lg:flex items-center space-x-1 font-semibold text-xs text-slate-600">
              {/* If on Student Portal: Show Home, Requirements, FAQs */}
              {currentView === 'student' && (
                <>
                  <button
                    onClick={() => handleNavClick('portal')}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Home</span>
                  </button>

                  <button
                    onClick={() => handleGuideClick('requirements')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Requirements</span>
                  </button>

                  <button
                    onClick={() => handleGuideClick('faq')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span>FAQs</span>
                  </button>
                </>
              )}

              {/* If on Login Page */}
              {currentView === 'login' && (
                <button
                  onClick={() => handleNavClick('portal')}
                  className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Portal Home</span>
                </button>
              )}

              {/* If on Staff or Admin Dashboard */}
              {(currentView === 'staff' || currentView === 'admin') && activeUser && (
                <div className="flex items-center space-x-2">
                  <span className={`font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border ${
                    activeUser.role === 'admin'
                      ? 'bg-slate-900 text-white border-slate-800'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{activeUser.role === 'admin' ? 'System Admin Dashboard' : 'Staff Coordinator Dashboard'}</span>
                  </span>
                </div>
              )}
            </nav>

            {/* Header Right Action & User Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* If Logged Out: Only display Staff & Admin Sign In on the main portal gateway */}
              {!activeUser && currentView === 'portal' && (
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    onClick={() => handleNavClick('login')}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Staff & Admin Sign In</span>
                  </button>
                </div>
              )}

              {/* If Logged In: Active User Pill */}
              {activeUser && (
                <div className="flex items-center space-x-2 bg-slate-50 p-1 sm:p-1.5 pl-2.5 sm:pl-3 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-900 text-white shrink-0">
                      {activeUser.role === 'admin' ? (
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Award className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                        {activeUser.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                        {activeUser.role === 'admin' ? 'Administrator' : 'Coordinator'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}

              {/* Mobile & Tablet Hamburger Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Responsive Slide-out Mobile & Tablet Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-2xs">
                    <ScholarFlowLogo size="sm" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-900">
                      Scholar<span className="text-indigo-600">Flow</span>
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {currentView === 'student' ? 'Student Portal Navigation' : 'Portal Navigation'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Links */}
              <div className="p-4 space-y-6 flex-1">
                
                {/* Active User Card in Drawer (if logged in) */}
                {activeUser && (
                  <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {activeUser.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Award className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{activeUser.full_name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{activeUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {activeUser.role === 'admin' ? 'Administrator' : 'Staff Coordinator'}
                      </span>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                        className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center space-x-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* WHEN ON STUDENT PORTAL: Show Home, Requirements, FAQs */}
                {currentView === 'student' ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Student Navigation
                    </span>

                    <button
                      onClick={() => handleNavClick('portal')}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <Home className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="font-bold">Home Portal</p>
                          <p className="text-[10px] font-normal text-slate-500">Back to main gateway</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleGuideClick('requirements')}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold">Eligibility & Requirements</p>
                          <p className="text-[10px] font-normal text-slate-500">Document checklists & criteria</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleGuideClick('faq')}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold">Frequently Asked Questions</p>
                          <p className="text-[10px] font-normal text-slate-500">Answers to applicant questions</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  /* WHEN NOT ON STUDENT PORTAL: Show clean Gateway navigation */
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                      Select Gateway
                    </span>

                    <button
                      onClick={() => handleNavClick('student')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-bold">Student Applicant Portal</p>
                          <p className="text-[10px] font-normal text-slate-500">Apply & track scholarships</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {!activeUser && (
                      <button
                        onClick={() => handleNavClick('login')}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white transition-all text-left shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Shield className="w-4 h-4 text-indigo-300" />
                          <div>
                            <p className="font-bold">Staff & Admin Sign In</p>
                            <p className="text-[10px] font-normal text-slate-400">Institutional Faculty Access</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Academic Aid Office</p>
                <p>aid@scholarflow.edu • +1 (800) 555-0199</p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
