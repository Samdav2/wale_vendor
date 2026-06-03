'use client';

import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { api } from '../../utils/api';

// Icons based on FontAwesome classes
const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram text-pink-600' },
  { id: 'twitter', name: 'Twitter', icon: 'fab fa-twitter text-blue-400' },
  { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube text-red-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin text-blue-700' },
  { id: 'tiktok', name: 'TikTok', icon: 'fab fa-tiktok text-black' },
  { id: 'snapchat', name: 'Snapchat', icon: 'fab fa-snapchat text-yellow-400' },
  { id: 'pinterest', name: 'Pinterest', icon: 'fab fa-pinterest text-red-500' },
  { id: 'github', name: 'GitHub', icon: 'fab fa-github text-slate-800' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp text-green-500' },
  { id: 'telegram', name: 'Telegram', icon: 'fab fa-telegram text-blue-500' },
  { id: 'discord', name: 'Discord', icon: 'fab fa-discord text-indigo-500' },
  { id: 'reddit', name: 'Reddit', icon: 'fab fa-reddit text-orange-500' },
  { id: 'website', name: 'Website', icon: 'fas fa-globe text-slate-600' }
];

export default function Profile() {
  const { setTitle, showToast } = useUI();
  
  const [adminName, setAdminName] = useState('Admin Name');
  const [bio, setBio] = useState('✨ Write your beautiful bio ✨');
  const [socials, setSocials] = useState<{ id: string, handle: string }[]>([]);
  const [avatar, setAvatar] = useState('https://ghungroowale.com/logo.png');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=1200&h=400&fit=crop');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [socialInput, setSocialInput] = useState('');

  useEffect(() => {
    setTitle('Edit Profile');
    
    // Add fontawesome if missing
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }

    const fetchProfile = async () => {
      try {
        const res = await api.getMe();
        if (res) {
          setAdminName(res.name || 'Admin Name');
          setBio(res.bio || '✨ Write your beautiful bio ✨');
          setSocials(res.socials || []);
          if (res.avatar) setAvatar(res.avatar);
          if (res.banner) setBanner(res.banner);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const openSocialModal = () => {
    setSelectedPlatform(null);
    setSocialInput('');
    setIsModalOpen(true);
  };

  const closeSocialModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform || !socialInput.trim()) return;

    const platformDef = SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform);
    
    let updatedSocials = [...socials];
    const filtered = updatedSocials.filter(s => s.id !== selectedPlatform);
    updatedSocials = [...filtered, { id: selectedPlatform, handle: socialInput.trim() }];
    
    setSocials(updatedSocials);
    
    try {
      await api.updateProfile({ bio, banner, avatar, socials: updatedSocials });
      showToast(`${platformDef?.name} added!`, 'success');
    } catch (err) {
      showToast('Failed to save social', 'error');
    }
    closeSocialModal();
  };

  const removeSocial = async (idToRemove: string) => {
    const updatedSocials = socials.filter(s => s.id !== idToRemove);
    setSocials(updatedSocials);
    try {
      await api.updateProfile({ bio, banner, avatar, socials: updatedSocials });
    } catch (err) {
      showToast('Failed to remove social', 'error');
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-5xl mx-auto space-y-8 pb-10">
      
      {/* Banner & Avatar Section */}
      <div className="relative w-full rounded-2xl bg-white shadow-sm border border-slate-200">
        
        {/* Banner */}
        <div className="w-full h-48 md:h-64 relative rounded-t-2xl bg-slate-200">
          <img 
            src={banner} 
            alt="Cover Banner" 
            className="w-full h-full object-cover rounded-t-2xl"
          />
          {/* Edit Banner Button */}
          <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-slate-900/80 transition-colors cursor-pointer z-10">
            <i className="fas fa-pencil-alt text-xs"></i>
          </button>
          {/* Recommended Resolution Text */}
          <div className="absolute bottom-3 right-4 px-2 py-1 rounded bg-slate-900/50 backdrop-blur-sm text-white text-[9px] font-medium opacity-80 z-10">
            Recommended: 900x300 (3:1)
          </div>

          {/* Avatar Profile Picture */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 z-20">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-200 to-amber-500 p-1 shadow-lg border-2 border-white">
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full rounded-xl object-cover bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e2a3a/ffffff?text=A'
                  }}
                />
              </div>
              {/* Warning / Error badge on Avatar */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for avatar overlap */}
        <div className="h-16"></div>

        {/* User Info */}
        <div className="text-center pb-8 px-4">
          <h2 className="text-lg font-bold text-slate-800">{adminName}</h2>
          <div className="mt-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={async () => {
            const newBio = prompt('Enter your new bio:', bio);
            if (newBio !== null) {
              setBio(newBio);
              try {
                await api.updateProfile({ bio: newBio, banner, avatar, socials });
                showToast('Bio updated!', 'success');
              } catch (err) {
                showToast('Failed to update bio', 'error');
              }
            }
          }}>
            <p className="text-xs font-medium text-slate-500 italic group-hover:text-amber-600 transition-colors">{bio}</p>
            <i className="fas fa-pencil-alt text-[10px] text-slate-400 group-hover:text-amber-600 transition-colors"></i>
          </div>
        </div>
      </div>

      {/* Social Links Row */}
      <div className="px-4 md:px-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Add Button */}
          <button 
            onClick={openSocialModal}
            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center shadow-sm border border-blue-100 transition-colors cursor-pointer"
          >
            <i className="fas fa-plus"></i>
          </button>

          {/* Render Added Socials */}
          {socials.map(social => {
            const platform = SOCIAL_PLATFORMS.find(p => p.id === social.id);
            if (!platform) return null;
            return (
              <div key={social.id} className="relative group">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm text-lg">
                  <i className={platform.icon}></i>
                </div>
                <button 
                  onClick={() => removeSocial(social.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Media Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] animate-fade-in" onClick={closeSocialModal}>
          <div 
            className="w-[90%] max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 flex-1 text-center pl-4">Add Social</h3>
              <button onClick={closeSocialModal} className="text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center">
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Modal Content */}
            {!selectedPlatform ? (
              /* View 1: Grid of Platforms */
              <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                {SOCIAL_PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => handleSelectPlatform(platform.id)}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <i className={`${platform.icon} text-2xl group-hover:scale-110 transition-transform`}></i>
                    <span className="text-[9px] font-semibold text-slate-600">{platform.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* View 2: Input Form */
              <form onSubmit={handleSaveSocial} className="space-y-4 animate-fade-in">
                {(() => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform);
                  return (
                    <button 
                      type="button" 
                      onClick={() => setSelectedPlatform(null)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <i className={platform?.icon}></i>
                      {platform?.name}
                    </button>
                  );
                })()}
                
                <div>
                  <input 
                    type="text" 
                    placeholder="Enter your username or ID" 
                    required
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-800 text-sm focus:outline-none focus:border-amber-500 transition-colors text-center font-medium"
                    autoFocus
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#1e465e] hover:bg-[#153448] text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-[#1e465e]/20 cursor-pointer"
                >
                  Save
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
