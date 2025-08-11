import { collection, getDocs, addDoc } from 'firebase/firestore';
import { getDbInstance, isFirebaseEnabled, getAuthInstance } from './firebase';
import { Product } from '../types';

const baseFlag = 'migration_products_to_firestore_done';

export async function migrateLocalProductsToFirestore(): Promise<{ imported: number } | null> {
  try {
  if (!isFirebaseEnabled()) return null;

  const db = getDbInstance();
  if (!db) return null;
  const auth = getAuthInstance();
  const uid = auth?.currentUser?.uid;
  if (!uid) return null;
  const MIGRATION_FLAG = `${baseFlag}_${uid}`;
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return null;

    // If Firestore already has products, skip
  const snap = await getDocs(collection(db, `users/${uid}/products`));
    if (!snap.empty) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return null;
    }

    const local = JSON.parse(localStorage.getItem('products') || '[]') as Product[];
    if (!Array.isArray(local) || local.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return null;
    }

    let imported = 0;
    for (const p of local) {
      const { id: _id, ...rest } = p as any;
  await addDoc(collection(db, `users/${uid}/products`), {
        ...rest,
        createdAt: (p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt) || new Date().toISOString(),
        updatedAt: (p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt) || new Date().toISOString(),
      });
      imported++;
    }
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return { imported };
  } catch (e) {
    console.error('Migration failed', e);
    return null;
  }
}
