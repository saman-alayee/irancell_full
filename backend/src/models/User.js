const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    nationalId: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    secondMobile: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ mobile: 1 });
userSchema.index({ nationalId: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
