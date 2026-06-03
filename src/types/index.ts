export interface Room {
  _id?: string;
  roomNumber: string;
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe' | 'Standard' | 'Family';
  price: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  amenities: string[];
  description?: string;
  images: string[];
}

export interface Guest {
  _id?: string;
  name: string;
  email?: string;
  phone: string;
  idNumber: string;
  roomAssigned?: string | Room;
  checkInDate: string;
  checkOutDate?: string;
  status: 'Checked-In' | 'Checked-Out' | 'Reserved';
  billTotal: number;
  isVendor?: boolean;
  createdAt?: string;
}

export interface Booking {
  _id?: string;
  guestName: string;
  roomNumber: string;
  image?: string;
  checkin: string;
  checkout: string;
  bookedBy: string;
  createdAt?: string;
}

export interface Food {
  _id?: string;
  itemName: string;
  category: 'Appetizer' | 'Main Course' | 'Dessert' | 'Beverage' | 'Breakfast';
  price: number;
  availability: boolean;
  description?: string;
  image?: string;
}

export interface Staff {
  _id?: string;
  name: string;
  position: string;
  email?: string;
  phone: string;
  address?: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'suspended'; // mapping active/suspended
  idNumber: string;
  profileImage?: string;
  shift?: 'Morning' | 'Evening' | 'Night' | 'Flexible';
}

export interface Policy {
  _id?: string;
  type: 'hotel_rules' | 'privacy_policy' | 'cancellation_policy';
  content: string;
}

export interface ContactInfo {
  _id?: string;
  propertyPhone?: string;
  propertyEmail?: string;
  propertyAddress?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  mapEmbed?: string;
}

export interface NearbyPlace {
  _id?: string;
  name: string;
  distanceKm: number;
  walkingMins: number;
}
