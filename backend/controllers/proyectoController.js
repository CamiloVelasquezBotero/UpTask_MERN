import Proyecto from '../models/Proyecto.js'
import Usuario from '../models/Usuario.js'

const obtenerProyectos = async (req, res) => {
    const proyectos = await Proyecto.find({
        $or : [ 
            {colaboradores: { $in: req.usuario}},
            {creador: { $in: req.usuario}}
        ]
    }).select('-tareas') 

    res.json(proyectos) /* Devolvermos los proyectos */
}

const nuevoProyecto = async (req, res) => {
    const proyecto = new Proyecto(req.body)
    proyecto.creador = req.usuario._id /* Le agregamos el id del creador al proyecto */

    try {
        const proyectoAlmacenado = await proyecto.save() 
        res.json(proyectoAlmacenado)
    } catch (error) {
        console.log(error)
    }
}

const obtenerProyecto = async (req, res) => {
    const { id } = req.params

    let proyecto;
    try {
        proyecto = await Proyecto.findById(id)
        .populate({ path: 'tareas', populate: {path: 'completado', select: 'nombre'}}) 
        .populate('colaboradores', 'nombre email')
    } catch (error) {
        return res.status(404).json({msg: 'No Encontrado'})
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString() && !proyecto.
    colaboradores.some( colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Accion no Valida!') 
        return res.status(400).json({msg: error.message})
    }

    res.json(proyecto)
}

const editarProyecto = async (req, res) => {
    const { id } = req.params 

    let proyecto;
    try {
        proyecto = await Proyecto.findById(id)
    } catch (error) {
        return res.status(404).json({msg: 'No Encontrado'})
        console.log(error)
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no Valida!')
        return res.status(400).json({msg: error.message})
    }

    // Actualizamos el proyecto
    proyecto.nombre = req.body.nombre || proyecto.nombre
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega
    proyecto.cliente = req.body.cliente || proyecto.cliente

    try {
        const proyectoAlmacenado = await proyecto.save() 
        res.json(proyectoAlmacenado)
    } catch (error) {
        console.log(error)
    }
}

const eliminarProyecto = async (req, res) => {
    const { id } = req.params 

    let proyecto;
    try {
        proyecto = await Proyecto.findById(id)
    } catch (error) {
        return res.status(404).json({msg: 'No Encontrado'})
        console.log(error)
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Accion no Valida!') 
        return res.status(400).json({msg: error.message})
    }

    try {
        await proyecto.deleteOne() 
        res.json({msg: 'Proyecto Eliminado'})
    } catch (error) {
        console.log(error)
    }
}

const buscarColaborador = async (req, res) => {
    const {email} = req.body
    const usuario = await Usuario.findOne({email}).select('-confirmado -createdAt -password -token -updatedAt -__v') 

    if(!usuario) { 
        const error = new Error('Usuario no encontrado')
        res.status(404).json({msg: error.message})
        return
    }
    res.json(usuario)
}

const agregarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id) 

    if(!proyecto) { 
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({msg: error.message})
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) { 
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})
    }

    const {email} = req.body
    const usuario = await Usuario.findOne({email}).select('-confirmado -createdAt -password -token -updatedAt -__v') 

    if(!usuario) { 
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    if(proyecto.creador.toString() === usuario._id.toString()) { 
        const error = new Error('El creador del proyecto no puede ser colaborador')
        return res.status(404).json({msg: error.message})
    }

    if(proyecto.colaboradores.includes(usuario._id)) { 
        const error = new Error('El usuario ya pertenece al proyecto')
        return res.status(404).json({msg: error.message})
    }

    proyecto.colaboradores.push(usuario._id)
    await proyecto.save() 
    res.json({msg: 'Colaborador agregado cor rectamente'})

}

const eliminarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id) 

    if(!proyecto) { 
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({msg: error.message})
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) { 
        const error = new Error('Accion no valida')
        return res.status(404).json({msg: error.message})
    }

    proyecto.colaboradores.pull(req.body.id)
    await proyecto.save() 
    res.json({msg: 'Colaborador eliminado correctamente'})
}

export {
    obtenerProyectos,
    nuevoProyecto,
    obtenerProyecto,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    buscarColaborador
}