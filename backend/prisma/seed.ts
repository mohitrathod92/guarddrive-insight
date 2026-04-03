import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // Create starting drivers
  const driversData = [
    { name: 'Rajesh Kumar', route: 'Route 42 — Ahmedabad Central', routeNum: 42, status: 'Safe', lat: 23.022, lng: 72.571, speed: 67, fatigueScore: 92 },
    { name: 'Amit Shah', route: 'Route 17 — SG Highway', routeNum: 17, status: 'Warning', lat: 23.033, lng: 72.585, speed: 72, fatigueScore: 71 },
    { name: 'Priya Patel', route: 'Route 8 — Navrangpura', routeNum: 8, status: 'Safe', lat: 23.015, lng: 72.560, speed: 45, fatigueScore: 97 },
    { name: 'Suresh Mehta', route: 'Route 31 — Maninagar', routeNum: 31, status: 'Critical', lat: 23.041, lng: 72.595, speed: 83, fatigueScore: 48 },
    { name: 'Deepak Joshi', route: 'Route 5 — Satellite', routeNum: 5, status: 'Safe', lat: 23.010, lng: 72.550, speed: 55, fatigueScore: 89 },
    { name: 'Neha Singh', route: 'Route 22 — Vastrapur', routeNum: 22, status: 'Warning', lat: 23.028, lng: 72.578, speed: 61, fatigueScore: 66 },
    { name: 'Vikram Rao', route: 'Route 14 — Paldi', routeNum: 14, status: 'Safe', lat: 23.018, lng: 72.565, speed: 48, fatigueScore: 91 },
    { name: 'Anita Desai', route: 'Route 9 — Bopal', routeNum: 9, status: 'Safe', lat: 23.035, lng: 72.588, speed: 52, fatigueScore: 85 }
  ];

  await prisma.driver.deleteMany(); // Reset
  
  for (const data of driversData) {
    const driver = await prisma.driver.create({ data });
    
    // Create random incidents if they aren't completely safe
    if (data.status !== 'Safe') {
        await prisma.incident.create({
            data: {
                driverId: driver.id,
                type: data.status === 'Critical' ? 'Drowsiness' : 'Eye Closure',
                severity: data.status === 'Critical' ? 'High' : 'Medium',
                duration: Math.random() * 5 + 1.5,
                speed: data.speed,
            }
        });
    }
  }

  // Create Fleet
  const fleetData = [
    { vehicleNo: 'GJ-01-AB-1234', routeName: 'Ahmedabad Central', routeNum: 42 },
    { vehicleNo: 'GJ-01-XY-9876', routeName: 'SG Highway', routeNum: 17 },
  ];

  await prisma.fleetVehicle.deleteMany();
  for (const data of fleetData) {
     await prisma.fleetVehicle.create({ data });
  }

  console.log('Database Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
