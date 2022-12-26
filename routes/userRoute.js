const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
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


router.post('/get-user-info-by-id', authMiddleware ,async (req , res)=>{
   try {
    const user = await User.findOne({ _id : req.body.userId})
    if(!user){
      return res.status(200).send({ message : "User Does not exist", success : false})
    }else{
      return res.status(200).send({success  : true, data : {
        name : user.name,
        email : user.email
      }})
    }
   } catch (error) {
      res.status(500).send({ message : "Error While getting user info", success : false, error})
   }
})
module.exports = router;
