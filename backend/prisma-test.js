import prisma from './src/config/db.js';

async function testDb() {
  try {
    console.log('Testing Prisma SQLite database connection...');
    const userCount = await prisma.user.count();
    console.log(`Current user count in SQLite DB: ${userCount}`);
    
    const fileCount = await prisma.medicalFile.count();
    console.log(`Current medical files in SQLite DB: ${fileCount}`);
    
    console.log('✅ SQLite Database connection is working perfectly!');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDb();
