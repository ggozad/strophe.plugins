(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('XMPP Library', function () {

        describe('Messaging Plugin', function () {

            var successHandler, errorHandler, connection, request;

            beforeEach(function () {
                connection = xmppMocker.mockConnection();
                request = '';
            });

            it('is available to the xmpp connection upon attaching', function () {
                expect(connection.Messaging).toBeTruthy();
            });

            it('can send a plaintext message using send()', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('message', request).attr('type')).toEqual('chat');
                    expect($('message', request).attr('to')).toEqual('foo@riot.com/home');
                    expect($('message > body', request).text()).toEqual('Hello world');
                });
                connection.Messaging.send('foo@riot.com/home',
                                               'Hello world');
            });

            it('can send an xhtml message using send()', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('message', request).attr('type')).toEqual('chat');
                    expect($('message', request).attr('to')).toEqual('foo@riot.com/home');
                    expect($('message > body', request).text()).toEqual('Hello world');
                    expect($('message > html > body > p > a', request).text()).toEqual('Hello');
                });
                connection.Messaging.send('foo@riot.com/home',
                                               'Hello world',
                                               '<p><a href="http://world.com">Hello</a></p>');
            });

            it('fires an "xmpp:message" event when a plaintext message is received', function () {
                var messageHandler = jasmine.createSpy('messageHandler');
                var msg = $msg({from: 'foo@riot.com', type: 'chat'})
                    .c('body', {}, 'Hello world');
                connection.Messaging.on('xmpp:message', messageHandler);
                xmppMocker.receive(connection, msg);
                expect(messageHandler).toHaveBeenCalledWith({jid: 'foo@riot.com',
                                                             type: 'chat',
                                                             body: 'Hello world',
                                                             html_body: null});
            });

            it('fires an "xmpp:message" event when a xhtml message is received', function () {
                var messageHandler = jasmine.createSpy('messageHandler');
                var msg = $msg({from: 'foo@riot.com', type: 'chat'})
                    .c('html', {xmlns: Strophe.NS.XHTML_IM})
                    .c('body', {xmlns: Strophe.NS.XHTML})
                    .h('<p><a href="http://world.com">Hello</a></p>')
                    .up().up()
                    .c('body', {}, 'Hello world');
                connection.Messaging.on('xmpp:message', messageHandler);
                xmppMocker.receive(connection, msg);
                expect(messageHandler).toHaveBeenCalledWith({jid: 'foo@riot.com',
                                                             type: 'chat',
                                                             body: 'Hello world',
                                                             html_body: '<p><a href="http://world.com">Hello</a></p>'});
            });

            it('sends a "composing" chat state when compsing() is invoked', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('message', request).attr('type')).toEqual('chat');
                    expect($('message', request).attr('to')).toEqual('foo@riot.com/home');
                    expect($('message > thread', request).text()).toEqual('foo');
                    expect($('message > composing', request).attr('xmlns')).toEqual(Strophe.NS.CHATSTATES);
                });
                connection.Messaging.composing('foo@riot.com/home', 'foo');
            });

            it('will send only one "composing" chat state when compsing() is invoked multiple times and send a "paused" after timeout', function (done) {
                var calls = 0;
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    if ($('message > composing', request).length > 0) {
                        calls++;
                    }
                    if ($('message > paused', request).length > 0) {
                        expect($('message', request).attr('type')).toEqual('chat');
                        expect($('message', request).attr('to')).toEqual('foo@riot.com/home');
                        expect($('message > thread', request).text()).toEqual('bar');
                        expect(calls).toEqual(1);
                        done();
                    }
                });
                connection.Messaging.composing('foo@riot.com/home', 'bar', 100);
                connection.Messaging.composing('foo@riot.com/home', 'bar', 100);
                connection.Messaging.composing('foo@riot.com/home', 'bar', 100);
            });

        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);