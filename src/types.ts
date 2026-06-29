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

export interface WebsiteAnalyzerData {
  https: boolean;
  ssl: boolean;
  mobileFriendly: boolean;
  responsive: boolean;
  speed: string;
  seoTitle: string;
  metaDescription: string;
  h1Tags: string[];
  robotsTxt: boolean;
  sitemap: boolean;
  openGraph: boolean;
  structuredData: boolean;
  contactForm: boolean;
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    twitter: string;
  };
  onlineBooking: boolean;
  liveChat: boolean;
  blog: boolean;
  testimonials: boolean;
  portfolio: boolean;
  googleAnalytics: boolean;
  modernDesign: string;
}

export interface ContactExtractionData {
  emails: string[];
  phones: string[];
}

export interface AiAuditData {
  websiteScore: number;
  seoScore: number;
  performanceScore: number;
  designScore: number;
  mobileScore: number;
  securityScore: number;
  leadScore: 'Hot Lead' | 'Warm Lead' | 'Cold Lead' | string;
  explanation: string;
  salesOpportunities: string[];
}

export interface DiscoveredLead {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  phone: string;
  website: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  rating: number;
  reviewCount: number;
  yelpRating: number;
  yelpReviewCount: number;
  mapsUrl: string;
  yelpUrl: string;
  latitude: number;
  longitude: number;
  
  // Custom CRM Lead Status
  status: 'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';
  isFavorite?: boolean;
  notes?: string;
  tags?: string[];
  followUpDate?: number;
  
  // Analyzer/Audit results
  websiteAnalyzer?: WebsiteAnalyzerData;
  contactExtraction?: ContactExtractionData;
  aiAudit?: AiAuditData;
  
  createdAt: number;
  updatedAt: number;
}

export interface SearchHistory {
  id: string;
  ownerId: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  radius: number;
  category: string;
  maxResults: number;
  createdAt: number;
}
