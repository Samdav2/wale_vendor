'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Room } from '../../types';
import { useUI } from '../../context/UIContext';
import Link from 'next/link';

const ALL_AMENITIES = ['Wi-Fi', 'AC', 'Breakfast', 'Parking', 'Pool', 'Gym', 'Spa', 'Sea View', 'Kitchen', 'Pet Friendly'];

export default function RoomList() {
  const { setTitle, showToast } = useUI();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formType, setFormType] = useState<'Single' | 'Double' | 'Suite' | 'Deluxe' | 'Standard' | 'Family'>('Standard');
  const [formPrice, setFormPrice] = useState(0);
  const [formStatus, setFormStatus] = useState<'Available' | 'Occupied' | 'Maintenance'>('Available');
  const [formDesc, setFormDesc] = useState('');
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    setTitle('Room Management');
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRooms();
      setRooms(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch rooms list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setFormType(room.type);
    setFormPrice(room.price);
    setFormStatus(room.status);
    setFormDesc(room.description || '');
    setFormAmenities(room.amenities || []);
    setFormImages(room.images || []);
  };

  const handleAmenityToggle = (amenity: string) => {
    if (formAmenities.includes(amenity)) {
      setFormAmenities(formAmenities.filter(a => a !== amenity));
    } else {
      setFormAmenities([...formAmenities, amenity]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImages([...formImages, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (idx: number) => {
    setFormImages(formImages.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    try {
      setLoading(true);
      const updated = await api.updateRoom(editingRoom._id!, {
        type: formType,
        price: formPrice,
        status: formStatus,
        description: formDesc,
        amenities: formAmenities,
        images: formImages
      });

      showToast(`Room ${editingRoom.roomNumber} updated successfully!`, 'success');
      setEditingRoom(null);
      loadRooms();
    } catch (err: any) {
      showToast(err.message || 'Failed to save room details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, roomNo: string) => {
    if (!confirm(`Are you sure you want to delete Room ${roomNo}?`)) return;

    try {
      setLoading(true);
      await api.deleteRoom(id);
      showToast(`Room ${roomNo} deleted successfully`, 'success');
      setEditingRoom(null);
      loadRooms();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete room', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading rooms list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider truncate">Property Inventory</h3>
          <p className="text-xs text-slate-500">Manage rooms, pricing tariffs, and occupancy rules</p>
        </div>
        <Link
          href="/rooms/new"
          className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-slate-800 transition-colors shadow-md shadow-slate-950/10 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
        >
          <span>+</span> Add Room
        </Link>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const isOccupied = room.status === 'Occupied';
          const isMaint = room.status === 'Maintenance';
          
          let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          if (isOccupied) statusColor = 'bg-red-100 text-red-800 border-red-200';
          if (isMaint) statusColor = 'bg-amber-100 text-amber-800 border-amber-200';

          return (
            <div
              key={room._id}
              onClick={() => handleEditClick(room)}
              className="glass-card rounded-3xl overflow-hidden cursor-pointer border border-slate-200 hover:-translate-y-1 hover:border-amber-400 transition-all duration-200"
            >
              <div className="h-44 relative bg-slate-100">
                <img
                  src={room.images[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop'}
                  alt={room.roomNumber}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2275%22%3E%3Crect width=%22100%22 height=%2275%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E';
                  }}
                />
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                  {room.status}
                </span>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-base font-extrabold text-slate-800">Room {room.roomNumber}</h4>
                  <span className="text-xs font-bold text-slate-400 uppercase">{room.type}</span>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-2">
                  {room.description || 'No description provided.'}
                </p>

                <div className="flex flex-wrap gap-1">
                  {(room.amenities || []).map(a => (
                    <span key={a} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Nightly tariff</span>
                  <span className="text-sm font-black text-emerald-600">₹{room.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {rooms.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm font-medium text-slate-400">
            No rooms registered. Click "+ Add Room" to create one.
          </div>
        )}
      </div>

      {/* Slide-out Edit Drawer */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">Edit Room {editingRoom.roomNumber}</h3>
                <span className="text-xs text-slate-400">Update status, pricing tariff, and info</span>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Room Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tariff Price (₹)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Amenities (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITIES.map(amenity => {
                    const isSelected = formAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-900 border-slate-950 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Images</label>
                <div className="flex flex-wrap gap-2">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl border relative overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 px-3 py-2 rounded-lg border border-slate-200 border-dashed text-xs text-center cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-500 font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-6 mt-auto">
                <button
                  type="button"
                  onClick={() => handleDelete(editingRoom._id!, editingRoom.roomNumber)}
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
