(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('XMPP Library', function () {

        describe('Roster Plugin', function () {

            var successHandler, errorHandler, request, response, promise;

            beforeEach(function () {
                connection = xmppMocker.mockConnection();
                successHandler = jasmine.createSpy('successHandler');
                errorHandler = jasmine.createSpy('errorHandler');
                request = '';
            });

            it('is available to the xmpp connection upon attaching', function () {
                expect(connection.roster).toBeTruthy();
                expect(Strophe.NS.ROSTERX).toEqual('http://jabber.org/protocol/rosterx');
            });

            it('sends a subscription request when subscribe() is called', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('presence', request).attr('to')).toEqual('foo@riot.com');
                    expect($('presence', request).attr('type')).toEqual('subscribe');
                });
                connection.roster.subscribe('foo@riot.com');
            });

            it('sends an unsubscription request when unsubscribe() is called', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('presence', request).attr('to')).toEqual('foo@riot.com');
                    expect($('presence', request).attr('type')).toEqual('unsubscribe');
                });
                connection.roster.unsubscribe('foo@riot.com');
            });

            it('sends an authorize request when authorize() is called', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('presence', request).attr('to')).toEqual('foo@riot.com');
                    expect($('presence', request).attr('type')).toEqual('subscribed');
                });
                connection.roster.authorize('foo@riot.com');
            });

            it('sends an unauthorize request when unauthorize() is called', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    expect($('presence', request).attr('to')).toEqual('foo@riot.com');
                    expect($('presence', request).attr('type')).toEqual('unsubscribed');
                });
                connection.roster.unauthorize('foo@riot.com');
            });

            it('sends a roster get request when get() is called and invokes the success() callback on success with an object representing the roster', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'result', id: $('iq', request).attr('id')})
                        .c('query', {xmlns: Strophe.NS.ROSTER})
                        .c('item', {jid: 'foo@riot.com', subscription: 'both', name: 'Foo'})
                        .c('group').t('Friends')
                        .c('item', {jid: 'bar@riot.com', subscription: 'from'});
                    xmppMocker.receive(connection, response);
                });
                promise = connection.roster.get();
                promise.done(successHandler);
                expect(successHandler).toHaveBeenCalledWith({'foo@riot.com': {subscription: 'both', name: 'Foo', groups: ['Friends']},
                                                             'bar@riot.com': {subscription: 'from', name: null, groups: []}});
            });

            it('sends a roster get request when get() is called and invokes the error() callback on error', function () {
                spyOn(connection, 'send').andCallFake(function (request) {
                    request = xmppMocker.jquerify(request);
                    response = $iq({type: 'error', id: $('iq', request).attr('id')}).tree();
                    xmppMocker.receive(connection, response);
                });
                promise = connection.roster.get();
                promise.done(successHandler);
                promise.fail(errorHandler);
                expect(successHandler).wasNotCalled();
                expect(errorHandler).toHaveBeenCalledWith(response);
            });

            it('fires an "xmpp:presence:available" and an "xmpp:presence" event when an appropriate presence stanza is received', function () {
                var presenceHandler = jasmine.createSpy('presenceHandler');
                var availableHandler = jasmine.createSpy('availableHandler');
                connection.roster.bind('xmpp:presence', presenceHandler);
                connection.roster.bind('xmpp:presence:available', availableHandler);
                var presence = $pres({from: 'foo@riot.com'})
                    .c('show', [], 'dnd')
                    .c('status', [], 'Testing...');

                xmppMocker.receive(connection, presence);
                expect(presenceHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com",
                    priority: null,
                    show: "dnd",
                    status: "Testing...",
                    type: null
                });
                expect(availableHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com",
                    priority: null,
                    show: "dnd",
                    status: "Testing..."
                });
            });

            it('fires an "xmpp:presence:unavailable" and an "xmpp:presence" event when an appropriate presence stanza is received', function () {
                var presenceHandler = jasmine.createSpy('presenceHandler');
                var unavailableHandler = jasmine.createSpy('unavailableHandler');
                connection.roster.bind('xmpp:presence', presenceHandler);
                connection.roster.bind('xmpp:presence:unavailable', unavailableHandler);
                var presence = $pres({from: 'foo@riot.com', type: 'unavailable'});

                xmppMocker.receive(connection, presence);
                expect(presenceHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com",
                    priority: null,
                    show: null,
                    status: null,
                    type: 'unavailable'
                });
                expect(unavailableHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com"
                });
            });

            it('fires an "xmpp:presence:subscriptionrequest" and an "xmpp:presence" event when an appropriate presence stanza is received', function () {
                var presenceHandler = jasmine.createSpy('presenceHandler');
                var subscriptionHandler = jasmine.createSpy('subscriptionHandler');
                connection.roster.bind('xmpp:presence', presenceHandler);
                connection.roster.bind('xmpp:presence:subscriptionrequest', subscriptionHandler);
                var presence = $pres({from: 'foo@riot.com', type: 'subscribe'});

                xmppMocker.receive(connection, presence);
                expect(presenceHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com",
                    priority: null,
                    show: null,
                    status: null,
                    type: 'subscribe'
                });
                expect(subscriptionHandler).toHaveBeenCalledWith({
                    jid: "foo@riot.com"
                });
            });

            it('fires an "xmpp:roster:set" when an appropriate iq staza is received', function () {

                var rosterSetHandler = jasmine.createSpy('rosterSetHandler'), iq;

                connection.roster.on('xmpp:roster:set', rosterSetHandler);
                iq = $iq({from: 'riot.com', type: 'set', id: '123'})
                    .c('query', {xmlns: Strophe.NS.ROSTER})
                    .c('item', {jid: 'foo@riot.com', name: 'Foo', subscription: 'none'}).up()
                    .c('item', {jid: 'bar@riot.com', name: 'Bar', subscription: 'both'})
                    .c('group').t('foogroup');

                xmppMocker.receive(connection, iq);
                expect(rosterSetHandler).toHaveBeenCalledWith([
                    {jid : 'foo@riot.com', name : 'Foo', subscription : 'none' },
                    {jid : 'bar@riot.com', name : 'Bar', subscription : 'both', groups : ['foogroup']}]);
            });

            it('responds to "Roster Suggested Items" messages', function () {
                var suggestedHandler = jasmine.createSpy('suggestedHandler'),
                    suggestion = $msg({from: 'foo@riot.com'})
                        .c('x', {xmlns: Strophe.NS.ROSTERX})
                        .c('item');
                connection.roster.bind('xmpp:roster:suggestion', suggestedHandler);
                xmppMocker.receive(connection, suggestion);
                expect(suggestedHandler).toHaveBeenCalled();
            });

            it('fires "xmpp:roster:suggestion:add" when a roster suggestion to add a roster item is received', function () {
                var suggestedHandler = jasmine.createSpy('suggestedHandler'),
                    suggestion = $msg({from: 'foo@riot.com'})
                        .c('x', {xmlns: Strophe.NS.ROSTERX})
                        .c('item', {action: 'add', jid: 'bar@riot.com', name: 'Joe Bar'})
                        .c('groups', {}, 'Rioters')
                        .c('groups', {}, 'Jarnians');
                connection.roster.bind('xmpp:roster:suggestion:add', suggestedHandler);
                xmppMocker.receive(connection, suggestion);
                expect(suggestedHandler).toHaveBeenCalledWith({from: 'foo@riot.com', action :'add', jid :'bar@riot.com', name :'Joe Bar', groups :['Rioters', 'Jarnians']});
            });

            it('fires "xmpp:roster:suggestion:delete" when a roster suggestion to delete a roster item is received', function () {
                var suggestedHandler = jasmine.createSpy('suggestedHandler'),
                    suggestion = $msg({from: 'foo@riot.com'})
                        .c('x', {xmlns: Strophe.NS.ROSTERX})
                        .c('item', {action: 'delete', jid: 'bar@riot.com'});
                connection.roster.bind('xmpp:roster:suggestion:delete', suggestedHandler);
                xmppMocker.receive(connection, suggestion);
                expect(suggestedHandler).toHaveBeenCalledWith({from: 'foo@riot.com', action :'delete', jid :'bar@riot.com'});
            });

            it('fires "xmpp:roster:suggestion:modify" when a roster suggestion to modify a roster item is received', function () {
                var suggestedHandler = jasmine.createSpy('suggestedHandler'),
                    suggestion = $msg({from: 'foo@riot.com'})
                        .c('x', {xmlns: Strophe.NS.ROSTERX})
                        .c('item', {action: 'modify', jid: 'bar@riot.com'})
                        .c('groups', {}, 'Jarnians');
                connection.roster.bind('xmpp:roster:suggestion:modify', suggestedHandler);
                xmppMocker.receive(connection, suggestion);
                expect(suggestedHandler).toHaveBeenCalledWith({from: 'foo@riot.com', action :'modify', jid :'bar@riot.com', groups :['Jarnians']});
            });
        });
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);