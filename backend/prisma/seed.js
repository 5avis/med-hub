import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

async function main() {
  console.log('Seeding MedHub database from scratch...');

  // Create default doctor/clinician user
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'dr.jenkins@medhub.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Jenkins',
      email: 'dr.jenkins@medhub.com',
      password: passwordHash,
      age: 34,
      contact: '+1 (555) 234-5678',
      bloodGroup: 'A+',
      height: '168',
      weight: '62',
      gender: 'Female',
      allergies: 'Penicillin',
      chronicConditions: 'None',
      emergencyContact: 'Mark Jenkins (+1 555 999 8888)',
      primaryPhysician: 'St. Jude Clinical Center',
      medicalHistory: 'Primary Admitting Clinician account.',
      medhubId: 'MED-100100',
      role: 'full_access',
      isFirstLogin: false,
    },
  });

  console.log('✅ Default user created:', demoUser.email, 'MedHub ID:', demoUser.medhubId);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
