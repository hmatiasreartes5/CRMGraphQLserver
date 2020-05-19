const Usuario = require('../models/Usuarios');
const Producto = require('../models/Producto');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

//Funcion que me genera un Token
const crearToken = (usuario,secreta, expiresIn) => {
    const {id, email, nombre , apellido} = usuario;
    return jwt.sign( {id,email,nombre,apellido},secreta,{expiresIn});
}

//Resolvers
const resolvers = {
    Query: {
        obtenerUsuario : async(_,{token}) =>{
            const usuarioId = await jwt.verify(token,process.env.SECRETA);

            return usuarioId;
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_,{id}) => {
            try {
                //verifico si existe el producto
                const producto = await Producto.findById(id);
                if(!producto){
                    throw new Error("El producto no existe");
                }

                return producto;
            } catch (error) {
                console.log(error);
            }
        }
    },

    Mutation:{
        nuevoUsuario: async (_,{input}) => {
            const { email , password} = input

            try {
                //verifico si el usuario ya existe
                const existeUsuario = await Usuario.findOne({email});
                if(existeUsuario){
                    throw new Error("El usuario ya existe")
                }

                //hasheamos el password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password,salt);

                //guardo el usuario en la DB
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_,{input}) => {
            const {email,password} = input;

            try {
                //revisamos si el ususario existe
                const existeUsuario = await Usuario.findOne({email});
                if(!existeUsuario){
                    throw new Error("No existe ese usuario");
                }

                //si el usuario existe verificar si el password es correcto
                const passwordCorrecto = await bcryptjs.compare(password,existeUsuario.password);
                if(!passwordCorrecto){
                    throw new Error("Password incorrecto");
                }

                //creamos el token
                return{
                    token: crearToken(existeUsuario,process.env.SECRETA, '8h')
                }
                
            } catch (error) {
                console.log(error);
            }
        },
        nuevoProducto: async (_,{input}) =>{
            try {
                //instanciamos el objeto
                const producto = new Producto(input);
                //almacenamos en la DB
                await producto.save();
                return producto
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async(_,{id,input}) => {
            try {
                //verifico que el producto exista
                let producto = await Producto.findById(id);
                if(!producto){
                    throw new Error("El producto no existe");
                }

                //actualizamos el producto en la DB
                producto = await Producto.findOneAndUpdate({_id: id},input, {new: true});
                return producto;
            } catch (error) {
                console.log(error);
            }
        },
        eliminarProducto: async(_,{id}) => {
            try {
                //verifico que el producto exista
                let producto = await Producto.findById(id);
                if(!producto){
                    throw new Error("El producto no existe");
                }

                //elimino el producto de la DB
                await Producto.findOneAndDelete({_id: id});
                return "Producto Eliminado"
            } catch (error) {
                console.log(error);         
            }
        }
    }
}

module.exports = resolvers;