import * as querystring from 'querystring';

import * as React from 'react';
import * as q from 'q';
import * as $ from 'jquery';

global.jQuery = global.$ = $;

import 'bootstrap';

import App from '../../src/app';
import config from '../../src/config';
import plugins from '../../src/plugins';

// Server uses express sessions; on the client, we'll persist state in memory.
App.prototype.getState = function(prop) {
  if (prop) {
    return this.state[prop];
  }

  return this.state;
}

App.prototype.setState = function(prop, val) {
  this.state[prop] = val;
  return v;
}

App.prototype.resetState = function(state) {
  this.state = state || {};
}

function buildRequest (url, app) {
  var splitUrl = url.split('?');
  var query = {};

  if(splitUrl.length > 1) {
    query = querystring.parse(splitUrl[1] || '');
  }

  var req = {
    url: url,
    method: 'GET',
    renderSynchronous: false,
    query: query,
    headers: {},
    session: {},
  }

  return req;
}

function changeUrl(href, mountPoint, app, initial) {
  var req = buildRequest(href, app);
  var defer = q.defer();

  if (initial) {
    req.props = app.getState();
  }

  defer.promise.then(function(res) {
    React.render(res.body, mountPoint);
  }).fail(function(res) {
    console.log('failure', arguments);
  });

  app.route(req, defer);
}

$(function() {
  var plugin, p;

  var app = new App(config);

  // Reset to window bootstrapping data
  app.resetState(window.bootstrap);

  if (plugins) {
    for (p in plugins) {
      plugin = plugins[p];
      plugin.register(app);
    }
  }

  var history = window.history || window.location.history;
  var mountPoint = document.getElementById('app-container');

  if (history) {
    $('body').on('click', 'a', function(e) {
      var $link = $(this);
      var href = $link.attr('href');

      // If it has a target=_blank, or an 'external' data attribute, or it's
      // an absolute url, let the browser route rather than forcing a capture.
      if (
        ($link.attr('target') || $link.attr('data-no-route')) ||
        href.indexOf('//') > -1
      ) {
        return;
      }

      e.preventDefault();

      if (href === document.location.pathname) {
        return;
      }

      history.pushState(null, null, href);

      changeUrl(href, mountPoint, app);
    });

    $(window).on('popstate', function(e) {
      changeUrl(location.pathname, mountPoint, app);
    });

    changeUrl(document.location.pathname, mountPoint, app, true);
  }
});