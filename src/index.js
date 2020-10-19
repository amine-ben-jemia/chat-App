const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter  = require('bad-words')
const { generateMessage , generateLocationMessage }  = require('./utils/messages')
const {addUser,getUser,getUsersInRoom,removeUser} = require('./utils/users')
        //socket.emit, io.emit , socket.broadcast.emit
        // Socket.emit : envoie un message pour un client specifie
        // io.emit : envoie un message a tout client connectes
        // Socket.broadcast.emit : envoie un message a tout les clients sauf le client princiapl 'Socket'
        // io.to.emit  : envoie un message a tout les utilisateurs qui sont dans ce room
        // socket.broadcast.to.emit : envoie un message a tout les utilisateurs qui sont dans ce room sauf l'utilisateur principal


const app = express()
//installation du web socket on a creee server pour le mettre dans socketio()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDiretctoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDiretctoryPath))


io.on('connection',(socket)=>{
    console.log('New WebSocket connection')




    socket.on('join',(options,callback)=>{
        const {error , user } = addUser({id:socket.id ,...options})

        if (error){
            return callback(error)
        }

        socket.join(user.room)
        //socket.emit, io.emit , socket.broadcast.emit
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined !`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })


    socket.on('sendMessage',(message,callback)=>{
        const filter = new Filter()
        const user = getUser(socket.id)
        //pour supprimer les gros mots
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback('Develivered')
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    // Localisation
     socket.on('sendLocation',(coords,callback)=>{
         const user = getUser(socket.id)
         io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
        })
    
   // socket.on('increment',()=>{
        // count++
        //socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })
})

server.listen(port,() => {
    console.log(`Server is up on port ${port}!`)
})
