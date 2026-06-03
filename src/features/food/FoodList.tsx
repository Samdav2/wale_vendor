'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Food } from '../../types';
import { useUI } from '../../context/UIContext';
import Link from 'next/link';

const CATEGORIES: ('Appetizer' | 'Main Course' | 'Dessert' | 'Beverage' | 'Breakfast')[] = [
  'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Breakfast'
];

export default function FoodList() {
  const { setTitle, showToast } = useUI();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer Edit state
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Appetizer' | 'Main Course' | 'Dessert' | 'Beverage' | 'Breakfast'>('Main Course');
  const [formPrice, setFormPrice] = useState(0);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');

  useEffect(() => {
    setTitle('Food Menu');
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      setLoading(true);
      const data = await api.getFoods();
      setFoods(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch food menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (food: Food) => {
    setEditingFood(food);
    setFormName(food.itemName);
    setFormCategory(food.category);
    setFormPrice(food.price);
    setFormAvailable(food.availability);
    setFormDesc(food.description || '');
    setFormImage(food.image || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;

    try {
      setLoading(true);
      await api.updateFood(editingFood._id!, {
        itemName: formName,
        category: formCategory,
        price: formPrice,
        availability: formAvailable,
        description: formDesc,
        image: formImage
      });

      showToast(`${formName} updated successfully!`, 'success');
      setEditingFood(null);
      loadFoods();
    } catch (err: any) {
      showToast(err.message || 'Failed to update food item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      setLoading(true);
      await api.deleteFood(id);
      showToast(`${name} deleted from menu`, 'success');
      setEditingFood(null);
      loadFoods();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete food item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filters
  const filteredFoods = foods.filter(f => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch = f.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading && foods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading food menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Controls & Nav */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                selectedCategory === cat
                  ? 'bg-slate-900 border-slate-950 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search dish name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-amber-500 md:w-48"
          />
          <Link
            href="/food/new"
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-800 transition-colors shadow flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0"
          >
            <span>+</span> Add Item
          </Link>
        </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredFoods.map(food => (
          <div
            key={food._id}
            onClick={() => handleEditClick(food)}
            className={`glass-card rounded-2xl overflow-hidden cursor-pointer border hover:-translate-y-1 hover:border-amber-400 transition-all duration-200 ${
              !food.availability ? 'opacity-50' : ''
            }`}
          >
            <div className="h-32 relative bg-slate-100">
              <img
                src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'}
                alt={food.itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2275%22%3E%3Crect width=%22100%22 height=%2275%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E';
                }}
              />
              {!food.availability && (
                <span className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center text-white font-extrabold text-xs uppercase tracking-wider">
                  Sold Out
                </span>
              )}
            </div>
            
            <div className="p-3.5 space-y-2">
              <div className="flex justify-between items-start gap-1">
                <h4 className="text-xs font-black text-slate-800 line-clamp-1">{food.itemName}</h4>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{food.category}</span>
                <span className="text-xs font-black text-emerald-600">₹{food.price}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredFoods.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm font-medium text-slate-400">
            No dishes listed in this category.
          </div>
        )}
      </div>

      {/* Edit Drawer Overlay */}
      {editingFood && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">Edit {editingFood.itemName}</h3>
                <span className="text-xs text-slate-400">Manage categories, prices, and kitchen rules</span>
              </div>
              <button
                onClick={() => setEditingFood(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Menu Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border">
                <div>
                  <span className="text-xs font-bold text-slate-800">Available for Order</span>
                  <p className="text-[10px] text-slate-400">Items marked off will show as sold out</p>
                </div>
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Image URL</label>
                <input
                  type="text"
                  placeholder="Paste dish image URL"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Short Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="E.g. Traditional recipe, spicy level, garnishing notes..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-6 mt-auto">
                <button
                  type="button"
                  onClick={() => handleDelete(editingFood._id!, editingFood.itemName)}
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
