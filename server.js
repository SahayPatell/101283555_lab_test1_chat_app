const app = require('express')()
const http = require('http').createServer(app)
const { Console } = require('console')
const cors = require('cors')
const PORT = 3000
const express = require('express');
const mongoose = require('mongoose');
const uModel = require(__dirname + '/models/User');
const groupModel = require(__dirname + '/models/GroupMessage');

const io = require('socket.io')(http)

app.use(cors()) 

users = []

io.on('connection', (socket) => {

  console.log('User Connected')
  
  socket.emit('welcome', 'Welcome to The Room -> ' + socket.id)

  socket.on('message', (data) => {

      if(data.room == '' || data.room==undefined){

          io.emit('newMessage', socket.id + ' : ' + data.message)

      }
      
      else{
        
        io.to(data.room).emit('newMessage', socket.id +' : ' + data.message)

        if(data.room=='news'||data.room=='covid'||data.room=='nodeJs'){

          const gm = new groupModel({from_user:socket.id,room:data.room,message:data.message});

          try {

            gm.save();

          } catch (err) {

            console.log(err);

          }

        }

      }

  })


  socket.on('newUser', (name) => {

      if(!users.includes(name)){

          users.push(name)

      }

      socket.id = name

  })


  socket.on('joinroom', (room) => {

      socket.join(room)

      roomName = room

      socket.currentRoom = room;

      const msg = groupModel.find({room: room}).sort({'date_sent': 'desc'}).limit(10);

      socket.msg=msg

  })

  socket.on("userTyping", (data) => {

    socket.broadcast.to(data.room).emit("chatUI", data.username);

  });
  
  socket.on('leaveRoom', () =>{

      socket.leave(socket.currentRoom);

      socket.currentRoom = null;

      console.log(socket.rooms);

  })

  socket.on('disconnect', () => {

      console.log(`${socket.id} disconnected`)

  })

})


app.use(

  express.urlencoded({

    extended: true

  })

)

app.use(express.json());

mongoose.connect('mongodb+srv://Sahay:admin123@cluster0.med58.mongodb.net/chatApp?retryWrites=true&w=majority', {

  useNewUrlParser: true,

  useUnifiedTopology: true

  }).then(success => {

    console.log('Mongdb connected')

  }).catch(err => {

    console.log('Mongodb connection Error')

  });

app.get('/signup', async (req, res) => {

  res.sendFile(__dirname + '/html/signup.html')

});

app.get('/login', async (req, res) => {

    res.sendFile(__dirname + '/html/login.html')

});

app.post('/login', async (req, res) => {

  const user = new uModel(req.body);

  try {

    await user.save((err) => {

      if(err){

          if (err.code === 11000) {

             return res.redirect('/signup?err=username')

          }
        
        res.send(err)

      }else{

        res.sendFile(__dirname + '/html/login.html')

      }

    });

  } catch (err) {

    res.status(500).send(err);

  }

});


app.get('/', async (req, res) => {

  res.sendFile(__dirname + '/html/index.html')

});

app.post('/', async (req, res) => {

  const username=req.body.username

  const password=req.body.password

  const user = await uModel.find({username:username});

  try {

    if(user.length != 0){

      if(user[0].password==password){

        return res.redirect('/?uname='+username)

      }

      else{

        return res.redirect('/login?wrong=pass')

      }

    }else{

      return res.redirect('/login?wrong=uname')

    }

  } catch (err) {

    res.status(500).send(err);

  }
  
  
});

app.get('/chat/:room', async (req, res) => {

  const room = req.params.room

  const msg = await groupModel.find({room: room}).sort({'date_sent': 'desc'}).limit(10);

  let temp="qwerty"

  module.exports=temp

  res.sendFile(__dirname + '/html/chat.html')

});

app.post('/chat',async(req,res)=>{

  const username=req.body.username

  const user = await uModel.find({username:username});

  console.log(user)

  if(user[0].username==username){

    return res.redirect('/chat/'+username)

  }

  else{

    return res.redirect('/?err=noUser')

  }

})

http.listen(PORT, () => {

  console.log(`Server started at ${PORT}`)

})

