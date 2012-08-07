(function ($, _, Backbone, Strophe, jasmine, xmppMocker) {

    describe('PubSub Plugin', function () {

        var successHandler, errorHandler, connection, request, response, promise;

        beforeEach(function () {
            connection = xmppMocker.mockConnection();
            successHandler = jasmine.createSpy('successHandler');
            errorHandler = jasmine.createSpy('errorHandler');
            request = '';
        });

        it('fires a "xmpp:pubsub:item-published" event when a PEP message is received for a newly published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            var itemPublishedOnNodeHandler = jasmine.createSpy('itemPublishedOnNodeHandler');

            connection.PubSub.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published:anode', itemPublishedOnNodeHandler);

            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'})
                .c('entry').t('some_text');

            xmppMocker.receive(connection, message);
            expect(itemPublishedHandler).wasCalled();
            var argument = itemPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry.isEqualNode($build('entry').t('some_text').tree())).toBeTruthy();
            expect(itemPublishedOnNodeHandler).wasCalled();
            expect(lastPublishedHandler).wasNotCalled();
        });

        it('fires a "xmpp:pubsub:item-published" event when a PEP message is received without a payload with an null entry', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            var itemPublishedOnNodeHandler = jasmine.createSpy('itemPublishedOnNodeHandler');

            connection.PubSub.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published:anode', itemPublishedOnNodeHandler);

            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'});

            xmppMocker.receive(connection, message);
            expect(itemPublishedHandler).wasCalled();
            var argument = itemPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry).toBeNull();
            expect(itemPublishedOnNodeHandler).wasCalled();
            expect(lastPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:last-published-item" event when a PEP message is received for the last published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var lastPublishedOnNodeHandler = jasmine.createSpy('lastPublishedOnNodeHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            connection.PubSub.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:last-published-item:anode', lastPublishedOnNodeHandler);

            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('delay', {xmlns: Strophe.NS.DELAY, stamp: '2011-12-01T10:00:00Z'}).up()
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'})
                .c('entry').t('some_text');
            xmppMocker.receive(connection, message);
            expect(lastPublishedHandler).toHaveBeenCalled();
            var argument = lastPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.timestamp).toEqual('2011-12-01T10:00:00Z');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry.isEqualNode($build('entry').t('some_text').tree())).toBeTruthy();
            expect(lastPublishedOnNodeHandler).toHaveBeenCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:last-published-item" event with a null entry when a PEP message is received without a payload for the last published item', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var lastPublishedOnNodeHandler = jasmine.createSpy('lastPublishedOnNodeHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            connection.PubSub.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published', itemPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:last-published-item:anode', lastPublishedOnNodeHandler);

            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('delay', {xmlns: Strophe.NS.DELAY, stamp: '2011-12-01T10:00:00Z'}).up()
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('item', {id: 'some_id'});
            xmppMocker.receive(connection, message);
            expect(lastPublishedHandler).toHaveBeenCalled();
            var argument = lastPublishedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.timestamp).toEqual('2011-12-01T10:00:00Z');
            expect(argument.id).toEqual('some_id');
            expect(argument.entry).toBeNull();
            expect(lastPublishedOnNodeHandler).toHaveBeenCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('fires the "xmpp:pubsub:item-deleted" event when a PEP message is received for a retracted item', function () {
            var itemDeletedHandler = jasmine.createSpy('itemDeletedHandler');
            var itemDeletedOnNodeHandler = jasmine.createSpy('itemDeletedOnNodeHandler');
            connection.PubSub.bind('xmpp:pubsub:item-deleted', itemDeletedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-deleted:anode', itemDeletedOnNodeHandler);
            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'})
                .c('retract', {id: 'some_id'});
            xmppMocker.receive(connection, message);
            expect(itemDeletedHandler).toHaveBeenCalled();
            var argument = itemDeletedHandler.mostRecentCall.args[0];
            expect(argument.node).toEqual('anode');
            expect(argument.id).toEqual('some_id');
            expect(itemDeletedOnNodeHandler).toHaveBeenCalled();
        });

        it('does not fire an event when a transient PEP message is received', function () {
            var lastPublishedHandler = jasmine.createSpy('lastPublishedHandler');
            var itemPublishedHandler = jasmine.createSpy('itemPublishedHandler');
            connection.PubSub.bind('xmpp:pubsub:last-published-item', lastPublishedHandler);
            connection.PubSub.bind('xmpp:pubsub:item-published', itemPublishedHandler);

            var message = $msg({from: connection.PubSub.service, to: connection.jid})
                .c('event', {xmlns: Strophe.NS.PUBSUB_EVENT})
                .c('items', {node: 'anode'});
            xmppMocker.receive(connection, message);
            expect(lastPublishedHandler).wasNotCalled();
            expect(itemPublishedHandler).wasNotCalled();
        });

        it('creates a PubSub node with default configuration', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > create', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.createNode('anode', null);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('creates a PubSub node with custom configuration', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > create', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > configure > x > field[var="pubsub#title"] > value', request).text()).toEqual('A node');
                expect($('iq > pubsub > configure > x > field[var="pubsub#max_items"] > value', request).text()).toEqual('1');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.createNode('anode', {'pubsub#title': 'A node', 'pubsub#max_items': 1});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('deletes a PubSub node', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB_OWNER);
                expect($('iq > pubsub > delete', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.deleteNode('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("returns the node's configuration on calling getNodeConfig()", function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB_OWNER);
                expect($('iq > pubsub > configure', request).attr('node')).toEqual('anode');
                var form = new Strophe.x.Form({type: 'form',
                                               fields: [new Strophe.x.Field({'var': 'pubsub#title',
                                                                             'type': 'text-single',
                                                                             'label': 'A friendly name for the node'})]});
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB_OWNER})
                    .c('configure', {node: 'anode'})
                    .cnode(form.toXML())
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.getNodeConfig('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith([{type: 'text-single',
                                                          'var': 'pubsub#title',
                                                          required: false,
                                                          desc: '',
                                                          label: 'A friendly name for the node',
                                                          values: [],
                                                          options : []}]);
        });

        it('returns child nodes of the service on calling discoverNodes() without a node ', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > query', request).attr('xmlns')).toEqual(Strophe.NS.DISCO_ITEMS);
                expect($('iq > query', request).attr('node')).toBeUndefined();
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('query', {xmlns: Strophe.NS.DISCO_ITEMS})
                    .c('item', {jid: connection.PubSub.service, node: 'anode'}).up()
                    .c('item', {jid: connection.PubSub.service, node: 'some_other_node'})
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.discoverNodes(null);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith(['anode', 'some_other_node']);
        });

        it('returns child nodes of the service on calling discoverNodes() on a node', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > query', request).attr('xmlns')).toEqual(Strophe.NS.DISCO_ITEMS);
                expect($('iq > query', request).attr('node')).toEqual('root_node');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('query', {xmlns: Strophe.NS.DISCO_ITEMS, node: 'root_node'})
                    .c('item', {jid: connection.PubSub.service, node: 'anode'}).up()
                    .c('item', {jid: connection.PubSub.service, node: 'some_other_node'})
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.discoverNodes('root_node');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith(['anode', 'some_other_node']);
        });

        it('publishes an xml item on a PubSub node', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > publish', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > publish > item', request).attr('id')).toEqual('some_id');
                expect($('iq > pubsub > publish > item > entry', request).text()).toEqual('Hello world');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('publish', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.publish('anode', $build('entry').t('Hello world').tree(), 'some_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith('some_id');
        });

        it('publishes an atom item on a PubSub node', function () {
            var obj = {
                title: 'An atom',
                geolocation: {latitude: 10.23, longitude: 20.45},
                published: new Date("June 5, 1974 11:13:00 GMT+0200")
            };

            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq > pubsub > publish > item', request).attr('id')).toEqual('some_id');
                expect($('iq > pubsub > publish > item > entry[xmlns="' + Strophe.NS.ATOM + '"]', request).length > 0).toBeTruthy();
                expect($('iq > pubsub > publish > item > entry > updated', request).length > 0).toBeTruthy();
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('publish', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .tree();
                xmppMocker.receive(connection, response);
            });

            promise = connection.PubSub.publishAtom('anode', obj, 'some_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith('some_id');
        });

        it('deletes an item from a PubSub node', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > retract', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > retract > item', request).attr('id')).toEqual('some_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.deleteItem('anode', 'some_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('deletes an item from a PubSub node and notifies when notify is set', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > retract', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > retract', request).attr('notify')).toEqual('true');
                expect($('iq > pubsub > retract > item', request).attr('id')).toEqual('some_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.deleteItem('anode', 'some_id', true);
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('returns the list items of a PubSub node when items() is called', function () {
            var args, items;
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.items('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
            items = args = successHandler.argsForCall[0][0];
            expect(items.length).toEqual(2);
            expect($(items[0]).attr('id')).toEqual('some_id');
            expect($('entry', items[0]).attr('some_attr')).toEqual('some_val');
            expect($(items[0]).text()).toEqual('Hello world.');
        });

        it('requests a max number of items if items() is called with max_items in its options', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > items', request).attr('max_items')).toEqual('10');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.items('anode', {max_items: 10});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('requests specific items if items() is called with a list of item ids in its options', function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                var item_ids = _.map($('iq > pubsub > items > item', request), function (item) { return $(item).attr('id'); });
                expect(item_ids).toEqual(['some_id', 'another_id']);

                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {some_attr: 'some_val'}, 'Hello world.')
                    .up()
                    .c('item', {id: 'another_id'})
                    .c('entry')
                    .c('field').t('Goodbye world.')
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.items('anode', {item_ids: ['some_id', 'another_id']});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it('returns the list items as well as the Result Management Set of a PubSub node when items() is called with `rsm` parameter', function () {
            var args, items, rsm;
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > items', request).attr('node')).toEqual('anode');
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('items', {node: 'anode'})
                    .c('item', {id: 'some_id'})
                    .c('entry', {}, 'Hello world.')
                    .up().up().up()
                    .c('set', {xmlns: Strophe.NS.RSM})
                    .c('first', {}, 'modification@time')
                    .c('last', {}, 'modification@time')
                    .c('count', {}, '4')
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.items('anode', {rsm: {first: 'modification@time', max: 1}});
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
            args = successHandler.argsForCall[0][0];
            items = args.items; rsm = args.rsm;
            expect(items.length).toEqual(1);
            expect($(items[0]).attr('id')).toEqual('some_id');
            expect($(items[0]).text()).toEqual('Hello world.');
            expect(rsm.first).toEqual('modification@time');
            expect(rsm.last).toEqual('modification@time');
            expect(rsm.count).toEqual(4);

        });

        it("subscribes the user's bare JID to a node when subscribe() is called", function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > subscribe', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > subscribe', request).attr('jid')).toEqual(Strophe.getBareJidFromJid(connection.jid));
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.subscribe('anode');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("unsubscribes the user's bare JID from a node when unsubscribe() is called", function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('set');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > unsubscribe', request).attr('node')).toEqual('anode');
                expect($('iq > pubsub > unsubscribe', request).attr('jid')).toEqual(Strophe.getBareJidFromJid(connection.jid));
                expect($('iq > pubsub > unsubscribe', request).attr('subid')).toEqual('sub_id');
                response = $iq({type: 'result', id: $('iq', request).attr('id')});
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.unsubscribe('anode', 'sub_id');
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalled();
        });

        it("returns the user's subscriptions to the service when getSubscriptions() is called", function () {
            spyOn(connection, 'send').andCallFake(function (request) {
                request = xmppMocker.jquerify(request);
                expect($('iq', request).attr('to')).toEqual(connection.PubSub.service);
                expect($('iq', request).attr('type')).toEqual('get');
                expect($('iq > pubsub', request).attr('xmlns')).toEqual(Strophe.NS.PUBSUB);
                expect($('iq > pubsub > subscriptions', request).length).toEqual(1);
                response = $iq({type: 'result', id: $('iq', request).attr('id')})
                    .c('pubsub', {xmlns: Strophe.NS.PUBSUB})
                    .c('subscription', {jid: connection.jid, node: 'anode', subid: '123', subscription: 'subscribed'})
                    .tree();
                xmppMocker.receive(connection, response);
            });
            promise = connection.PubSub.getSubscriptions();
            promise.done(successHandler);
            promise.fail(errorHandler);
            expect(errorHandler).wasNotCalled();
            expect(successHandler).toHaveBeenCalledWith([{jid: connection.jid, node: 'anode', subid: '123', subscription: 'subscribed'}]);
        });

        it('can transform a js Date() to an ISO 8601 formatted string', function () {
            var date = new Date("June 5, 1974 11:13:00 GMT+0200");
            expect(connection.PubSub._ISODateString(date)).toEqual('1974-06-05T09:13:00Z');
        });

        it('can transform a JS object containing strings, numbers, booleans, dates or nested combinations of those, to ATOM format', function () {
            var obj = {
                title: 'An atom',
                geolocation: {latitude: 10.23, longitude: 20.45},
                active: true,
                published: new Date("June 5, 1974 11:13:00 GMT+0200")
            }, atom = connection.PubSub._JsonToAtom(obj);
            var expected = $build('entry', {xmlns: Strophe.NS.ATOM})
                .c('title').t('An atom').up()
                .c('geolocation').c('latitude').t('10.23').up().c('longitude').t('20.45').up().up()
                .c('active').t('true').up()
                .c('published').t('1974-06-05T09:13:00Z')
                .tree();
            expect(atom.isEqualNode(expected)).toBeTruthy();
        });

        it('can transform an ATOM xml to a JSON object', function () {
            var entry = $build('entry', {xmlns: Strophe.NS.ATOM})
                .c('title').t('An atom').up()
                .c('geolocation').c('latitude').t('10.23').up().c('longitude').t('20.45').up().up()
                .c('published').t('1974-06-05T09:13:00Z').up()
                .c('count').t(3)
                .tree();
            expect(connection.PubSub._AtomToJson(entry)).toEqual({
                title: 'An atom',
                geolocation: {latitude: 10.23, longitude: 20.45},
                published: '1974-06-05T09:13:00Z',
                count: 3
            });
        });
        
        it('can transform hyphenated atom keys to camelCase JSON', function () {
           var entry = $build('entry', {xmlns: Strophe.NS.ATOM})
                .c('some-key').t('value')
                .tree();
            expect(connection.PubSub._AtomToJson(entry)).toEqual({
                someKey: 'value'
            });
        });
        
        it('can transform camelCase JSON keys to hyphenated atom', function () {
            var obj = {
                'someKey': 'value'
            }, atom = connection.PubSub._JsonToAtom(obj);
            var expected = $build('entry', {xmlns: Strophe.NS.ATOM})
                .c('some-key').t('value')
                .tree();
            expect(atom.isEqualNode(expected)).toBeTruthy();
        });
        
    });
})(this.jQuery, this._, this.Backbone, this.Strophe, this.jasmine, this.xmppMocker);