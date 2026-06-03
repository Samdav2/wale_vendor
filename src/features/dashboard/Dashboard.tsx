'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Room, Guest, Booking } from '../../types';
import { useUI } from '../../context/UIContext';
import Link from 'next/link';

export default function Dashboard() {
  const { setTitle, showToast } = useUI();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle('Dashboard');
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [roomsData, guestsData, bookingsData] = await Promise.all([
          api.getRooms(),
          api.getGuests(),
          api.getBookings()
        ]);
        setRooms(roomsData);
        setGuests(guestsData);
        setBookings(bookingsData);
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading your property metrics...</p>
      </div>
    );
  }

  // Derived metrics
  const totalRooms = rooms.length || 0;
  const availableRooms = rooms.filter(r => r.status === 'Available').length || 0;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length || 0;
  const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length || 0;
  const checkedInGuests = guests.filter(g => g.status === 'Checked-In').length || 0;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Filter checkins (today)
  const todayStr = new Date().toDateString();
  const todaysCheckins = guests.filter(g => {
    if (g.status !== 'Checked-In') return false;
    return new Date(g.checkInDate).toDateString() === todayStr;
  });

  // Filter checkouts (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();
  const tomorrowsCheckouts = guests.filter(g => {
    if (!g.checkOutDate) return false;
    return new Date(g.checkOutDate).toDateString() === tomorrowStr;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* 1. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rooms</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalRooms}</span>
            <span className="text-lg">🛏️</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booked Rooms</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{occupiedRooms}</span>
            <span className="text-lg">🔒</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Rooms</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{availableRooms}</span>
            <span className="text-lg">🔑</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checked-In Guests</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{checkedInGuests}</span>
            <span className="text-lg">👤</span>
          </div>
        </div>
      </div>

      {/* 2. Room Grid Status */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>🛏️</span> Room Status Map
        </h3>
        <div className="flex flex-wrap gap-3">
          {rooms.map((room) => {
            const isOccupied = room.status === 'Occupied';
            const isMaint = room.status === 'Maintenance';
            
            let bg = 'bg-emerald-50 border-emerald-200 text-emerald-700';
            if (isOccupied) bg = 'bg-red-50 border-red-200 text-red-700';
            if (isMaint) bg = 'bg-amber-50 border-amber-200 text-amber-700';

            return (
              <div
                key={room.roomNumber}
                className={`p-3 rounded-2xl text-center border font-semibold flex flex-col gap-1 transition-transform hover:scale-105 select-none flex-1 sm:flex-none min-w-[80px] whitespace-nowrap ${bg}`}
              >
                <span className="text-sm">{room.roomNumber}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">{room.type}</span>
              </div>
            );
          })}
          {rooms.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-slate-400">
              No rooms registered. <Link href="/rooms/new" className="text-amber-500 hover:underline">Add one now</Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Mid Section (Today's Checkins & Tomorrow's Checkouts) */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Today's Checkins */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📋</span> Today's Check-ins
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">{todaysCheckins.length} Guests</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {todaysCheckins.map((guest) => (
              <div key={guest._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center font-bold text-amber-800">
                  {guest.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{guest.name}</p>
                  <p className="text-[11px] text-slate-500">Phone: {guest.phone}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>
            ))}

            {todaysCheckins.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">
                No active check-ins today.
              </div>
            )}
          </div>
        </div>

        {/* Tomorrow's Checkouts */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>🚪</span> Tomorrow's Check-outs
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">{tomorrowsCheckouts.length} Guests</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {tomorrowsCheckouts.map((guest) => (
              <div key={guest._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {guest.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{guest.name}</p>
                  <p className="text-[11px] text-slate-500">Total bill: ₹{guest.billTotal}</p>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-[10px] font-bold">
                  Checkout
                </span>
              </div>
            ))}

            {tomorrowsCheckouts.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">
                No check-outs scheduled for tomorrow.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Sales & Food Orders */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🍽️ Food Orders</span>
          <span className="text-xl font-black text-slate-800 block mt-1">18</span>
          <span className="text-[9px] text-slate-500">12 pending • 6 ready</span>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">💰 Today's Sales</span>
          <span className="text-xl font-black text-slate-800 block mt-1">₹32,499</span>
          <span className="text-[9px] text-emerald-600 font-semibold">+12% vs last week</span>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📅 Month Target</span>
          <span className="text-xl font-black text-slate-800 block mt-1">₹4.28L</span>
          <span className="text-[9px] text-slate-500">Target: ₹5.5L</span>
        </div>
      </div>

      {/* 5. Occupancy & Booking Stats */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
            <span className="text-2xl font-black text-slate-800">{occupancyRate}%</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Direct Bookings</span>
            <span className="text-sm font-bold text-slate-700">{bookings.length} reservations</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${occupancyRate}%` }}
          ></div>
        </div>
      </div>

      {/* 6. Guest Reviews */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>⭐</span> Recent Guest Reviews
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">Meera Dasgupta</div>
              <span className="text-amber-500">★★★★★</span>
            </div>
            <p className="text-slate-600 italic">"Amazing stay! Staff was very helpful, room was super clean. Will definitely come back."</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">Rakesh Tiwari</div>
              <span className="text-amber-500">★★★★☆</span>
            </div>
            <p className="text-slate-600 italic">"Good location, nice food. Room service was quick. Slight delay at check-in but overall good."</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">Komal Jain</div>
              <span className="text-amber-500">★★★★★</span>
            </div>
            <p className="text-slate-600 italic">"Beautiful property, peaceful environment. The staff went above and beyond. Highly recommend!"</p>
          </div>
        </div>
      </div>

    </div>
  );
}
