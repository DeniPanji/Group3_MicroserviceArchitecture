'use strict';

const restify = require('restify');
const serveStatic = require('serve-static-restify');
const project = require('../../package.json');
const basicAuth = require('../auth/basic_auth_helper');
const jwtAuth = require('../auth/jwt_auth_helper');
const wrapper = require('../helpers/utils/wrapper');
const sentryLog = require('../helpers/components/sentry/sentry_log');
const logger = require("../helpers/utils/logger");
const corsMiddleware = require('restify-cors-middleware')
const mockupHandler = require('../modules/mockup/handlers/api_handler');
const userHandler = require('../modules/user/handlers/api_handler');
const articleAgreeHandler = require('../modules/articleAgree/handlers/api_handler');
const registerAgreeHandler = require('../modules/registerAgree/handlers/api_handler');


let crossOrigin = (req,res,next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    return next();
}

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['Origin, X-Requested-With, Content-Type, Accept, OPTIONS'],
    exposeHeaders: ['OPTIONS']
})

let AppServer = function(){
    this.server = restify.createServer({
        name: project.name + '-server',
        version: project.version
    });

    this.server.serverKey = '';
    this.server.pre(cors.preflight);
    this.server.use(cors.actual);
    this.server.use(restify.plugins.acceptParser(this.server.acceptable));
    this.server.use(restify.plugins.queryParser());
    this.server.use(restify.plugins.bodyParser());
    this.server.use(restify.plugins.authorizationParser());

    //required for basic auth
    this.server.use(basicAuth.init());
    this.server.use(crossOrigin);

    //anonymous can access the end point, place code bellow
    this.server.get('/', (req, res, next) => {
        wrapper.response(res,`success`,wrapper.data(`Index`),`This service is running properly`);
    });

    //authenticated client can access the end point, place code bellow
    this.server.get('/api/v1/mockups/:projectName/:domainName/:apiName', basicAuth.isAuthenticated, mockupHandler.getOneMockup);
    this.server.get('/api/v1/mockups/mysql/:projectName/:domainName/:apiName', basicAuth.isAuthenticated, mockupHandler.getOneMockupMySQL);
    this.server.post('/api/v1/mockups/',basicAuth.isAuthenticated,  mockupHandler.postOneMockup);
    this.server.post('/api/v1/me', basicAuth.isAuthenticated, userHandler.postDataLogin);
    this.server.get('/api/v1/me',  jwtAuth.verifyToken, userHandler.getUser);
    this.server.get('/api/v1/article/getmany/', articleAgreeHandler.getManyArticle);
    this.server.get('/api/v1/article/getone/', articleAgreeHandler.getOneArticle);
    this.server.post('/api/v1/article/postarticle/', articleAgreeHandler.postArticle);
    this.server.post('/api/v1/article/registeragree/', registerAgreeHandler.registerAgree);
}
 
module.exports = AppServer;