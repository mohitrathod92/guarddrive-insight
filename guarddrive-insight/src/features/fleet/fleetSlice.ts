import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DriverStatus = 'Safe' | 'Warning' | 'Critical';

export interface Driver {
  id: number;
  name: string;
  route: string;
  routeNum: number;
  status: DriverStatus;
  lat: number;
  lng: number;
  speed: number;
  fatigue: number;
  lastIncident: string;
}

interface FleetState {
  drivers: Driver[];
}

const initialDrivers: Driver[] = [
  { id: 1, name: 'Rajesh Kumar',  route: 'Route 42 — Ahmedabad Central', routeNum: 42, status: 'Safe',     lat: 23.0225, lng: 72.5714, speed: 67, fatigue: 92, lastIncident: '13:45' },
  { id: 2, name: 'Amit Shah',     route: 'Route 17 — SG Highway',        routeNum: 17, status: 'Warning',  lat: 23.0331, lng: 72.5852, speed: 72, fatigue: 71, lastIncident: '11:20' },
  { id: 3, name: 'Priya Patel',   route: 'Route 8 — Navrangpura',        routeNum: 8,  status: 'Safe',     lat: 23.0158, lng: 72.5601, speed: 45, fatigue: 97, lastIncident: 'None' },
  { id: 4, name: 'Suresh Mehta',  route: 'Route 31 — Maninagar',         routeNum: 31, status: 'Warning', lat: 23.0416, lng: 72.5954, speed: 83, fatigue: 48, lastIncident: '14:30' },
  { id: 5, name: 'Deepak Joshi',  route: 'Route 5 — Satellite',          routeNum: 5,  status: 'Safe',     lat: 23.0102, lng: 72.5501, speed: 55, fatigue: 89, lastIncident: 'None' },
  { id: 6, name: 'Neha Singh',    route: 'Route 22 — Vastrapur',         routeNum: 22, status: 'Warning',  lat: 23.0284, lng: 72.5786, speed: 61, fatigue: 66, lastIncident: '10:15' },
  { id: 7, name: 'Vikram Rao',    route: 'Route 14 — Paldi',             routeNum: 14, status: 'Safe',     lat: 23.0182, lng: 72.5654, speed: 48, fatigue: 91, lastIncident: 'None' },
  { id: 8, name: 'Anita Desai',   route: 'Route 9 — Bopal',              routeNum: 9,  status: 'Safe',     lat: 23.0354, lng: 72.5888, speed: 52, fatigue: 85, lastIncident: '09:40' },
];

const initialState: FleetState = {
  drivers: initialDrivers,
};

export const fleetSlice = createSlice({
  name: 'fleet',
  initialState,
  reducers: {
    updateDriverSpeed: (state, action: PayloadAction<{ id: number; speed: number; status?: DriverStatus }>) => {
      const driver = state.drivers.find(d => d.id === action.payload.id);
      if (driver) {
        driver.speed = action.payload.speed;
        if (action.payload.status) {
          driver.status = action.payload.status;
        }
      }
    },
    tickFleetMovement: (state) => {
      state.drivers = state.drivers.map(d => {
        // Only randomly change speed slightly if they are NOT Driver 1 (assuming Driver 1 is our real user)
        // Or actually we can leave their speed static if we want full manual control for all,
        // but for simulation feeling, others can jitter. Let's jitter driver 2-8 speed slightly.
        let newSpeed = d.speed;
        if (d.id !== 1) {
             newSpeed = Math.max(30, Math.min(80, d.speed + (Math.random() - 0.5) * 5));
        }

        const moveAmount = newSpeed * 0.0000005;
        let newLat = d.lat + (Math.random() - 0.2) * moveAmount;
        let newLng = d.lng + (Math.random() - 0.5) * moveAmount;

        return { ...d, lat: newLat, lng: newLng, speed: Math.round(newSpeed) };
      });
    },
    updateDriverLocation: (state, action: PayloadAction<{ id: number; lat: number; lng: number }>) => {
        const driver = state.drivers.find(d => d.id === action.payload.id);
        if (driver) {
            driver.lat = action.payload.lat;
            driver.lng = action.payload.lng;
        }
    }
  },
});

export const { updateDriverSpeed, tickFleetMovement, updateDriverLocation } = fleetSlice.actions;

export default fleetSlice.reducer;
