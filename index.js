const mongoose = require('mongoose');

const {ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers
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