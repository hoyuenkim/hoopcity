module.exports = function(req, res, next) {
    if (!req.isAuthenticated()){
        res.redirect('/accounts/login');
    }else{
        if(req.user.status < 2){
            res.send('<script>alert("팀장만이 접근가능합니다.");history.back();</script>');
        }else{
            return next();
        }
    }
};
