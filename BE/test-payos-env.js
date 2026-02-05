// Test script to validate PayOS credentials
require('dotenv').config();

console.log('='.repeat(60));
console.log('📋 PayOS Environment Variables Check');
console.log('='.repeat(60));

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

console.log('\n1. PAYOS_CLIENT_ID:');
if (clientId && clientId.trim()) {
  console.log(`   ✅ Configured: ${clientId.substring(0, 10)}...`);
} else {
  console.log(`   ❌ Missing or empty`);
}

console.log('\n2. PAYOS_API_KEY:');
if (apiKey && apiKey.trim()) {
  console.log(`   ✅ Configured: ${apiKey.substring(0, 10)}...`);
} else {
  console.log(`   ❌ Missing or empty`);
}

console.log('\n3. PAYOS_CHECKSUM_KEY:');
if (checksumKey && checksumKey.trim()) {
  console.log(`   ✅ Configured: ${checksumKey.substring(0, 10)}...`);
} else {
  console.log(`   ❌ Missing or empty`);
}

console.log('\n' + '='.repeat(60));

if (clientId && apiKey && checksumKey) {
  console.log('✅ All credentials configured!');
  console.log('You can now test PayOS payments.');
} else {
  console.log('❌ Some credentials are missing.');
  console.log('Please check your .env file and ensure:');
  console.log('  - No spaces around the = sign');
  console.log('  - No quotes around values');
  console.log('  - File is saved');
}

console.log('='.repeat(60));
