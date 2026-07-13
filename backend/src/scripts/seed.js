require('dotenv').config();
const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Number = require('../models/Number');
const Discount = require('../models/Discount');

const seed = async () => {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      email: adminEmail,
      password: adminPassword,
      name: 'مدیر سیستم',
    });
    console.log('Admin created:', adminEmail);
  } else {
    console.log('Admin already exists, password unchanged:', adminEmail);
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany([
      {
        title: 'مودم 4G ایرانسل TD-LTE 350',
        slug: 'modem-td-lte-350',
        description: 'مودم پرسرعت 4G ایرانسل با پوشش گسترده',
        price: 2500000,
        stock: 50,
        images: [],
        category: 'modem',
      },
      {
        title: 'مودم 4G ایرانسل TD-LTE 711',
        slug: 'modem-td-lte-711',
        description: 'مودم حرفه‌ای 4G با قابلیت WiFi',
        price: 3200000,
        stock: 30,
        images: [],
        category: 'modem',
      },
      {
        title: 'سیم‌کارت دیتا ایرانسل',
        slug: 'sim-data',
        description: 'سیم‌کارت دیتا با بسته اینترنت رایگان',
        price: 150000,
        stock: 100,
        images: [],
        category: 'accessory',
      },
    ]);
    console.log('Sample products created');
  }

  const numberCount = await Number.countDocuments();
  if (numberCount === 0) {
    const sampleNumbers = [
      { number: '09001071252', price: 15000000, status: 'available' },
      { number: '09001234567', price: 8500000, status: 'available' },
      { number: '09009876543', price: 12000000, status: 'available' },
      { number: '09001111111', price: 50000000, status: 'available' },
      { number: '09002222222', price: 7500000, status: 'sold' },
    ];
    await Number.insertMany(sampleNumbers);
    console.log('Sample numbers created');
  }

  const discountCount = await Discount.countDocuments();
  if (discountCount === 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Discount.create({
      code: 'IRANCELL10',
      type: 'percent',
      value: 10,
      minOrderAmount: 1000000,
      expiresAt,
      showTimer: true,
      isActive: true,
    });
    console.log('Sample discount created');
  }

  console.log('Seed completed');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
