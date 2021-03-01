var express = require('express');
var app = express();
const mongoose = require('mongoose');
const bodyParser  = require('body-parser');
//Routes
var validator = require('validator');
require('dotenv').config();
const config = {
  region: global.secretEnv.REGION,
  accessKeyId: global.secretEnv.SNS_ACCESS_KEY_ID,
  secretAccessKey: global.secretEnv.SNS_SECRET_ACCESS_KEY
}
var AWS = require('aws-sdk');
const sns = new AWS.SNS(config)
const ses =  new AWS.SES(config);

import Admin from './Models/admin';
import Student from './Models/students';
import Room from './Models/room';
import validator from 'validator';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
    res.send('Hello World!');
});

function getSenderEmail() 
{
  return new Promise(resolve =>{
    let result = await Admin.find({});
    if(result.length!==0)
    {
        resolve(result.email);
    } 
  })
}

app.post('/addStudent',async function(req,res) {
  
    let result = await Student.find({rollno:req.body.rollno});
    if(result.length!==0)
    {
        let ress = {
            statusCode : 401,
            error: "Roll no. already Added"
        }
        res.json(ress);
    }
    console.log(result);
    
    const student = new Student({
        "name": req.body.name,
        "email": req.body.email,
        "password": req.body.password,
        "rollno": req.body.rollno,
        "status": "pending",
        "requestTime": new Date(),
        "emergencyStatus": req.body.emergencyStatus
    });

    let senderEmail = await getSenderEmail();
    let message = {
        templateName: "StudentSignUp",
        name:student.name,
        email:student.email,
        userid:student.userid,
        password:student.password,
        url:process.secret.STUDENT_NOTIFICATION_URL,// should define in .env
        senderEmail:senderEmail
    }
    var params = 
    {
        Message: JSON.stringify(message), 
        TopicArn: process.secret.STUDENT_SIGNUP_SUCCESS_TOPIC,
        Subject:"sending message"
    };

    
    student.save().then(val => {
        res.json({ msg: "Student Added Successfully", val: val })
    })
})

app.post('/updateAdmin',async function(req,res) {

    if(!validator.isEmail(req.body.email))
    {
        let ress = {
            statusCode : 402,
            error: "Email is not valid"
        }
        res.json(ress);
    }
    
    let result = await Admin.updateOne({},{
        "name": req.body.name,
        "email": req.body.email,
        "password": req.body.password,
        "phone_number": req.body.phone_number,
    })
    var status="a";
    var checkEmailPromise = ses.getIdentityVerificationAttributes({Identities: [req.body.email]}).promise();
    // Handle promise's fulfilled/rejected states
    checkEmailPromise.then(function(data) 
    {
    var email =req.body.email;
    console.log(data);
    if(data.VerificationAttributes[email]!==undefined)
    {
        status=data.VerificationAttributes[email].VerificationStatus;
        console.log(status);
    }
    if(status==="Success")
    {
    }
    else
    {
        var verifyEmailPromise = ses.verifyEmailIdentity({EmailAddress: req.body.email}).promise();

        // Handle promise's fulfilled/rejected states
        verifyEmailPromise.then(
        function(data) {
            console.log("Email verification initiated");
            }).catch(
            function(err) {
            console.error(err, err.stack);
        });
    }
    }).catch(
    function(err) {
        console.error(err, err.stack);
    });
    res.json(result);
})


app.get('/StudentAddedInWaiting',async function(req,res) {
    let result = await Student.updateOne({rollno:req.body.rollno},{status:"waiting",emergencyStatus:req.body.emergencyStatus});
    res.json(result);
})


app.get('/getListOfWaitingStudent',async function(req,res) {
    let result = await Student.find({status:"waiting"});
    res.json(result);
})

app.post('/sendEmail', async function(res,req){
    if(!validator.isEmail(req.body.email))
    {
        let ress = {
            statusCode : 402,
            error: "Email is not valid"
        }
        res.json(ress);
    }
    function generatePassword() {
        var length = 6,
            charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }
    let password = generatePassword();
    let message = {
        templateName: "StudentLogin",
        name:req.body.name,
        email:req.body.email,
        password:password,
        url:process.secret.STUDENT_URL,// should define in .env
        senderEmail:senderEmail
    }
    var params = 
    {
        Message: JSON.stringify(message), 
        TopicArn: process.secret.STUDENT_SIGNUP_SUCCESS_TOPIC,
        Subject:"sending message"
    };
    var status="a";
    var checkEmailPromise = ses.getIdentityVerificationAttributes({Identities: [req.body.email]}).promise();
    // Handle promise's fulfilled/rejected states
    checkEmailPromise.then(function(data) 
    {
    var email =req.body.email;
    console.log(data);
    if(data.VerificationAttributes[email]!==undefined)
    {
        status=data.VerificationAttributes[email].VerificationStatus;
        console.log(status);
    }
    if(status==="Success")
    {
        sns.publish(params, function(err, data) {
            if (err) console.log(err, err.stack); 
            else console.log(data);
        });
    }
    else
    {
        var verifyEmailPromise = ses.verifyEmailIdentity({EmailAddress: req.body.email}).promise();

        // Handle promise's fulfilled/rejected states
        verifyEmailPromise.then(
        function(data) {
            console.log("Email verification initiated");
            }).catch(
            function(err) {
            console.error(err, err.stack);
        });
        setTimeout(function()
        {
        sns.publish(params, function(err, data) {
            if (err) console.log(err, err.stack); 
            else console.log(data);
        });
        }, 120000);
    }
    }).catch(
    function(err) {
        console.error(err, err.stack);
    });
})
app.post('/loginStudent', async function(res,req){
    if(!validator.isEmail(req.body.email))
    {
        let ress = {
            statusCode : 402,
            error: "Email is not valid"
        }
        res.json(ress);
    }

    let result = await Student.find({'email':req.body.email,password:req.body.password});
    if(result.length===0)
    {
        let ress = {
            statusCode : 403,
            error: "Authentication Failed"
        }
        res.json(ress);
    }
    else
    {
        let ress = {
            statusCode : 200,
            result: "UserLoginSuccess"
        }
        res.json(ress);
    }
})

app.post('/loginAdmin', async function(res,req){
    if(!validator.isEmail(req.body.email))
    {
        let ress = {
            statusCode : 402,
            error: "Email is not valid"
        }
        res.json(ress);
    }

    let result = await Admin.find({'email':req.body.email,password:req.body.password});
    if(result.length===0)
    {
        let ress = {
            statusCode : 403,
            error: "Authentication Failed"
        }
        res.json(ress);
    }
    else
    {
        let ress = {
            statusCode : 200,
            result: "UserLoginSuccess"
        }
        res.json(ress);
    }
})

app.post('/addRoom',async function(req,res) 
{
    let result = await Room.find({number:req.body.number,hostel:req.body.hostel});
    if(result.length===0)
    {
        const room = new Room({
            "hostel":req.body.hostel,
            "number": req.body.number,
            "status": "available"
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
mongoose.connect('mongodb+srv://2701gouravgoel:abcd@cluster0.a6n1c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true});
    mongoose.connection.once('open',function(){
        console.log('Database connected Successfully');
    }).on('error',function(err){
    console.log('Error', err);
})

app.listen(8000, function () {
    console.log('Listening to Port 8000');
});