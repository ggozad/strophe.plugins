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
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect(request.find('query').attr('xmlns')).toEqual(Strophe.NS.DISCO_INFO);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
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

        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);