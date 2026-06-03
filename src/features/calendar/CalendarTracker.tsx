'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Room, Booking } from '../../types';
import { useUI } from '../../context/UIContext';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarTracker() {
  const { setTitle, showToast } = useUI();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    day: number;
    month: number;
    year: number;
    guests: Booking[];
    availRooms: string[];
  } | null>(null);

  useEffect(() => {
    setTitle('Calendar Tracker');
    loadTrackerData();
  }, []);

  const loadTrackerData = async () => {
    try {
      setLoading(true);
      const [roomsData, bookingsData] = await Promise.all([
        api.getRooms(),
        api.getBookings(),
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper: check if a booking overlaps with a specific date
  const getBookedRoomsForDate = (y: number, m: number, d: number) => {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(ds);
    dateObj.setHours(0,0,0,0);

    return bookings.filter(b => {
      const start = new Date(b.checkin);
      start.setHours(0,0,0,0);
      const end = new Date(b.checkout);
      end.setHours(0,0,0,0);
      // Overlap: checkin <= dateObj < checkout
      return dateObj >= start && dateObj < end;
    });
  };

  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;
  };

  const renderGrid = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Group days into week arrays: weeks as columns, rows as days (Sun to Sat)
    const weeks: (number | null)[][] = [];
    let currentDay = 1;

    // First week
    const firstWeek: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) firstWeek.push(null);
    for (let i = startWeekday; i < 7 && currentDay <= daysInMonth; i++) firstWeek.push(currentDay++);
    weeks.push(firstWeek);

    // Subsequent weeks
    while (currentDay <= daysInMonth) {
      const week: (number | null)[] = [];
      for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
        week.push(currentDay++);
      }
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const totalRoomsCount = rooms.length || 6;
    const allRoomNumbers = rooms.map(r => r.roomNumber);

    return (
      <div className="flex w-full border-t border-slate-200 min-w-[600px]">
        {/* Vertical Weekday Header Row */}
        <div className="flex flex-col w-12 bg-slate-100 flex-shrink-0 border-r border-slate-200">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={idx}
              className="h-16 flex items-center justify-center font-bold text-xs text-slate-500 border-b border-slate-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks (Columns) */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex-1 flex flex-col min-w-[70px]">
            {week.map((dateVal, dayIdx) => {
              if (dateVal === null) {
                return (
                  <div
                    key={dayIdx}
                    className="h-16 bg-slate-50/50 border-b border-r border-slate-200"
                  ></div>
                );
              }

              const dateBookings = getBookedRoomsForDate(currentYear, currentMonth, dateVal);
              const bookedRooms = dateBookings.map(b => b.roomNumber);
              const availRooms = allRoomNumbers.filter(num => !bookedRooms.includes(num));
              
              const isCellToday = isToday(dateVal);
              const occupancyRatio = dateBookings.length;

              let ratioBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (occupancyRatio >= totalRoomsCount) {
                ratioBg = 'bg-red-50 text-red-800 border-red-200';
              } else if (occupancyRatio > 0) {
                ratioBg = 'bg-amber-50 text-amber-800 border-amber-200';
              }

              return (
                <div
                  key={dayIdx}
                  onClick={() => setSelectedDayInfo({
                    day: dateVal,
                    month: currentMonth,
                    year: currentYear,
                    guests: dateBookings,
                    availRooms
                  })}
                  className={`h-16 border-b border-r border-slate-200 flex flex-col items-center justify-center p-1.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                    isCellToday ? 'bg-slate-900 border-slate-950 hover:bg-slate-900' : 'bg-white'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isCellToday ? 'text-white' : 'text-slate-800'}`}>
                    {dateVal}
                  </span>
                  
                  <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border ${
                    isCellToday 
                      ? 'bg-amber-500 text-slate-950 border-transparent shadow'
                      : ratioBg
                  }`}>
                    {occupancyRatio}/{totalRoomsCount}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading calendar tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Calendar Header Controls */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="font-extrabold text-base text-slate-800">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Grid Container (horizontally scrollable wrapper) */}
      <div className="glass-card rounded-3xl overflow-x-auto overflow-y-hidden shadow-sm">
        {renderGrid()}
      </div>

      {/* Details overlay modal */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/20 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDayInfo(null)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[75vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-baseline pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                📅 {selectedDayInfo.day} {MONTH_NAMES[selectedDayInfo.month]} {selectedDayInfo.year} Bookings
              </h3>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
              
              {/* Booked Guests */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">🛏️ Booked Guests ({selectedDayInfo.guests.length})</h4>
                <div className="space-y-2">
                  {selectedDayInfo.guests.map((b) => (
                    <div key={b._id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm">
                        {b.guestName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{b.guestName}</p>
                        <p className="text-[10px] text-slate-400">Reserved: {b.checkin.split('T')[0]} → {b.checkout.split('T')[0]}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-[9px] font-black">
                        Room {b.roomNumber}
                      </span>
                    </div>
                  ))}
                  {selectedDayInfo.guests.length === 0 && (
                    <p className="text-xs text-slate-400 py-3 text-center">No guests booked on this date.</p>
                  )}
                </div>
              </div>

              {/* Unoccupied Rooms */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">✅ Unoccupied Rooms ({selectedDayInfo.availRooms.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDayInfo.availRooms.map(roomNum => (
                    <div
                      key={roomNum}
                      className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center font-bold text-emerald-800 text-xs"
                    >
                      Room {roomNum}
                    </div>
                  ))}
                  {selectedDayInfo.availRooms.length === 0 && (
                    <p className="col-span-full text-xs text-slate-400 py-3 text-center">All rooms are fully booked!</p>
                  )}
                </div>
              </div>

            </div>

            <button
              onClick={() => setSelectedDayInfo(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
