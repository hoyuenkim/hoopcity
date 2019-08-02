var ProfileModel = require('../models/ProfileModel');

module.exports = function(req, res, next) {
  ProfileModel.find({username : req.user.username}, function(err, profile){
    if(!profile){
      res.send('<script>alert("you have to regist your profile!");location.href="/accounts/profile"</script>');
    } else {
      return next();
    }
  })
};
