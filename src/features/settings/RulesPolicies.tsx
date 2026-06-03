'use client';

import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { api } from '../../utils/api';

export default function RulesPolicies() {
  const { setTitle, showToast } = useUI();
  const [activeTab, setActiveTab] = useState<'hotel_rules' | 'privacy_policy' | 'cancellation_policy'>('hotel_rules');
  
  const [policies, setPolicies] = useState({
    hotel_rules: '',
    privacy_policy: '',
    cancellation_policy: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setTitle('Rules & Policies');
    
    // Add fontawesome if missing
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }

    const checkAdmin = async () => {
      try {
        const res = await api.getMe();
        if (res?.data?.role === 'admin' || res?.data?.role === 'superadmin') {
          setIsAdmin(true);
        }
      } catch (err) {
        // Handle error implicitly
      }
    };
    checkAdmin();

    const loadPolicies = async () => {
      try {
        const res = await api.getPolicies();
        if (Array.isArray(res)) {
          const newPol = { ...policies };
          res.forEach(p => {
            if (p.type && (newPol as any)[p.type] !== undefined) {
              (newPol as any)[p.type] = p.content;
            }
          });
          setPolicies(newPol);
        }
      } catch (err) {
        console.error("Failed to load policies", err);
      }
    };
    loadPolicies();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updatePolicy(activeTab, policies[activeTab]);
      showToast('Policy updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update policy', 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-fade-in">

      {/* Tabs Header */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('hotel_rules')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'hotel_rules' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Hotel Rules
        </button>
        <button 
          onClick={() => setActiveTab('privacy_policy')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'privacy_policy' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Privacy Policy
        </button>
        <button 
          onClick={() => setActiveTab('cancellation_policy')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'cancellation_policy' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Cancellation Policy
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[60vh] relative">
        
        {/* Header Actions */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
           {isAdmin && (
             <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-full bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
               {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
               Save Changes
             </button>
           )}
        </div>

        <div className="space-y-6 animate-fade-in pr-20 pt-16">
          <textarea
            className={`w-full h-[500px] p-4 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${!isAdmin ? 'bg-slate-100 cursor-not-allowed opacity-80' : 'bg-slate-50'}`}
            value={policies[activeTab]}
            onChange={(e) => setPolicies(prev => ({ ...prev, [activeTab]: e.target.value }))}
            placeholder={`Enter ${activeTab.replace('_', ' ')}...`}
            readOnly={!isAdmin}
          />
        </div>

      </div>

    </div>
  );
}
