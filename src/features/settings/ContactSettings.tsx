'use client';

import React, { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { api } from '../../utils/api';

export default function ContactSettings() {
  const { setTitle, showToast } = useUI();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    setTitle('Contact');
    
    // Add fontawesome if missing
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }

    const load = async () => {
      try {
        const res = await api.getContactInfo();
        if (res) setData(res);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const updateField = async (field: string, promptText: string) => {
    const newVal = prompt(promptText, data[field] || '');
    if (newVal !== null) {
      const newData = { ...data, [field]: newVal };
      setData(newData);
      try {
        await api.updateContactInfo(newData);
        showToast('Updated successfully', 'success');
      } catch (e) {
        showToast('Failed to update', 'error');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-fade-in">

      {/* Phone Numbers Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-phone-alt text-slate-500"></i> Phone Numbers
          </h3>
          <button className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{data.propertyPhone || '-'}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">[Primary]</span>
          </div>
          <button onClick={() => updateField('propertyPhone', 'Enter Phone Number')} className="text-amber-500 hover:text-amber-600 transition-colors">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
      </section>

      {/* WhatsApp Numbers Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="far fa-comment-dots text-slate-500"></i> WhatsApp Numbers
          </h3>
          <button className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{data.whatsapp || '-'}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">[Primary]</span>
          </div>
          <button onClick={() => updateField('whatsapp', 'Enter WhatsApp Number')} className="text-amber-500 hover:text-amber-600 transition-colors">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
      </section>

      {/* Email Addresses Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="far fa-envelope text-slate-500"></i> Email Addresses
          </h3>
          <button className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{data.propertyEmail || '-'}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">[Primary]</span>
          </div>
          <button onClick={() => updateField('propertyEmail', 'Enter Email Address')} className="text-amber-500 hover:text-amber-600 transition-colors">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-globe text-blue-500"></i> Social Media
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">Facebook</span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium text-slate-400">{data.facebook || '-'}</span>
              <button onClick={() => updateField('facebook', 'Enter Facebook handle/URL')} className="text-amber-500 hover:text-amber-600 transition-colors">
                <i className="fas fa-pencil-alt text-sm"></i>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">Instagram</span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium text-slate-400">{data.instagram || '-'}</span>
              <button onClick={() => updateField('instagram', 'Enter Instagram handle/URL')} className="text-amber-500 hover:text-amber-600 transition-colors">
                <i className="fas fa-pencil-alt text-sm"></i>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">Twitter/X</span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium text-slate-400">{data.twitter || '-'}</span>
              <button onClick={() => updateField('twitter', 'Enter Twitter handle/URL')} className="text-amber-500 hover:text-amber-600 transition-colors">
                <i className="fas fa-pencil-alt text-sm"></i>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mb-1 block">YouTube URL</span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-sm font-medium text-slate-400">{data.youtube || '-'}</span>
              <button onClick={() => updateField('youtube', 'Enter YouTube URL')} className="text-amber-500 hover:text-amber-600 transition-colors">
                <i className="fas fa-pencil-alt text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-map text-blue-400"></i> Google Map
          </h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium text-slate-400">{data.googleMapUrl || '-'}</span>
          <button onClick={() => updateField('googleMapUrl', 'Enter Google Map URL')} className="text-amber-500 hover:text-amber-600 transition-colors">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
      </section>

    </div>
  );
}
