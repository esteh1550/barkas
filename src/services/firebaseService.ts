import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth } from './googleAuth';
import {
  ConsignmentItem,
  SubmissionStatus,
  AdminPostStatus,
  WantedRequest,
  WantedRequestStatus,
} from '../types/consignment';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Silence internal WebChannel fallback probe errors in iframe/proxy environments
try {
  setLogLevel('silent');
} catch {
  // ignore
}

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;

const SUBMISSIONS_COLLECTION = 'submissions';
const WANTED_COLLECTION = 'wanted_requests';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  const lowerMsg = errInfo.error.toLowerCase();
  if (
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('client is offline') ||
    lowerMsg.includes('could not reach cloud firestore')
  ) {
    console.warn('Firestore operating in offline/fallback mode:', errInfo.error);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Convert ticket ID (e.g. "#BM-2026-4821") into a clean Firestore Document ID ("BM-2026-4821")
 */
export const getSubmissionDocId = (ticketId: string): string => {
  return ticketId.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'unknown-ticket';
};

/**
 * Remove undefined fields and ensure payload fits within Firestore's 1 MiB limit
 */
const sanitizeConsignmentItemForFirestore = (
  item: ConsignmentItem
): Record<string, unknown> => {
  const rawWa = (item.whatsappNumber || '').trim();
  const clean: Record<string, unknown> = {
    id: (item.id || '#BM-2026-0000').slice(0, 50),
    createdAt: item.createdAt || new Date().toISOString(),
    fullName: (item.fullName || 'Penitip').trim().slice(0, 150) || 'Penitip',
    whatsappNumber: (rawWa.length >= 5 ? rawWa : '0800000000').slice(0, 35),
    kecamatan: (item.kecamatan || 'Majalengka').trim().slice(0, 100) || 'Majalengka',
    bankAccount: (item.bankAccount || '-').trim().slice(0, 250) || '-',
    category: item.category || 'Lainnya',
    itemNameAndBrand: (item.itemNameAndBrand || 'Barang Titipan').trim().slice(0, 250) || 'Barang Titipan',
    size: (item.size || 'All Size').trim().slice(0, 100) || 'All Size',
    condition: item.condition || 'Bekas Pemakaian Wajar',
    descriptionAndFlaws: (item.descriptionAndFlaws || '-').trim().slice(0, 4000) || '-',
    nettPrice: Math.max(1, Math.min(1000000000, Number(item.nettPrice) || 10000)),
    photos: Array.isArray(item.photos) && item.photos.length > 0 ? item.photos.slice(0, 8) : ['https://placehold.co/600x600?text=Barkas+Majalengka'],
    agreementAccepted: Boolean(item.agreementAccepted ?? true),
    status: item.status || 'Menunggu Kurasi',
  };

  if (typeof item.previousNettPrice === 'number' && item.previousNettPrice > 0) {
    clean.previousNettPrice = Number(item.previousNettPrice);
  }
  if (item.postStatus) {
    clean.postStatus = item.postStatus;
  }
  if (typeof item.syncedToGoogleForms === 'boolean') {
    clean.syncedToGoogleForms = item.syncedToGoogleForms;
  }
  if (item.googleFormId) {
    clean.googleFormId = item.googleFormId;
  }
  if (typeof item.adminRackLocation === 'string') {
    clean.adminRackLocation = item.adminRackLocation.trim().slice(0, 120);
  }
  if (typeof item.adminBottomNettPrice === 'number' && item.adminBottomNettPrice >= 0) {
    clean.adminBottomNettPrice = Number(item.adminBottomNettPrice);
  }
  if (typeof item.adminInternalNotes === 'string') {
    clean.adminInternalNotes = item.adminInternalNotes.trim().slice(0, 2000);
  }

  return clean;
};

/**
 * Re-compress base64 photos if total document size approaches Firestore 1 MiB limit (~900 KB safety threshold)
 */
const ensurePhotosFitFirestoreLimit = async (photos: string[]): Promise<string[]> => {
  const MAX_TOTAL_CHARS = 320_000; // ~320 KB fast-sync threshold for <1s Firestore writes
  const calcTotal = (arr: string[]) => arr.reduce((acc, p) => acc + (p ? p.length : 0), 0);
  if (calcTotal(photos) <= MAX_TOTAL_CHARS || typeof document === 'undefined') {
    return photos;
  }

  const compressDataUrl = (dataUrl: string, maxDim: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve('https://placehold.co/600x600?text=Barkas+Majalengka');
      img.src = dataUrl;
    });
  };

  let pass1 = await Promise.all(photos.map((p) => compressDataUrl(p, 560, 0.56)));
  if (calcTotal(pass1) > MAX_TOTAL_CHARS) {
    pass1 = await Promise.all(pass1.map((p) => compressDataUrl(p, 440, 0.48)));
  }
  return pass1;
};

/**
 * Save a consignment form submission to Firestore (`submissions/{docId}`)
 * Includes automatic fallback retry so cross-device submissions never fail silently.
 */
export const saveSubmissionToFirebase = async (item: ConsignmentItem): Promise<void> => {
  const docId = getSubmissionDocId(item.id);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
  try {
    const fittedPhotos = await ensurePhotosFitFirestoreLimit(item.photos || []);
    const payload = sanitizeConsignmentItemForFirestore({
      ...item,
      photos: fittedPhotos,
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (firstError) {
    try {
      // Fallback retry with ultra-compact photos (up to first 3 photos) to guarantee record reaches Admin device
      const compactPhotos = await ensurePhotosFitFirestoreLimit((item.photos || []).slice(0, 3));
      const fallbackPayload = sanitizeConsignmentItemForFirestore({
        ...item,
        photos: compactPhotos.slice(0, 3),
      });
      await setDoc(docRef, fallbackPayload, { merge: true });
    } catch (secondError) {
      handleFirestoreError(secondError || firstError, OperationType.WRITE, path);
      throw secondError || firstError;
    }
  }
};

/**
 * Update a submission's status in Firestore
 */
export const updateSubmissionStatusInFirebase = async (
  ticketId: string,
  newStatus: SubmissionStatus
): Promise<void> => {
  const docId = getSubmissionDocId(ticketId);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

/**
 * Update a submission's admin post status in Firestore
 */
export const updateSubmissionPostStatusInFirebase = async (
  ticketId: string,
  newPostStatus: AdminPostStatus
): Promise<void> => {
  const docId = getSubmissionDocId(ticketId);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    await updateDoc(docRef, { postStatus: newPostStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

/**
 * Update a submission's nettPrice and previousNettPrice (e.g. Price Drop H-20) in Firestore
 */
export const updateSubmissionPriceInFirebase = async (
  ticketId: string,
  newNettPrice: number,
  previousNettPrice?: number
): Promise<void> => {
  const docId = getSubmissionDocId(ticketId);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    const updatePayload: Record<string, unknown> = {
      nettPrice: Number(newNettPrice),
    };
    if (typeof previousNettPrice === 'number' && previousNettPrice > 0) {
      updatePayload.previousNettPrice = Number(previousNettPrice);
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

/**
 * Update a submission's internal admin notes, rack location, and bottom nett price
 */
export const updateSubmissionAdminNotesInFirebase = async (
  ticketId: string,
  notesPayload: {
    adminRackLocation?: string;
    adminBottomNettPrice?: number;
    adminInternalNotes?: string;
  }
): Promise<void> => {
  const docId = getSubmissionDocId(ticketId);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    const updateData: Record<string, unknown> = {};
    if (typeof notesPayload.adminRackLocation === 'string') {
      updateData.adminRackLocation = notesPayload.adminRackLocation.trim().slice(0, 120);
    }
    if (typeof notesPayload.adminBottomNettPrice === 'number') {
      updateData.adminBottomNettPrice = Math.max(0, Number(notesPayload.adminBottomNettPrice));
    }
    if (typeof notesPayload.adminInternalNotes === 'string') {
      updateData.adminInternalNotes = notesPayload.adminInternalNotes.trim().slice(0, 2000);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

/**
 * Delete a submission from Firestore
 */
export const deleteSubmissionFromFirebase = async (ticketId: string): Promise<void> => {
  const docId = getSubmissionDocId(ticketId);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

/**
 * Fetch a single submission by ticket ID (for public Ticket Tracker without exposing all submissions)
 */
export const getSubmissionByTicketId = async (ticketId: string): Promise<ConsignmentItem | null> => {
  const docId = getSubmissionDocId(ticketId.trim().toUpperCase());
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data() as ConsignmentItem;
    return {
      ...data,
      id: data.id || `#${snap.id}`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

/**
 * Force-fetch latest consignment submissions directly from Firestore Server (bypasses stale cache)
 */
export const fetchSubmissionsFromServer = async (
  maxItems: number = 100
): Promise<ConsignmentItem[]> => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  try {
    const snapshot = await getDocsFromServer(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as ConsignmentItem;
      return {
        ...data,
        id: data.id || `#${docSnap.id}`,
      };
    });
  } catch {
    try {
      const fallbackSnap = await getDocs(q);
      return fallbackSnap.docs.map((docSnap) => {
        const data = docSnap.data() as ConsignmentItem;
        return {
          ...data,
          id: data.id || `#${docSnap.id}`,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
      return [];
    }
  }
};

/**
 * Subscribe to real-time updates of consignment submissions ordered by newest first (bounded to 100 latest)
 */
export const subscribeToSubmissions = (
  onData: (items: ConsignmentItem[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void,
  maxItems: number = 100
): (() => void) => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ConsignmentItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as ConsignmentItem;
        return {
          ...data,
          id: data.id || `#${docSnap.id}`,
        };
      });
      onData(items);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
};

/**
 * Subscribe to public live catalog items ('Sedang Dipajang (Live)', 'Diterima', 'Menunggu Kurasi') with privacy masking
 */
export const subscribeToLiveCatalog = (
  onData: (items: ConsignmentItem[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void
): (() => void) => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('status', 'in', [
      'Sedang Dipajang (Live)',
      'Booked (Di-DP)',
      'Diterima',
      'Menunggu Kurasi',
    ]),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ConsignmentItem[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as ConsignmentItem;
          return {
            ...data,
            id: data.id || `#${docSnap.id}`,
            // Mask sensitive consignor & internal admin fields for public catalog viewers
            whatsappNumber: '',
            bankAccount: '',
            adminRackLocation: undefined,
            adminBottomNettPrice: undefined,
            adminInternalNotes: undefined,
          };
        })
        .filter((item) => item.postStatus !== 'Sold Out')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
};

/**
 * Subscribe to recently sold items ('Terjual' and 'Selesai & Dicairkan') with privacy masking for public social proof
 */
export const subscribeToSoldCatalog = (
  onData: (items: ConsignmentItem[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void
): (() => void) => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('status', 'in', ['Terjual', 'Selesai & Dicairkan']),
    limit(12)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ConsignmentItem[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as ConsignmentItem;
          return {
            ...data,
            id: data.id || `#${docSnap.id}`,
            whatsappNumber: '',
            bankAccount: '',
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
};

/**
 * Wanted Requests (Papan Titip Cari Barang) Firestore Helpers
 */
export const saveWantedRequestToFirebase = async (req: WantedRequest): Promise<void> => {
  const docId = getSubmissionDocId(req.id);
  const path = `${WANTED_COLLECTION}/${docId}`;
  try {
    const rawWa = (req.whatsappNumber || '').trim();
    const payload: Record<string, unknown> = {
      id: (req.id || '#REQ-2026-0000').slice(0, 50),
      createdAt: req.createdAt || new Date().toISOString(),
      requesterName: (req.requesterName || 'Warga Majalengka').trim().slice(0, 150),
      whatsappNumber: (rawWa.length >= 5 ? rawWa : '0800000000').slice(0, 35),
      kecamatan: (req.kecamatan || 'Majalengka').trim().slice(0, 100),
      category: req.category || 'Lainnya',
      itemWanted: (req.itemWanted || 'Barang Bekas').trim().slice(0, 250),
      maxBudget: Math.max(1000, Math.min(1000000000, Number(req.maxBudget) || 50000)),
      notes: (req.notes || '-').trim().slice(0, 2000) || '-',
      status: req.status || 'Masih Dicari',
    };
    await setDoc(doc(db, WANTED_COLLECTION, docId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const updateWantedRequestStatusInFirebase = async (
  reqId: string,
  newStatus: WantedRequestStatus
): Promise<void> => {
  const docId = getSubmissionDocId(reqId);
  const path = `${WANTED_COLLECTION}/${docId}`;
  try {
    await updateDoc(doc(db, WANTED_COLLECTION, docId), { status: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteWantedRequestFromFirebase = async (reqId: string): Promise<void> => {
  const docId = getSubmissionDocId(reqId);
  const path = `${WANTED_COLLECTION}/${docId}`;
  try {
    await deleteDoc(doc(db, WANTED_COLLECTION, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

export const subscribeToWantedRequests = (
  onData: (requests: WantedRequest[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void
): (() => void) => {
  const q = query(
    collection(db, WANTED_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: WantedRequest[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as WantedRequest;
        return {
          ...data,
          id: data.id || `#${docSnap.id}`,
        };
      });
      onData(list);
    },
    (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, WANTED_COLLECTION);
      if (onError) onError(errInfo);
    }
  );
};

/**
 * Validate connection to Firestore server on boot
 */
export const testFirestoreConnection = async (): Promise<void> => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently in offline fallback mode.');
    }
  }
};
