import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { db, addDoc, updateDoc, deleteDoc, doc, collection, OperationType, handleFirestoreError } from '../lib/firebase';
import { Plus, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function Tasks() {
  const { user } = useAuth();
  const { tasks } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' });

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ownerId: user.uid,
        title: newTask.title,
        status: 'Todo',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsAdding(false);
      setNewTask({ title: '', dueDate: '' });
      toast.success('Task created');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const toggleStatus = async (task: any) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: task.status === 'Done' ? 'Todo' : 'Done',
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Task deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Tasks</h1>
          <p className="text-slate-500">Manage your to-dos and follow-ups.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          New Task
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addTask} className="mb-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
          <input
            autoFocus
            required
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 transition-colors w-40"
          />
          <button type="submit" className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all">Add</button>
        </form>
      )}

      <div className="space-y-4">
        {tasks.sort((a, b) => b.createdAt - a.createdAt).map(task => (
          <div key={task.id} className={`bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition-all shadow-sm group hover:border-blue-200 ${task.status === 'Done' ? 'opacity-50' : ''}`}>
            <button onClick={() => toggleStatus(task)} className={`shrink-0 transition-colors ${task.status === 'Done' ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'}`}>
              {task.status === 'Done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <div className="flex-1">
              <span className={`text-lg font-bold transition-all ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {task.title}
              </span>
              {task.dueDate && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                  <Calendar size={14} className="text-slate-400" />
                  {format(task.dueDate, 'MMM d, yyyy')}
                </div>
              )}
            </div>
            <button 
              onClick={() => handleDelete(task.id)}
              className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && !isAdding && (
          <div className="text-center text-slate-500 py-16 bg-white rounded-3xl border border-slate-200 border-dashed font-medium">
            No active tasks. Enjoy your day!
          </div>
        )}
      </div>
    </div>
  );
}
