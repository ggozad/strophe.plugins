(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('XMPP Library', function () {

        describe('Private Storage Plugin', function () {

            var successHandler, errorHandler, request, response, ns, promise;
            ns = 'http://riot.com/ns/testing';

            beforeEach(function () {
                connection = xmppMocker.mockConnection();
                successHandler = jasmine.createSpy('successHandler');
                errorHandler = jasmine.createSpy('errorHandler');
                request = '';
            });

            it('is available to the xmpp connection upon attaching', function () {
                expect(connection.Private).toBeTruthy();
            });

            it('has register the NS to Strophe upon attaching', function () {
                expect(Strophe.NS.PRIVATE).toEqual('jabber:iq:private');
            });

            it('sends a set request when set() is called and invokes the success() callback on success', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')}).tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.set('mykey', 'http://riot.com/ns/testing', 'myvalue');
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith(response);
            });

            it('sends a set request when set() is called and invokes the error() callback on error', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'error', id: $('iq', request).attr('id')}).tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.set('mykey', 'http://riot.com/ns/testing', 'myvalue');
                promise.done(successHandler);
                promise.fail(errorHandler);
                expect(successHandler).not.toHaveBeenCalled();
                expect(errorHandler).toHaveBeenCalledWith(response);
            });

            it('sends a get request when get() is called', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect(request.find('query').attr('xmlns')).toEqual(Strophe.NS.PRIVATE);
                    expect(request.find('query mykey').attr('xmlns')).toEqual(ns + ':mykey');
                });
                promise = connection.Private.get('mykey', 'http://riot.com/ns/testing');
            });

            it('sends a get request when get() is called and invokes the success() callback with the value', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
                        .c('query', {xmlns: Strophe.NS.PRIVATE})
                        .c('mykey', {xmlns: ns + ':mykey'})
                        .c('value', {}, '"myvalue"')
                        .tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.get('mykey', 'http://riot.com/ns/testing');
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith('myvalue');
            });

            it('sends a get request when get() is called and invokes the success() callback with the value "undefined" if the key is not found', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
                        .c('query', {xmlns: Strophe.NS.PRIVATE})
                        .c('nokey', {xmlns: ns + ':nokey'})
                        .tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.get('nokey', 'http://riot.com/ns/testing');
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith(undefined);
            });

            it('sends a get request when get() is called and invokes the error() callback on error', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'error', id: $('iq', request).attr('id')}).tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.get('somekey', 'http://riot.com/ns/testing');
                promise.done(successHandler);
                promise.fail(errorHandler);
                expect(successHandler).not.toHaveBeenCalled();
                expect(errorHandler).toHaveBeenCalledWith(response);
            });

            it('stringifies through JSON a js object on set()', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect(request.find('query mykey value').text()).toEqual(JSON.stringify({key1: "value1", key2: 2}));
                });
                connection.Private.set('mykey', 'http://riot.com/ns/testing', {key1: 'value1', key2: 2});
            });

            it('parses a JSON string and returns the js object on get()', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
                        .c('query', {xmlns: Strophe.NS.PRIVATE})
                        .c('mykey', {xmlns: ns + ':mykey'})
                        .c('value', {}, JSON.stringify({key1: 'value1', key2: 2}))
                        .tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.Private.get('mykey', 'http://riot.com/ns/testing');
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith({key1: 'value1', key2: 2});
            });
        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);