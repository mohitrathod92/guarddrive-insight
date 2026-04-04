import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateDriverLocation, updateDriverSpeed, updateDriverImu } from '@/features/fleet/fleetSlice';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Navigation } from 'lucide-react';

// A simple permissions prompt modal for iOS DeviceMotion
const PermissionsModal = ({ onGrant }: { onGrant: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xl max-w-sm text-center">
      <div className="flex justify-center mb-4 text-gd-blue">
        <Navigation size={48} />
      </div>
      <h2 className="text-xl font-heading font-bold mb-2">Enable Sensors</h2>
      <p className="text-sm text-muted-foreground mb-6">
        GuardDrive requires access to your device's motion sensors to track harsh braking and sharp turns accurately.
      </p>
      <button 
        onClick={onGrant}
        className="w-full bg-gd-blue text-white font-semibold py-3 rounded-lg hover:bg-gd-blue/90 transition-colors"
      >
        Grant Permission
      </button>
    </div>
  </div>
);

export default function GlobalRealTimeTracker() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const [needsPermission, setNeedsPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Throttle refs for device motion
  const lastImuUpdate = useRef(0);

  const requestPermissionsAndStart = async () => {
    try {
      // Handle iOS 13+ DeviceMotionEvent permission requirement
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setNeedsPermission(false);
        } else {
          console.warn("DeviceMotion permission denied");
          return;
        }
      } else {
        // Non iOS 13+ devices
        setNeedsPermission(false);
      }
      setIsTracking(true);
    } catch (e) {
      console.error("Error requesting IMU permissions:", e);
      // Fallback
      setIsTracking(true);
      setNeedsPermission(false);
    }
  };

  useEffect(() => {
    // Only track if logged in
    if (!user) return;

    // Check if we need to show the permission prompt
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function' && !isTracking) {
      setNeedsPermission(true);
      return;
    }

    setIsTracking(true);

  }, [user]);

  useEffect(() => {
    if (!isTracking) return;

    // 1. Start GPS Tracking
    // Immediately fetch once for fast lock:
    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch(updateDriverLocation({ id: 1, lat: position.coords.latitude, lng: position.coords.longitude }));
      },
      (error) => console.warn("Initial GPS fetch failed:", error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        // Update location globally for Driver 1
        dispatch(updateDriverLocation({ id: 1, lat: latitude, lng: longitude }));
        
        if (speed !== null) {
          // speed is in m/s, convert to km/h
          const kmh = Math.round(speed * 3.6);
          dispatch(updateDriverSpeed({ id: 1, speed: kmh }));
        }
      },
      (error) => {
         console.warn("Global GPS Watch Error:", error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    // 2. Start IMU Tracking (Device Motion)
    const handleMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      // Throttle IMU updates to Redux to 500ms to avoid performance bottleneck
      if (now - lastImuUpdate.current > 500) {
         lastImuUpdate.current = now;
         
         // Extract values, default to 0 if null
         const x = event.acceleration?.x ?? 0;
         const y = event.acceleration?.y ?? 0;
         const z = event.acceleration?.z ?? 0;

         dispatch(updateDriverImu({ id: 1, x, y, z }));
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('devicemotion', handleMotion);
    };

  }, [isTracking, dispatch]);

  if (needsPermission) {
    return <PermissionsModal onGrant={requestPermissionsAndStart} />;
  }

  // Adding a subtle indicator component for active tracking
  if (isTracking) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-surface/80 backdrop-blur border border-border px-3 py-1.5 rounded-full shadow-lg pointer-events-none fade-in">
        <MapPin size={12} className="text-gd-blue pulse-blue" />
        <span className="text-[10px] font-mono text-muted-foreground font-semibold">LIVE SENSORS</span>
      </div>
    );
  }

  return null;
}
