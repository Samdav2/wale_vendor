import { Room, Guest, Booking, Food, Staff, Policy, ContactInfo, NearbyPlace } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: any = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NEXT_PUBLIC_API_SECRET_KEY || '',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let result;
  try {
    result = await response.json();
  } catch (e) {
    throw new Error(`Server connection failed or returned an invalid response (${response.status} ${response.statusText}).`);
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
  }

  return result.data !== undefined ? result.data : result;
}

export const api = {
  // Rooms
  getRooms: () => request<Room[]>('/rooms'),
  getRoom: (id: string) => request<Room>(`/rooms/${id}`),
  createRoom: (data: Partial<Room>) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: Partial<Room>) => request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: string) => request<unknown>(`/rooms/${id}`, { method: 'DELETE' }),

  // Guests
  getGuests: () => request<Guest[]>('/guests'),
  createGuest: (data: Partial<Guest>) => request<Guest>('/guests', { method: 'POST', body: JSON.stringify(data) }),
  updateGuest: (id: string, data: Partial<Guest>) => request<Guest>(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGuest: (id: string) => request<unknown>(`/guests/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: () => request<Booking[]>('/bookings'),
  createBooking: (data: Partial<Booking>) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  deleteBooking: (id: string) => request<unknown>(`/bookings/${id}`, { method: 'DELETE' }),

  // Food
  getFoods: () => request<Food[]>('/food'),
  createFood: (data: Partial<Food>) => request<Food>('/food', { method: 'POST', body: JSON.stringify(data) }),
  updateFood: (id: string, data: Partial<Food>) => request<Food>(`/food/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFood: (id: string) => request<unknown>(`/food/${id}`, { method: 'DELETE' }),

  // Staff
  getStaff: () => request<Staff[]>('/staff'),
  createStaff: (data: Partial<Staff>) => request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: Partial<Staff>) => request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id: string) => request<unknown>(`/staff/${id}`, { method: 'DELETE' }),

  // Policies
  getPolicies: () => request<Policy[]>('/policies'),
  updatePolicy: (type: string, content: string) => request<Policy>(`/policies/${type}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  // Contact Info
  getContactInfo: () => request<ContactInfo>('/contacts'),
  updateContactInfo: (data: Partial<ContactInfo>) => request<ContactInfo>('/contacts', { method: 'PUT', body: JSON.stringify(data) }),

  // Nearby Places
  getNearbyPlaces: () => request<NearbyPlace[]>('/nearby'),
  createNearbyPlace: (data: Partial<NearbyPlace>) => request<NearbyPlace>('/nearby', { method: 'POST', body: JSON.stringify(data) }),
  deleteNearbyPlace: (id: string) => request<unknown>(`/nearby/${id}`, { method: 'DELETE' }),

  // Admin Auth & Profile
  adminLogin: (data: any) => request<any>('/vendor-auth/login', { method: 'POST', body: JSON.stringify(data) }),
  adminRegister: (data: any) => request<any>('/vendor-auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/vendor-auth/me'),
  updateProfile: (data: any) => request<any>('/vendor-auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};
