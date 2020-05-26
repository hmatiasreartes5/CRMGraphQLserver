const mongoose = require('mongoose');

const {ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req})=> {
        const token = req.headers['authorization'] || '';
        if(token){
            const usuario = jwt.verify(token,process.env.SECRETA);
            return {
                usuario
            }
        }
    }
});

//Conectar a la DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/crmclientegraphql',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})


// arrancar el servidor
server.listen({ port: process.env.PORT || 4000 }).then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
} )