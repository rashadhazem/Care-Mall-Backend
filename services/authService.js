const crypto = require('crypto');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Otp = require('../models/OTP');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const {sendMail} = require('../utils/Emails');
const {createToken} = require('../utils/createToken');
const {sanitizeUser} = require('../utils/SanitizeUser');
const PasswordResetToken=require('../models/PasswordResetToken');
const User = require('../models/userModel');
const {generateOTP}=require('../utils/GenerateOtp');
// @desc    Signup
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
 try{
    const { name, email, password ,role} = req.body;

    const existingUser=await User.findOne({email})
     if(existingUser){
            return res.status(400).json({"message":"User already exists"})
        }
        
      const createdUser=new User(req.body)
       if(role==='admin'){
        createdUser.role='admin'
        createdUser.isAdmin = true;
       }
       createdUser.isVerified=false;
        await createdUser.save()

        const otp=generateOTP();
        const otpExpiresAt=Date.now() + 10 * 60 * 1000; // otp valid for 10 minutes

        const OTP = new Otp({
            user: createdUser._id, 
            otp: await bcrypt.hash(otp,10),
            expiresAt: otpExpiresAt
        });

        await OTP.save()

        await sendMail(email,
          `OTP Verification for Your Ecommerce Account`
          ,`Your One-Time Password (OTP) for account verification is: <b>${otp}</b>.</br>Do not share this OTP with anyone for security reasons`)

        // creating new user
         
        res.status(201).json({
           message: 'User registered. Please verify your email.' });
 }
 catch(error){
  console.log(error);
        res.status(500).json({message:"Error occured during signup, please try again later"})
 }
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
 try{
    // checking if user exists or not
        const existingUser=await User.findOne({email:req.body.email})
         
        const passCorrect = existingUser ? await bcrypt.compare(req.body.password, existingUser.password) : false;
         console.log("pass correct",passCorrect)
        if(existingUser && passCorrect ){
           
           if(!existingUser.isVerified){
            return  res.status(401).json({message:"User is not verified, please verify your email"})
           }
            // getting secure user info
            const secureInfo=sanitizeUser(existingUser)
             
            // generating jwt token
            const token=createToken(secureInfo)
           
            // sending jwt token in the response cookies
            res.cookie('token',token,{
                sameSite:process.env.PRODUCTION==='true'?"None":'Lax',
                maxAge: parseInt(process.env.COOKIE_EXPIRATION_DAYS) * 24 * 60 * 60 * 1000,
                httpOnly:true,
                secure:process.env.PRODUCTION==='true'?true:false
            })
            return res.status(200).json({user:secureInfo,token})
        }
       
        res.clearCookie('token');
        return res.status(401).json({message:"Invalid Credentails"})
 }
 catch(error){
       console.log(error);
        res.status(500).json({message:'Some error occured while logging in, please try again later'})
    }
});


exports.verifyOtp = asyncHandler(async (req,res,next)=>{
    try {
        const { email, otp } = req.body;
        // checks if user id is existing in the user collection
        const isValidUser=await User.findOne({email})

        // if user id does not exists then returns a 404 response
        if(!isValidUser){
            return res.status(404).json({message:'User not Found, for which the otp has been generated'})
        }
        if(isValidUser.isVerified){
            return res.status(400).json({message:"User is already verified"})
        }
        // checks if otp exists by that user id
        const isOtpExisting=await Otp.findOne({user:isValidUser._id})
            
        // if otp does not exists then returns a 404 response
        if(!isOtpExisting){
            return res.status(404).json({message:'Otp not found'})
        }

        // checks if the otp is expired, if yes then deletes the otp and returns response accordinly
        if(isOtpExisting.expiresAt <  Date.now()){
            await Otp.findByIdAndDelete(isOtpExisting._id)
            return res.status(400).json({message:"Otp has been expired"})
        }
        
        // checks if otp is there and matches the hash value then updates the user verified status to true and returns the updated user
        if(isOtpExisting && (await bcrypt.compare(req.body.otp,isOtpExisting.otp))){
            await Otp.findByIdAndDelete(isOtpExisting._id)
            const verifiedUser=await User.findByIdAndUpdate(isValidUser._id,{isVerified:true},{new:true})
            return res.status(200).json(sanitizeUser(verifiedUser))
        }
         
        // in default case if none of the conidtion matches, then return this response
        return res.status(400).json({message:'Otp is invalid or expired'})


    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Some Error occured"})
    }
});

exports.resendOtp=asyncHandler(async (req,res,next)=>{
    try { 
      
        const existingUser=await User.findOne({email:req.body.email})

        if(!existingUser){
            return res.status(404).json({"message":"User not found"})
        }

        await Otp.deleteMany({user:existingUser._id})

        const otp=generateOTP()
        const hashedOtp=await bcrypt.hash(otp,10)

        const newOtp=new Otp({user:existingUser._id,otp:hashedOtp,expiresAt:Date.now()+parseInt(process.env.OTP_EXPIRATION_TIME)})
        await newOtp.save()

        await sendMail(existingUser.email,`OTP Verification for Your E-commerce App Account`,`Your One-Time Password (OTP) for account verification is: <b>${otp}</b>.</br>Do not share this OTP with anyone for security reasons`)
  
        res.status(201).json({'message':"OTP sent"})
    } catch (error) {
        res.status(500).json({'message':"Some error occured while resending otp, please try again later"})
        console.log(error);
    }
});

// @desc   make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exist, if exist get
  let token;
  const authHeader = req.headers.authorization;
  // 1) Check header
  if (!authHeader) {
    return next(
      new ApiError(
        'You are not logged in, please login to get access this route',
        401
      )
    );
  }
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return next(
      new ApiError(
        'Invalid authorization format, expected Bearer token',
        401
      )
    );
  }
  token = authHeader.split(' ')[1];
  if (!token) {
    return next(
      new ApiError(
        'You are not login, Please login to get access this route',
        401
      )
    );
  }
  console.log("req body is :",req.body);
  // 2) Verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  console.log("DECODED TOKEN:", decoded);
  // 3) Check if user exists
  const currentUser = await User.findById(decoded._id);
  if (!currentUser) {
    return next(
      new ApiError(
        'The user that belong to this token does no longer exist',
        401
      )
    );
  }

  // 4) Check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // Password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          'User recently changed his password. please login again..',
          401
        )
      );
    }
  }

  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
// ["admin", "manager"]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You are not allowed to access this route', 403)
      );
    }
    next();
  });

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  // 2) If user exist, Generate hash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  // 3) Send the reset code via email
  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    console.log("i'm here",user.email)

    await sendMail(
       user.email,
       'Your password reset code (valid for 10 min)',
      message,
    );
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError('There is an error in sending email', 500));
  }

  res
    .status(200)
    .json({ status: 'Success', message: 'Reset code sent to email' });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await User.findOne({
    email: req.body.email,
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError('Reset code invalid or expired', 400));
  }

  // 2) Reset code valid
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: 'Success',
  });
});

// @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }
  // 3) Update password
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();

  // 3) if everything is ok, generate token
  const token = createToken(sanitizeUser(user));
  res.status(200).json({ token });
});

exports.logout=async(req,res)=>{
    try {
        res.clearCookie('token',{
    
            sameSite:process.env.PRODUCTION==='true'?"None":'Lax',
            httpOnly:true,
            secure:process.env.PRODUCTION==='true'?true:false
        })
        res.status(200).json({message:'Logout successful'})
    } catch (error) {
        console.log(error);
    }
}
exports.checkAuth=async(req,res)=>{
    try {
      const user=await User.findById(req.user._id)
        if(req.user){
            return res.status(200).json(sanitizeUser(user))
        }
      if (!user) return res.sendStatus(401);
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
}
