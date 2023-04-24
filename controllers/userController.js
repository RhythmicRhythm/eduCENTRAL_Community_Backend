const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { phone, email, password } = req.body;

  // Validation
  if (!phone || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create new user
  const user = await User.create({
    email,
    phone,
    password,
    addedBy: null,
    members: []
  });

  //   Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const {
      _id,
      firstname,
      lastname,
      phone,
      isAdmin,
      email,
      password,
      photo,
      gender,
      addedBy,
      marital_status,
      dob,
      
    } = user;
    res.status(200).json({
      _id,
      firstname,
      lastname,
      phone,
      email,
      password,
      isAdmin,
      photo,
      gender,
      addedBy,
      marital_status,
      dob,
     
      members: user.members,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // User exists, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //   Generate Token
  const token = generateToken(user._id);

  // Send HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    const {
      _id,
      firstname,
      lastname,
      phone,
      email,
      password,
      isAdmin,
      photo,
      gender,
      members,
      addedBy,
      marital_status,
      dob,
    } = user;
    res.status(200).json({
      _id,
      firstname,
      lastname,
      phone,
      email,
      password,
      isAdmin,
      photo,
      gender,
      members,
      addedBy,
      marital_status,
      dob,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

//Add Members
const addMember = asyncHandler(async (req, res) => {
  const { email } = req.body;

    // Validate Request
    if (!email ) {
      res.status(400);
      throw new Error("Please add an email");

    }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // Check if user is already a member
  if (req.user.members.includes(user._id)) {
    res.status(400);
    throw new Error("User is already a member");
  }

  if(user){
    // Add the user as a member 
   req.user.members.push(user._id);
   

   //updated addedBy
   user.addedBy = req.user._id;

   // Save the changes
  await Promise.all([req.user.save(), user.save()]);


 res.status(200).json({ message: "Member added successfully" });
  }else {
    res.status(400);
    throw new Error("err adding member");
  }

});

// Get members 
const getMembers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate('members', 'firstname lastname email phone photo');

  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  res.status(200).json({ members: user.members });
});

// Generate link for adding members
const generateLink = asyncHandler(async (req, res) => {
 

  // Check if admin exists
  // const admin = await User.findById(userId);
  const admin = await User.findById(req.params.id)

  if (!admin) {
    res.status(404);
    throw new Error("User not found");
  }

  // Generate unique link
  const link = crypto.randomBytes(20).toString("hex");

  // Save link to admin's record
  admin.addMemberLink = link;
  await admin.save();

  res.status(200).json({
    message: "Link generated successfully",
    link,
  });
});

// Add member using link
const addMemberByLink = asyncHandler(async (req, res) => {
  const { link } = req.params;

  // Check if link exists
  const admin = await User.findOne({ addMemberLink: link });

  if (!admin) {
    res.status(404);
    throw new Error("Link not found");
  }

  // Check if user is already a member
  const user = await User.findById(req.user._id);

  if (admin.members.includes(user._id)) {
    res.status(400);
    throw new Error("User is already a member");
  }

  // Add user to admin's team
  admin.members.push(user._id);
  user.addedBy = admin._id;

  await Promise.all([admin.save(), user.save()]);

  res.status(200).json({
    message: "Member added successfully",
  });
});


// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { firstname, lastname, phone, email, isAdmin, photo, gender, marital_status, dob } =
      user;

    user.email = email;
    user.firstname = req.body.firstname || firstname;
    user.lastname = req.body.lastname || lastname;
    user.phone = req.body.phone || phone;
    user.isAdmin = req.body.isAdmin || isAdmin;
    user.gender = req.body.gender || gender;
    user.photo = req.body.photo || photo;
    user.dob = req.body.dob || dob;
    user.marital_status = req.body.marital_status || marital_status;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      photo: updatedUser.photo,
      isAdmin: updatedUser.isAdmin,
      phone: updatedUser.phone,
      dob: updatedUser.dob,
      gender: updatedUser.gender,
      marital_status: updatedUser.marital_status,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id,  firstname,
      lastname,
      phone,
      email,
      photo,
      isAdmin,
      gender,
      dob,
      marital_status } = user;
    res.status(200).json({
      _id,
      firstname,
      lastname,
      phone,
      email,
      photo,
      isAdmin,
      gender,
      dob,
      marital_status,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

//Change Password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

//Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reste Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>  
        <p>This reset link is valid for only 30minutes.</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        <p>Regards...</p>
        <p>eduCentral Team</p>
      `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  loginStatus,
  addMember,
  addMemberByLink,
  generateLink,
  getMembers,
  getUser,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
