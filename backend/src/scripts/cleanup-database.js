#!/usr/bin/env node
/**
 * Remove all data except admin accounts.
 * Run after taking a backup.
 */
require('dotenv').config({ path: process.argv[2] || '/var/www/irancell/backend/.env' });
const { connectDB } = require('../config/database');
const mongoose = require('mongoose');

const COLLECTIONS_TO_CLEAR = [
  'users',
  'orders',
  'payments',
  'otps',
  'numbers',
  'products',
  'discounts',
  'shopsettings',
];

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const adminCount = await db.collection('admins').countDocuments();

  for (const name of COLLECTIONS_TO_CLEAR) {
    const result = await db.collection(name).deleteMany({});
    console.log(`Cleared ${name}: ${result.deletedCount}`);
  }

  console.log(`Admins kept: ${adminCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
