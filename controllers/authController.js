const { promisify } = require('util');
const catchAsync = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // This will allow only the data that we need that user can put
    // In this way he can't but himself an admin
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordconfirm: req.body.passwordconfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // equal to req.body.email/,password

  //1) Check if email and password is correct [بيشوف انت حطيت اميل وباص ولا لا اصلا ف الاول ويخش علي المرحله الي بعدها ]
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2) Check if user exists and password is correct [بيشوف لو الايميل متسجل اصلا والباص صح ]
  const user = await User.findOne({ email }).select('+password'); // we do the select casue we made password hidden in the db

  // if the didn't find user so he won't run the next code to check the password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invaild email or password', 401));
  }
  //3) If everything is okay send token to clinet [كلو تمام خلاص دخلو وابعت التوكين انو vaild ]
  const token = signToken(user._id); //payload is user._id
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // هنا علشان ناخد الجزء بتاع التوكين بس من غير bearer وحطيناها في arrary
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access', 401),
    );
  }
  // 2) Verification The Token
  const accessToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );
  //console.log(decoded);

  // 3) Check if user still exists
  const FreshUser = await User.findById(accessToken.id); // [التوكين دا فيه يوزر برقم ٣٤٥ ولكن اليوزر دا اتمسح هو هيشوف بقي هو لسه موجود ولا لh]
  if (!FreshUser) {
    return next(
      new AppError('The token for this user does no longer exists!', 401),
    );
  }

  // 4) Check if user changed the password after the token was issued
  if (FreshUser.ChangedPasswordAfter(accessToken.iat)) {
    return next(new AppError('The user recently changed the password !'));
  }
  next();
});