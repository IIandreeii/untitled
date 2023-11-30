const express = require('express');
const router = express.Router();

const passport= require('passport');
const {isNotLoggedIn} = require('../lib/auth');


router.get('/signup',isNotLoggedIn,(req,res)=>{
    res.render('auth/signup');
});

router.post('/signup', passport.authenticate('local.signup',{
    successRedirect : '/profile',
    failureRedirect : 'signup',
    failureFlash: true
}));

router.get('/signin',isNotLoggedIn, (req, res)=>{
    res.render('auth/signin');
});

router.post('/signin',isNotLoggedIn, (req, res, next)=>{
    passport.authenticate('local.signin',{
        successRedirect: '/profile',
        failureRedirect: '/signin',
        filureFlash: true
    })(req, res, next);
});


router.get('/logout',(req,res)=>{
    if(req.user){
        req.logout(function(err){
            if(err) {return next(err);}
            res.redirect('signin');
        });
    }else{
        res.redirect('signin')
    }
});


router.get('/profile', (req, res)=>{
    if(req.user){
        if(req.user.id==2){
            res.render('profile')
        }else{
            res.redirect('profilesP')
        }
    }else{
        res.redirect('signin')
    }
});

router.get('/profilesP', (req, res)=>{
    if(req.user){
        res.render('profilesP')
    }else{
        res.redirect('signin')
    }
});

module.exports= router;