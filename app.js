/* 
   @author - Nagarjuna Yadav K
*/
var https = require('https');
var url = require('url');
var express = require( 'express');
var bodyParser = require('body-parser')
var app = express();
var mongoose = require('mongoose');
var csv = require('fast-csv');
var fileUpload = require('express-fileupload');
// var fs = require('fs');
var path = require('path');
// create application/json parser
var jsonParser = bodyParser.json();


//=== Point static path to app 
app.use(express.static(__dirname + '/app'));
//=== Read File Upload ======//
app.use(fileUpload());

//=== Get port from environment and store in Express.
var port  = process.env.PORT || 900;
app.listen(port, function () {
   console.log("Server Stated ======= in Port",port);
});

//======== Cors Orgin Request Set ========//
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, token,authKey, userid");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');    
    next();
});

//========== REST Api's  =============//

//========= DB Connection ==========//
mongoose.connect('mongodb://localhost/csvtest');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("DB is Connected Sucessfully");
});
//================ App Model Schema Defination Start============//
  var userSchema = mongoose.Schema({ name: String});
  var appSchema = mongoose.Schema({ name : String,
                                              version: String,
                                              vendor: String,
                                              installerType: String,
                                              os: String,
                                              packcageSourceName: String,
                                              path: String,
                                              filename: String,
                                              installedName: String,
                                              installedVersion: String
                                            });
//================ App Model Schema Defination End ============//
var csvrecords= [];
function addAppDetailToCollection(data){
   // console.log('data Each Record ==== ',data);
   var appModel = mongoose.model("csvrecord", appSchema);
   var appRecord = new appModel(data);
   appRecord.save().then(() => console.log('Saved')); 
  }

//========== File Upload Api =========//
app.post("/uploadCSV",function(req,res){
    if (!req.files)
        return res.status(400).send('No files were uploaded.');
    // var authorFile = req.files.file;
    csvFileRead(req.files.csvFile,res);
    console.log(req.files.csvFile.name);
});


function csvFileRead(uploadedFile,res){
  csvrecords= [];
  var csvStream = csv
    .fromString(uploadedFile.data.toString(),{
      headers:[
        "name",
        "version",
        "vendor",
        "installerType",
        "os",
        "packcageSourceName",
        "path",
        "filename",
        "installedName",
        "installedVersion"
      ],
      ignoreEmpty: true
    })
    .on("err",function(err){
      console.log('error',err);
      // res.send('Error reading through the file');
    })
    .on("data",function(data){ 
      ///============= Adding to DB ==========// 
      //========== Push Records in DB and Ignore Headers=======//
      if(!(data.name === "name: String")){
         csvrecords.push(data); 
         addAppDetailToCollection(data)
       }
    })
    .on("end",function(){
      // console.log("Finished reading through the file");
      res.send(csvrecords.length + ' have been successfully uploaded.');
    });
}