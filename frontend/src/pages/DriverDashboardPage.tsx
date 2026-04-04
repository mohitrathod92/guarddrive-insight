import { useState } from 'react';
import { AlertTriangle, Bell, Zap } from 'lucide-react';
import FatigueDetector from '@/components/FatigueDetector';
import { useAuth } from '@/contexts/AuthContext';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'overspeed', time: '10 mins ago', message: 'Exceeded speed limit by 15km/h' },
    { id: 2, type: 'rush', time: '1 hour ago', message: 'Harsh braking detected' }
  ]);

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Welcome, {user?.name || 'Driver'}</h1>
        <p className="text-sm text-muted-foreground">Your real-time safety monitoring is active.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Live Camera Demo (Fatigue Detection) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-1 shadow-sm transition-shadow hover:shadow-md">
            <div className="p-4 flex items-center justify-between border-b border-surface-border">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gd-green pulse-green"></span>
                Live Fatigue Monitoring
              </h2>
            </div>
            <div className="p-4">
              <FatigueDetector 
                driverName={user?.name || 'Driver'} 
                route="Active Duty" 
                onStatusChange={() => {}} 
                onIncident={() => {}} 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Notifications Feed */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface shadow-sm">
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Bell size={20} className="text-muted-foreground" />
                Alerts & Feedback
              </h2>
              <span className="rounded-full bg-gd-red/10 px-2.5 py-0.5 text-xs font-semibold text-gd-red">
                {notifications.length} New
              </span>
            </div>
            <div className="p-5 space-y-4">
              {notifications.length > 0 ? (
                notifications.map(note => (
                  <div key={note.id} className="flex gap-4 items-start p-3 bg-background rounded-xl border border-border/50 transition-colors hover:border-muted">
                    <div className="mt-0.5 rounded-full bg-gd-amber/20 p-1.5 flex-shrink-0">
                      {note.type === 'overspeed' ? (
                        <Zap size={16} className="text-gd-amber" />
                      ) : (
                        <AlertTriangle size={16} className="text-gd-amber" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{note.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{note.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active alerts. Safe driving!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
