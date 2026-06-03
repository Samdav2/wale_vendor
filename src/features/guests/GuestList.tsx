'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Guest, Booking, Room } from '../../types';
import { useUI } from '../../context/UIContext';

export default function GuestList() {
  const { setTitle, showToast } = useUI();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Actions modal
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<'checkin' | 'cancel' | null>(null);

  useEffect(() => {
    setTitle('Guest List');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [guestsData, bookingsData, roomsData] = await Promise.all([
        api.getGuests(),
        api.getBookings(),
        api.getRooms(),
      ]);
      setGuests(guestsData);
      setBookings(bookingsData);
      setRooms(roomsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch guests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getGuestRoom = (guest: Guest) => {
    if (!guest.roomAssigned) return null;
    if (typeof guest.roomAssigned === 'string') {
      return rooms.find(r => r._id === guest.roomAssigned);
    }
    return guest.roomAssigned as Room;
  };

  const getGuestBooking = (guest: Guest) => {
    const room = getGuestRoom(guest);
    if (!room) return null;
    return bookings.find(b => b.roomNumber === room.roomNumber && b.guestName.toLowerCase() === guest.name.toLowerCase());
  };

  const handleCheckIn = async (guest: Guest) => {
    const room = getGuestRoom(guest);
    if (!room) {
      showToast('No room assigned to this guest.', 'error');
      return;
    }

    try {
      setLoading(true);
      // 1. Update guest status to Checked-In
      await api.updateGuest(guest._id!, { status: 'Checked-In' });
      // 2. Mark Room as Occupied
      await api.updateRoom(room._id!, { status: 'Occupied' });

      showToast(`${guest.name} checked in successfully!`, 'success');
      setActiveGuest(null);
      setConfirmingAction(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Check-in action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (guest: Guest) => {
    const room = getGuestRoom(guest);
    const booking = getGuestBooking(guest);

    try {
      setLoading(true);
      // 1. Delete Guest
      await api.deleteGuest(guest._id!);

      // 2. Delete Booking if present
      if (booking && booking._id) {
        await api.deleteBooking(booking._id);
      }

      // 3. Mark Room as Available if it was occupied/associated with this checkin
      if (room && room.status === 'Occupied') {
        await api.updateRoom(room._id!, { status: 'Available' });
      }

      showToast(`Booking for ${guest.name} cancelled successfully`, 'success');
      setActiveGuest(null);
      setConfirmingAction(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const room = getGuestRoom(guest);
    const roomNumber = room ? room.roomNumber.toLowerCase() : '';
    return (
      guest.name.toLowerCase().includes(q) ||
      guest.phone.toLowerCase().includes(q) ||
      guest.email?.toLowerCase().includes(q) ||
      roomNumber.includes(q)
    );
  });

  // Sort: Checked-In guests first, then alphabetical
  const sortedGuests = [...filteredGuests].sort((a, b) => {
    if (a.status === 'Checked-In' && b.status !== 'Checked-In') return -1;
    if (a.status !== 'Checked-In' && b.status === 'Checked-In') return 1;
    return a.name.localeCompare(b.name);
  });

  const maskId = (idNum: string) => {
    if (!idNum) return 'ID: Not provided';
    return `ID: ****${idNum.slice(-4)}`;
  };

  if (loading && guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading guest files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-3">
        <input
          type="text"
          placeholder="Search by name, phone or room number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-amber-500"
        />
        <button
          onClick={loadData}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          Refresh
        </button>
      </div>

      {/* Guest Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedGuests.map((guest) => {
          const room = getGuestRoom(guest);
          const booking = getGuestBooking(guest);
          const isCheckedIn = guest.status === 'Checked-In';

          return (
            <div
              key={guest._id}
              onClick={() => setActiveGuest(guest)}
              className={`glass-card rounded-2xl overflow-hidden cursor-pointer border hover:-translate-y-0.5 hover:border-amber-400 transition-all duration-200 p-4 flex gap-4 ${
                isCheckedIn ? 'border-l-4 border-l-emerald-500 border-emerald-100 bg-emerald-50/10' : 'border-slate-200 bg-white'
              }`}
            >
              {/* Profile Avatar */}
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center font-black text-slate-400 text-2xl uppercase border border-slate-200 shadow-inner">
                {guest.name.substring(0, 2)}
              </div>

              {/* Guest Information */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-slate-800 truncate">{guest.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block truncate">{maskId(guest.idNumber)}</span>
                  </div>
                  <span className={`flex-shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isCheckedIn ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {guest.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>📞 {guest.phone}</p>
                  {guest.email && <p>✉️ {guest.email}</p>}
                </div>

                {room && (
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-indigo-700">
                    <span>🏠 Room {room.roomNumber} ({room.type})</span>
                    {booking && (
                      <span className="text-slate-400 text-[9px] font-normal">
                        📅 {booking.checkin.split('T')[0]} → {booking.checkout.split('T')[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sortedGuests.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm font-medium text-slate-400">
            No matching guests found.
          </div>
        )}
      </div>

      {/* Guest Action overlay modal */}
      {activeGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fade-in" onClick={() => setActiveGuest(null)}>
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800">Manage Guest Files</h3>
              <p className="text-xs text-slate-400 mt-1">Select action for {activeGuest.name}</p>
            </div>

            {confirmingAction === null ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {activeGuest.status !== 'Checked-In' ? (
                  <button
                    onClick={() => setConfirmingAction('checkin')}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Check In
                  </button>
                ) : (
                  <button
                    disabled
                    className="py-3 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed"
                  >
                    Checked-In
                  </button>
                )}
                
                <button
                  onClick={() => setConfirmingAction('cancel')}
                  className="py-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel Booking
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-xs font-medium text-slate-600">
                  {confirmingAction === 'checkin'
                    ? `Are you sure you want to Check-in ${activeGuest.name}?`
                    : `This will remove the guest and release Room ${getGuestRoom(activeGuest)?.roomNumber}. Proceed?`
                  }
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConfirmingAction(null)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => confirmingAction === 'checkin' ? handleCheckIn(activeGuest) : handleCancelBooking(activeGuest)}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Yes, Confirm
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => { setActiveGuest(null); setConfirmingAction(null); }}
              className="w-full py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
