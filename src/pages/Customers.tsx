import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { db, addDoc, deleteDoc, doc, collection, OperationType, handleFirestoreError } from '../lib/firebase';
import { Plus, Mail, Building2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Customers() {
  const { user } = useAuth();
  const { customers } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', company: '', industry: '' });

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustomer.name || !newCustomer.email) return;
    try {
      await addDoc(collection(db, 'customers'), {
        ownerId: user.uid,
        name: newCustomer.name,
        email: newCustomer.email,
        company: newCustomer.company,
        industry: newCustomer.industry,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsAdding(false);
      setNewCustomer({ name: '', email: '', company: '', industry: '' });
      toast.success('Customer added');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Customer deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Customers</h1>
          <p className="text-slate-500">Manage your existing clients and contacts.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          New Customer
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addCustomer} className="mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            autoFocus
            required
            type="text"
            placeholder="Full Name"
            value={newCustomer.name}
            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors"
          />
          <input
            required
            type="email"
            placeholder="Email Address"
            value={newCustomer.email}
            onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Company"
            value={newCustomer.company}
            onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Industry"
            value={newCustomer.industry}
            onChange={e => setNewCustomer({ ...newCustomer, industry: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors"
          />
          <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-all">Save Customer</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex justify-between items-start group hover:border-blue-200 transition-colors">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{customer.name}</h3>
              <div className="flex items-center gap-2 text-slate-500 mb-4 text-sm">
                <Mail size={16} className="text-slate-400" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                {customer.company && (
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                    <Building2 size={14} className="text-blue-500" />
                    <span>{customer.company}</span>
                  </div>
                )}
                {customer.industry && (
                  <span className="text-slate-600 text-xs font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                    {customer.industry}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => handleDelete(customer.id)}
              className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        {customers.length === 0 && !isAdding && (
          <div className="col-span-1 lg:col-span-2 text-center text-slate-500 py-16 bg-white rounded-3xl border border-slate-200 border-dashed font-medium">
            No customers yet. Add your first customer to get started.
          </div>
        )}
      </div>
    </div>
  );
}
