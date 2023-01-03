const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res
      .status(200)
      .send({
        message: "Doctors Fetched Successfully",
        success: true,
        data: doctors,
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server Error", success: false });
  }
});


router.get("/get-all-users", authMiddleware, async (req, res) => {
    try {
      const users = await User.find({});
      res
        .status(200)
        .send({
          message: "Users Fetched Successfully",
          success: true,
          data: users,
        });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Server Error", success: false });
    }
  });


  router.post("/change-doctor-status", authMiddleware, async (req, res) => {
    try {
       const {doctorId, status , userId} = req.body;
       const doctor =await Doctor.findByIdAndUpdate(doctorId,{
        status,
       });

       const user = await User.findOne({_id:doctor.userId});
       const unseenNotification = user.unseenNotification

       unseenNotification.push({
         type : 'new-doctor-request-changed',
         message :  `Your doctor account has been ${status}`,
         onClickPath: '/notifications'
       })
       user.isDoctor = status ==='approved'  ? true : false; 
       await user.save();
    
       res.status(200).send({
        success : true,
        message : "Doctor Status Updated Successfully",
        data : doctor
       });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong", success: false });
    }
  });


  module.exports = router;
  
