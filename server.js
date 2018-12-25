var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

const fs = require('fs');
const path = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { ApolloVoyagerServer, voyagerResolvers, gql } = require('@aerogear/apollo-voyager-server');
const { KeycloakSecurityService } = require('@aerogear/apollo-voyager-keycloak');
    
Object.assign=require('object-assign');

const keycloakConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config/keycloak.json')));

if(process.env.KEYCLOAK_ROUTE){
    keycloakConfig['auth-server-url'] = process.env.KEYCLOAK_ROUTE + "/auth"
}


// This is our Schema Definition Language (SDL)
const typeDefs = gql`

    # In the older version of graphql in the data sync server
    # We did not have to define the directive here.
    # For some reason we do now, otherwise makeExecutableSchema does not work.

    directive @hasRole(role: [String]) on FIELD | FIELD_DEFINITION

    type Query {
        hello: String @hasRole(role: "admin")
    }
`;

// Resolver functions. This is our business logic
let resolvers = {
    Query: {
        hello: (obj, args, context, info) => {

            // log some of the auth related info added to the context
            console.log(context.auth.isAuthenticated())
            console.log(context.auth.accessToken.content.name)

            const name = context.auth.accessToken.content.name || 'world'
            return `Hello ${name} from ${context.serverName}`
        }
    }
};

resolvers = voyagerResolvers(resolvers, { auditLogging: true });

// Initialize the keycloak service
const keycloakService = new KeycloakSecurityService(keycloakConfig);

// get the keycloak context provider and directives
const schemaDirectives = keycloakService.getSchemaDirectives();

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    // add the keycloak directives
    schemaDirectives
});

// The context is a function or object that can add some extra data
// That will be available via the `context` argument the resolver functions
const context = ({ req }) => {
    return {
        serverName: 'Voyager Server'
    }
};

const apolloConfig = {
    schema,
    context
}

const voyagerConfig = {
    securityService: keycloakService
}

const server = ApolloVoyagerServer(apolloConfig, voyagerConfig)

keycloakService.applyAuthMiddleware(app)
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
