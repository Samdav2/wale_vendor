'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Staff } from '../../types';
import { useUI } from '../../context/UIContext';
import Link from 'next/link';

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

const SHIFTS: ('Morning' | 'Evening' | 'Night' | 'Flexible')[] = ['Morning', 'Evening', 'Night', 'Flexible'];

export default function StaffList() {
  const { setTitle, showToast } = useUI();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer edit states
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formRole, setFormRole] = useState('Booking Agent');
  const [formShift, setFormShift] = useState<'Morning' | 'Evening' | 'Night' | 'Flexible'>('Flexible');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Inactive'>('Active');

  useEffect(() => {
    setTitle('Staff Directory');
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getStaff();
      setStaffList(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch staff directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (staff: Staff) => {
    setEditingStaff(staff);
    setFormRole(staff.position);
    setFormShift(staff.shift || 'Flexible');
    // Map backend status to select menu
    setFormStatus(staff.status === 'suspended' ? 'Inactive' : staff.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      setLoading(true);
      await api.updateStaff(editingStaff._id!, {
        position: formRole,
        shift: formShift,
        status: formStatus
      });

      showToast(`Profile of ${editingStaff.name} updated!`, 'success');
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to update staff record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete staff member ${name}?`)) return;

    try {
      setLoading(true);
      await api.deleteStaff(id);
      showToast(`${name} removed from roster`, 'success');
      setEditingStaff(null);
      loadStaff();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const rawDigits = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${rawDigits.startsWith('91') ? rawDigits : '91' + rawDigits}`, '_blank');
  };

  // Search filter
  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.position.toLowerCase().includes(q) ||
      s.idNumber.toLowerCase().includes(q)
    );
  });

  const maskIdNumber = (id: string) => {
    if (!id) return '';
    return `ID: ****${id.slice(-4)}`;
  };

  if (loading && staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading staff files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header filter controls */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4">
        <input
          type="text"
          placeholder="Search by name, phone, position or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-amber-500 bg-white"
        />
        <Link
          href="/staff/new"
          className="px-5 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-slate-800 transition-colors shadow-md shadow-slate-950/10 whitespace-nowrap"
        >
          + Add Staff
        </Link>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStaff.map((staff) => {
          const isSuspended = staff.status === 'Inactive' || staff.status === 'suspended';
          const isLeave = staff.status === 'On Leave';

          return (
            <div
              key={staff._id}
              className={`glass-card rounded-2xl overflow-hidden border p-4 flex gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 ${
                isSuspended ? 'border-l-4 border-l-red-500 border-red-100 bg-red-50/5 opacity-70' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Photo */}
              <div
                onClick={() => handleEditClick(staff)}
                className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center font-black text-slate-400 text-2xl uppercase border border-slate-200 shadow-inner cursor-pointer"
              >
                {staff.name.substring(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1 cursor-pointer" onClick={() => handleEditClick(staff)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 truncate">{staff.name}</h4>
                    <span className="text-[10px] text-emerald-700 font-bold block">{staff.position}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isSuspended ? 'bg-red-500 text-white' : isLeave ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-white'
                  }`}>
                    {staff.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>📍 {staff.address || 'Address not listed'}</p>
                  <p>📞 {staff.phone}</p>
                  <p className="text-[9px] text-slate-400">{maskIdNumber(staff.idNumber)}</p>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="flex flex-col gap-2 justify-center">
                <a
                  href={`tel:${staff.phone}`}
                  className="w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-transform active:scale-95"
                >
                  📞
                </a>
                <button
                  onClick={() => handleWhatsApp(staff.phone)}
                  className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  💬
                </button>
              </div>

            </div>
          );
        })}

        {filteredStaff.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm font-medium text-slate-400">
            No staff records found.
          </div>
        )}
      </div>

      {/* Edit Drawer Overlay */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">Edit {editingStaff.name}</h3>
                <span className="text-xs text-slate-400">Update workspace permissions and roster schedule</span>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Position *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duty Shift</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                  >
                    {SHIFTS.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Roster Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Suspended / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-auto">
                <button
                  type="button"
                  onClick={() => handleDelete(editingStaff._id!, editingStaff.name)}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
