#!/usr/bin/env node
require('dotenv').config({ path: process.argv[2] || '/var/www/irancell/backend/.env' });
const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('ADMIN_PASSWORD is required');
    process.exit(1);
  }

  await connectDB();
  const admin = await Admin.findOne({ email });
  if (!admin) {
    console.error('Admin not found:', email);
    process.exit(1);
  }

  admin.password = password;
  await admin.save();
  console.log('Admin password updated for', email);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
