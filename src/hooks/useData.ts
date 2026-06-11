import { useState, useEffect } from 'react';
import nprogress from 'nprogress';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lead, Customer, Task } from '../types';
import { auth } from '../lib/firebase';

export function useData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    let unsubLeads: (() => void) | undefined;
    let unsubCust: (() => void) | undefined;
    let unsubTasks: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;

        const qLeads = query(collection(db, 'leads'), where('ownerId', '==', uid));
        nprogress.start();
        unsubLeads = onSnapshot(qLeads, (snap) => {
          setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
          setLoadingLeads(false);
          nprogress.done();
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'leads');
          nprogress.done();
        });

        const qCust = query(collection(db, 'customers'), where('ownerId', '==', uid));
        unsubCust = onSnapshot(qCust, (snap) => {
          setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

        const qTasks = query(collection(db, 'tasks'), where('ownerId', '==', uid));
        unsubTasks = onSnapshot(qTasks, (snap) => {
          setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));
      } else {
        if (unsubLeads) unsubLeads();
        if (unsubCust) unsubCust();
        if (unsubTasks) unsubTasks();
        setLeads([]);
        setCustomers([]);
        setTasks([]);
      }
    });

    return () => {
      if (unsubLeads) unsubLeads();
      if (unsubCust) unsubCust();
      if (unsubTasks) unsubTasks();
      unsubscribeAuth();
    };
  }, []);

  return { leads, customers, tasks, loadingLeads };
}
