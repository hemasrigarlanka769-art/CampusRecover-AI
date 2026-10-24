export interface CampusLocation {
  id: string;
  name: string;
  code: string;
  zone: string;
  lat: number;
  lng: number;
  description: string;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'b_de',
    name: 'DE Block',
    code: 'DE',
    zone: 'Academic Wing',
    lat: 18.0647,
    lng: 83.4052,
    description: 'Mechanical & Chemical Engineering DE Block',
  },
  {
    id: 'b_cse',
    name: 'CSE Block',
    code: 'CSE',
    zone: 'Academic Wing',
    lat: 18.0652,
    lng: 83.4060,
    description: 'Computer Science & Engineering Department',
  },
  {
    id: 'b_it',
    name: 'IT Block',
    code: 'IT',
    zone: 'Academic Wing',
    lat: 18.0656,
    lng: 83.4062,
    description: 'Information Technology Department Wing',
  },
  {
    id: 'b_civil',
    name: 'Civil Block',
    code: 'CIVIL',
    zone: 'Academic Wing',
    lat: 18.0642,
    lng: 83.4057,
    description: 'Civil Engineering Department Complex',
  },
  {
    id: 'b_canteen',
    name: 'Canteen',
    code: 'CANTEEN',
    zone: 'Food & Dining',
    lat: 18.0650,
    lng: 83.4075,
    description: 'Main Campus Canteen & Cafeteria',
  },
  {
    id: 'b_freshchill',
    name: 'Fresh Chill',
    code: 'FRESH_CHILL',
    zone: 'Food & Dining',
    lat: 18.0654,
    lng: 83.4076,
    description: 'Fresh Chill Juice & Beverage Station',
  },
  {
    id: 'b_bakers',
    name: 'Bakers Corner',
    code: 'BAKERS_CORNER',
    zone: 'Food & Dining',
    lat: 18.0657,
    lng: 83.4077,
    description: 'Bakers Corner Snack & Bakery Hub',
  },
  {
    id: 'b_centralpark',
    name: 'Central Park',
    code: 'CENTRAL_PARK',
    zone: 'Central Campus',
    lat: 18.0650,
    lng: 83.4065,
    description: 'MVGR Central Park & Quad Garden',
  },
  {
    id: 'b_admin',
    name: 'Admin Block',
    code: 'ADMIN',
    zone: 'Administration',
    lat: 18.0649,
    lng: 83.4068,
    description: 'Administrative Block & Principal Office',
  },
  {
    id: 'b_bank',
    name: 'Bank',
    code: 'BANK',
    zone: 'Campus Services',
    lat: 18.0646,
    lng: 83.4070,
    description: 'Union / Andhra Bank Branch & Campus ATM',
  },
  {
    id: 'b_stationary',
    name: 'Stationary',
    code: 'STATIONARY',
    zone: 'Campus Services',
    lat: 18.0647,
    lng: 83.4071,
    description: 'Campus Book Store & Stationary Store',
  },
  {
    id: 'b_gate',
    name: 'Main Gate & Security Post',
    code: 'GATE',
    zone: 'East Entrance',
    lat: 18.0645,
    lng: 83.4072,
    description: 'College Main Gate & 24/7 Security Desk',
  },
];

export const CAMPUS_LOCATION_NAMES = CAMPUS_LOCATIONS.map((l) => l.name);
