const Usuario = require('../models/Usuarios');
const Producto = require('../models/Producto');
const Cliente = require('../models/Clientes');
const Pedido = require('../models/Pedidos');


const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

//Funcion que me genera un Token
const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
}

//Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify(token, process.env.SECRETA);

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
        obtenerProducto: async (_, { id }) => {
            try {
                //verifico si existe el producto
                const producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error("El producto no existe");
                }

                return producto;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async (_, { }, ctx) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() });
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async (_, { id }, ctx) => {
            try {
                //verifico si el cliente existe
                const cliente = await Cliente.findById(id);
                if (!cliente) {
                    throw new Error('Ese cliente no existe');
                }

                //Me aseguro que solo el usuario correspondiente pueda ver sus cliente
                if (cliente.vendedor.toString() !== ctx.usuario.id) {
                    throw new Error('No tienes los permisos para esta accion');
                }
                return cliente;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidos: async () => {
            const pedidos = await Pedido.find({});
            return pedidos;
        },
        obtenerPedido: async (_, { id }, ctx) => {
            try {
                //verifico si el pedido existe
                const pedido = await Pedido.findById(id);
                if (!pedido) {
                    throw new Error('Ese pedido no existe')
                }

                //verifico que el pedido pertenezaca al vendedor correspondiente
                if (pedido.vendedor.toString() !== ctx.usuario.id) {
                    throw new Error('No tienes las credenciales para esta accion');
                }

                return pedido;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor: async (_, { }, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
            return pedidos;
        },
        obtenerPedidosEstado: async (_,{estado},ctx) => {
            const pedidos = Pedido.find({vendedor: ctx.usuario.id, estado});
            return pedidos;
        }
    },

    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            const { email, password } = input

            try {
                //verifico si el usuario ya existe
                const existeUsuario = await Usuario.findOne({ email });
                if (existeUsuario) {
                    throw new Error("El usuario ya existe")
                }

                //hasheamos el password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);

                //guardo el usuario en la DB
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;

            try {
                //revisamos si el ususario existe
                const existeUsuario = await Usuario.findOne({ email });
                if (!existeUsuario) {
                    throw new Error("No existe ese usuario");
                }

                //si el usuario existe verificar si el password es correcto
                const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
                if (!passwordCorrecto) {
                    throw new Error("Password incorrecto");
                }

                //creamos el token
                return {
                    token: crearToken(existeUsuario, process.env.SECRETA, '8h')
                }

            } catch (error) {
                console.log(error);
            }
        },
        nuevoProducto: async (_, { input }) => {
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
        actualizarProducto: async (_, { id, input }) => {
            try {
                //verifico que el producto exista
                let producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error("El producto no existe");
                }

                //actualizamos el producto en la DB
                producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
                return producto;
            } catch (error) {
                console.log(error);
            }
        },
        eliminarProducto: async (_, { id }) => {
            try {
                //verifico que el producto exista
                let producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error("El producto no existe");
                }

                //elimino el producto de la DB
                await Producto.findOneAndDelete({ _id: id });
                return "Producto Eliminado"
            } catch (error) {
                console.log(error);
            }
        },
        nuevoCliente: async (_, { input }, ctx) => {
            const { email } = input;
            console.log(ctx);

            //Verificar si el cliente ya existe
            const cliente = await Cliente.findOne({ email });
            if (cliente) {
                throw new Error('Ese cliente ya existe');
            }

            const nuevoCliente = new Cliente(input);
            //asignar el vendedor
            nuevoCliente.vendedor = ctx.usuario.id;

            //guardamos en la DB
            try {
                await nuevoCliente.save();
                return nuevoCliente;
            } catch (error) {
                console.log(error);
            }

        },
        actualizarCliente: async (_, { id, input }, ctx) => {
            try {
                //verifico que el cliente exista
                let cliente = await Cliente.findById(id);
                if (!cliente) {
                    throw new Error('Ese cliente no existe');
                }

                //verifico que el cliente pertenezca al usuario logueado
                if (cliente.vendedor.toString() !== ctx.usuario.id) {
                    throw new Error('No tienes los permisos para esta accion');
                }

                //actualizamos los datos
                cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
                return cliente;
            } catch (error) {
                console.log(error);
            }
        },
        eliminarCliente: async (_, { id }, ctx) => {
            try {
                //verifico que el cliente exista
                let cliente = await Cliente.findById(id);
                if (!cliente) {
                    throw new Error('Ese cliente no existe');
                }

                //verifico que el cliente pertenezca al usuario logueado
                if (cliente.vendedor.toString() !== ctx.usuario.id) {
                    throw new Error('No tienes los permisos para esta accion');
                }

                //elimino el cliente de la DB
                await Cliente.findOneAndDelete({ _id: id });
                return "Cliente Eliminado";
            } catch (error) {
                console.log(error);
            }
        },
        nuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input

            //verificar si el cliente existe
            let clienteVerify = await Cliente.findById(cliente);
            if (!clienteVerify) {
                throw new Error('Ese cliente no existe');
            }

            //verificar que ese cliente pertenezca al usuario(vendedor) logueado
            if (clienteVerify.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos para esta accion');
            }

            //revisar si el stock esta disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                let producto = await Producto.findById(id);
                if (articulo.cantidad > producto.stock) {
                    throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                } else {
                    //si hay stock disponible restar el mismo
                    producto.stock = producto.stock - articulo.cantidad
                    await producto.save();
                }
            }

            //crear (instanciar) un nuevo pedido
            let pedido = new Pedido(input);

            //asignarle un vendedor
            pedido.vendedor = ctx.usuario.id

            //guardarlo en la DB
            await pedido.save();

            return pedido;
        },
        actualizarPedido: async (_, { id, input }, ctx) => {
            const { cliente } = input

            //verificar si el pedido existe
            let pedidoVerify = await Pedido.findById(id)
            if (!pedidoVerify) {
                throw new Error('Ese pedido no existe')
            }

            //verificar si el cliente existe
            let clienteVerify = await Cliente.findById(cliente)
            if (!clienteVerify) {
                throw new Error('Ese pedido no existe')
            }

            //verificar si el cliente y el pedido pertenen al vendedor
            if (clienteVerify.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes los permisos para esta accion');
            }

            //revisar el stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    let producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.stock) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        //si hay stock disponible restar el mismo
                        producto.stock = producto.stock - articulo.cantidad
                        await producto.save();
                    }
                }
            }

            //guardar los cambios
            const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, { new: true });
            return resultado;
        },
        eliminarPedido: async(_,{id},ctx) => {
            try {
                //verificar si el pedido existe
                let pedidoVerify = await Pedido.findById(id)
                if (!pedidoVerify) {
                    throw new Error('Ese pedido no existe')
                }

                //verificar si el pedido pertenen al vendedor
                if (pedidoVerify.vendedor.toString() !== ctx.usuario.id) {
                    throw new Error('No tienes los permisos para esta accion');
                }

                //elimino el pedido de la DB
                await Pedido.findOneAndDelete({_id: id});
                return "Pedido eliminado"
            } catch (error) {
                console.log(error);
            }

        }
    }
}

module.exports = resolvers;