const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "You must put the code"],
      unique: true,
      trim: true,
    },
    expireDate: {
      type: Date,
      required: [true, "You must put the discount"],
    },
    discount: {
      type: Number,
      required: [true, "You must put the discount"],
      min: [0, "the discount must be bigger than 0"],
    },
    maxUses: {
      type: Number,
      default: 0,
      min: [0, "max uses must be bigger than or equal to 0"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "used count must be bigger than or equal to 0"],
    },
    //if instractor want to create a coupon for specific course
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null إذا كان الكوبون عامًا
    },
  },
  {
    timestamps: true,
  }
);
couponSchema.pre("save", function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});
couponSchema.pre(/^find/, function (next) {
  // استبعد الكوبونات المنتهية أو التي استُهلكت بالكامل
  this.where({
    expireDate: { $gt: new Date() },
    $expr: { $lt: ["$usedCount", "$maxUses"] },
  });
  next();
});
const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;