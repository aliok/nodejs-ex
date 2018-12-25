var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

const { makeExecutableSchema } = require('graphql-tools');
const { ApolloVoyagerServer, gql } = require('@aerogear/apollo-voyager-server');
    
Object.assign=require('object-assign');


const typeDefs = gql`
    type Query {
        hello: String
    }
`;

// Resolver functions. This is our business logic
const resolvers = {
    Query: {
        hello: (obj, args, context, info) => {

            // we can access the request object provided by the Voyager framework
            console.log(context.request.body)

            // we can access the context added below also
            console.log(context.serverName)
            return `Hello world from ${context.serverName}`
        }
    }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// The context is a function or object that can add some extra data
// That will be available via the `context` argument the resolver functions
const context = ({ req }) => {
    return {
        serverName: 'Voyager Server'
    }
};

// Initialize the apollo voyager server with our schema and context
const server = ApolloVoyagerServer({
    schema,
    context
});

server.applyMiddleware({ app });


app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/', function (req, res) {
    res.render('index.html', { pageCountMessage : null});
});

app.get('/pagecount', function (req, res) {
    res.send('{ pageCount: -1 }');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
