import Usuario from '../models/Usuario.js'
import generarId from '../helpers/generarId.js'
import generarJWT from '../helpers/generarJWT.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const registrar = async (req, res) => {
    // Evitar usuarios duplicados
    const { email } = req.body 
    const existeUsuario = await Usuario.findOne({ email }) 

    if(existeUsuario) { 
        const error = new Error('Usuario ya registrado') 
        return res.status(400).json({msg: error.message}) 
    }

    try {
        
        const usuario = new Usuario(req.body) 
        usuario.token = generarId() 

        await usuario.save() 

        //Enviar el email de confirmacion
        emailRegistro({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        res.json({msg: 'Usuario creado Correctamente, Revisa tu Email para confirmar tu cuenta.'})
    } catch (error) {
        console.log(error)
    }
}

const autenticar = async (req, res) => {
    const { email, password } = req.body 

    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({email}) 
    if(!usuario) {
        const error = new Error('El usuario no existe')
        return res.status(400).json({msg: error.message})
    }

    // Comprobar si el usuario esta confirmado
    if(!usuario.confirmado) { 
        const error = new Error('Tu Cuenta no ha sido Confirmada')
        return res.status(403).json({msg: error.message})
    }

    // Comprobar su password
    if(await usuario.comprobarPassword(password)) { 
        res.json({ 
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id) 
        })
    } else {
        const error = new Error('El password es incorrecto')
        return res.status(403).json({msg: error.message})
    }
}

const confirmar = async (req, res) => {
    const { token } = req.params 
    const usuarioConfirmar = await Usuario.findOne({token}) 

    if(!usuarioConfirmar) {
        const error = new Error('Token no valido')
        return res.status(400).json({msg: error.message}) 
    }

    try {
        usuarioConfirmar.confirmado = true
        usuarioConfirmar.token = '' 
        await usuarioConfirmar.save()
        res.json({msg: 'Usuario Confirmado correctamente'})
    } catch (error) {
        console.log(error)
    }
}

const olvidePassword = async (req, res) => {
    const { email } = req.body 

    const usuario = await Usuario.findOne({email}) 
    if(!usuario) {
        const error = new Error('El usuario no existe')
        return res.status(400).json({msg: error.message})
    }

    try {
        usuario.token = generarId() 
        await usuario.save()

        // Enviar email con instrucciones
        emailOlvidePassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        res.json({msg: 'Hemos enviado un email con las instrucciones'})
    } catch (error) {
        console.log(error)
    }
}

const comprobarToken = async (req, res) => {
    const { token } = req.params 

    const tokenValido = await Usuario.findOne({token}) 
    if(tokenValido) {
        res.json({msg: 'Token Valido y el Usuario existe'})
    } else {
        const error = new Error('Token no valido')
        return res.status(404).json({msg: error.message})
    }
}

const nuevoPassword = async (req, res) => {
    const { token } = req.params 
    const { password } = req.body 

    const usuario = await Usuario.findOne({token}) 
    if(usuario) {
        usuario.password = password 
        usuario.token = '' 
        try {
            await usuario.save() 
            return res.json({msg: 'Password Modificado Correctamente'})
        } catch (error) {
            console.log(error)
        }
    } else {
        const error = new Error('Token no valido')
        return res.status(404).json({msg: error.message})
    }
}

const perfil = async (req, res) => {
    const { usuario } = req

    res.json(usuario)
}

export {
    registrar,
    autenticar,
    confirmar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    perfil
}