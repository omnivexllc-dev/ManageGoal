export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: number;
  updatedAt: number;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  company?: string;
  status: LeadStatus;
  value?: number;
  aiSummary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  company?: string;
  industry?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
}
