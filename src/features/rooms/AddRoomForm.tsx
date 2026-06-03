'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Room } from '../../types';
import { useUI } from '../../context/UIContext';
import { useRouter } from 'next/navigation';

const ALL_AMENITIES = ['Wi-Fi', 'AC', 'Breakfast', 'Parking', 'Pool', 'Gym', 'Spa', 'Sea View', 'Kitchen', 'Pet Friendly'];

export default function AddRoomForm() {
  const { setTitle, showToast } = useUI();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingRooms, setExistingRooms] = useState<Room[]>([]);

  // Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<'Single' | 'Double' | 'Suite' | 'Deluxe' | 'Standard' | 'Family'>('Standard');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    setTitle('Add New Room');
    const fetchRooms = async () => {
      try {
        const data = await api.getRooms();
        setExistingRooms(data);
      } catch (err) {}
    };
    fetchRooms();
  }, []);

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl) return;
    setImages([...images, newImageUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomNumber) {
      showToast('Room number is required', 'error');
      return;
    }
    
    // Check duplication
    const duplicate = existingRooms.some(r => r.roomNumber === roomNumber);
    if (duplicate) {
      showToast(`Room number ${roomNumber} already exists!`, 'error');
      return;
    }

    if (!price || price <= 0) {
      showToast('Please enter a valid nightly price tariff', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const payload: Partial<Room> = {
        roomNumber,
        type: roomType,
        price: Number(price),
        status: 'Available',
        amenities: selectedAmenities,
        description,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop']
      };

      await api.createRoom(payload);
      showToast(`Room ${roomNumber} created successfully!`, 'success');
      router.push('/rooms');
    } catch (err: any) {
      showToast(err.message || 'Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl max-w-lg mx-auto animate-slide-up">
      <div className="pb-4 border-b border-slate-100 mb-6">
        <h3 className="text-lg font-black text-slate-800">Register New Inventory Room</h3>
        <p className="text-xs text-slate-400">Configure layout features, tags, and pricing rates</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Room Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value.trim())}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Room Type</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
            >
              <option value="Standard">Standard</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Family">Family</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Tariff Rate Per Night (₹) *</label>
          <input
            type="number"
            required
            placeholder="e.g. 2499"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || '')}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Amenities (Select all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {ALL_AMENITIES.map(amenity => {
              const isSelected = selectedAmenities.includes(amenity);
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
          <label className="text-[10px] font-bold text-slate-500 uppercase">Room Images</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
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
            <input
              type="text"
              placeholder="Paste image URL (or leave blank to use default)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-amber-500"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-3 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Room Highlights Description</label>
          <textarea
            rows={3}
            placeholder="Write a brief overview of the room comforts..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          ></textarea>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/rooms')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Room'}
          </button>
        </div>
      </form>
    </div>
  );
}
