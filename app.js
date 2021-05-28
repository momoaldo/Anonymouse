


//jshint esversion:6


require('dotenv').config();


const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const saltRounds=10;
const session = require('express-session');
const passport =require("passport");
const passportLocalMongoose =require("passport-Local-Mongoose");
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
//
//const bcrypt = require("bcrypt");


const app = express();
console.log(process.env.API_KEY);
app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
secret :"our little secrate.",
resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

//connect to mongose
mongoose.connect("mongodb://localhost:27017/userdb",{useNewUrlParser:true});
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email : String ,
  password : String,
  googleid: String,
  secret : String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



//new usermodel
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
     passReqToCallback   : true,
   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] })
);
app.get('/auth/google/secrets', passport.authenticate('google', {failureRedirect: '/login'}), function(req, res)  {
    res.redirect('/secrets');
});
app.get("/",function (req,res){
  res.render("home");
});
app.get("/login",function (req,res){
  res.render("login");

});app.get("/register",function (req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({'secret': {$ne: null}}, function(err, foundUsers) {
         if(err) {
             console.log(err);
         } else {
             if (foundUsers) {
                 console.log(foundUsers);
                 res.render('secrets', {usersWithSecrets: foundUsers});
             }
         }
     });
});

app.get('/submit', function(req, res)  {
    if (req.isAuthenticated()){
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

app.post('/submit', function(req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            foundUser.secret = submittedSecret;
            foundUser.save(function() {
                res.redirect('/secrets');
                console.log(foundUser.secret);
            });
        }
    });
    User.findOneAndUpdate({_id: req.user.id}, {});
});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});
////////////////////////////////
app.post("/register",function (req,res){
  User.register({username :req.body.username},req.body.password,function(err,user){
    if (err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate ("local")(req,res,function(){
      res.redirect("/secrets");
     });
      }


   });


  });
//  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      // Store hash in your password DB.
//      const newUser = new User({

//        email :req.body.username,
//        password:hash
//      });
//      newUser.save(function(err) {
//                   if(err) {
  //                    console.log(err);
//                   } else {
//                     res.render('secrets');
//                  }
  //    });

//  });




app.post('/login', function(req, res)  {
const user = new User ({
  username : req.body.username,
  password : req.body.password

});
req.login(user,function(err){
  if(err){
    console.log(err);
  }else{
    passport.athenticate("local ")(req,res,function(){
      res.redirect("/secrets");
    });
  }
});
   });
  //  const username = req.body.username;
//    const password = req.body.password;

  //   User.findOne({email: username}, function(err, result) {
    //     if(err) {
  //           console.log(err);
  //      } else {

    //        if(result) {
      //        bcrypt.compare(req.body.password, result.password, function(err, correct) {
    //                  bcrypt.compare(password, result.password, function(err, newresult) {
    //                    if (newresult === true){
      //                    res.render('secrets');
//
    //                    }


    //                     console.log(result);
    //                 } else {
    //                     res.send("Incorrect username or password");
    //                 }
    //             });
    //         } else {
    //             res.send("Incorrect username or password");
  //});

  //       }
  //     }
//     });




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
