import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
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
import { ConsignmentItem, SubmissionStatus, AdminPostStatus } from '../types/consignment';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const SUBMISSIONS_COLLECTION = 'submissions';

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
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
  const clean: Record<string, unknown> = {
    id: item.id,
    createdAt: item.createdAt,
    fullName: item.fullName,
    whatsappNumber: item.whatsappNumber,
    kecamatan: item.kecamatan,
    bankAccount: item.bankAccount,
    category: item.category,
    itemNameAndBrand: item.itemNameAndBrand,
    size: item.size || 'All Size',
    condition: item.condition,
    descriptionAndFlaws: item.descriptionAndFlaws,
    nettPrice: Number(item.nettPrice) || 0,
    photos: Array.isArray(item.photos) ? item.photos : [],
    agreementAccepted: Boolean(item.agreementAccepted),
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

  return clean;
};

/**
 * Re-compress base64 photos if total document size approaches Firestore 1 MiB limit (~900 KB safety threshold)
 */
const ensurePhotosFitFirestoreLimit = async (photos: string[]): Promise<string[]> => {
  const MAX_TOTAL_CHARS = 850_000; // ~850 KB safe margin under 1,048,576 bytes
  const totalChars = photos.reduce((acc, p) => acc + (p ? p.length : 0), 0);
  if (totalChars <= MAX_TOTAL_CHARS || typeof document === 'undefined') {
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
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  return Promise.all(photos.map((p) => compressDataUrl(p, 720, 0.62)));
};

/**
 * Save a consignment form submission to Firestore (`submissions/{docId}`)
 */
export const saveSubmissionToFirebase = async (item: ConsignmentItem): Promise<void> => {
  const docId = getSubmissionDocId(item.id);
  const path = `${SUBMISSIONS_COLLECTION}/${docId}`;
  try {
    const fittedPhotos = await ensurePhotosFitFirestoreLimit(item.photos);
    const payload = sanitizeConsignmentItemForFirestore({
      ...item,
      photos: fittedPhotos,
    });
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
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
 * Subscribe to public live catalog items ('Sedang Dipajang (Live)') with privacy masking
 */
export const subscribeToLiveCatalog = (
  onData: (items: ConsignmentItem[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void
): (() => void) => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('status', '==', 'Sedang Dipajang (Live)'),
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
            // Mask sensitive consignor fields for public catalog viewers
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
 * Validate connection to Firestore server on boot
 */
export const testFirestoreConnection = async (): Promise<void> => {
  try {
    await getDocFromServer(doc(db, '_connection_check', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Client appears offline.');
    }
  }
};
