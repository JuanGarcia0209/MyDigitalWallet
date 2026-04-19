import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private readonly firestore: Firestore) {}

  add<T extends object>(path: string, data: T): Promise<string> {
    const ref = collection(this.firestore, path);
    return addDoc(ref, data).then((result) => result.id);
  }

  set<T extends object>(path: string, id: string, data: T): Promise<void> {
    const ref = doc(this.firestore, `${path}/${id}`);
    return setDoc(ref, data, { merge: true });
  }

  update<T extends object>(path: string, id: string, data: Partial<T>): Promise<void> {
    const ref = doc(this.firestore, `${path}/${id}`);
    return updateDoc(ref, data as object);
  }

  delete(path: string, id: string): Promise<void> {
    const ref = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(ref);
  }

  getDoc<T>(path: string, id: string): Observable<T | undefined> {
    const ref = doc(this.firestore, `${path}/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<T | undefined>;
  }

  getCollection<T>(path: string): Observable<T[]> {
    const ref = collection(this.firestore, path);
    return collectionData(ref, { idField: 'id' }) as Observable<T[]>;
  }

  getCollectionWhere<T>(path: string, field: string, value: unknown): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, where(field, '==', value));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }
}
