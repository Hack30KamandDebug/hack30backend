var express = require('express');
var app = express();
const mongoose = require('mongoose');
const bodyParser  = require('body-parser');
//Routes

import Admin from './Models/admin';
import Student from './Models/students';
import Room from './Models/room';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
    res.send('Hello World!');
});
app.post('/addStudent',async function(req,res) {
  
    let result = await Student.find({rollno:req.body.rollno});
    let ress = {
        statusCode : 402,
        error: "Roll no. already Added"
    }
    res.json(ress);

    result = await Student.find({email:req.body.email});
    let ress = {
        statusCode : 402,
        error: "email already Added"
    }
    res.json(ress);

    const student = new Student({
        "name": req.body.name,
        "email": req.body.email,
        "password": req.body.password,
        "rollno": req.body.rollno,
        "phone_number": req.body.phone_number,
        "status": "pending",
        "requestTime": new Date(),
        "emergencyStatus": req.body.emergencyStatus
  });
  student.save().then(val => {
    res.json({ msg: "Student Added Successfully", val: val })
  })
})

app.post('/updateAdmin',async function(req,res) {

    let result = await Admin.update({},{
        "name": req.body.name,
        "email": req.body.email,
        "password": req.body.password,
        "phone_number": req.body.phone_number,
    })
    res.json(result);
  })


  app.get('/getListOfWaitingStudent',async function(req,res) {
    let result = await Student.find({"status":"pending"});
    res.json(result);
  })


  app.post('/addRoom',async function(req,res) {
    
    let result = await Room.find({number:req.body.number,hostel:req.body.hostel});
    if(result.length===0)
    {
        const room = new Room({
            "hostel":req.body.hostel,
            "number": req.body.number,
            "status": req.body.status
        });
        room.save().then(val => {
        res.json(val);
        })
    }
    else
    {
        let ress = {
            statusCode : 402,
            error: "Room already Added"
        }
        res.json(ress);
    }
  })
//Database
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
mongoose.connection.once('open',function(){
    console.log('Database connected Successfully');
}).on('error',function(err){
    console.log('Error', err);
})
app.listen(8000, function () {
    console.log('Listening to Port 8000');
});