process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

var express = require('express'),
    app = express(),
    morgan = require('morgan');

const fs = require('fs');
const path = require('path');
const {VoyagerServer, gql} = require('@aerogear/voyager-server')
const {KeycloakSecurityService} = require('@aerogear/voyager-keycloak');
const auditLogger = require('@aerogear/voyager-audit')
const metrics = require('@aerogear/voyager-metrics')

Object.assign = require('object-assign');

const keycloakConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config/keycloak.json')));

if (process.env.KEYCLOAK_ROUTE) {
    keycloakConfig['auth-server-url'] = process.env.KEYCLOAK_ROUTE + "/auth"
}

console.log("Using Keycloak route " + keycloakConfig['auth-server-url']);

console.log("Keycloak config:")
console.log(JSON.stringify(keycloakConfig))


// This is our Schema Definition Language (SDL)
const typeDefs = gql`

    # In the older version of graphql in the data sync server
    # We did not have to define the directive here.
    # For some reason we do now, otherwise makeExecutableSchema does not work.

    directive @hasRole(role: [String]) on FIELD | FIELD_DEFINITION

    type Query {
        hello: String @hasRole(role: "admin")
        fails: String
        getUser(id: Int): User
    }

    type Mutation {
        createUser(name: String): User
        createMeme(userId: Int, url: String): Meme
        createConflict: String
    }

    type User {
        id: Int!
        name: String!
        memes: [Meme]!
    }

    type Meme {
        id: Int!
        url: String
    }
`;

const users = [];

// Resolver functions. This is our business logic
let resolvers = {
    Query: {
        hello: (obj, args, context, info) => {
            const name = context.auth.accessToken.content.name || 'world';
            return `Hello ${name} from ${context.serverName}`;
        },
        fails: (obj, args, context, info) => {
            throw new Error('Fails on purpose')
        },
        getUser: (obj, args, context, info) => {
            const user = users[args.id];
            if (user) {
                return {
                    id: user.id,
                    name: user.name
                }
            } else {
                return null
            }
        }
    },
    Mutation: {
        createUser: (obj, args, context, info) => {
            const id = users.length;
            const user = {
                id,
                name: args.name,
                memes: []
            };
            users.push(user);
            return {
                id: user.id,
                name: user.name
            }
        },

        createMeme: (obj, args, context, info) => {
            const user = users[args.userId];
            if (!user) {
                return null;
            } else {
                user.memes = user.memes || [];
                meme = {
                    id: args.userId * 1000000 + user.memes.length,
                    url: args.url
                };
                user.memes.push(meme);
                return meme;
            }
        },

        createConflict: (obj, args, context, info) => {
            const {conflict} = context
            const a = {foo: "bar", version: 10};
            const b = {foo: "baz", version: 1};
            conflict.hasConflict(a, b, obj, args, context, info);
            return "conflict"
        }
    },
    User: {
        memes: (obj, args, context, info) => {
            if (!obj || !users[obj.id]) {
                return []
            }
            return users[obj.id].memes
        }
    }
};

// The context is a function or object that can add some extra data
// That will be available via the `context` argument the resolver functions
const context = ({req}) => {
    return {
        serverName: 'Voyager Server'
    }
};

// Initialize the keycloak service
const keycloakService = new KeycloakSecurityService(keycloakConfig);


const apolloConfig = {
    typeDefs,
    resolvers,
    context
};

const voyagerConfig = {
    auditLogger,
    metrics,
    securityService: keycloakService
};

// Initialize the voyager server with our schema and context
const server = VoyagerServer(apolloConfig, voyagerConfig)

keycloakService.applyAuthMiddleware(app)
metrics.applyMetricsMiddlewares(app)
server.applyMiddleware({app})

// error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
