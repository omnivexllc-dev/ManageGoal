import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  DiscoveredLead, 
  SearchHistory, 
  WebsiteAnalyzerData, 
  ContactExtractionData, 
  AiAuditData 
} from '../types';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Calendar, 
  Star, 
  Tag, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  ChevronRight, 
  RefreshCw, 
  BarChart3, 
  Check, 
  Clock, 
  Play, 
  FileSpreadsheet, 
  X, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Palette, 
  FileCode, 
  Bookmark,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
];

const PRESET_CATEGORIES = [
  'Dentists', 'Restaurants', 'Roofing', 'HVAC', 'Plumbers', 'Electricians', 
  'Lawyers', 'Accountants', 'Real Estate', 'Insurance', 'Medical Clinics', 
  'Auto Repair', 'Salons', 'Gyms', 'Contractors', 'Marketing Agencies', 
  'Hotels', 'Retail Stores', 'Manufacturers'
];

const LEAD_STATUSES = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

export function LeadFinder() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'dashboard' | 'history'>('search');
  
  // Search state
  const [country, setCountry] = useState('US');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [radius, setRadius] = useState(15);
  const [category, setCategory] = useState('Dentists');
  const [customKeyword, setCustomKeyword] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Saved leads & Search history states
  const [savedLeads, setSavedLeads] = useState<DiscoveredLead[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  
  // Filter and search inside CRM
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState('All');
  const [crmLeadScoreFilter, setCrmLeadScoreFilter] = useState('All');
  const [crmFavoriteFilter, setCrmFavoriteFilter] = useState(false);

  // Selected Lead for Audit / Detail view
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedSavedLead, setSelectedSavedLead] = useState<DiscoveredLead | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Tag / Note inputs
  const [newTag, setNewTag] = useState('');
  const [notesText, setNotesText] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');

  // Fetch Saved Leads & History
  useEffect(() => {
    if (!user) return;
    
    // Listen to saved leads
    const qLeads = query(collection(db, 'discoveredLeads'), where('ownerId', '==', user.uid));
    const unsubLeads = onSnapshot(qLeads, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscoveredLead));
      setSavedLeads(list);
      setLoadingSaved(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'discoveredLeads');
    });

    // Listen to search history
    const qHistory = query(collection(db, 'searchHistory'), where('ownerId', '==', user.uid));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SearchHistory));
      setSearchHistory(list.sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'searchHistory');
    });

    return () => {
      unsubLeads();
      unsubHistory();
    };
  }, [user]);

  // Execute Business Discovery Search
  const handleSearch = async (e?: React.FormEvent, rerunQuery?: any) => {
    if (e) e.preventDefault();
    if (!user) return;
    
    const searchCat = rerunQuery ? rerunQuery.category : (customKeyword.trim() || category);
    const searchCity = rerunQuery ? rerunQuery.city : city;
    const searchState = rerunQuery ? rerunQuery.state : state;
    const searchCountry = rerunQuery ? rerunQuery.country : country;
    const searchZip = rerunQuery ? rerunQuery.zip : zip;
    const searchRadius = rerunQuery ? rerunQuery.radius : radius;
    const searchMax = rerunQuery ? rerunQuery.maxResults : maxResults;

    if (!searchCity) {
      toast.error('City is required to search businesses.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedLead(null);
    setSelectedSavedLead(null);
    
    try {
      // 1. Trigger Search Backend API
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: searchCountry,
          state: searchState,
          city: searchCity,
          zip: searchZip,
          radius: searchRadius,
          category: searchCat,
          maxResults: searchMax
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find business leads. Please try again.');
      }

      const data = await response.json();
      setSearchResults(data);
      toast.success(`Discovered ${data.length} businesses matching your criteria!`);

      // 2. Save to Search History in Firestore
      if (!rerunQuery) {
        await addDoc(collection(db, 'searchHistory'), {
          ownerId: user.uid,
          country: searchCountry,
          state: searchState,
          city: searchCity,
          zip: searchZip,
          radius: Number(searchRadius),
          category: searchCat,
          maxResults: Number(searchMax),
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during business search.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Run AI Audit on selected business
  const runWebsiteAudit = async (lead: any, isSavedLead: boolean = false) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          category: lead.category,
          website: lead.website,
          city: lead.city,
          state: lead.state,
          country: lead.country
        }),
      });

      if (!response.ok) {
        throw new Error('Audit engine failure.');
      }

      const auditData = await response.json();
      
      // Update selected states
      const updatedLead = {
        ...lead,
        websiteAnalyzer: auditData.websiteAnalyzer,
        contactExtraction: auditData.contactExtraction,
        aiAudit: auditData.aiAudit
      };

      if (isSavedLead) {
        // Update database doc
        await updateDoc(doc(db, 'discoveredLeads', lead.id), {
          websiteAnalyzer: auditData.websiteAnalyzer,
          contactExtraction: auditData.contactExtraction,
          aiAudit: auditData.aiAudit,
          updatedAt: Date.now()
        });
        setSelectedSavedLead(updatedLead);
        toast.success('AI Audit completed and saved to CRM!');
      } else {
        setSelectedLead(updatedLead);
        // Also update search result entry in local list
        setSearchResults(prev => prev.map(item => item.name === lead.name ? updatedLead : item));
        toast.success('AI Website audit generated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Audit generation failed.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Lead to Firestore CRM
  const saveLeadToCrm = async (lead: any) => {
    if (!user) return;
    
    // Check if already saved
    if (savedLeads.some(l => l.name.toLowerCase() === lead.name.toLowerCase() && l.city.toLowerCase() === lead.city.toLowerCase())) {
      toast.error('This lead is already saved in your CRM.');
      return;
    }

    try {
      const docPayload = {
        ownerId: user.uid,
        name: lead.name,
        category: lead.category || '',
        phone: lead.phone || '',
        website: lead.website || '',
        email: lead.email || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        zip: lead.zip || '',
        rating: Number(lead.rating) || 0,
        reviewCount: Number(lead.reviewCount) || 0,
        yelpRating: Number(lead.yelpRating) || 0,
        yelpReviewCount: Number(lead.yelpReviewCount) || 0,
        mapsUrl: lead.mapsUrl || '',
        yelpUrl: lead.yelpUrl || '',
        latitude: Number(lead.latitude) || 0,
        longitude: Number(lead.longitude) || 0,
        status: 'New',
        isFavorite: false,
        notes: '',
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(lead.websiteAnalyzer ? { websiteAnalyzer: lead.websiteAnalyzer } : {}),
        ...(lead.contactExtraction ? { contactExtraction: lead.contactExtraction } : {}),
        ...(lead.aiAudit ? { aiAudit: lead.aiAudit } : {})
      };

      await addDoc(collection(db, 'discoveredLeads'), docPayload);
      toast.success('Lead saved to CRM successfully!');
    } catch (err: any) {
      toast.error('Failed to save lead.');
      console.error(err);
    }
  };

  // Delete lead from CRM
  const deleteSavedLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lead from your CRM?')) return;
    try {
      await deleteDoc(doc(db, 'discoveredLeads', id));
      setSelectedSavedLead(null);
      toast.success('Lead deleted from CRM.');
    } catch (err: any) {
      toast.error('Failed to delete lead.');
    }
  };

  // Update CRM Lead attributes
  const updateSavedLeadAttr = async (leadId: string, updates: Partial<DiscoveredLead>) => {
    try {
      await updateDoc(doc(db, 'discoveredLeads', leadId), {
        ...updates,
        updatedAt: Date.now()
      });
      // Sync local viewing state if open
      if (selectedSavedLead && selectedSavedLead.id === leadId) {
        setSelectedSavedLead(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      toast.error('Failed to update lead attributes.');
    }
  };

  // Rerun a previous search
  const rerunSearch = (historyItem: SearchHistory) => {
    setCountry(historyItem.country);
    setState(historyItem.state);
    setCity(historyItem.city);
    setZip(historyItem.zip);
    setRadius(historyItem.radius);
    const isPreset = PRESET_CATEGORIES.includes(historyItem.category);
    if (isPreset) {
      setCategory(historyItem.category);
      setCustomKeyword('');
    } else {
      setCustomKeyword(historyItem.category);
    }
    setMaxResults(historyItem.maxResults);
    setActiveTab('search');
    handleSearch(undefined, historyItem);
  };

  // Add tag to saved lead
  const handleAddTag = async () => {
    if (!selectedSavedLead || !newTag.trim()) return;
    const currentTags = selectedSavedLead.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error('Tag already exists.');
      return;
    }
    const updated = [...currentTags, newTag.trim()];
    await updateSavedLeadAttr(selectedSavedLead.id, { tags: updated });
    setNewTag('');
    toast.success('Tag added!');
  };

  // Remove tag from saved lead
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedSavedLead) return;
    const currentTags = selectedSavedLead.tags || [];
    const updated = currentTags.filter(t => t !== tagToRemove);
    await updateSavedLeadAttr(selectedSavedLead.id, { tags: updated });
    toast.success('Tag removed');
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedSavedLead) return;
    await updateSavedLeadAttr(selectedSavedLead.id, { notes: notesText });
    toast.success('Notes saved successfully!');
  };

  // Set follow up date
  const handleSaveFollowUp = async () => {
    if (!selectedSavedLead) return;
    if (!followUpInput) {
      await updateSavedLeadAttr(selectedSavedLead.id, { followUpDate: undefined });
      toast.success('Follow-up date cleared!');
      return;
    }
    const timestamp = new Date(followUpInput).getTime();
    await updateSavedLeadAttr(selectedSavedLead.id, { followUpDate: timestamp });
    toast.success('Follow-up date scheduled!');
  };

  // Sync details fields when selecting a saved lead
  useEffect(() => {
    if (selectedSavedLead) {
      setNotesText(selectedSavedLead.notes || '');
      setFollowUpInput(selectedSavedLead.followUpDate ? new Date(selectedSavedLead.followUpDate).toISOString().substring(0, 10) : '');
    }
  }, [selectedSavedLead]);

  // Filter saved leads for CRM display
  const filteredSavedLeads = savedLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                          (lead.company && lead.company.toLowerCase().includes(crmSearch.toLowerCase())) ||
                          lead.city.toLowerCase().includes(crmSearch.toLowerCase());
    const matchesStatus = crmStatusFilter === 'All' || lead.status === crmStatusFilter;
    const matchesScore = crmLeadScoreFilter === 'All' || (lead.aiAudit && lead.aiAudit.leadScore === crmLeadScoreFilter);
    const matchesFavorite = !crmFavoriteFilter || lead.isFavorite;
    return matchesSearch && matchesStatus && matchesScore && matchesFavorite;
  });

  // Calculate Dashboard Metrics
  const totalCRMLeads = savedLeads.length;
  const hotLeads = savedLeads.filter(l => l.aiAudit?.leadScore === 'Hot Lead').length;
  const warmLeads = savedLeads.filter(l => l.aiAudit?.leadScore === 'Warm Lead').length;
  const coldLeads = savedLeads.filter(l => l.aiAudit?.leadScore === 'Cold Lead').length;
  const hasWebsite = savedLeads.filter(l => l.website && l.website.trim() !== '').length;
  const noWebsite = totalCRMLeads - hasWebsite;
  const hasEmail = savedLeads.filter(l => l.email || l.contactExtraction?.emails?.length).length;
  const hasPhone = savedLeads.filter(l => l.phone || l.contactExtraction?.phones?.length).length;
  
  const leadsWithWebsiteScore = savedLeads.filter(l => l.aiAudit?.websiteScore !== undefined);
  const avgWebsiteScore = leadsWithWebsiteScore.length 
    ? Math.round(leadsWithWebsiteScore.reduce((acc, l) => acc + (l.aiAudit?.websiteScore || 0), 0) / leadsWithWebsiteScore.length) 
    : 0;

  const leadsWithSeoScore = savedLeads.filter(l => l.aiAudit?.seoScore !== undefined);
  const avgSeoScore = leadsWithSeoScore.length 
    ? Math.round(leadsWithSeoScore.reduce((acc, l) => acc + (l.aiAudit?.seoScore || 0), 0) / leadsWithSeoScore.length) 
    : 0;

  // Export Leads to CSV
  const exportToCSV = () => {
    if (savedLeads.length === 0) {
      toast.error('No leads found in CRM to export.');
      return;
    }

    const headers = [
      'Business Name', 'Category', 'Phone', 'Website', 'Email', 'Address', 
      'City', 'State', 'Country', 'ZIP', 'Google Rating', 'Review Count', 
      'Lead Score', 'Website Score', 'SEO Score', 'Opportunities', 'Status', 'Favorite', 'Notes', 'Tags'
    ];

    const rows = savedLeads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.phone}"`,
      `"${l.website}"`,
      `"${l.email || (l.contactExtraction?.emails?.[0] || '')}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.city}"`,
      `"${l.state}"`,
      `"${l.country}"`,
      `"${l.zip}"`,
      l.rating,
      l.reviewCount,
      `"${l.aiAudit?.leadScore || ''}"`,
      l.aiAudit?.websiteScore || '',
      l.aiAudit?.seoScore || '',
      `"${(l.aiAudit?.salesOpportunities || []).join(', ')}"`,
      `"${l.status}"`,
      l.isFavorite ? 'Yes' : 'No',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.tags || []).join(',')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LeadFinder_AI_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported to CSV!');
  };

  // Export to Excel (represented elegantly with a formatted grid download)
  const exportToExcel = () => {
    // We can download as .xls format which Excel understands directly as a clean spreadsheet table!
    if (savedLeads.length === 0) {
      toast.error('No leads found in CRM to export.');
      return;
    }

    let xml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte o mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leads List</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; font-family: sans-serif; }
          th { background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; }
          td { padding: 6px; border: 1px solid #cbd5e1; }
          .hot { background-color: #fef2f2; color: #dc2626; font-weight: bold; }
          .warm { background-color: #fffbeb; color: #d97706; font-weight: bold; }
          .cold { background-color: #eff6ff; color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Category</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Email</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>ZIP</th>
              <th>Google Rating</th>
              <th>Lead Score</th>
              <th>Website Score</th>
              <th>SEO Score</th>
              <th>Sales Pitch Pitch</th>
              <th>CRM Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    savedLeads.forEach(l => {
      const cls = l.aiAudit?.leadScore === 'Hot Lead' ? 'hot' : l.aiAudit?.leadScore === 'Warm Lead' ? 'warm' : 'cold';
      xml += `
        <tr>
          <td>${l.name}</td>
          <td>${l.category}</td>
          <td>${l.phone}</td>
          <td>${l.website}</td>
          <td>${l.email || (l.contactExtraction?.emails?.[0] || '')}</td>
          <td>${l.address}</td>
          <td>${l.city}</td>
          <td>${l.state}</td>
          <td>${l.zip}</td>
          <td>${l.rating}</td>
          <td class="${cls}">${l.aiAudit?.leadScore || 'Un-audited'}</td>
          <td>${l.aiAudit?.websiteScore ?? 'N/A'}</td>
          <td>${l.aiAudit?.seoScore ?? 'N/A'}</td>
          <td>${(l.aiAudit?.salesOpportunities || []).join(', ')}</td>
          <td>${l.status}</td>
        </tr>
      `;
    });

    xml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LeadFinder_AI_Report_${new Date().toISOString().substring(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Leads report exported to Microsoft Excel!');
  };

  // Export Selected Audit to PDF (Print Friendly layout)
  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 bg-[#F8FAFC] min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Search className="w-6 h-6" />
            </span>
            LeadFinder AI
          </h1>
          <p className="text-slate-500 mt-1">Discover, analyze and secure high-value clients needing web design and SEO services.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Search className="w-4 h-4" />
            Find Leads
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'saved' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Bookmark className="w-4 h-4" />
            Saved Leads
            {savedLeads.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {savedLeads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <BarChart3 className="w-4 h-4" />
            SaaS Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* 1. FIND LEADS TAB */}
      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          
          {/* Search Inputs (Form Panel) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col h-fit">
            <h2 className="text-lg font-bold text-slate-950 mb-5 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Target Location & Criteria
            </h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              
              {/* Country Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Country</label>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountry(c.code)}
                      className={`p-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${country === c.code ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span className="text-base">{c.flag}</span>
                      {c.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* City & State / Province */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">State / Prov</label>
                  <input
                    type="text"
                    placeholder="e.g. TX or ON"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* ZIP / Postal Code & Radius */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ZIP / Postal</label>
                  <input
                    type="text"
                    placeholder="e.g. 78701"
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Radius (Miles)</label>
                  <select
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value={5}>5 Miles</option>
                    <option value={10}>10 Miles</option>
                    <option value={15}>15 Miles</option>
                    <option value={25}>25 Miles</option>
                    <option value={50}>50 Miles</option>
                  </select>
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Business Category</label>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setCustomKeyword(''); // Clear custom keyword if choosing preset
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  {PRESET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Custom Keyword (Overrides Preset) */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Or Custom Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Installers, Organic Cafes"
                  value={customKeyword}
                  onChange={e => setCustomKeyword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Maximum Results */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Maximum Results</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxResults(val)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${maxResults === val ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Searching Live APIs...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Discover Leads
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Search Results Display Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {searchResults.length === 0 && !isSearching && (
              <div className="bg-white border border-slate-200 rounded-[28px] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Discover Potential Agency Clients</h3>
                <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
                  Enter a target location and business category to find restaurants, plumbers, or shops. LeadFinder AI automatically analyzes their digital health and flags SEO/design flaws!
                </p>
              </div>
            )}

            {isSearching && (
              <div className="bg-white border border-slate-200 rounded-[28px] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-950">Scanning Local Business Listings...</h3>
                <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
                  We are querying the Google Places and Yelp Fusion repositories for real listings matching your parameters, organizing coordinates, ratings, reviews, and website links.
                </p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-slate-900 text-lg">Search Results ({searchResults.length} Leads found)</h3>
                  <span className="text-xs text-slate-400 font-mono">Powered by Google Places & Yelp</span>
                </div>

                <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                  {searchResults.map((lead, idx) => {
                    const isAlreadySaved = savedLeads.some(l => l.name.toLowerCase() === lead.name.toLowerCase() && l.city.toLowerCase() === lead.city.toLowerCase());
                    const showAudit = lead.aiAudit;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row gap-5 items-start justify-between ${selectedLead?.name === lead.name ? 'border-blue-500 ring-2 ring-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-950 text-base">{lead.name}</h4>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-medium">
                              {lead.category}
                            </span>
                            {lead.website ? (
                              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                <Globe className="w-3 h-3" /> Has Site
                              </span>
                            ) : (
                              <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> No Site
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{lead.address}, {lead.city}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>{lead.phone || 'No phone listed'}</span>
                            </div>
                            {lead.website && (
                              <div className="flex items-center gap-1.5 text-blue-600 font-medium col-span-2">
                                <Globe className="w-3.5 h-3.5 shrink-0" />
                                <a href={lead.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                                  {lead.website} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-medium pt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-amber-500 font-bold">★ {lead.rating}</span>
                              <span className="text-slate-400">({lead.reviewCount} reviews)</span>
                            </div>
                            {lead.yelpRating > 0 && (
                              <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                                <span className="text-red-500 font-semibold font-sans">Yelp:</span>
                                <span className="text-amber-500 font-bold">★ {lead.yelpRating}</span>
                                <span className="text-slate-400">({lead.yelpReviewCount})</span>
                              </div>
                            )}
                          </div>

                          {showAudit && (
                            <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg text-white font-bold text-xs shrink-0 ${lead.aiAudit.leadScore.includes('Hot') ? 'bg-red-600' : lead.aiAudit.leadScore.includes('Warm') ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                {lead.aiAudit.leadScore.substring(0, 3)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">Website Score: {lead.aiAudit.websiteScore}/100</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="font-bold text-slate-900 text-xs">SEO Score: {lead.aiAudit.seoScore}/100</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {lead.aiAudit.explanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Audit & CRM Actions */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              if (!lead.aiAudit) {
                                runWebsiteAudit(lead, false);
                              }
                            }}
                            className="flex-1 md:flex-initial text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            {lead.aiAudit ? 'View Audit' : 'Analyze Site'}
                          </button>
                          
                          <button
                            onClick={() => saveLeadToCrm(lead)}
                            disabled={isAlreadySaved}
                            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${isAlreadySaved ? 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                          >
                            {isAlreadySaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3.5 h-3.5" />
                                Save Lead
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 2. SAVED LEADS TAB (CRM) */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          
          {/* Saved Leads Filters & Sidebar List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col max-h-[750px] overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                Saved CRM Leads
              </h2>
              
              {/* Batch Export Dropdown */}
              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-all shadow-sm"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  onClick={exportToCSV}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-all shadow-sm"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Local CRM Search bar */}
            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by company, city..."
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter options */}
            <div className="grid grid-cols-3 gap-1.5 mb-4 shrink-0">
              <select
                value={crmStatusFilter}
                onChange={e => setCrmStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700"
              >
                <option value="All">Status: All</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select
                value={crmLeadScoreFilter}
                onChange={e => setCrmLeadScoreFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700"
              >
                <option value="All">Score: All</option>
                <option value="Hot Lead">🔥 Hot</option>
                <option value="Warm Lead">🟠 Warm</option>
                <option value="Cold Lead">🔵 Cold</option>
              </select>

              <button
                onClick={() => setCrmFavoriteFilter(!crmFavoriteFilter)}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${crmFavoriteFilter ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                <Star className="w-3 h-3 fill-current" /> Stars
              </button>
            </div>

            {/* Leads List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredSavedLeads.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium">
                  No saved leads matching the criteria.
                </div>
              ) : (
                filteredSavedLeads.map(lead => {
                  const scoreLabel = lead.aiAudit?.leadScore;
                  const websiteScore = lead.aiAudit?.websiteScore;
                  
                  return (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSelectedSavedLead(lead);
                        setSelectedLead(null);
                      }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedSavedLead?.id === lead.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-bold text-slate-950 text-sm leading-snug">{lead.name}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSavedLeadAttr(lead.id, { isFavorite: !lead.isFavorite });
                          }}
                          className="text-amber-400 hover:text-amber-500 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${lead.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{lead.city}, {lead.state}</span>
                        <span className="text-slate-300">•</span>
                        <span>{lead.category}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          lead.status === 'Won' ? 'bg-emerald-50 text-emerald-700' :
                          lead.status === 'Lost' ? 'bg-rose-50 text-rose-700' :
                          lead.status === 'Proposal' ? 'bg-purple-50 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {lead.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {scoreLabel ? (
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              scoreLabel.includes('Hot') ? 'bg-red-50 text-red-600' :
                              scoreLabel.includes('Warm') ? 'bg-amber-50 text-amber-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {scoreLabel.includes('Hot') ? '🔥 Hot' : scoreLabel.includes('Warm') ? '🟠 Warm' : '🔵 Cold'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Un-audited</span>
                          )}

                          {websiteScore !== undefined && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              {websiteScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* CRM Lead Detailed Information & CRM controls */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {!selectedSavedLead && (
              <div className="bg-white border border-slate-200 rounded-[28px] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Select a Lead to Manage</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-2 leading-relaxed">
                  Select a business from your saved CRM list on the left to set custom tags, view detailed website speed check summaries, log call notes, and schedule calendar follow-up dates.
                </p>
              </div>
            )}

            {selectedSavedLead && (
              <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col gap-6">
                
                {/* Header Actions */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950 leading-tight">{selectedSavedLead.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedSavedLead.address}, {selectedSavedLead.city}, {selectedSavedLead.state} {selectedSavedLead.zip}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => deleteSavedLead(selectedSavedLead.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* CRM Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  
                  {/* Lead CRM Status */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Status</span>
                    <select
                      value={selectedSavedLead.status}
                      onChange={e => updateSavedLeadAttr(selectedSavedLead.id, { status: e.target.value as any })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Follow-up Datepicker */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Follow-up Date</span>
                    <input
                      type="date"
                      value={followUpInput}
                      onChange={e => {
                        setFollowUpInput(e.target.value);
                      }}
                      onBlur={handleSaveFollowUp}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Rating / Review Stats */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Local Standing</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                      <span>★ {selectedSavedLead.rating}</span>
                      <span className="text-slate-400 font-medium">({selectedSavedLead.reviewCount} reviews)</span>
                    </div>
                  </div>

                </div>

                {/* Tags Section */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(selectedSavedLead.tags || []).map(tag => (
                      <span key={tag} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                      </span>
                    ))}
                    
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white max-w-[150px]">
                      <input
                        type="text"
                        placeholder="New tag..."
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                        className="px-2 py-1 text-xs font-medium outline-none w-full"
                      />
                      <button onClick={handleAddTag} className="bg-slate-100 hover:bg-slate-200 px-2 py-1 border-l border-slate-200">
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Internal CRM Notes
                    </h4>
                    <button
                      onClick={handleSaveNotes}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                    >
                      Save Notes
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter customized call records, sales pitches, or email history logs..."
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Audit & Web Analyzer Details */}
                <div className="border-t border-slate-100 pt-6">
                  
                  {!selectedSavedLead.aiAudit ? (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center flex flex-col items-center justify-center">
                      <Sparkles className="w-8 h-8 text-blue-500 mb-2 animate-pulse" />
                      <h4 className="font-bold text-slate-950 text-sm">No Website Audit Generated Yet</h4>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm">
                        Generate an AI Website and SEO audit containing performance diagnostics, lead scores, and recommended agency upsell pitches.
                      </p>
                      <button
                        onClick={() => runWebsiteAudit(selectedSavedLead, true)}
                        disabled={isAnalyzing}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Run AI Website Audit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Audit Overview Badge */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm ${
                            selectedSavedLead.aiAudit.leadScore.includes('Hot') ? 'bg-red-600 shadow-red-100' :
                            selectedSavedLead.aiAudit.leadScore.includes('Warm') ? 'bg-amber-500 shadow-amber-100' :
                            'bg-blue-600 shadow-blue-100'
                          }`}>
                            {selectedSavedLead.aiAudit.leadScore.includes('Hot') ? '🔥' : selectedSavedLead.aiAudit.leadScore.includes('Warm') ? '🟠' : '🔵'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-950 text-base">{selectedSavedLead.aiAudit.leadScore}</h4>
                            <p className="text-slate-500 text-xs font-medium">AI Audit Diagnostics</p>
                          </div>
                        </div>

                        {/* Audit print button */}
                        <button
                          onClick={() => {
                            setSelectedLead(selectedSavedLead);
                          }}
                          className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          View Full Audit Details
                        </button>
                      </div>

                      {/* Six Performance Gauges */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <Gauge score={selectedSavedLead.aiAudit.websiteScore} label="Overall" color="bg-blue-600" />
                        <Gauge score={selectedSavedLead.aiAudit.seoScore} label="SEO" color="bg-indigo-600" />
                        <Gauge score={selectedSavedLead.aiAudit.performanceScore} label="Speed" color="bg-emerald-600" />
                        <Gauge score={selectedSavedLead.aiAudit.designScore} label="Design" color="bg-purple-600" />
                        <Gauge score={selectedSavedLead.aiAudit.mobileScore} label="Mobile" color="bg-pink-600" />
                        <Gauge score={selectedSavedLead.aiAudit.securityScore} label="Security" color="bg-rose-600" />
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. SAAS DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 print:hidden">
          
          {/* Top Statistics Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Saved Leads" value={totalCRMLeads} subText="Across all categories" icon={<Bookmark className="w-5 h-5 text-blue-500" />} />
            <StatsCard title="🔥 Hot Leads" value={hotLeads} subText="Immediate Sales Action" icon={<Sparkles className="w-5 h-5 text-red-500" />} />
            <StatsCard title="Average Web Score" value={`${avgWebsiteScore}%`} subText="Client digital health" icon={<Award className="w-5 h-5 text-emerald-500" />} />
            <StatsCard title="Average SEO Score" value={`${avgSeoScore}%`} subText="Client visibility index" icon={<LineChart className="w-5 h-5 text-purple-500" />} />
          </div>

          {/* Web presence Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsMiniCard title="Businesses With Website" value={hasWebsite} color="text-emerald-600" />
            <StatsMiniCard title="Businesses Without Website" value={noWebsite} color="text-rose-600" />
            <StatsMiniCard title="Businesses With Email" value={hasEmail} color="text-blue-600" />
            <StatsMiniCard title="Businesses With Phone" value={hasPhone} color="text-indigo-600" />
          </div>

          {/* Visual Recharts Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Chart 1: Lead Score breakdown */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Lead Score Breakdown
              </h3>
              
              {totalCRMLeads === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm font-medium">
                  No saved leads to display metrics.
                </div>
              ) : (
                <div className="h-[250px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '🔥 Hot Lead', value: hotLeads },
                          { name: '🟠 Warm Lead', value: warmLeads },
                          { name: '🔵 Cold Lead', value: coldLeads }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#dc2626" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#2563eb" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: Web Presence Statistics */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-950 mb-4 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                Digital Footprint Statistics
              </h3>

              {totalCRMLeads === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm font-medium">
                  No saved leads to display metrics.
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Website Present', count: hasWebsite },
                        { name: 'Missing Website', count: noWebsite },
                        { name: 'Contact Email', count: hasEmail },
                        { name: 'Phone Contact', count: hasPhone }
                      ]}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#6366f1" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 4. SEARCH HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm print:hidden">
          <h2 className="text-lg font-bold text-slate-950 mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Previous Queries History
          </h2>

          {searchHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium">
              You haven't performed any business searches yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Business Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Target Range</th>
                    <th className="py-3 px-4">Max Size</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                  {searchHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.city}, {item.state} ({item.country})
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{item.radius} miles</td>
                      <td className="py-3 px-4 font-mono text-xs">{item.maxResults} results</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => rerunSearch(item)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Rerun Query
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* MODAL: EXTREMELY HIGH-FIDELITY COMPREHENSIVE AUDIT VIEW & PRINT LAYOUT */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:shadow-none print:max-h-none print:overflow-visible">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors print:hidden"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Print Friendly Header */}
            <div className="flex justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Audit Agency Report</span>
                <h3 className="text-2xl font-extrabold text-slate-950">{selectedLead.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {selectedLead.address}, {selectedLead.city}, {selectedLead.state} {selectedLead.zip} | {selectedLead.phone}
                </p>
              </div>

              {/* Action buttons (hidden on print) */}
              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handlePrintAudit}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print / Download PDF
                </button>
              </div>
            </div>

            {/* If Not Audited Yet (Running spinner) */}
            {isAnalyzing && (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <h4 className="font-bold text-slate-950 text-base">Running Deep Crawler Audits...</h4>
                <p className="text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
                  Analyzing sitemaps, H1 headers, loading speed footprint, SSL status, and extracting social profiles using the Gemini core analyzer.
                </p>
              </div>
            )}

            {/* Full Audit Information Grid */}
            {!isAnalyzing && selectedLead.aiAudit && (
              <div className="space-y-8">
                
                {/* Score Summary Banner */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 items-center">
                  
                  {/* Score badge */}
                  <div className="md:col-span-4 text-center md:border-r border-slate-200 md:pr-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Overall Website Score</span>
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-[8px] border-blue-500 bg-white shadow-sm">
                      <span className="text-3xl font-extrabold text-slate-900">{selectedLead.aiAudit.websiteScore}%</span>
                    </div>
                  </div>

                  {/* Diagnositics and Lead Score badge */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                        selectedLead.aiAudit.leadScore.includes('Hot') ? 'bg-red-100 text-red-700' :
                        selectedLead.aiAudit.leadScore.includes('Warm') ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedLead.aiAudit.leadScore.includes('Hot') ? '🔥 Hot Lead Opportunity' : selectedLead.aiAudit.leadScore.includes('Warm') ? '🟠 Warm Deal Lead' : '🔵 Cold Prospect'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      "{selectedLead.aiAudit.explanation}"
                    </p>
                  </div>
                </div>

                {/* Performance scores grid */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">Diagnostics Scorecard</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <ScoreCard score={selectedLead.aiAudit.seoScore} label="SEO Rating" icon={<LineChart className="w-4 h-4 text-indigo-600" />} />
                    <ScoreCard score={selectedLead.aiAudit.performanceScore} label="Website Speed" icon={<Zap className="w-4 h-4 text-emerald-600" />} />
                    <ScoreCard score={selectedLead.aiAudit.designScore} label="Layout Design" icon={<Palette className="w-4 h-4 text-purple-600" />} />
                    <ScoreCard score={selectedLead.aiAudit.mobileScore} label="Mobile Ready" icon={<Smartphone className="w-4 h-4 text-pink-600" />} />
                    <ScoreCard score={selectedLead.aiAudit.securityScore} label="Security/SSL" icon={<ShieldCheck className="w-4 h-4 text-rose-600" />} />
                  </div>
                </div>

                {/* Sales Opportunities (Agency pitch guide) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Recommended Pitch Opportunities
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedLead.aiAudit.salesOpportunities.map((opp: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Public Contact details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-500" />
                      Discovered Contact Details
                    </h4>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Email Addresses</span>
                        <div className="space-y-1">
                          {selectedLead.contactExtraction?.emails?.length ? (
                            selectedLead.contactExtraction.emails.map((email: string, i: number) => (
                              <div key={i} className="font-mono text-blue-600 hover:underline">{email}</div>
                            ))
                          ) : (
                            <div className="text-slate-400 italic">No emails harvested automatically</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Discovered Social Handles</span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedLead.websiteAnalyzer?.socialLinks ? (
                            Object.entries(selectedLead.websiteAnalyzer.socialLinks).map(([key, val]) => {
                              if (!val) return null;
                              return (
                                <a key={key} href={val as string} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 px-2 py-1 rounded-md font-bold text-slate-700 hover:bg-slate-50 text-[10px] capitalize">
                                  {key}
                                </a>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">None identified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Crawler website analysis details */}
                {selectedLead.websiteAnalyzer && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-slate-500" />
                      Crawler Metadata Analysis
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs font-semibold">
                      <Checker label="HTTPS Enabled" checked={selectedLead.websiteAnalyzer.https} />
                      <Checker label="SSL Certificate" checked={selectedLead.websiteAnalyzer.ssl} />
                      <Checker label="Mobile Responsive" checked={selectedLead.websiteAnalyzer.responsive} />
                      <Checker label="Google Analytics" checked={selectedLead.websiteAnalyzer.googleAnalytics} />
                      <Checker label="Robots.txt" checked={selectedLead.websiteAnalyzer.robotsTxt} />
                      <Checker label="Sitemap.xml" checked={selectedLead.websiteAnalyzer.sitemap} />
                      <Checker label="Open Graph Metadata" checked={selectedLead.websiteAnalyzer.openGraph} />
                      <Checker label="Contact Form Found" checked={selectedLead.websiteAnalyzer.contactForm} />
                      <Checker label="Online Booking System" checked={selectedLead.websiteAnalyzer.onlineBooking} />
                      <Checker label="Live Chat Widget" checked={selectedLead.websiteAnalyzer.liveChat} />
                      <Checker label="Has Active Blog" checked={selectedLead.websiteAnalyzer.blog} />
                      <Checker label="Has Testimonials" checked={selectedLead.websiteAnalyzer.testimonials} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wide block mb-1">SEO Title Tag</span>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-slate-700 break-words leading-relaxed">
                          {selectedLead.websiteAnalyzer.seoTitle || 'None found'}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wide block mb-1">Meta Description</span>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-100 font-mono text-slate-700 break-words leading-relaxed">
                          {selectedLead.websiteAnalyzer.metaDescription || 'None found'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Stats Cards for Dashboard
function StatsCard({ title, value, subText, icon }: { title: string, value: number | string, subText: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">{icon}</div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-black text-slate-950 tracking-tight">{value}</h3>
        <p className="text-slate-400 text-xs mt-1 font-medium">{subText}</p>
      </div>
    </div>
  );
}

function StatsMiniCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-500">{title}</span>
      <span className={`text-base font-black ${color}`}>{value}</span>
    </div>
  );
}

// 6 Performance Gauge Indicators
function Gauge({ score, label, color }: { score: number, label: string, color: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="relative inline-flex items-center justify-center">
        <div className={`w-10 h-10 rounded-full border-4 border-slate-200 flex items-center justify-center`}>
          <span className="text-xs font-black text-slate-800">{score}%</span>
        </div>
        {/* Simple colored fill representation */}
        <div className={`absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent border-t-blue-500 pointer-events-none opacity-40`} />
      </div>
    </div>
  );
}

// ScoreCard item inside PDF modal
function ScoreCard({ score, label, icon }: { score: number, label: string, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center">
      <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs mb-2">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-black text-slate-950">{score}%</span>
    </div>
  );
}

// Metadata Checker Row
function Checker({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      ) : (
        <X className="w-4 h-4 text-rose-500 shrink-0" />
      )}
      <span className={checked ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}>{label}</span>
    </div>
  );
}
