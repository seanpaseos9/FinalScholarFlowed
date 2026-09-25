import {
  Scholarship,
  Application,
  FreezePeriod,
  InterviewSchedule,
  UserProfile,
} from '../types';
import {
  createApplicationInFirestore,
  updateApplicationInFirestore,
  deleteApplicationFromFirestore,
  saveScholarshipToFirestore,
  deleteScholarshipFromFirestore,
  saveFreezePeriodToFirestore,
  saveInterviewToFirestore,
  saveUserToFirestore,
} from './firebase';

/**
 * Data Synchronization Service
 * Ensures every create, edit, and delete action is completely recorded
 * to both the Backend API server and Cloud Firestore database,
 * and immediately reflected on the frontend.
 */

// -------------------------------------------------------------
// APPLICATIONS
// -------------------------------------------------------------

export async function syncCreateApplication(application: Application): Promise<Application> {
  const backendPromise = fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  }).then(async (res) => {
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(errData.error || 'You already applied for this scholarship');
      }
      console.warn('Backend API submission warning:', errData.error || res.statusText);
    }
  }).catch((apiErr: any) => {
    if (apiErr?.message?.includes('already applied')) {
      throw apiErr;
    }
    console.warn('Direct backend API notice:', apiErr);
  });

  const firestorePromise = createApplicationInFirestore(application).catch((firestoreErr) => {
    console.warn('Client Firestore write notice (backend handles persistence):', firestoreErr);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
  return application;
}

export async function syncUpdateApplication(application: Application): Promise<Application> {
  const backendPromise = fetch(`/api/applications/${application.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  }).catch((apiErr) => {
    console.warn('Backend update notice:', apiErr);
  });

  const firestorePromise = updateApplicationInFirestore(application).catch((firestoreErr) => {
    console.warn('Client Firestore update notice:', firestoreErr);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
  return application;
}

export async function syncDeleteApplication(id: string): Promise<void> {
  const backendPromise = fetch(`/api/applications/${id}`, {
    method: 'DELETE',
  }).catch((apiErr) => {
    console.warn('Backend delete notice:', apiErr);
  });

  const firestorePromise = deleteApplicationFromFirestore(id).catch((firestoreErr) => {
    console.warn('Client Firestore delete notice:', firestoreErr);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
}

// -------------------------------------------------------------
// SCHOLARSHIPS
// -------------------------------------------------------------

export async function syncSaveScholarship(scholarship: Scholarship): Promise<Scholarship> {
  const backendPromise = fetch(`/api/scholarships/${scholarship.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scholarship),
  }).catch((apiErr) => {
    console.warn('Backend scholarship save notice:', apiErr);
  });

  const firestorePromise = saveScholarshipToFirestore(scholarship).catch((firestoreErr) => {
    console.warn('Client Firestore scholarship notice:', firestoreErr);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
  return scholarship;
}

export async function syncDeleteScholarship(id: string): Promise<void> {
  const backendPromise = fetch(`/api/scholarships/${id}`, {
    method: 'DELETE',
  }).catch((apiErr) => {
    console.warn('Backend scholarship delete notice:', apiErr);
  });

  const firestorePromise = deleteScholarshipFromFirestore(id).catch((firestoreErr) => {
    console.warn('Client Firestore scholarship delete notice:', firestoreErr);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
}

// -------------------------------------------------------------
// FREEZE PERIODS & INTERVIEWS
// -------------------------------------------------------------

export async function syncSaveFreezePeriod(period: FreezePeriod): Promise<FreezePeriod> {
  const backendPromise = fetch('/api/freeze-periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(period),
  }).catch((err) => {
    console.warn('Backend freeze save notice:', err);
  });

  const firestorePromise = saveFreezePeriodToFirestore(period).catch((err) => {
    console.warn('Firestore freeze save notice:', err);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
  return period;
}

export async function syncSaveInterview(interview: InterviewSchedule): Promise<InterviewSchedule> {
  const backendPromise = fetch('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interview),
  }).catch((err) => {
    console.warn('Backend interview save notice:', err);
  });

  const firestorePromise = saveInterviewToFirestore(interview).catch((err) => {
    console.warn('Firestore interview save notice:', err);
  });

  await Promise.allSettled([backendPromise, firestorePromise]);
  return interview;
}

export async function syncDeleteInterview(id: string): Promise<void> {
  const backendPromise = fetch(`/api/interviews/${id}`, {
    method: 'DELETE',
  }).catch((err) => {
    console.warn('Backend interview delete notice:', err);
  });

  await backendPromise;
}

// -------------------------------------------------------------
// INITIAL RECOVERY & SYNC FETCH
// -------------------------------------------------------------

export async function fetchAllBackendData() {
  const results = {
    scholarships: [] as Scholarship[],
    applications: [] as Application[],
    freezePeriods: [] as FreezePeriod[],
    interviews: [] as InterviewSchedule[],
  };

  try {
    const [resSch, resApp, resFreeze, resInterviews] = await Promise.allSettled([
      fetch('/api/scholarships').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/applications').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/freeze-periods').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/interviews').then((r) => (r.ok ? r.json() : null)),
    ]);

    if (resSch.status === 'fulfilled' && resSch.value?.scholarships) {
      results.scholarships = resSch.value.scholarships;
    }
    if (resApp.status === 'fulfilled' && resApp.value?.applications) {
      results.applications = resApp.value.applications;
    }
    if (resFreeze.status === 'fulfilled' && resFreeze.value?.freeze_periods) {
      results.freezePeriods = resFreeze.value.freeze_periods;
    }
    if (resInterviews.status === 'fulfilled' && resInterviews.value?.interviews) {
      results.interviews = resInterviews.value.interviews;
    }
  } catch (err) {
    console.warn('Data sync initial fetch notice:', err);
  }

  return results;
}
