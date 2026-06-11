import React, { useState } from 'react';
import { Plus, Zap, Play, Pause, MoreVertical, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  isActive: boolean;
  lastRun: string | null;
  runs: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'New Lead Assignment',
    description: 'Automatically assign new leads to available sales agents and send a welcome email.',
    trigger: 'Lead Created',
    actions: ['Assign to Agent', 'Send Email'],
    isActive: true,
    lastRun: '10 mins ago',
    runs: 1248
  },
  {
    id: '2',
    name: 'Stalled Deal Alert',
    description: 'Notify the manager when a deal has been in the Negotiation stage for over 7 days.',
    trigger: 'Time in Stage > 7 Days',
    actions: ['Send Slack Notification', 'Create Task'],
    isActive: true,
    lastRun: '2 hours ago',
    runs: 84
  },
  {
    id: '3',
    name: 'Customer Onboarding',
    description: 'Send a series of onboarding emails when a lead is marked as Won.',
    trigger: 'Lead Status = Won',
    actions: ['Wait 1 Day', 'Send Email', 'Wait 3 Days', 'Send Email'],
    isActive: false,
    lastRun: null,
    runs: 0
  }
];

export function Automation() {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);

  const toggleStatus = (id: string) => {
    setWorkflows(workflows.map(wf => 
      wf.id === id ? { ...wf, isActive: !wf.isActive } : wf
    ));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Automation</h1>
          <p className="text-slate-500">Manage your active workflows and triggers.</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-blue-200 transition-colors group">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${workflow.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Zap size={20} className={workflow.isActive ? 'fill-blue-600/20' : ''} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{workflow.name}</h3>
                  <p className="text-sm text-slate-500">{workflow.description}</p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 md:pl-13">
                <div className="flex items-center font-medium text-slate-600 text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-400 mr-1">IF:</span> {workflow.trigger}
                </div>
                <ArrowRight size={14} className="text-slate-300 hidden sm:block" />
                <div className="flex items-center font-medium text-blue-700 text-xs bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
                  <span className="opacity-70 mr-1">THEN:</span> {workflow.actions.length} Action{workflow.actions.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
              <div className="flex gap-6">
                <div className="text-sm">
                  <p className="text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Runs</p>
                  <p className="font-bold text-slate-900">{workflow.runs.toLocaleString()}</p>
                </div>
                <div className="text-sm w-24">
                  <p className="text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Last Run</p>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    {workflow.lastRun ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="truncate">{workflow.lastRun}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Never</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(workflow.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    workflow.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {workflow.isActive ? (
                    <><Pause size={16} className="fill-emerald-700/20" /> Active</>
                  ) : (
                    <><Play size={16} className="fill-slate-600/20" /> Paused</>
                  )}
                </button>
                <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
