import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { Lead, LeadStatus } from '../types';
import { db, addDoc, updateDoc, deleteDoc, doc, collection, OperationType, handleFirestoreError } from '../lib/firebase';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function Leads() {
  const { user } = useAuth();
  const { leads, loadingLeads } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', value: '' });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    try {
      await updateDoc(doc(db, 'leads', leadId), { 
        status: targetStatus,
        updatedAt: Date.now()
      });
      toast.success(`Lead moved to ${targetStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await deleteDoc(doc(db, 'leads', id));
      toast.success('Lead deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${id}`);
    }
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLead.name) return;
    try {
      await addDoc(collection(db, 'leads'), {
        ownerId: user.uid,
        name: newLead.name,
        company: newLead.company,
        value: Number(newLead.value) || 0,
        status: 'New',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsAdding(false);
      setNewLead({ name: '', company: '', value: '' });
      toast.success('Lead added');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
    }
  };

  if (loadingLeads) return <div className="p-8 text-slate-500 font-medium">Loading pipeline...</div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-8 overflow-hidden">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Sales Pipeline</h1>
          <p className="text-slate-500">Manage your leads and deals.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          New Lead
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addLead} className="mb-6 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 shrink-0 shadow-sm">
          <input
            autoFocus
            type="text"
            placeholder="Lead Name"
            value={newLead.name}
            onChange={e => setNewLead({ ...newLead, name: e.target.value })}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 text-sm font-medium transition-colors"
          />
          <input
            type="text"
            placeholder="Company"
            value={newLead.company}
            onChange={e => setNewLead({ ...newLead, company: e.target.value })}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 text-sm font-medium transition-colors"
          />
          <input
            type="number"
            placeholder="Value ($)"
            value={newLead.value}
            onChange={e => setNewLead({ ...newLead, value: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 text-sm font-medium transition-colors w-32"
          />
          <div className="flex items-center gap-2 ml-4">
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-700 font-medium px-3 py-2 transition-colors">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all">Save</button>
          </div>
        </form>
      )}

      <div className="flex gap-6 overflow-x-auto pb-4 h-full scrollbar-hide">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage);
          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="flex flex-col flex-shrink-0 w-[320px] bg-slate-50 border border-slate-200 rounded-[28px] overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-[28px]">
                <h3 className="font-bold text-slate-800">{stage}</h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold tracking-wide">{stageLeads.length}</span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 cursor-grab hover:border-blue-300 hover:shadow-md transition-all group relative flex flex-col min-h-[140px] shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 leading-tight">{lead.name}</h4>
                      <button onClick={() => handleDelete(lead.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {lead.company && <p className="text-xs font-semibold text-slate-500 mb-3">{lead.company}</p>}
                    
                    {lead.aiSummary && <p className="text-xs text-slate-600 mb-3 italic bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">"{lead.aiSummary}"</p>}

                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                      <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2.5 py-1 rounded-lg">
                        ${lead.value?.toLocaleString() || 0}
                      </span>
                      <button 
                        onClick={async () => {
                          const res = await fetch('/api/ai/summarize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'lead profile', text: `Lead name: ${lead.name}, Company: ${lead.company || 'Unknown'}, Value: $${lead.value}, Status: ${lead.status}` })
                          });
                          const data = await res.json();
                          if (data.summary) {
                            await updateDoc(doc(db, 'leads', lead.id), { aiSummary: data.summary, updatedAt: Date.now() });
                          }
                        }}
                        className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-xl transition-colors" 
                        title="Generate AI Summary">
                        <Wand2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
