import Proyecto from '../models/Proyecto.js'
import Tarea from '../models/Tarea.js'

const agregarTarea = async (req, res) => {
    const { proyecto } = req.body

    let existeProyecto;
    try {
        existeProyecto = await Proyecto.findById(proyecto)
    } catch (error) {
        console.log(error)
    }

    if(!existeProyecto) {
        const error= new Error('El proyecto no existe')
        return res.status(404).json(error.message)
    }

    if(existeProyecto.creador.toString() !== req.usuario._id.toString()){
        const error= new Error('No tienes los permisos para añadir tareas')
        return res.status(404).json(error.message)
    }

    try {
        const tareaAlmacenada = await Tarea.create(req.body) 
        // Almacenar el ID en el proyecto
        existeProyecto.tareas.push(tareaAlmacenada._id) 
        await existeProyecto.save() 
        res.json(tareaAlmacenada)
    } catch (error) {
        console.log(error)
    }
}

const obtenerTarea = async (req, res) => {
    const { id } = req.params
    
    let tarea;
    try {
        tarea = await Tarea.findById(id).populate('proyecto')
    } catch (error) {
        console.log(error)
    }

    if(!tarea) {
        const error= new Error('Tarea no Encontrada')
        return res.status(404).json(error.message)
    }
    
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error= new Error('Accion no Valida')
        return res.status(403).json(error.message)
    }

    res.json(tarea)
}

const actualizarTarea = async (req, res) => {
    const { id } = req.params
    
    let tarea;
    try {
        tarea = await Tarea.findById(id).populate('proyecto')
    } catch (error) {
        console.log(error)
    }

    if(!tarea) {
        const error= new Error('Tarea no Encontrada')
        return res.status(404).json(error.message)
    }
    
    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error= new Error('Accion no Valida')
        return res.status(403).json(error.message)
    }

    tarea.nombre = req.body.nombre || tarea.nombre
    tarea.descripcion = req.body.descripcion || tarea.descripcion
    tarea.prioridad = req.body.prioridad || tarea.prioridad
    tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega

    try {
        const tareaAlmacenada = await tarea.save()
        res.json(tareaAlmacenada)
    } catch (error) {
        console.log(error)
    }
}

const eliminarTarea = async (req, res) => {
    const { id } = req.params
    
    let tarea;
    try {
        tarea = await Tarea.findById(id).populate('proyecto')
    } catch (error) {
        console.log(error)
    }

    if(!tarea) {
        const error = new Error('Tarea no Encontrada')
        return res.status(404).json(error.message)
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error= new Error('Accion no Valida')
        return res.status(403).json(error.message)
    }

    try {
        const proyecto =  await Proyecto.findById(tarea.proyecto._id)
        proyecto.tareas.pull(tarea._id)

        await Promise.allSettled([await proyecto.save(), await tarea.deleteOne()])

        res.json({msg: 'Tarea Eliminada Correctamente'})
    } catch (error) {
        console.log(error)
    }
}

const cambiarEstado = async (req, res) => {
    const { id } = req.params
    
    let tarea;
    try {
        tarea = await Tarea.findById(id).populate('proyecto')
    } catch (error) { 
        console.log(error)
    }

    if(!tarea) {
        const error= new Error('Tarea no Encontrada')
        return res.status(404).json(error.message)
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString() && !tarea.proyecto.
    colaboradores.some( colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error= new Error('Accion no Valida')
        return res.status(403).json(error.message)
    }

    tarea.estado = !tarea.estado;
    tarea.completado = req.usuario._id
    await tarea.save()

    try {
        const tareaAlmacenada = await Tarea.findById(id)
        .populate('proyecto')
        .populate('completado')
        res.json(tareaAlmacenada)
    } catch (error) {
        console.log(error)
    }

}

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado
}