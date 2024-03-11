import {
  Firestore,
  getFirestore,
  DocumentSnapshot,
} from "firebase-admin/firestore";

export class Firebase {
  readonly firestore: Firestore;

  constructor() {
    this.firestore = getFirestore();
  }

  format<T>(snapshot: DocumentSnapshot) {
    return { id: snapshot.id, ...snapshot.data() } as T & {id: string};
  }
}
