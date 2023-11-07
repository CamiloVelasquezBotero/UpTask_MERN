
import express from 'express' 
import dotenv from 'dotenv'
import cors from 'cors' 
import conectarDB from './config/db.js' 
import usuarioRoutes from './routes/usuarioRoutes.js' 
import proyectoRoutes from './routes/proyectoRoutes.js' 
import tareasRoutes from './routes/tareasRoutes.js' 

const app = express(); 
app.use(express.json()); 

dotenv.config() 

conectarDB(); 

// COnfigurar CORS
const whiteList = [process.env.FRONTEND_URL] 

const corsOptions = {
    origin: function(origin, callback) {
        if(whiteList.includes(origin)) {
            callback(null, true) 
        } else {
            callback(new Error('Error de CORS'))
        }
    }
}
app.use(cors(corsOptions)) 
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/proyectos', proyectoRoutes)
app.use('/api/tareas', tareasRoutes)

const PORT = process.env.PORT || 4000

const servidor =  app.listen(PORT, () => { 
    console.log(`Servidor correiendo en el puerto ${PORT}`)
})

// -------------------------------- Socket.io --------------------------------------
import { Server } from 'socket.io'

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL
    }
}) 

io.on('connection', (socket) => {
    console.log('Conectado a Socket.io');

   
    socket.on('abrir proyecto', (proyecto) => { 
        socket.join(proyecto)
    });

    socket.on('nueva tarea', tarea => { 
        const proyecto = tarea.proyecto; 
        socket.to(proyecto).emit('tarea agregada', tarea) 
    })

    socket.on('eliminar tarea', tarea => { 
        const proyecto = tarea.proyecto; 
        socket.to(proyecto).emit('tarea eliminada', tarea) 
    })

    socket.on('actualizar tarea', tarea => {
        const proyecto = tarea.proyecto._id
        socket.to(proyecto).emit('tarea actualizada', tarea)
    })

    socket.on('cambiar estado', tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit('nuevo estado', tarea)
    })
})