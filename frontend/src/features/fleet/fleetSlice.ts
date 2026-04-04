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
  xAccel?: number;
  yAccel?: number;
  zAccel?: number;
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
        // Driver 1 (Current User) should NOT be simulated. They use real sensors.
        if (d.id === 1) return d;

        // Jitter speed slightly for simulated drivers
        let newSpeed = Math.max(30, Math.min(80, d.speed + (Math.random() - 0.5) * 5));

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
    },
    updateDriverImu: (state, action: PayloadAction<{ id: number; x: number; y: number; z: number }>) => {
        const driver = state.drivers.find(d => d.id === action.payload.id);
        if (driver) {
            driver.xAccel = action.payload.x;
            driver.yAccel = action.payload.y;
            driver.zAccel = action.payload.z;
        }
    },
    setUserAsDriver: (state, action: PayloadAction<{ name: string }>) => {
      const driver = state.drivers.find(d => d.id === 1);
      if (driver) {
        driver.name = action.payload.name;
        // Don't set random coordinates. Let <GlobalRealTimeTracker /> accurately overwrite this when it obtains a real GPS lock.
      }
    }
  },
});

export const { updateDriverSpeed, tickFleetMovement, updateDriverLocation, updateDriverImu, setUserAsDriver } = fleetSlice.actions;

export default fleetSlice.reducer;
