'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Staff } from '../../types';
import { useUI } from '../../context/UIContext';
import { useRouter } from 'next/navigation';

const PRESET_USERS = [
  { name: "Rajesh Kumar", email: "rajesh@hotel.com", phone: "9876543210", address: "Delhi", idNumber: "123456789012" },
  { name: "Priya Sharma", email: "priya.sharma@hotel.com", phone: "8765432109", address: "Mumbai", idNumber: "ABCDE1234F" },
  { name: "Amit Verma", email: "amit.verma@gmail.com", phone: "7654321098", address: "Lucknow", idNumber: "DL2024123456" },
  { name: "Sneha Patel", email: "sneha.p@booking.com", phone: "6543210987", address: "Ahmedabad", idNumber: "567890123456" },
  { name: "Rahul Mehta", email: "rahul.m@hospitality.com", phone: "8899776655", address: "Gurgaon", idNumber: "987654321098" },
  { name: "Neha Gupta", email: "neha.gupta@gmail.com", phone: "9988776655", address: "Noida", idNumber: "PK7890LMN12" },
];

const ROLES = [
  'Front Desk Manager',
  'Booking Agent',
  'F&B Manager',
  'Housekeeping Supervisor',
  'Security Guard',
  'Event Coordinator',
  'Maintenance Staff',
  'Restaurant Manager',
  'Accountant',
  'HR Manager'
];

export default function AddStaffForm() {
  const { setTitle, showToast } = useUI();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // User preset search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPresets, setFilteredPresets] = useState(PRESET_USERS);

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('Booking Agent');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Night' | 'Flexible'>('Flexible');

  useEffect(() => {
    setTitle('Add Staff Member');
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPresets(PRESET_USERS);
    } else {
      setFilteredPresets(
        PRESET_USERS.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  }, [searchQuery]);

  const handleSelectPreset = (preset: typeof PRESET_USERS[0]) => {
    setName(preset.name);
    setEmail(preset.email);
    setPhone(preset.phone);
    setAddress(preset.address);
    setIdNumber(preset.idNumber);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !idNumber) {
      showToast('Name, Phone, and ID Number are required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<Staff> = {
        name,
        position,
        email: email || undefined,
        phone,
        address: address || undefined,
        idNumber,
        status: 'Active',
        shift,
        profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff&size=128`
      };

      await api.createStaff(payload);
      showToast(`Staff member ${name} assigned successfully!`, 'success');
      router.push('/staff');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign staff role', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl max-w-lg mx-auto animate-slide-up space-y-6">
      
      {/* Preset Search Section */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Search Pre-registered Users</h3>
        <input
          type="text"
          placeholder="Search by username, phone or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-amber-500"
        />

        {searchQuery && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-2 animate-fade-in max-h-48 overflow-y-auto">
            {filteredPresets.map(user => (
              <div
                key={user.name}
                onClick={() => handleSelectPreset(user)}
                className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100 hover:border-amber-400 cursor-pointer shadow-sm text-[11px]"
              >
                <div>
                  <span className="font-bold text-slate-800">{user.name}</span>
                  <p className="text-slate-400 text-[10px]">{user.email} | {user.phone}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Select</span>
              </div>
            ))}
            {filteredPresets.length === 0 && (
              <span className="text-[10px] text-slate-400 p-2">No template found. Enter details manually below.</span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Assign Position *</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Duty Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
            >
              <option value="Flexible">Flexible</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Govt ID Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 123456789012"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
          <input
            type="email"
            placeholder="e.g. name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Residential Address</label>
          <input
            type="text"
            placeholder="e.g. Flat 101, Vrindavan Heights"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/staff')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Role & Save'}
          </button>
        </div>

      </form>
    </div>
  );
}
