const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
   
    firstname: {
      type: String,
      required: [true, "Please add a firstname"],
      default: "Na",
    },
    lastname: {
      type: String,
      required: [true, "Please add a lastname"],
      default: "Na",
    },
    email: {
      type: String,
      required: [true, "Please add a email"],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid emaial",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please add a phoneNumber"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password must be up to 6 characters"],
      // maxLength: [23, "Password must not be more than 23 characters"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
      photo: {
      type: String,
      required: [true, "Please add a photo"],
      default: "https://api.lorem.space/image/face?w=120&h=120&hash=bart89fe",
    },
    gender: {
      type: String,
      required: [true, "please add your gender"],
      default: "na"
    },
    marital_status: {
      type: String,
      required: [true, "please add marital status"],
      default: "single",
    },
    dob: {
      type: String,
      required: [true, "date of birth"],
      default: "NA"
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }

  },
  {
    timestamps: true,
  }
);

//   Encrypt password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;