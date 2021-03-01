const mongoose = require('mongoose');
const student = new mongoose.Schema({
    name: {
    type: String,
    required: true,
    },
    rollno:{
    type: String,
    required: true,
    },
    email: {
    type: String,
    required: true,
    },
    password: {
    type: String,
    required: true,
    },
    status: {
    type: String,
    required: true,
    },
    requestTime:{ 
    type: String,
    },
    quartineStartTime:{
    type: String,
    },
    quartineEndTime:{
    type: String,
    },
    otp:{
    type: String,
    },
    room:{
    type: String,
    },
    hisotry:{
    type: Array
    },
    nextTest:{
      type: String,
    },
    emergencyStatus:{
    type: String,
    },
    emailStatus:{
    type: String,
    }
})
module.exports = mongoose.model('Student',student)