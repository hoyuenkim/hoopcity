require('./removeByValue')();

module.exports = function(io) {
  var userList = [];
    io.on('connection', function(socket){
      //io.on('connection', fucntion(socket){ ... 이것 약속임
        // var session = socket.request.session.passport;
        // var user = (typeof session !== 'undefined') ? (session.user) : "";
        //
        // if(userList.indexOf(user.displayname) === -1 ){
        //   userList.push(user.displayname);
        // }
        // io.emit('join', userList);

        //사용자 명과 메세지를 같이 반환한다
        socket.on('client message', function(data){
            io.emit('server message',
            {message : data.message,
            displayname : user.displayname });
        });
        socket.on('disconnect', function(){
        userList.removeByValue(user.displayname);
        io.emit('leave', userList);
      });
    });
};
