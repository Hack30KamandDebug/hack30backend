var express = require('express');
var app = express();
const mongoose = require('mongoose');
const bodyParser  = require('body-parser');
//Routes
var validator = require('validator');
const nodeCron = require("node-cron")
require('dotenv').config();
const config = {
  region: process.env.REGION,
  accessKeyId: process.env.SNS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SNS_SECRET_ACCESS_KEY
}
var AWS = require('aws-sdk');
const sns = new AWS.SNS(config)
const ses =  new AWS.SES(config);

import Admin from './Models/admin';
import Student from './Models/students';
import Room from './Models/room';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
    res.send('Hello World!');
});

async function getSenderEmail() 
{
  return new Promise(async function(resolve){
    let result = await Admin.find({});
    console.log(result);
    if(result.length!==0)
    {
        resolve(result[0].email);
    } 
  })
}

nodeCron.schedule('* * * * *', async function() {
    console.log('running a task every minute');
    let rooms = await Room.find({status:"available"});
    let students =await  Student.find({status:"waiting"}).sort({requestTime: 1});
    //console.log(students);
    let senderEmaill = await getSenderEmail();
    for(let i=0;i<rooms.length;i++)
    {
        if(students.length>=i+1)
        {
            let result =await Room.updateOne({number:rooms[i].number,hostel:rooms[i].hostel},{status:"occupied",rollno:students[i].rollno});
            let result2 = await Student.updateOne({rollno:students[i].rollno},{status:"room_assigned",room:result._id});
            let message = {
                templateName: "StudentSignUp",
                name:students[i].name,
                email:students[i].email,
                hostel:rooms[i].hostel,
                number:rooms[i].number,
                senderEmail:senderEmaill
            }
            console.log(message);
            var params = 
            {
                Message: JSON.stringify(message), 
                TopicArn: process.env.STUDENT_SIGNUP_SUCCESS_TOPIC,
                Subject:"sending message"
            };
            console.log(students[i].name+" has benn alloted room no "+rooms[i].number+" of hostel "+rooms[i].hostel);
            sns.publish(params, function(err, data) {
                if (err) console.log(err, err.stack); 
                else console.log(data);
            });
        }
    }
});



nodeCron.schedule('* * * * *', async function() {

    let result = await Student.find({status:"quartine"});
    for(let i=0;i<result.length;i++)
    {
        if(result[i].quartineEndTime< new Date())
        {
            Room.findByIdAndUpdate(result[i].room,{status:"available"});
            Student.findByIdAndUpdate(result[i]._id,{status:"complete"});
            let senderEmaill = await getSenderEmail();
            let message = {
                templateName: "Complete",
                name:result.name,
                email:result.email,
                senderEmail:senderEmaill
            }
            console.log(message);
            var params = 
            {
                Message: JSON.stringify(message), 
                TopicArn: process.env.STUDENT_SIGNUP_SUCCESS_TOPIC,
                Subject:"sending message"
            };
            sns.publish(params, function(err, data) {
                if (err) console.log(err, err.stack); 
                else console.log(data);
            });
        }
    }
});


app.post('/StudentRequestToAdmin',async function(req,res) {
    let rr = await Student.find({rollno:req.body.rollno});
    if(rr[0].status!=="pending")
    {
        let ress = {
            statusCode:402
        }
        res.json(ress);
    }
    let result = await Student.updateOne({rollno:req.body.rollno},{status: "waiting request",reason:req.body.rollno});
    res.json({statusCode:200,result:result});
})


app.post('/StudentEntersInRoom',async function(req,res) {
    
    let result = await Student.updateOne({rollno:req.body.rollno},{quartineStartTime: new Date(),status:"quartine"});
    res.json(result);
})



app.post('/SignUpStudent',async function(req,res) {
  
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
    var verifyEmailPromise = ses.verifyEmailIdentity({EmailAddress: req.body.email}).promise();

    // Handle promise's fulfilled/rejected states
    verifyEmailPromise.then(
    function(data) {
        console.log("Email verification initiated");
        }).catch(
        function(err) {
        console.error(err, err.stack);
    });
    student.save().then(val => {
        res.json({statusCode:200, msg: "Student Added Successfully", val: val })
    })
})
app.post('/updateAdmin',async function(req,res) 
{
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


app.post('/StudentAddedInWaiting',async function(req,res) {
    console.log(req);
    let result = await Student.updateOne({rollno:req.body.rollno},{status:"waiting"});

    let senderEmaill = await getSenderEmail();
    let message = {
        templateName: "ApplicationApproved",
        name:result.name,
        email:result.email,
        senderEmail:senderEmaill
    }
    console.log(message);
    var params = 
    {
        Message: JSON.stringify(message), 
        TopicArn: process.env.STUDENT_SIGNUP_SUCCESS_TOPIC,
        Subject:"sending message"
    };
    sns.publish(params, function(err, data) {
        if (err) console.log(err, err.stack); 
        else console.log(data);
    });

    res.json({statusCode:200,result:result});
})



app.get('/getListOfWaitingRequestStudent',async function(req,res) {
    let result = await Student.find({status:"waiting request"});
    console.log(result);
    res.json(result);
})

app.get('/getListOfWaitingStudent',async function(req,res) {
    let result = await Student.find({status:"waiting"});
    res.json(result);
})

app.get('/updateTestStatus',async function(req,res) {
    let result = await Student.find({status:"waiting"});
    res.json(result);
})
app.get('/statusRoom',async function(req,res) {
    let result = await Room.find({status:"occupied"});
    let result2 = await Room.find({status:"available"});

    let r = {
        occupied:result,
        count:result2.length
    }
    res.json(r);
})


app.post('/testResult', async function(req,res){
    if(req.body.status==="positive")
    {
        
        let result = await Student.updateOne({rollno:req.body.rollno},{test:"positve"});
    }
    else
    {    
        let DateAfter =new Date();
        DateAfter.setDate( DateAfter.getDate() + 4);
        let result = await Student.updateOne({rollno:req.body.rollno},{quartineEndTime:DateAfter,test:"positve"});
    }
    let rr={
        statusCode:200
    }
    res.json(rr);
})


app.post('/loginStudent', async function(req,res){
    if(!validator.isEmail(req.body.email))
    {
        let ress = {
            statusCode : 402,
            error: "Email is not valid"
        }
        res.json(ress);
    }
    let result = await Student.find({'email':req.body.email,password:req.body.password});
    console.log(result);
    if(result.length===0)
    {
        let ress = {
            statusCode : 403,
            error: "Authentication Failed"
        }
        res.json(ress);
    }
    var checkEmailPromise = ses.getIdentityVerificationAttributes({Identities: [req.body.email]}).promise();
    // Handle promise's fulfilled/rejected states
    checkEmailPromise.then(function(data) 
    {
    var email =req.body.email;
    console.log(data);
    var status="ss";
    if(data.VerificationAttributes[email]!==undefined)
    {
        status=data.VerificationAttributes[email].VerificationStatus;
        console.log(status);
    }
    if(status==="Success")
    {
        let ress = {
            statusCode : 200,
            result: "UserLoginSuccess"
        }
        res.json(ress);
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
        
        let ress = {
            statusCode : 404,
            result: "EmailNotConfirm"
        }
        res.json(ress);
    }
    }).catch(
    function(err) {
        console.error(err, err.stack);
    });
})

app.post('/loginAdmin', async function(req,res){
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
        res.json({statusCode:200,value:val});
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
const PORT = process.env.PORT || 80;
app.listen(PORT, function () {
    console.log('Listening to Port 80');
});