import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingPage } from './components/portal/LandingPage';
import { StudentPortal } from './components/student/StudentPortal';
import { StaffAdminLogin } from './components/auth/StaffAdminLogin';
import { StaffPanel } from './components/staff/StaffPanel';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HelpGuideModal } from './components/common/HelpGuideModal';
import { LogoutConfirmationModal } from './components/common/LogoutConfirmationModal';
import { NotificationSidebar } from './components/common/NotificationSidebar';
import {
  getStoredActiveUser,
  saveStoredActiveUser,
  getStoredSessionToken,
  saveStoredSessionToken,
  getDisplacedSessionNotice,
  setDisplacedSessionNotice,
} from './lib/storage';
import {
  seedFirestoreIfEmpty,
  subscribeScholarships,
  subscribeApplications,
  subscribeFreezePeriods,
  subscribeInterviews,
  subscribeUsers,
  saveScholarshipToFirestore,
  updateScholarshipFreezeInFirestore,
  updateUserSessionTokenInFirestore,
  deleteScholarshipFromFirestore,
  createApplicationInFirestore,
  updateApplicationInFirestore,
  deleteApplicationFromFirestore,
  saveFreezePeriodToFirestore,
  resetFirestoreScholarships,
  saveUserToFirestore,
  deleteUserFromFirestore,
} from './lib/firebase';
import {
  fetchAllBackendData,
  syncCreateApplication,
  syncUpdateApplication,
  syncDeleteApplication,
  syncSaveScholarship,
  syncDeleteScholarship,
  syncSaveFreezePeriod,
  syncSaveInterview,
  syncDeleteInterview,
} from './lib/dataSync';
import { Scholarship, Application, FreezePeriod, UserProfile, InterviewSchedule, ApplicationStatus } from './types';
import { checkDuplicateApplication } from './lib/duplicateCheck';
import { logEvent } from './lib/logger';

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => getStoredActiveUser());
  const [displacedNotice, setDisplacedNotice] = useState<string | null>(() => getDisplacedSessionNotice());
  const [currentView, setCurrentView] = useState<'portal' | 'student' | 'login' | 'staff' | 'admin'>(() => {
    const user = getStoredActiveUser();

    // Route Guard: Check URL query, hash, or pathname for direct navigation attempts (e.g. /admin, /staff)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedRoute =
      urlParams.get('route') ||
      urlParams.get('view') ||
      (window.location.hash ? window.location.hash.replace('#', '').replace('/', '') : '');
    const pathname = window.location.pathname.toLowerCase();
    const isDirectAdmin = requestedRoute === 'admin' || pathname.endsWith('/admin');
    const isDirectStaff = requestedRoute === 'staff' || pathname.endsWith('/staff');

    // If an unauthenticated user attempts to access /admin or /staff directly,
    // intercept and redirect directly to login view
    if (isDirectAdmin) {
      if (!user || user.role !== 'admin') {
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname.split('?')[0]);
        }
        return 'login';
      }
      return 'admin';
    }

    if (isDirectStaff) {
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname.split('?')[0]);
        }
        return 'login';
      }
      return 'staff';
    }

    if (requestedRoute === 'login') return 'login';
    if (requestedRoute === 'student') return 'student';

    // Strict Landing Page Default Route: Base URL/root of the website strictly defaults to the public Landing Page ('portal').
    // Users should not bypass the landing page or be forced straight into a login screen upon first visit.
    return 'portal';
  });

  const [studentInitialTab, setStudentInitialTab] = useState<'catalog' | 'renewal' | 'tracker'>('catalog');
  const [selectedLandingScholarship, setSelectedLandingScholarship] = useState<Scholarship | null>(null);
  const [activeGuideModal, setActiveGuideModal] = useState<'requirements' | 'faq' | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const changeView = (
    view: 'portal' | 'student' | 'login' | 'staff' | 'admin',
    tab?: 'catalog' | 'renewal' | 'tracker'
  ) => {
    if (view === 'student' && tab) {
      setStudentInitialTab(tab);
    }
    setCurrentView(view);
    sessionStorage.setItem('scholarflow_current_view', view);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  // Scroll to top automatically whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  // Live Cloud Firestore Data State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [freezePeriods, setFreezePeriods] = useState<FreezePeriod[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  /**
   * Computes remaining scholarship slots accurately based on the actual recorded
   * student applications in the database (active non-rejected applications).
   */
  const calculateRemainingSlots = (scholarship: Scholarship, allApps: Application[]): number => {
    const activeCount = allApps.filter(
      (app) =>
        (app.scholarship_id === scholarship.id || app.scholarship_title === scholarship.title) &&
        app.status !== 'Rejected'
    ).length;
    return Math.max(0, scholarship.slots - activeCount);
  };

  // Derive real-time accurate scholarships where slots_remaining is dynamically
  // synchronized with the exact number of active student applications recorded in the database.
  const accurateScholarships = useMemo(() => {
    return scholarships.map((sch) => ({
      ...sch,
      slots_remaining: calculateRemainingSlots(sch, applications),
    }));
  }, [scholarships, applications]);

  // Self-healing synchronization: automatically repair any out-of-sync slot counts in the database
  useEffect(() => {
    if (scholarships.length > 0 && applications.length > 0) {
      scholarships.forEach((sch) => {
        const accurate = calculateRemainingSlots(sch, applications);
        if (sch.slots_remaining !== accurate) {
          const repaired = { ...sch, slots_remaining: accurate };
          syncSaveScholarship(repaired).catch(() => {});
        }
      });
    }
  }, [scholarships, applications]);

  /**
   * Automated Status Routing:
   * Detects when a scholarship's duration has lapsed and automatically routes it
   * to either an 'Expired' or 'For Renewal' status based on scholarship policy rules.
   */
  useEffect(() => {
    if (scholarships.length > 0 && applications.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      applications.forEach((app) => {
        if (app.status === 'Approved') {
          const scholarship = scholarships.find(
            (s) => s.id === app.scholarship_id || s.title === app.scholarship_title
          );
          const durationYears = scholarship?.duration_years || 1;
          const approvedDate = app.approved_at || app.created_at;
          let expiryDate = app.expires_at;

          if (!expiryDate && approvedDate) {
            const d = new Date(approvedDate);
            d.setFullYear(d.getFullYear() + durationYears);
            expiryDate = d.toISOString().split('T')[0];
          }

          if (expiryDate && today >= expiryDate) {
            let newStatus: ApplicationStatus = 'Expired';
            if (scholarship?.is_renewable) {
              const renewalDeadline = scholarship.renewal_deadline;
              if (!renewalDeadline || today <= renewalDeadline) {
                newStatus = 'For Renewal';
              } else {
                newStatus = 'Expired';
              }
            } else {
              newStatus = 'Expired';
            }

            if ((app.status as string) !== newStatus) {
              const updated: Application = {
                ...app,
                status: newStatus,
                expires_at: expiryDate,
                updated_at: new Date().toISOString(),
                remarks:
                  newStatus === 'For Renewal'
                    ? 'Scholarship duration term completed. Renewal window is open.'
                    : 'Scholarship duration term concluded. Expired.',
              };
              setApplications((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
              syncUpdateApplication(updated).catch(() => {});
              logEvent(
                'System',
                'Lifecycle',
                `Automated Status Routing: Application ${app.reference_code} (${app.first_name} ${app.last_name}) automatically routed to "${newStatus}"`
              );
            }
          }
        }
      });
    }
  }, [scholarships, applications]);

  // Initialize and connect live Cloud Firestore listeners & backend data sync on mount
  useEffect(() => {
    const loadedUser = getStoredActiveUser();
    setActiveUser(loadedUser);

    // Automatically seed Cloud Firestore database if collections are empty
    seedFirestoreIfEmpty().catch((err) => {
      console.warn('Initial Firestore setup notice:', err);
    });

    // Initial Fetch from backend REST API (fast immediate bootstrap)
    fetchAllBackendData().then((backendData) => {
      if (backendData.scholarships.length > 0) {
        setScholarships((prev) => (prev.length === 0 ? backendData.scholarships : prev));
      }
      if (backendData.applications.length > 0) {
        setApplications((prev) => (prev.length === 0 ? backendData.applications : prev));
      }
      if (backendData.freezePeriods.length > 0) {
        setFreezePeriods((prev) => (prev.length === 0 ? backendData.freezePeriods : prev));
      }
      if (backendData.interviews.length > 0) {
        setInterviews((prev) => (prev.length === 0 ? backendData.interviews : prev));
      }
    });

    // Real-time Cloud Firestore data subscriptions (pushes instant live updates to frontend)
    const unsubScholarships = subscribeScholarships((list) => {
      if (list && list.length > 0) setScholarships(list);
    });

    const unsubApplications = subscribeApplications((list) => {
      setApplications(list);
    });

    const unsubFreezePeriods = subscribeFreezePeriods((list) => {
      setFreezePeriods(list);
    });

    const unsubInterviews = subscribeInterviews((list) => {
      setInterviews(list);
    });

    // Real-time synchronization of faculty, staff, and professor accounts from Cloud Firestore
    const unsubUsers = subscribeUsers((list) => {
      setUsers(list);
      setActiveUser((prev) => {
        if (!prev) return null;
        const freshUser = list.find((u) => u.id === prev.id);
        if (freshUser) {
          const localSessionToken = getStoredSessionToken();
          // Check for single device displacement: if server has an active token that doesn't match our local token
          if (
            freshUser.active_session_token &&
            localSessionToken &&
            freshUser.active_session_token !== localSessionToken
          ) {
            saveStoredSessionToken(null);
            saveStoredActiveUser(null);
            localStorage.removeItem('scholarflow_current_view');
            const noticeMsg = 'Your session has ended because this account was accessed from another device.';
            setDisplacedSessionNotice(noticeMsg);
            setDisplacedNotice(noticeMsg);
            setTimeout(() => {
              setCurrentView('portal');
            }, 0);
            return null;
          }
          saveStoredActiveUser(freshUser);
          return freshUser;
        }
        return prev;
      });
    });

    return () => {
      unsubScholarships();
      unsubApplications();
      unsubFreezePeriods();
      unsubInterviews();
      unsubUsers();
    };
  }, []);

  const handleLoginSuccess = async (user: UserProfile) => {
    // Generate fresh session token for single device sessions
    const sessionToken = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    saveStoredSessionToken(sessionToken);
    setDisplacedSessionNotice(null);
    setDisplacedNotice(null);

    const userWithToken = { ...user, active_session_token: sessionToken };
    setActiveUser(userWithToken);
    saveStoredActiveUser(userWithToken);

    // Save token to Firestore to invalidate previous sessions on other devices
    updateUserSessionTokenInFirestore(user.id, sessionToken).catch((err) => {
      console.warn('Could not record active session token to Firestore:', err);
    });

    const targetView = user.role === 'admin' ? 'admin' : 'staff';
    changeView(targetView);
    logEvent('Security', 'Authentication', `User signed in: ${user.full_name} (${user.email}) — Role: ${user.role}`);
  };

  const handleLogout = () => {
    const currentUser = activeUser;
    saveStoredSessionToken(null);
    setActiveUser(null);
    saveStoredActiveUser(null);
    localStorage.removeItem('scholarflow_current_view');
    setCurrentView('portal');
    if (currentUser) {
      logEvent('Security', 'Authentication', `User signed out: ${currentUser.full_name} (${currentUser.email})`);
    }
  };

  const requestLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    handleLogout();
  };

  // Student Actions: Add Application (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleNewApplication = async (newApp: Application) => {
    // 1. Guard against duplicate application with same scholarship and same email or student ID
    const dupCheck = checkDuplicateApplication(
      applications,
      newApp.scholarship_id,
      newApp.email,
      newApp.student_number
    );
    if (dupCheck.isDuplicate) {
      console.warn('Blocked duplicate application submission:', dupCheck.message);
      throw new Error('You already applied for this scholarship');
    }

    // 2. Immediately reflect on frontend state (Optimistic update)
    const nextApplications = [newApp, ...applications.filter((a) => a.id !== newApp.id)];
    setApplications(nextApplications);

    // 3. Update slot count for target scholarship accurately based on actual recorded applications
    const targetSch = scholarships.find(s => s.id === newApp.scholarship_id || s.title === newApp.scholarship_title);
    if (targetSch) {
      const updatedRemaining = calculateRemainingSlots(targetSch, nextApplications);
      const updatedSch = {
        ...targetSch,
        slots_remaining: updatedRemaining,
      };
      setScholarships((prev) => prev.map(s => s.id === targetSch.id ? updatedSch : s));
      try {
        await syncSaveScholarship(updatedSch);
      } catch (err) {
        console.error('Failed to sync slot count update:', err);
      }
    }

    try {
      await syncCreateApplication(newApp);
      logEvent('Info', 'Application', `New application submitted: ${newApp.reference_code} — ${newApp.first_name} ${newApp.last_name} for "${newApp.scholarship_title}"`);
    } catch (err: any) {
      console.error('Failed to sync application to backend/database:', err);
      if (err?.message?.includes('already applied')) {
        setApplications((prev) => prev.filter((a) => a.id !== newApp.id));
        throw err;
      }
    }
  };

  // Staff Actions: Edit & Delete Application (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleUpdateApplicationFromStaff = async (updatedApp: Application) => {
    const nextApps = applications.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    setApplications(nextApps);

    // If application status changed (e.g. to or from Rejected), update the scholarship's slot count
    const targetSch = scholarships.find(
      (s) => s.id === updatedApp.scholarship_id || s.title === updatedApp.scholarship_title
    );
    if (targetSch) {
      const updatedRemaining = calculateRemainingSlots(targetSch, nextApps);
      if (targetSch.slots_remaining !== updatedRemaining) {
        const updatedSch = { ...targetSch, slots_remaining: updatedRemaining };
        setScholarships((prev) => prev.map((s) => (s.id === targetSch.id ? updatedSch : s)));
        syncSaveScholarship(updatedSch).catch((err) =>
          console.error('Failed to sync slot count on application update:', err)
        );
      }
    }

    try {
      await syncUpdateApplication(updatedApp);
      logEvent('Info', 'Application', `Application ${updatedApp.reference_code} status updated to "${updatedApp.status}" — ${updatedApp.first_name} ${updatedApp.last_name}`);
    } catch (err) {
      console.error('Failed to update application in backend/Firestore:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    // Find application being deleted to restore target scholarship slot count
    const appToDelete = applications.find((a) => a.id === id);

    // Optimistically remove from UI immediately
    const nextApps = applications.filter((a) => a.id !== id);
    setApplications(nextApps);

    // Slot restoration: based on accurate remaining applications
    if (appToDelete) {
      const targetSch = scholarships.find(
        (s) => s.id === appToDelete.scholarship_id || s.title === appToDelete.scholarship_title
      );
      if (targetSch) {
        const restoredRemaining = calculateRemainingSlots(targetSch, nextApps);
        const updatedSch = {
          ...targetSch,
          slots_remaining: restoredRemaining,
        };
        // Update local state first
        setScholarships((prev) => prev.map((s) => (s.id === targetSch.id ? updatedSch : s)));
        try {
          // Persist restored slot count to both backend and Firestore
          await syncSaveScholarship(updatedSch);
          logEvent('Info', 'Scholarship', `Slot restored for "${targetSch.title}": ${targetSch.slots_remaining} → ${restoredRemaining} (after application deletion)`);
        } catch (err) {
          console.error('Failed to sync restored slot count:', err);
        }
      }
      logEvent('Warning', 'Application', `Application deleted: ${appToDelete.reference_code} — ${appToDelete.first_name} ${appToDelete.last_name}`);
    }

    try {
      await syncDeleteApplication(id);
    } catch (err) {
      console.error('Failed to delete application from backend/Firestore:', err);
    }
  };

  const handleSaveFreezeAction = async (freezeRecord: FreezePeriod) => {
    setFreezePeriods((prev) => [freezeRecord, ...prev.filter((f) => f.id !== freezeRecord.id)]);

    try {
      await syncSaveFreezePeriod(freezeRecord);

      // Update targeted scholarships based on is_active (freeze vs unfreeze)
      const targeted = scholarships.filter(
        (s) => freezeRecord.scholarship_id === 'all' || s.id === freezeRecord.scholarship_id
      );
      const actionLabel = freezeRecord.is_active ? 'FROZEN' : 'UNFROZEN';
      for (const s of targeted) {
        const updated: Scholarship = {
          ...s,
          is_frozen: freezeRecord.is_active,
          freeze_note: freezeRecord.is_active ? freezeRecord.announcement_note : undefined,
        };
        setScholarships((prev) => prev.map((item) => (item.id === s.id ? updated : item)));

        // Explicitly clear freeze_note in Firestore using deleteField() on unfreeze
        await updateScholarshipFreezeInFirestore(
          s.id,
          freezeRecord.is_active,
          freezeRecord.is_active ? freezeRecord.announcement_note : undefined
        ).catch((err) => {
          console.warn('Firestore direct freeze update notice:', err);
        });

        await syncSaveScholarship(updated);
      }
      logEvent(
        freezeRecord.is_active ? 'Warning' : 'Info',
        'Freeze',
        `Scholarship ${actionLabel}: ${freezeRecord.scholarship_title || 'All Programs'} — "${freezeRecord.announcement_note}"`
      );
    } catch (err) {
      console.error('Failed to save freeze period to backend/Firestore:', err);
    }
  };

  const handleSaveInterview = async (interview: InterviewSchedule) => {
    setInterviews((prev) => {
      const idx = prev.findIndex((i) => i.id === interview.id || i.application_id === interview.application_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = interview;
        return next;
      }
      return [interview, ...prev];
    });

    try {
      await syncSaveInterview(interview);
      logEvent('Info', 'Interview', `Scheduled interview for ${interview.student_name} (${interview.date_time})`);
    } catch (err) {
      console.error('Failed to save interview to backend:', err);
    }
  };

  const handleDeleteInterview = async (id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    try {
      await syncDeleteInterview(id);
      logEvent('Info', 'Interview', `Deleted interview schedule (${id})`);
    } catch (err) {
      console.error('Failed to delete interview:', err);
    }
  };

  const handleClearAllInterviews = async () => {
    const toDelete = [...interviews];
    setInterviews([]);
    try {
      await Promise.allSettled(toDelete.map((i) => syncDeleteInterview(i.id)));
      logEvent('Warning', 'Interview', `Cleared all shortlist interview schedules`);
    } catch (err) {
      console.error('Failed to clear all interviews:', err);
    }
  };

  // Admin Actions: Add, Edit, Delete Scholarship
  const handleSaveScholarshipFromAdmin = async (sch: Scholarship) => {
    const accurateRemaining = calculateRemainingSlots(sch, applications);
    const normalizedSch: Scholarship = {
      ...sch,
      slots_remaining: accurateRemaining,
    };
    const isNew = !scholarships.some((s) => s.id === normalizedSch.id);
    setScholarships((prev) => {
      const exists = prev.some((s) => s.id === normalizedSch.id);
      return exists ? prev.map((s) => (s.id === normalizedSch.id ? normalizedSch : s)) : [normalizedSch, ...prev];
    });

    try {
      await syncSaveScholarship(normalizedSch);
      logEvent('System', 'Scholarship', `Scholarship ${isNew ? 'created' : 'updated'}: "${normalizedSch.title}" (${normalizedSch.code}) — Slots: ${normalizedSch.slots}, Remaining: ${normalizedSch.slots_remaining}, Grant: ₱${normalizedSch.grant_amount.toLocaleString()}`);
    } catch (err) {
      console.error('Failed to save scholarship to backend/Firestore:', err);
    }
  };

  const handleDeleteScholarshipFromAdmin = async (id: string) => {
    const schToDelete = scholarships.find((s) => s.id === id);
    setScholarships((prev) => prev.filter((s) => s.id !== id));

    try {
      await syncDeleteScholarship(id);
      logEvent('Warning', 'Scholarship', `Scholarship deleted: "${schToDelete?.title || id}" (${schToDelete?.code || id})`);
    } catch (err) {
      console.error('Failed to delete scholarship from backend/Firestore:', err);
    }
  };

  const handleRestoreDefaultScholarships = async () => {
    try {
      await resetFirestoreScholarships();
    } catch (err) {
      console.error('Failed to restore default scholarships in Firestore:', err);
    }
  };

  // Faculty & User Accounts Update (Cloud Firestore & Backend API)
  const handleUpdateUser = async (updatedUser: UserProfile) => {
    try {
      setUsers((prev) => {
        const index = prev.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedUser;
          return next;
        }
        return [...prev, updatedUser];
      });

      if (activeUser && activeUser.id === updatedUser.id) {
        setActiveUser(updatedUser);
        saveStoredActiveUser(updatedUser);
      }

      const firestorePromise = saveUserToFirestore(updatedUser).catch((err) => {
        console.error('Failed to update user profile in Firestore:', err);
      });

      const backendPromise = fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch((backendErr) => {
        console.warn('Backend API notification notice:', backendErr);
      });

      await Promise.allSettled([firestorePromise, backendPromise]);
    } catch (err) {
      console.error('Failed to update user profile:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    try {
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      const firestorePromise = deleteUserFromFirestore(userId).catch((err) => {
        console.error('Failed to delete user in Firestore:', err);
      });

      const backendPromise = fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch((backendErr) => {
        console.warn('Backend API delete notice:', backendErr);
      });

      await Promise.allSettled([firestorePromise, backendPromise]);
      logEvent('Warning', 'UserManagement', `Staff account deleted: "${userToDelete?.full_name || userId}" (${userToDelete?.email || userId})`);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleApplyScholarshipFromLanding = (scholarship: Scholarship) => {
    setSelectedLandingScholarship(scholarship);
    changeView('student', 'catalog');
  };

  const handleNavigate = (
    view: 'portal' | 'student' | 'login' | 'staff' | 'admin',
    tab?: 'catalog' | 'renewal' | 'tracker'
  ) => {
    if (view !== 'student') {
      setSelectedLandingScholarship(null);
    }
    if (view === 'staff' && activeUser?.role !== 'staff') {
      changeView('login');
    } else if (view === 'admin' && activeUser?.role !== 'admin') {
      changeView('login');
    } else {
      changeView(view, tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white overflow-x-hidden w-full">
      
      {/* Universal Responsive Header — shown on all views except full-bleed portal landing page */}
      {currentView !== 'portal' && (
        <Header
          activeUser={activeUser}
          onLogout={requestLogout}
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenGuide={(tab) => setActiveGuideModal(tab)}
          onOpenNotifications={() => setIsNotificationSidebarOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      )}

      {/* Displaced Session Notification Popup Toast */}
      {displacedNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="bg-amber-500/95 backdrop-blur-md text-slate-950 px-4 sm:px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-amber-600/80 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-bold min-w-0">
              <ShieldAlert className="w-5 h-5 text-slate-950 shrink-0" />
              <span className="leading-snug">{displacedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDisplacedNotice(null);
                setDisplacedSessionNotice(null);
              }}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm shrink-0 active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Page Views with responsive padding */}
      <main className="flex-1 w-full overflow-x-hidden">
        {currentView === 'portal' && (
          <LandingPage
            scholarships={accurateScholarships}
            applications={applications}
            activeUser={activeUser}
            onNavigate={handleNavigate}
            onOpenGuide={(tab) => setActiveGuideModal(tab)}
            onApplyScholarship={handleApplyScholarshipFromLanding}
            onLogout={requestLogout}
          />
        )}

        {currentView === 'student' && (
          <StudentPortal
            key={`student-portal-${studentInitialTab}`}
            scholarships={accurateScholarships}
            applications={applications}
            freezePeriods={freezePeriods}
            initialTab={studentInitialTab}
            initialScholarship={selectedLandingScholarship}
            onNewApplication={handleNewApplication}
          />
        )}

        {currentView === 'login' && (
          <StaffAdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToPortal={() => changeView('portal')}
          />
        )}

        {currentView === 'staff' && activeUser && (
          <StaffPanel
            user={activeUser}
            scholarships={accurateScholarships}
            applications={applications}
            freezePeriods={freezePeriods}
            interviews={interviews}
            onUpdateApplication={handleUpdateApplicationFromStaff}
            onDeleteApplication={handleDeleteApplication}
            onSaveFreeze={handleSaveFreezeAction}
            onSaveInterview={handleSaveInterview}
            onDeleteInterview={handleDeleteInterview}
            onClearAllInterviews={handleClearAllInterviews}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {currentView === 'admin' && activeUser && (
          <AdminDashboard
            user={activeUser}
            users={users}
            scholarships={accurateScholarships}
            applications={applications}
            freezePeriods={freezePeriods}
            onSaveScholarship={handleSaveScholarshipFromAdmin}
            onDeleteScholarship={handleDeleteScholarshipFromAdmin}
            onRestoreDefaultScholarships={handleRestoreDefaultScholarships}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onUpdateApplication={handleUpdateApplicationFromStaff}
            onDeleteApplication={handleDeleteApplication}
            onSaveFreeze={handleSaveFreezeAction}
            onSaveInterview={handleSaveInterview}
          />
        )}
      </main>

      {/* Interactive Universal Footer — shown on all views except full-bleed portal landing page */}
      {currentView !== 'portal' && (
        <Footer
          onNavigate={handleNavigate}
          onOpenGuide={(tab) => setActiveGuideModal(tab)}
          currentView={currentView}
        />
      )}

      {/* Responsive Help & FAQ Guide Modal */}
      <HelpGuideModal
        isOpen={Boolean(activeGuideModal)}
        initialTab={activeGuideModal || 'requirements'}
        onClose={() => setActiveGuideModal(null)}
        onNavigateToCatalog={() => {
          changeView('student', 'catalog');
        }}
        onNavigateToTracker={() => {
          changeView('student', 'tracker');
        }}
      />

      {/* Dedicated Notifications / Recent Updates Sidebar for Admin & Staff */}
      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        applications={applications}
        scholarships={accurateScholarships}
        freezePeriods={freezePeriods}
        onUnreadCountChange={setUnreadNotificationsCount}
      />

      {/* Logout Confirmation Modal Interceptor */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        userName={activeUser?.full_name}
      />

    </div>
  );
}
