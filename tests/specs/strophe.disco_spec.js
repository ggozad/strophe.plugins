(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('XMPP Library', function () {

        describe('Disco Plugin', function () {

            var successHandler, errorHandler, request, response, promise;

            beforeEach(function () {
                connection = xmppMocker.mockConnection();
                successHandler = jasmine.createSpy('successHandler');
                errorHandler = jasmine.createSpy('errorHandler');
            });

            it('is available to the xmpp connection upon attaching', function () {
                expect(connection.Disco).toBeTruthy();
            });

            it('sends a get request when info() is called and returns identities and features', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect(request.find('query').attr('xmlns')).toEqual(Strophe.NS.DISCO_INFO);
                    response = $iq({type: 'result', id: $('iq', request).attr('id'), from: 'entity'})
                        .c('query', {xmlns: Strophe.NS.DISCO_INFO})
                        .c('identity', {category: 'pubsub', type: 'pep'}).up()
                        .c('identity', {category: 'server', type: 'im', name: 'foo'}).up()
                        .c('feature', {'var': 'foo'}).up()
                        .c('feature', {'var': 'bar'}).up();
                    xmppMocker.receive(connection, response);

                });
                promise = connection.Disco.info('entity');
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith({
                    identities: [
                        {category: 'pubsub', type: 'pep'},
                        {category: 'server', type: 'im', name: 'foo'}
                    ],
                    features: ['foo', 'bar']
                });
            });

            it('replies with identities and features when a info request is made to the entity', function () {
                var spy = spyOn(connection, 'send').and.callFake(function (response) {
                    response = xmppMocker.jquerify(response);
                    expect($('iq', response).attr('to')).toEqual('foo@bar.com/client');
                    expect($('iq', response).attr('type')).toEqual('result');
                    expect($('iq', response).attr('id')).toEqual('foo');
                    expect($('iq > query', response).attr('xmlns')).toEqual(Strophe.NS.DISCO_INFO);
                    expect($('iq > query > identity', response).attr('category')).toEqual('client');
                    expect($('iq > query > identity', response).attr('type')).toEqual('im');
                    expect($('iq > query > identity', response).attr('name')).toEqual('foo');
                    expect($('iq > query > feature', response).attr('var')).toEqual('jabber:iq:version');

                });
                connection.Disco.addIdentity({category: 'client', type: 'im', name: 'foo'});
                connection.Disco.addFeature('jabber:iq:version');

                request = $iq({from: 'foo@bar.com/client', to: connection.jid, type: 'get', id: 'foo'})
                    .c('query', {xmlns: Strophe.NS.DISCO_INFO});
                xmppMocker.receive(connection, request);
                expect(spy).toHaveBeenCalled();
            });

        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);