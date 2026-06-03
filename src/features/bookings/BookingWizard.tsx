'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Room, Guest, Booking } from '../../types';
import { useUI } from '../../context/UIContext';

export default function BookingWizard() {
  const { setTitle, showToast } = useUI();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedGuest, setSearchedGuest] = useState<Guest | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Form states
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    idType: 'Aadhar Card',
    idNumber: '',
  });

  const [bookingForm, setBookingForm] = useState({
    checkin: new Date().toISOString().split('T')[0],
    checkout: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 1,
    children: 0,
    requests: '',
  });

  useEffect(() => {
    setTitle('Room Booking Flow');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, guestsData] = await Promise.all([
        api.getRooms(),
        api.getGuests(),
      ]);
      setRooms(roomsData);
      setGuests(guestsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load rooms and guests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room: Room) => {
    if (room.status === 'Occupied') {
      showToast(`Room ${room.roomNumber} is already occupied`, 'error');
      return;
    }
    if (room.status === 'Maintenance') {
      showToast(`Room ${room.roomNumber} is currently under maintenance`, 'error');
      return;
    }
    setSelectedRoom(room);
    setStep(2);
  };

  const handlePhoneSearch = () => {
    if (!searchPhone || searchPhone.length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setSearchInitiated(true);
    const found = guests.find(g => g.phone.replace(/\D/g, '').endsWith(searchPhone));
    
    if (found) {
      setSearchedGuest(found);
      const nameParts = found.name.split(' ');
      setGuestForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || 'Guest',
        email: found.email || '',
        address: 'Vrindavan, UP',
        idType: 'Aadhar Card',
        idNumber: found.idNumber,
      });
      showToast('Existing guest profile loaded!', 'success');
    } else {
      setSearchedGuest(null);
      setGuestForm({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        idType: 'Aadhar Card',
        idNumber: '',
      });
      showToast('No record found. Please register as new guest.', 'info');
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.firstName || !guestForm.lastName || !guestForm.idNumber) {
      showToast('Please fill out all required fields (*)', 'error');
      return;
    }
    setStep(3);
  };

  const calculateNights = () => {
    const start = new Date(bookingForm.checkin);
    const end = new Date(bookingForm.checkout);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleBookingConfirm = async () => {
    if (!selectedRoom) return;

    try {
      setLoading(true);
      const fullName = `${guestForm.firstName} ${guestForm.lastName}`.trim();
      
      // 1. Create or retrieve guest in database
      let guestId = searchedGuest?._id;
      let finalGuest = searchedGuest;
      
      if (!guestId) {
        // Register new guest
        const newGuest = await api.createGuest({
          name: fullName,
          phone: searchPhone,
          email: guestForm.email,
          idNumber: guestForm.idNumber,
          checkInDate: new Date(bookingForm.checkin).toISOString(),
          status: 'Checked-In',
          roomAssigned: selectedRoom._id,
          billTotal: calculateNights() * selectedRoom.price,
        });
        guestId = newGuest._id;
        finalGuest = newGuest;
      } else {
        // Update existing guest's checkin and room assignment
        const updated = await api.updateGuest(guestId, {
          roomAssigned: selectedRoom._id,
          checkInDate: new Date(bookingForm.checkin).toISOString(),
          status: 'Checked-In',
          billTotal: calculateNights() * selectedRoom.price,
        });
        finalGuest = updated;
      }

      // 2. Create Booking
      await api.createBooking({
        guestName: fullName,
        roomNumber: selectedRoom.roomNumber,
        checkin: new Date(bookingForm.checkin).toISOString(),
        checkout: new Date(bookingForm.checkout).toISOString(),
        bookedBy: 'Front Desk Admin',
      });

      // 3. Mark room as occupied
      await api.updateRoom(selectedRoom._id!, { status: 'Occupied' });

      showToast(`Booking for Room ${selectedRoom.roomNumber} confirmed successfully!`, 'success');
      
      // Reset wizard
      setSelectedRoom(null);
      setSearchPhone('');
      setSearchedGuest(null);
      setSearchInitiated(false);
      setStep(1);
      loadData(); // reload rooms and guests
    } catch (err: any) {
      showToast(err.message || 'Booking confirmation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading rooms list...</p>
      </div>
    );
  }

  const nightsCount = calculateNights();
  const totalPrice = selectedRoom ? nightsCount * selectedRoom.price : 0;

  return (
    <div className="space-y-6">
      
      {/* Wizard Progress Headers */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        {['Select Room', 'Guest Details', 'Dates & Verify'].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 justify-center first:justify-start last:justify-end">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                isActive ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isDone ? '✓' : stepNum}
              </span>
              <span className={`text-xs font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: ROOM SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select Available Room</h3>
            <span className="text-xs text-slate-500">{rooms.filter(r => r.status === 'Available').length} available</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const isOccupied = room.status === 'Occupied';
              const isMaint = room.status === 'Maintenance';
              
              let statusText = 'Available';
              let statusBg = 'bg-emerald-500 text-white';
              if (isOccupied) {
                statusText = 'Occupied';
                statusBg = 'bg-red-500 text-white';
              } else if (isMaint) {
                statusText = 'Maint.';
                statusBg = 'bg-amber-500 text-slate-950';
              }

              return (
                <div
                  key={room._id}
                  onClick={() => handleRoomSelect(room)}
                  className={`glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                    isOccupied || isMaint ? 'opacity-60 cursor-not-allowed border-transparent' : 'hover:-translate-y-1 hover:border-amber-400 border-transparent'
                  }`}
                >
                  <div className="h-28 relative bg-slate-200">
                    <img
                      src={room.images[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop'}
                      alt={room.roomNumber}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2275%22%3E%3Crect width=%22100%22 height=%2275%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E';
                      }}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBg}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-extrabold text-slate-800">Room {room.roomNumber}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{room.type}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-emerald-600">₹{room.price}/night</span>
                      <span className="text-[10px] text-slate-400">👥 {room.type === 'Single' ? '1-2' : room.type === 'Double' ? '2-3' : '4+'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: GUEST DETAILS */}
      {step === 2 && selectedRoom && (
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Room</span>
              <p className="text-sm font-extrabold text-slate-800">Room {selectedRoom.roomNumber} ({selectedRoom.type})</p>
            </div>
            <span className="text-xs font-bold text-emerald-600">₹{selectedRoom.price}/night</span>
          </div>

          {/* Guest phone search */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Guest Profile</label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-amber-500"
              />
              <button
                onClick={handlePhoneSearch}
                className="px-6 bg-slate-900 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Search Result display */}
          {searchInitiated && (
            <form onSubmit={handleGuestSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800">Guest Registration Form</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">First Name *</label>
                  <input
                    type="text"
                    required
                    value={guestForm.firstName}
                    onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={guestForm.lastName}
                    onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Government ID Type *</label>
                  <select
                    value={guestForm.idType}
                    onChange={(e) => setGuestForm({ ...guestForm, idType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
                  >
                    <option value="Aadhar Card">Aadhar Card</option>
                    <option value="Pan Card">Pan Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">ID Number *</label>
                  <input
                    type="text"
                    required
                    value={guestForm.idNumber}
                    onChange={(e) => setGuestForm({ ...guestForm, idNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* STEP 3: BOOKING DETAILS & VERIFY */}
      {step === 3 && selectedRoom && (
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <h3 className="text-sm font-bold text-slate-800">Booking Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Check-In Date</label>
              <input
                type="date"
                value={bookingForm.checkin}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const checkin = e.target.value;
                  const checkout = bookingForm.checkout <= checkin 
                    ? new Date(new Date(checkin).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : bookingForm.checkout;
                  setBookingForm({ ...bookingForm, checkin, checkout });
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Check-Out Date</label>
              <input
                type="date"
                value={bookingForm.checkout}
                min={new Date(new Date(bookingForm.checkin).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setBookingForm({ ...bookingForm, checkout: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Adults</label>
              <input
                type="number"
                min="1"
                max="6"
                value={bookingForm.adults}
                onChange={(e) => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Children</label>
              <input
                type="number"
                min="0"
                max="6"
                value={bookingForm.children}
                onChange={(e) => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Special Requests (Optional)</label>
            <textarea
              rows={2}
              placeholder="E.g. Extra towels, ground floor, late check-in..."
              value={bookingForm.requests}
              onChange={(e) => setBookingForm({ ...bookingForm, requests: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-amber-500"
            ></textarea>
          </div>

          {/* Pricing summary */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl flex flex-col gap-1 items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Price Calculation</span>
            <div className="text-xl font-extrabold text-amber-500">₹{totalPrice.toLocaleString()}</div>
            <span className="text-[10px] text-slate-300">
              {nightsCount} night{nightsCount > 1 ? 's' : ''} × ₹{selectedRoom.price.toLocaleString()} Tariff
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleBookingConfirm}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
