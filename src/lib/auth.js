module.exports={
    isNotLoggedIn(req,res,next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/profile');
    },


    isLogin(req,res,next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/profile');
    },

    isAdmin(req, res, next){
        if(req.isAuthenticated()){
            if(req.user.id == 2){
                return next();
            }else
            {
                res.redirect('/Products/publico')
            }
        }
        res.redirect('/signin')
    }

};
