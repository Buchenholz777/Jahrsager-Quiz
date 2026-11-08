import { hashPassword } from "../src/server/auth";

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error('Aufruf: npm run admin:hash -- "ein-langes-passwort" (mindestens 12 Zeichen)');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(pw)}`);
