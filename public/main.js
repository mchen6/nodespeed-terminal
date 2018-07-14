/*global $,  window, document, location, WebSocket, Terminal, setTimeout*/
$(document).ready(function () {

    var term,
        protocol,
        socketURL,
        socket;

    var terminalNumber = 1;
    var terminalData = [];

    var config = {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: true,
            showCloseIcon: true
        },
        content: [{
            type: 'stack',
            isClosable: false,
            content: []
        }]
    };

    var layout = new window.GoldenLayout(config, $('#layoutContainer'));

    layout.registerComponent('containerComponent', function (container, state) {
        container.getElement().html(state.text);
        container.on('resize', function (e) {
            // e undefined?
        });
        container.on('destroy', function (e) {
            // e undefined?
        });
    });

    var addMenuItems = function () {
        var addTerminalOption = $('<li>Add terminal</li>');

        $('#menuContainer').append(addTerminalOption);

        addTerminalOption.click(function () {
            addTerminal();
        });
    };

    layout.init();
    addMenuItems();

    function addTerminal() {
        var newItemConfig = {
            title: 'Terminal-' + terminalNumber,
            type: 'component',
            componentName: 'containerComponent',
            componentState: {
                text: '<div class="terminal-container" id="terminal-container-' + terminalNumber + '"></div>'
            }
        };

        layout.root.contentItems[0].addChild(newItemConfig);

        var element = $('#terminal-container-' + terminalNumber)[0];

        createTerminal(element);
    }

    function createTerminal(terminalContainer) {

        while (terminalContainer.children.length) {
            terminalContainer.removeChild(terminalContainer.children[0]);
        }

        term = new Terminal({
            cursorBlink: true
        });

        term.on('resize', function (size) {
            if (terminalData.length && size.cols && size.rows) {

                var number = size.terminal.parent.id.split('-')[2];

                var terminal = terminalData.filter(el => el.id === Number(number));

                if (!terminal[0] || !terminal[0].pid) {
                    return;
                } else {
                    var pid = terminal[0].pid;
                    var url = '/terminals/' + pid + '/size?cols=' + size.cols + '&rows=' + size.rows;

                    $.ajax({
                        url: url,
                        type: 'POST'
                    });
                }
            }
        });

        protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
        socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';

        term.open(terminalContainer);
        term.fit();

        var initialGeometry = term.proposeGeometry(),
            cols = initialGeometry.cols,
            rows = initialGeometry.rows;

        $.ajax({
            url: '/terminals?cols=' + cols + '&rows=' + rows,
            type: 'GET',
            success: function (pid) {
                window.pid = pid;
                socketURL += pid;
                socket = new WebSocket(socketURL);
                socket.onopen = function () {
                    terminalData.push({
                        pid: pid,
                        id: terminalNumber,
                        socket: socket,
                        terminal: term
                    });

                    terminalNumber++;
                    socket.send('cd /\nclear\n');
                    runTerminal();
                };

                socket.onclose = function (mes) {
                    console.log(mes);
                };
                socket.onerror = function (err) {
                    console.log(err);
                };
            },
            error: function (error) {
                console.log(error);
            }
        });
    }

    function runTerminal() {
        term.attach(socket);
        term._initialized = true;
    }

    function pingAllTerminals() {
        terminalData.forEach((el) => {
            el.socket.send('');
        });
        setTimeout(pingAllTerminals, 1000 * 60 * 2);
    }

    addTerminal();
    pingAllTerminals();
});
