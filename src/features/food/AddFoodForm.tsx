'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Food } from '../../types';
import { useUI } from '../../context/UIContext';
import { useRouter } from 'next/navigation';

const PRESET_VEG_ITEMS = [
  { name: "Margherita Pizza", category: "Appetizer" as const, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
  { name: "Veg Burger", category: "Breakfast" as const, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400" },
  { name: "Caesar Salad", category: "Appetizer" as const, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400" },
  { name: "Paneer Butter Masala", category: "Main Course" as const, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400" },
  { name: "Veg Biryani", category: "Main Course" as const, image: "https://images.unsplash.com/photo-1563379091339-03b21dd4a9f8?w=400" },
  { name: "Gulab Jamun", category: "Dessert" as const, image: "https://images.unsplash.com/photo-1602526432608-b8f8b6c3a382?w=400" },
  { name: "Masala Chai", category: "Beverage" as const, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
];

export default function AddFoodForm() {
  const { setTitle, showToast } = useUI();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Auto-complete presets search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPresets, setFilteredPresets] = useState(PRESET_VEG_ITEMS);

  // Form states
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<'Appetizer' | 'Main Course' | 'Dessert' | 'Beverage' | 'Breakfast'>('Main Course');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    setTitle('Add Food Item');
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPresets(PRESET_VEG_ITEMS);
    } else {
      setFilteredPresets(
        PRESET_VEG_ITEMS.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  }, [searchQuery]);

  const handleSelectPreset = (preset: typeof PRESET_VEG_ITEMS[0]) => {
    setItemName(preset.name);
    setCategory(preset.category);
    setImage(preset.image);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName) {
      showToast('Item Name is required', 'error');
      return;
    }

    if (!price || price <= 0) {
      showToast('Please enter a valid menu price', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const payload: Partial<Food> = {
        itemName,
        category,
        price: Number(price),
        availability: true,
        description,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&fit=crop'
      };

      await api.createFood(payload);
      showToast(`${itemName} added to menu!`, 'success');
      router.push('/food');
    } catch (err: any) {
      showToast(err.message || 'Failed to create food item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl max-w-lg mx-auto animate-slide-up space-y-6">
      
      {/* Preset Search Section */}
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Search Pre-set Veg Items</h3>
        <input
          type="text"
          placeholder="Type to search presets (e.g. Pizza, Burger, Chai...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-amber-500"
        />

        {searchQuery && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap gap-2 animate-fade-in max-h-36 overflow-y-auto">
            {filteredPresets.map(preset => (
              <button
                type="button"
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 bg-white border rounded-lg text-[10px] font-bold text-slate-700 hover:border-amber-400 cursor-pointer shadow-sm"
              >
                {preset.name}
              </button>
            ))}
            {filteredPresets.length === 0 && (
              <span className="text-[10px] text-slate-400 p-2">No template found. Enter details manually below.</span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Item Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Paneer Tikka Salad"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
            >
              <option value="Appetizer">Appetizer</option>
              <option value="Main Course">Main Course</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Breakfast">Breakfast</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Menu Price (₹) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 199"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || '')}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Image URL</label>
          <input
            type="text"
            placeholder="Paste dish image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
          <textarea
            rows={3}
            placeholder="Short details about ingredients or size..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
          ></textarea>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/food')}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Food Item'}
          </button>
        </div>

      </form>
    </div>
  );
}
