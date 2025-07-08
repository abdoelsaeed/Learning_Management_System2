const User = require('../models/user.Model');
const AppError = require('../error/err');
const catchAsync = require('../error/catchAsyn');

// Get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

// Get a single user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Update a user by ID (admin or self)
exports.updateUser = catchAsync(async (req, res, next) => {
  const updates = req.body;
  // Prevent password updates here
  if (updates.password || updates.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }
  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Update current user's own data (except password)
exports.updateMe = catchAsync(async (req, res, next) => {
  const updates = req.body;
  if (updates.password || updates.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // Handle photo upload if present
  if (req.file) {
    // If using Cloudinary
    if (typeof require !== 'undefined') {
      try {
        const cloudinary = require('../utils/cloudinary');
        const result = await cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'user-photos' },
          (error, result) => {
            if (error) return next(new AppError('Cloudinary upload failed', 500));
            updates.photo = result.secure_url;
          }
        );
        // Note: If using upload_stream, you need to pipe the buffer
        if (req.file.buffer) {
          const streamifier = require('streamifier');
          streamifier.createReadStream(req.file.buffer).pipe(result);
        }
      } catch (err) {
        // fallback: just save filename
        updates.photo = req.file.filename;
      }
    } else {
      // fallback: just save filename
      updates.photo = req.file.filename;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// Delete a user by ID (admin or self)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.status(204).json({ status: 'success', data: null });
});

// Delete current user's own account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user._id);
  res.status(204).json({ status: 'success', data: null });
});
