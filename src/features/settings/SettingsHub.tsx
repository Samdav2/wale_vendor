'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { ContactInfo, NearbyPlace, Policy } from '../../types';
import { useUI } from '../../context/UIContext';

const NEARBY_PRESETS = [
  "Keli Kunj",
  "Prem Mandir",
  "Banke Bihari Temple",
  "ISKCON Temple",
  "Dwarkadhish Temple",
  "Radha Raman Temple",
  "Nidhivan",
  "Yamuna Ghats",
  "Vrindavan Market"
];

export default function SettingsHub({ defaultTab = 'contact' }: { defaultTab?: 'contact' | 'places' | 'policies' }) {
  const { setTitle, showToast } = useUI();
  const [activeTab, setActiveTab] = useState<'contact' | 'places' | 'policies'>(defaultTab);
  const [loading, setLoading] = useState(false);

  // 1. Contact state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');

  // 2. Nearby places state
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [searchPreset, setSearchPreset] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [walkingMins, setWalkingMins] = useState<number | ''>('');

  // 3. Policies state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyType, setSelectedPolicyType] = useState<'hotel_rules' | 'privacy_policy' | 'cancellation_policy'>('hotel_rules');
  const [policyContent, setPolicyContent] = useState('');

  useEffect(() => {
    setTitle('Settings Hub');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [contactData, placesData, policiesData] = await Promise.all([
        api.getContactInfo(),
        api.getNearbyPlaces(),
        api.getPolicies(),
      ]);

      if (contactData) {
        setPhone(contactData.propertyPhone || '');
        setEmail(contactData.propertyEmail || '');
        setAddress(contactData.propertyAddress || '');
        setFacebook(contactData.facebook || '');
        setInstagram(contactData.instagram || '');
        setTwitter(contactData.twitter || '');
      }

      setPlaces(placesData || []);
      setPolicies(policiesData || []);
      
      const activePolicy = policiesData?.find(p => p.type === selectedPolicyType);
      setPolicyContent(activePolicy ? activePolicy.content : '');

    } catch (err: any) {
      showToast(err.message || 'Failed to load settings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Contact Info
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateContactInfo({
        propertyPhone: phone,
        propertyEmail: email,
        propertyAddress: address,
        facebook,
        instagram,
        twitter,
      });
      showToast('Contact details saved successfully!', 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to save contact info', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Nearby Place
  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName) {
      showToast('Please select or type a place name', 'error');
      return;
    }
    if (distanceKm === '' || walkingMins === '') {
      showToast('Please specify distance and walking duration', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.createNearbyPlace({
        name: placeName,
        distanceKm: Number(distanceKm),
        walkingMins: Number(walkingMins),
      });

      showToast(`${placeName} added successfully!`, 'success');
      setPlaceName('');
      setDistanceKm('');
      setWalkingMins('');
      setSearchPreset('');
      loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to create nearby place', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Place
  const handleDeletePlace = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from nearby listings?`)) return;
    try {
      setLoading(true);
      await api.deleteNearbyPlace(id);
      showToast(`${name} removed`, 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete place', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle policy selector change
  const handlePolicyChange = (type: 'hotel_rules' | 'privacy_policy' | 'cancellation_policy') => {
    setSelectedPolicyType(type);
    const activePolicy = policies.find(p => p.type === type);
    setPolicyContent(activePolicy ? activePolicy.content : '');
  };

  // Save active policy content
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updatePolicy(selectedPolicyType, policyContent);
      showToast('Policy details updated!', 'success');
      loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update policy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPresets = NEARBY_PRESETS.filter(p =>
    p.toLowerCase().includes(searchPreset.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('contact')}
          className={`pb-3 text-sm font-extrabold cursor-pointer border-b-2 transition-all ${
            activeTab === 'contact' ? 'border-b-amber-500 text-slate-800' : 'border-b-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📞 Contact Options
        </button>
        <button
          onClick={() => setActiveTab('places')}
          className={`pb-3 text-sm font-extrabold cursor-pointer border-b-2 transition-all ${
            activeTab === 'places' ? 'border-b-amber-500 text-slate-800' : 'border-b-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🗺️ Nearby Attractions
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 text-sm font-extrabold cursor-pointer border-b-2 transition-all ${
            activeTab === 'policies' ? 'border-b-amber-500 text-slate-800' : 'border-b-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📜 Hotel Policies
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="text-center text-xs font-bold text-slate-400 animate-pulse">
          Synchronizing configuration files...
        </div>
      )}

      {/* Tab: Contact Details */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveContact} className="glass-card p-6 rounded-3xl max-w-xl space-y-4 bg-white border animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800">Property Contact Details</h3>
            <p className="text-[10px] text-slate-400">Configure phone, emails, and address to display on front desk invoices</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Property Hotline *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Support Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">Social Channels</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Facebook</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border text-xs focus:outline-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Instagram</label>
                <input
                  type="text"
                  placeholder="@wale_hotel"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border text-xs focus:outline-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Twitter</label>
                <input
                  type="text"
                  placeholder="https://twitter.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border text-xs focus:outline-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow"
          >
            Save Contact Configuration
          </button>
        </form>
      )}

      {/* Tab: Nearby Attractions */}
      {activeTab === 'places' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Add form */}
          <form onSubmit={handleAddPlace} className="glass-card p-6 bg-white border rounded-3xl space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-800">Add Nearby Attraction</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Template Search</label>
              <input
                type="text"
                placeholder="Search templates (e.g. Prem Mandir)..."
                value={searchPreset}
                onChange={(e) => { setSearchPreset(e.target.value); setPlaceName(e.target.value); }}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-amber-500"
              />
              {searchPreset && filteredPresets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border rounded-lg max-h-24 overflow-y-auto">
                  {filteredPresets.map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => { setPlaceName(p); setSearchPreset(''); }}
                      className="px-2 py-1 bg-white border text-[9px] font-bold rounded hover:border-amber-400 cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Name *</label>
              <input
                type="text"
                required
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Distance (KM) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Walking Time (Mins) *</label>
                <input
                  type="number"
                  required
                  value={walkingMins}
                  onChange={(e) => setWalkingMins(parseInt(e.target.value) || '')}
                  className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow"
            >
              + Register Attraction
            </button>
          </form>

          {/* Places List */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800">Listed Attractions</h3>
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {places.map(p => (
                <div key={p._id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-800">{p.name}</h4>
                    <p className="text-slate-400 text-[10px]">{p.distanceKm} km away • 🚶 {p.walkingMins} mins walk</p>
                  </div>
                  <button
                    onClick={() => handleDeletePlace(p._id!, p.name)}
                    className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded flex items-center justify-center font-bold cursor-pointer transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {places.length === 0 && (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">
                  No attractions added yet.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab: Hotel Policies */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicy} className="glass-card p-6 bg-white border rounded-3xl max-w-xl space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800">Establishment Policies</h3>
            <p className="text-[10px] text-slate-400">Manage fine print printed on guest receipts and confirmation emails</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Policy Type</label>
            <select
              value={selectedPolicyType}
              onChange={(e) => handlePolicyChange(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500 font-extrabold"
            >
              <option value="hotel_rules">🏠 Hotel & Room Rules</option>
              <option value="privacy_policy">🔒 Privacy Policy</option>
              <option value="cancellation_policy">🚫 Cancellation & Booking Rules</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Terms Details *</label>
            <textarea
              required
              rows={8}
              value={policyContent}
              onChange={(e) => setPolicyContent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs focus:outline-amber-500 leading-relaxed"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow"
          >
            Save Policy Terms
          </button>
        </form>
      )}

    </div>
  );
}
