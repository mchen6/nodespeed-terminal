(() => {
    "use strict";
    var express = require("express"),
        router = express.Router(),
        pty = require("pty.js"),
        debug = require("debug")("xterm-js-server");

    var terminals = {},
        logs = {};

    router.get("/", function (req, res, next) {
        res.redirect("xterm");
    });

    router.get("/xterm", function (req, res, next) {
        res.render("home");
    });


    router.ws("/terminals/:pid", function (ws, req) {

        var term = terminals[parseInt(req.params.pid)];
        debug("Connected to terminal " + term.pid);
        ws.send(logs[term.pid]);

        term.on("data", function (data) {
            try {
                ws.send(data);
            } catch (ex) {
                // The WebSocket is not open, ignore
            }
        });

        ws.on("message", function (msg) {
            term.write(msg);
        });
        ws.on("close", function () {
            process.kill(term.pid);
            console.log("Closed terminal " + term.pid);
            // Clean things up
            delete terminals[term.pid];
            delete logs[term.pid];
        });
    });

    router.get('/terminals', function (req, res) {
        var cols = parseInt(req.query.cols),
            rows = parseInt(req.query.rows),
            term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
                name: 'xterm-color',
                cols: cols || 80,
                rows: rows || 24,
                cwd: process.env.PWD,
                env: process.env
            });

        debug("Created terminal with PID: " + term.pid + " cols: " + term.cols + " rows: " + term.rows);
        terminals[term.pid] = term;
        logs[term.pid] = '';
        term.on('data', function (data) {
            debug("Terminal " + term.pid + " got data:" + data);
            logs[term.pid] += data;
        });
        res.send(term.pid.toString());
        res.end();
    });

    router.get("/terminals/:pid/size", function (req, res) {
        var pid = parseInt(req.params.pid),
            cols = parseInt(req.query.cols),
            rows = parseInt(req.query.rows),
            term = terminals[pid];

        term.resize(cols, rows);
        debug("Resized terminal " + pid + " to " + cols + " cols and " + rows + " rows.");
        res.end();
    });

    module.exports = router;

})();
