//    XMPP plugins for Strophe v1.0.0

//    (c) 2012-2013 Yiorgis Gozadinos.
//    strophe.plugins is distributed under the MIT license.
//    http://github.com/ggozad/strophe.plugins


// A vCard plugin implementing
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

    Strophe.addConnectionPlugin('vCard', {
        _connection: null,

        init: function (conn) {
            this._connection = conn;
            Strophe.addNamespace('vCard', 'vcard-temp');
        },

        // **_buildvCard** builds an XML vCard from an object.
        _buildvCard: function (dict, parent) {
            var builder;
            if (typeof parent === 'undefined') {
                builder = $build('vCard', {xmlns: Strophe.NS.vCard, version: '2.0'});
            } else {
                builder = $build(parent);
            }
            _.each(dict, function (val, key) {
                if (typeof val === 'object') {
                    builder.cnode(this._buildvCard(val, key)).up();
                } else if (val) {
                    builder.c(key, {}, val);
                } else {
                    builder.c(key).up();
                }
            }, this);
            return builder.tree();
        },

        // **_parsevCard** parses a vCard in XML format and returns an object.
        _parsevCard: function (xml) {
            var dict = {},
                self = this,
                jqEl;
            $(xml).children().each(function (idx, el) {
                jqEl = $(el);
                if (jqEl.children().length) {
                    dict[el.nodeName] = self._parsevCard(el);
                } else {
                    dict[el.nodeName] = jqEl.text();
                }
            });
            return dict;
        },

        // **get** returns the parsed vCard of the user identified by `jid`.
        get: function (jid) {
            var d = $.Deferred(),
                self = this,
                iq = $iq({type: 'get', to: jid, id: this._connection.getUniqueId('vCard')})
                    .c('vCard', {xmlns: Strophe.NS.vCard});

            this._connection.sendIQ(iq.tree(), function (response) {
                var result = $('vCard[xmlns="' + Strophe.NS.vCard + '"]', response);
                if (result.length > 0) {
                    d.resolve(self._parsevCard(result));
                } else {
                    d.reject();
                }
            }, d.reject);
            return d.promise();
        },

        // **set** sets the vCard of the authenticated user by parsing `vcard`.
        set: function (vcard) {
            var d = $.Deferred(),
                iq = $iq({type: 'set', id: this._connection.getUniqueId('vCard')})
                    .cnode(this._buildvCard(vcard));
            this._connection.sendIQ(iq.tree(), d.resolve, d.reject);
            return d.promise();
        },

        // **base64Image** returns the Base64-encoded image from a `url`.
        base64Image: function (url) {
            var d = $.Deferred(),
                img = new Image();
            $(img).error(d.reject);
            $(img).load(function () {
                var ctx,
                    canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                d.resolve(canvas.toDataURL('image/png'));
            }).attr('src', url);
            return d.promise();
        }
    });
}));
