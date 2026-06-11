import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lead, Customer, Task } from '../types';
import { auth } from '../lib/firebase';

export function useData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qLeads = query(collection(db, 'leads'), where('ownerId', '==', uid));
    const unsubLeads = onSnapshot(qLeads, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
      setLoadingLeads(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    const qCust = query(collection(db, 'customers'), where('ownerId', '==', uid));
    const unsubCust = onSnapshot(qCust, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    const qTasks = query(collection(db, 'tasks'), where('ownerId', '==', uid));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    return () => {
      unsubLeads();
      unsubCust();
      unsubTasks();
    };
  }, [auth.currentUser]);

  return { leads, customers, tasks, loadingLeads };
}
