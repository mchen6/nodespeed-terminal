#! /usr/bin/env node

(() => {

    var express = require('express');
    var exphbs = require('express-handlebars');
    var app = express();
    var expressWs = require('express-ws')(app);
    var bodyParser = require('body-parser');
    var path = require('path');
    var debug = require('debug')('xterm-js-server');
    var favicon = require('serve-favicon');

    var argv = require('yargs')
        .default('port', 9485)
        .argv;

    app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

    var routes = require('./routes/index');

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

    // view engine setup
    app.engine('handlebars', exphbs({
        defaultLayout: 'main'
    }));

    app.set('view engine', 'handlebars');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use('/', routes);
    app.use('/', express.static('./public'));
    app.use('/jquery', express.static('./node_modules/jquery'));
    app.use('/src', express.static('./node_modules/xterm/src'));

    app.use(function (err, req, res, next) {
        res.status(500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    app.listen(argv.port, () => {
        console.log('App listening ', argv.port);
        debug('App listening ' + argv.port);
    });

})();
