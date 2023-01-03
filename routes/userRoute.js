const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require('../models/doctorModel');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      res.status(400).send({ message: "User already exists", success: false });
    }
    const password = req.body.password;

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    req.body.password = hashedPassword;

    const newuser = new User(req.body);

    await newuser.save();

    res
      .status(200)
      .send({ message: "User Created Successfully", success: true });
  } catch (error) {
    res.status(500).send({ message: "Error creating user", success: false });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(200).send({ message: "User Does Not Exist", success: false });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .status(200)
        .send({ message: "Login Successfully", success: true, data: token });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error Logging in ", success: false, error });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined
    if (!user) {
      return res
        .status(200)
        .send({ message: "User Does not exist", success: false });
    } else {
      return res
        .status(200)
        .send({ success: true, data: user });
    }
  } catch (error) {
    res
      .status(500)
      .send({
        message: "Error While getting user info",
        success: false,
        error,
      });
  }
});


router.post("/apply-doctor-account",authMiddleware,  async (req, res) => {
  try {
      const newdoctor = new Doctor({...req.body, status : 'pending'});
      await newdoctor.save();
      const adminUser = await User.findOne({ isAdmin: true});

      const unseenNotification = adminUser.unseenNotification

      unseenNotification.push({
        type : 'new-doctor-request',
        message :  `${newdoctor.firstName} ${newdoctor.lastName} has applied for a doctor account`,
        data : {
          doctorId : newdoctor._id,
          name: newdoctor.firstName + " " + newdoctor.lastName,
        },
        onClickPath: '/admin/doctors'
      })
      await User.findByIdAndUpdate(adminUser._id,{ unseenNotification });
      res.status(200).send({
        success: true,
        message : 'Doctor account applied successfully',
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error applying doctor account", success: false });
  }
});

router.post("/mark-all-notifications-as-seen",authMiddleware,  async (req, res) => {
  try {
     const user = await User.findOne({ _id : req.body.userId});
     const unseenNotification = user.unseenNotification;
     const seenNotification = user.seenNotification;
    //  user.seenNotification = unseenNotification;
     seenNotification.push(...unseenNotification);
     user.unseenNotification = [];
     user.seenNotification = seenNotification; 
     const updatedUser = await user.save();
    //   User.findByIdAndUpdate(user._id,user);
     updatedUser.password = undefined;
     res.status(200).send({
      success : true,
      message : "All notification marked as seen",
      data : updatedUser,
     });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error", success: false });
  }
});


router.post("/delete-all-notifications",authMiddleware,  async (req, res) => {
  try {
     const user = await User.findOne({ _id : req.body.userId});
    user.seenNotification = [];
    user.unseenNotification = [];
    const updatedUser = await user.save();
    // const updatedUser = await User.findByIdAndUpdate(user._id,user);
    updatedUser.password = undefined;
     res.status(200).send({
      success : true,
      message : "All notifications deleted successfully",
      data : updatedUser,
     });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error", success: false });
  }
});

module.exports = router;
