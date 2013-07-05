//    XMPP plugins for Strophe v0.3

//    (c) 2012-2013 Yiorgis Gozadinos.
//    strophe.plugins is distributed under the MIT license.
//    http://github.com/ggozad/strophe.plugins


// Helpers for dealing with
// [XEP-0049: vcard-temp](http://xmpp.org/extensions/xep-0049.html)

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'underscore', 'backbone', 'strophe'], function ($, _, Backbone, Strophe) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return factory($, _, Backbone, Strophe);
        });
    } else {
        // Browser globals
        factory(root.$, root._, root.Backbone, root.Strophe);
    }
}(this,function ($, _, Backbone, Strophe) {

    Strophe.addConnectionPlugin('Private', {

        _connection: null,

        init: function (conn) {
            this._connection = conn;
            Strophe.addNamespace('PRIVATE', "jabber:iq:private");
        },

        // **get** returns the value of `key` on the namespace `ns`,
        // or `undefined` if there is no stored value.
        get: function (key, ns) {

            var d = $.Deferred(),
                iq = $iq({ type: 'get', id: this._connection.getUniqueId('private')})
                    .c('query', { xmlns: Strophe.NS.PRIVATE })
                    .c(key, { xmlns: ns + ':' + key});
            this._connection.sendIQ(iq.tree(), function (response) {
                    var value = $(key + '[xmlns="' + ns + ':' + key + '"] > value', response).text();
                    value = value ? JSON.parse(value) : undefined;
                    d.resolve(value);
                }, d.reject);
            return d.promise();
        },

        // **set** sets the `key` on the namespace `ns` to `value`. `value` can be any JSON-ifiable object.
        set: function (key, ns, value) {
            var d = $.Deferred(), iq;
            value = JSON.stringify(value);
            iq = $iq({type: 'set', id: this._connection.getUniqueId('private')})
                .c('query', {xmlns: 'jabber:iq:private'})
                .c(key, {xmlns: ns + ':' + key})
                .c('value', value);
            this._connection.sendIQ(iq.tree(), d.resolve, d.reject);
            return d.promise();
        }
    });

}));