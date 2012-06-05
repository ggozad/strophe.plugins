//    XMPP plugins for Strophe v0.1

//    (c) 2012 Yiorgis Gozadinos, Riot AS.
//    strophe.plugins is distributed under the MIT license.
//    http://github.com/ggozad/strophe.plugins


// Roster plugin partially implementing
// [Roster management](http://xmpp.org/rfcs/rfc6121.html) & [Roster Item Exchange](http://xmpp.org/extensions/xep-0144.html)

(function ($, _, Backbone, Strophe) {

    Strophe.addConnectionPlugin('roster', {
        _connection: null,

        init: function (conn) {
            this._connection = conn;
            Strophe.addNamespace('ROSTERX', 'http://jabber.org/protocol/rosterx');
            _.extend(this, Backbone.Events);
        },

        statusChanged: function (status, condition) {
            if (status === Strophe.Status.CONNECTED || status === Strophe.Status.ATTACHED) {
                // Subscribe to Presence
                this._connection.addHandler(this._onReceivePresence.bind(this), null, 'presence', null, null, null);
                // Subscribe to Roster Item exchange messages
                this._connection.addHandler(this._onRosterSuggestion.bind(this), Strophe.NS.ROSTERX, 'message', null);
            }
        },

        // **get** resolves with a dictionary of the authenticated user's roster.
        get: function () {
            var d = $.Deferred(), roster,
                iq = $iq({type: 'get',  id: this._connection.getUniqueId('roster')})
                    .c('query', {xmlns: Strophe.NS.ROSTER});
            this._connection.sendIQ(iq, function (result) {
                roster = {};
                $.each($('item', result), function (idx, item) {
                    roster[item.getAttribute('jid')] = {
                        subscription: item.getAttribute('subscription'),
                        name: item.getAttribute('name'),
                        groups: $.map($('group', item), function (group, idx) { return $(group).text(); })
                    };
                });
                d.resolve(roster);
            }, d.reject);
            return d.promise();
        },

        // **subscribe** to the user's with JID `jid` presence
        subscribe: function (jid) {
            this._connection.send($pres({to: jid, type: "subscribe"}));
        },

        // **unsubscribe** from the user's with JID `jid` presence
        unsubscribe: function (jid) {
            this._connection.send($pres({to: jid, type: "unsubscribe"}));
        },

        // **authorize** the user with JID `jid` to subscribe to the authenticated user's presence
        authorize: function (jid) {
            this._connection.send($pres({to: jid, type: "subscribed"}));
        },

        // **unauthorize** the user with JID `jid` to subscribe to the authenticated user's presence
        unauthorize: function (jid) {
            this._connection.send($pres({to: jid, type: "unsubscribed"}));
        },

        // **update** the authenticated user's roster. Takes as arguments `jid` the JID of the user to update,
        // `name` the "nick" given to the user, and `groups` a list of groups the user belongs to.
        update: function (jid, name, groups) {
            var d = $.Deferred(), i,
                iq = $iq({type: 'set', id: this._connection.getUniqueId('roster')})
                    .c('query', {xmlns: Strophe.NS.ROSTER})
                    .c('item', {jid: jid, name: name});
            for (i = 0; i < groups.length; i++) {
                iq.c('group').t(groups[i]).up();
            }
            this._connection.sendIQ(iq, d.resolve, d.reject);
            return d.promise();
        },

        // **_onReceivePresence** will capture all presence events.
        // It will re-trigger to subscribers more specific events, see inline comments.
        _onReceivePresence : function (presence) {
            var jid = presence.getAttribute('from'),
                type = presence.getAttribute('type'),
                show = (presence.getElementsByTagName('show').length !== 0) ? Strophe.getText(presence.getElementsByTagName('show')[0]) : null,
                status =  (presence.getElementsByTagName('status').length !== 0) ? Strophe.getText(presence.getElementsByTagName('status')[0]) : null,
                priority = (presence.getElementsByTagName('priority').length !== 0) ? Strophe.getText(presence.getElementsByTagName('priority')[0]) : null;

            // Always trigger an `xmpp:presence` event, regardless of the type of the event.
            this.trigger('xmpp:presence', {
                jid: jid,
                type: type,
                show: show,
                status: status,
                priority: priority
            });

            switch (type) {
                // Trigger an `xmpp:presence:available` event when a user becomes available.
                case null:
                    this.trigger('xmpp:presence:available', {
                        jid: jid,
                        show: show,
                        status: status,
                        priority: priority
                    });
                    break;
                // Trigger an `xmpp:presence:unavailable` event when a user becomes unavailable.
                case 'unavailable':
                    this.trigger('xmpp:presence:unavailable', {jid: jid});
                    break;
                // Trigger an `xmpp:presence:subscriptionrequest` event when a user requests to subscribe to the
                // authenticated user's presence.
                case 'subscribe':
                    this.trigger('xmpp:presence:subscriptionrequest', {jid: jid});
                    break;

                default:
                    break;
            }
            return true;
        },

        // **_onRosterSuggestion** captures Roster Item exchange events.
        // It will re-trigger to subscribers more specific events, see inline comments.
        _onRosterSuggestion: function (msg) {
            var self = this,
                from = $(msg).attr('from'),
                suggestion,
                groups;

            $.each($('item', msg), function (idx, item) {
                suggestion = {from: from};
                _.each(item.attributes, function (attr) {
                    suggestion[attr.name] = attr.value;
                });
                groups = _.map($('groups', item), function (group) { return group.textContent;});
                if (groups.length) {
                    suggestion.groups = groups;
                }

                // Always trigger an `xmpp:roster:suggestion` event.
                self.trigger('xmpp:roster:suggestion', suggestion);

                switch (suggestion.action) {
                    // Trigger an `xmpp:roster:suggestion:add` event when a suggestion
                    // to add a user is received.
                    case 'add':
                        self.trigger('xmpp:roster:suggestion:add', suggestion);
                        break;
                    // Trigger an `xmpp:roster:suggestion:delete` event when a suggestion
                    // to delete a user is received.
                    case 'delete':
                        self.trigger('xmpp:roster:suggestion:delete', suggestion);
                        break;
                    // Trigger an `xmpp:roster:suggestion:modify` event when a suggestion
                    // to modify a user's properties in the roster is received.
                    case 'modify':
                        self.trigger('xmpp:roster:suggestion:modify', suggestion);
                        break;
                    default:
                        break;
                }
            });
            return true;
        }
    });
})(this.jQuery, this._, this.Backbone, this.Strophe);
