// Usage: node server/scripts/reset-admin.js <newpassword>
// Example: JWT_SECRET=... node server/scripts/reset-admin.js 'VukaAdmin@2024!'
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';

const [,, password] = process.argv;
if (!password || password.length < 8) {
  console.error('Usage: node server/scripts/reset-admin.js <newpassword>');
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const hashed = await bcrypt.hash(password, 12);
const result = db.prepare("UPDATE users SET password = ? WHERE role = 'admin'").run(hashed);

if (result.changes === 0) {
  console.error('No admin user found in the database.');
  process.exit(1);
}

console.log(`✅ Admin password updated for ${result.changes} account(s).`);
process.exit(0);
