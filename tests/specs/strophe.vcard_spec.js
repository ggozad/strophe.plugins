(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('XMPP Library', function () {

        describe('vCard Plugin', function () {

            var successHandler, errorHandler, request, response, p;

            beforeEach(function () {
                connection = xmppMocker.mockConnection();
                successHandler = jasmine.createSpy('successHandler');
                errorHandler = jasmine.createSpy('errorHandler');
                request = '';
            });

            it('is available to the xmpp connection upon attaching', function () {
                expect(connection.vCard).toBeTruthy();
            });

            it('can parse a nested dict and return a vCard through _buildvCard()', function () {
                var adict = {
                    FN: 'Peter Saint-Andre',
                    N: {
                        FAMILY: 'Peter Saint-Andre',
                        GIVEN: 'Peter'},
                    BDAY: 'Yesterday',
                    ORG: '',
                    PHOTO: {
                        BINVAL: '/9j/',
                        TYPE: 'image/jpeg'}
                };

                var xml = xmppMocker.jquerify(connection.vCard._buildvCard(adict));
                // The namespace and version are set.
                expect($('vCard', xml).attr('xmlns')).toEqual('vcard-temp');
                expect($('vCard', xml).attr('version')).toEqual('2.0');
                // FN is a direct child of vCard
                expect($('vCard > FN', xml).text()).toEqual('Peter Saint-Andre');
                // FAMILY and GIVEN are children of N
                expect($('vCard > N > GIVEN', xml).text()).toEqual('Peter');
                expect($('vCard > N > FAMILY', xml).text()).toEqual('Peter Saint-Andre');
                // A direct child following a composite child goes up, so BDAY is a direct child of vCard
                expect($('vCard > BDAY', xml).text()).toEqual('Yesterday');
                expect($('vCard > ORG', xml).text()).toEqual('');
                expect($('vCard > PHOTO > BINVAL', xml).text()).toEqual('/9j/');
                expect($('vCard > PHOTO > TYPE', xml).text()).toEqual('image/jpeg');
            });

            it('can parse vCard formatted xml and return a nested dict', function () {
                var vCard = $build('vCard', {xmlns: Strophe.NS.vCard, version: '2.0'})
                    .c('FN', {}, 'Peter Saint-Andre')
                    .c('N')
                    .c('FAMILY', {}, 'Peter Saint-Andre')
                    .c('GIVEN', {}, 'Peter');
                var dict = connection.vCard._parsevCard(vCard.tree());
                expect(dict.FN).toEqual('Peter Saint-Andre');
                expect(dict.N).toEqual({FAMILY: 'Peter Saint-Andre', GIVEN: 'Peter'});
            });

            it('can get a vCard and return an object with its properties', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('iq', request).attr('type')).toEqual('get');
                    expect($('iq', request).attr('to')).toEqual('stpeter@riot.com');
                    expect($('iq > vCard', request).attr('xmlns')).toEqual(Strophe.NS.vCard);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
                        .c('vCard', {xmlns: Strophe.NS.vCard, version: '2.0'})
                        .c('FN', {}, 'Peter Saint-Andre')
                        .c('N')
                        .c('FAMILY', {}, 'Peter Saint-Andre')
                        .c('GIVEN', {}, 'Peter');
                    xmppMocker.receive(connection, response);
                });
                p = connection.vCard.get('stpeter@riot.com');
                p.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith({
                    FN: 'Peter Saint-Andre',
                    N: {FAMILY: 'Peter Saint-Andre', GIVEN: 'Peter'}
                });
            });

            it('can set a vCard from an dict', function () {
                spyOn(connection, 'send').and.callFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('iq', request).attr('type')).toEqual('set');
                    expect($('iq > vCard', request).attr('xmlns')).toEqual(Strophe.NS.vCard);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')});
                    xmppMocker.receive(connection, response);
                });
                p = connection.vCard.set({
                    FN: 'Peter Saint-Andre',
                    N: {FAMILY: 'Peter Saint-Andre', GIVEN: 'Peter'}
                });
                p.done(successHandler);
                expect(successHandler).toHaveBeenCalled();
            });
        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);