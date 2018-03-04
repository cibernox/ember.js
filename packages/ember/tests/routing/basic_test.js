import { getOwner } from 'ember-utils';
import Logger from 'ember-console';
import { Controller } from 'ember-runtime';
import { Route } from 'ember-routing';
import {
  run
} from 'ember-metal';
import {
  Component,
  setTemplates,
  setTemplate
} from 'ember-glimmer';
import { ENV } from 'ember-environment';
import { compile } from 'ember-template-compiler';
import { Application, Engine } from 'ember-application';
import { getTextOf } from 'internal-test-helpers';

let Router, App, router, registry, container, originalLoggerError, originalRenderSupport, rootElement;

function bootApplication() {
  router = container.lookup('router:main');
  run(App, 'advanceReadiness');
}

function handleURL(assert, path) {
  return run(() => {
    return router.handleURL(path).then(function(value) {
      assert.ok(true, 'url: `' + path + '` was handled');
      return value;
    }, function(reason) {
      assert.ok(false, 'failed to visit:`' + path + '` reason: `' + QUnit.jsDump.parse(reason));
      throw reason;
    });
  });
}

QUnit.module('Basic Routing', {
  beforeEach() {
    run(() => {
      App = Application.create({
        name: 'App',
        rootElement: '#qunit-fixture'
      });

      rootElement = document.getElementById('qunit-fixture');

      App.deferReadiness();

      App.Router.reopen({
        location: 'none'
      });

      Router = App.Router;

      App.LoadingRoute = Route.extend({
      });

      registry = App.__registry__;
      container = App.__container__;

      setTemplate('application', compile('{{outlet}}'));
      setTemplate('home', compile('<h3 class="hours">Hours</h3>'));
      setTemplate('homepage', compile('<h3 class="megatroll">Megatroll</h3><p>{{model.home}}</p>'));
      setTemplate('camelot', compile('<section><h3 class="silly">Is a silly place</h3></section>'));

      originalLoggerError = Logger.error;
      originalRenderSupport = ENV._ENABLE_RENDER_SUPPORT;

      ENV._ENABLE_RENDER_SUPPORT = true;
    });
  },

  afterEach() {
    run(() => {
      App.destroy();
      App = null;

      setTemplates({});
      Logger.error = originalLoggerError;
      ENV._ENABLE_RENDER_SUPPORT = originalRenderSupport;
    });
  }
});

QUnit.test('Can this.render({into:...}) the render helper', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('sidebar', compile('<div class="sidebar">{{outlet}}</div>'));
  setTemplate('index', compile('other'));
  setTemplate('bar', compile('bar'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'sidebar' });
    },
    actions: {
      changeToBar() {
        this.disconnectOutlet({
          parentView: 'sidebar',
          outlet: 'main'
        });
        this.render('bar', { into: 'sidebar' });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.sidebar')), 'other');
  run(router, 'send', 'changeToBar');
  assert.equal(getTextOf(rootElement.querySelector('.sidebar')), 'bar');
});

QUnit.test('Can disconnect from the render helper', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('sidebar', compile('<div class="sidebar">{{outlet}}</div>'));
  setTemplate('index', compile('other'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'sidebar' });
    },
    actions: {
      disconnect: function() {
        this.disconnectOutlet({
          parentView: 'sidebar',
          outlet: 'main'
        });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.sidebar')), 'other');
  run(router, 'send', 'disconnect');
  assert.equal(getTextOf(rootElement.querySelector('.sidebar')), '');
});

QUnit.test('Can this.render({into:...}) the render helper\'s children', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('sidebar', compile('<div class="sidebar">{{outlet}}</div>'));
  setTemplate('index', compile('<div class="index">{{outlet}}</div>'));
  setTemplate('other', compile('other'));
  setTemplate('bar', compile('bar'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'sidebar' });
      this.render('other', { into: 'index' });
    },
    actions: {
      changeToBar() {
        this.disconnectOutlet({
          parentView: 'index',
          outlet: 'main'
        });
        this.render('bar', { into: 'index' });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.sidebar .index')), 'other');
  run(router, 'send', 'changeToBar');
  assert.equal(getTextOf(rootElement.querySelector('.sidebar .index')), 'bar');
});

QUnit.test('Can disconnect from the render helper\'s children', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('sidebar', compile('<div class="sidebar">{{outlet}}</div>'));
  setTemplate('index', compile('<div class="index">{{outlet}}</div>'));
  setTemplate('other', compile('other'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'sidebar' });
      this.render('other', { into: 'index' });
    },
    actions: {
      disconnect() {
        this.disconnectOutlet({
          parentView: 'index',
          outlet: 'main'
        });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.sidebar .index')), 'other');
  run(router, 'send', 'disconnect');
  assert.equal(getTextOf(rootElement.querySelector('.sidebar .index')), '');
});

QUnit.test('Can this.render({into:...}) nested render helpers', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  expectDeprecation(() => {
    setTemplate('sidebar', compile('<div class="sidebar">{{render "cart"}}</div>'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('cart', compile('<div class="cart">{{outlet}}</div>'));
  setTemplate('index', compile('other'));
  setTemplate('baz', compile('baz'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'cart' });
    },
    actions: {
      changeToBaz() {
        this.disconnectOutlet({
          parentView: 'cart',
          outlet: 'main'
        });
        this.render('baz', { into: 'cart' });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.cart')), 'other');
  run(router, 'send', 'changeToBaz');
  assert.equal(getTextOf(rootElement.querySelector('.cart')), 'baz');
});

QUnit.test('Can disconnect from nested render helpers', function(assert) {
  expectDeprecation(/Rendering into a {{render}} helper that resolves to an {{outlet}} is deprecated./);

  expectDeprecation(() => {
    setTemplate('application', compile('{{render "sidebar"}}'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  expectDeprecation(() => {
    setTemplate('sidebar', compile('<div class="sidebar">{{render "cart"}}</div>'));
  }, /Please refactor [\w\{\}"` ]+ to a component/);

  setTemplate('cart', compile('<div class="cart">{{outlet}}</div>'));
  setTemplate('index', compile('other'));

  App.IndexRoute = Route.extend({
    renderTemplate() {
      this.render({ into: 'cart' });
    },
    actions: {
      disconnect() {
        this.disconnectOutlet({
          parentView: 'cart',
          outlet: 'main'
        });
      }
    }
  });

  bootApplication();
  assert.equal(getTextOf(rootElement.querySelector('.cart')), 'other');
  run(router, 'send', 'disconnect');
  assert.equal(getTextOf(rootElement.querySelector('.cart')), '');
});

QUnit.test('Components inside an outlet have their didInsertElement hook invoked when the route is displayed', function(assert) {
  setTemplate('index', compile('{{#if showFirst}}{{my-component}}{{else}}{{other-component}}{{/if}}'));

  let myComponentCounter = 0;
  let otherComponentCounter = 0;
  let indexController;

  App.IndexController = Controller.extend({
    showFirst: true
  });

  App.IndexRoute = Route.extend({
    setupController(controller) {
      indexController = controller;
    }
  });

  App.MyComponentComponent = Component.extend({
    didInsertElement() {
      myComponentCounter++;
    }
  });

  App.OtherComponentComponent = Component.extend({
    didInsertElement() {
      otherComponentCounter++;
    }
  });

  bootApplication();

  assert.strictEqual(myComponentCounter, 1, 'didInsertElement invoked on displayed component');
  assert.strictEqual(otherComponentCounter, 0, 'didInsertElement not invoked on displayed component');

  run(() => indexController.set('showFirst', false));

  assert.strictEqual(myComponentCounter, 1, 'didInsertElement not invoked on displayed component');
  assert.strictEqual(otherComponentCounter, 1, 'didInsertElement invoked on displayed component');
});

QUnit.test('Doesnt swallow exception thrown from willTransition', function(assert) {
  assert.expect(1);
  setTemplate('application', compile('{{outlet}}'));
  setTemplate('index', compile('index'));
  setTemplate('other', compile('other'));

  Router.map(function() {
    this.route('other', function() {
    });
  });

  App.IndexRoute = Route.extend({
    actions: {
      willTransition() {
        throw new Error('boom');
      }
    }
  });

  bootApplication();

  assert.throws(() => {
    run(() => router.handleURL('/other'));
  }, /boom/, 'expected an exception but none was thrown');
});

QUnit.test('Exception if outlet name is undefined in render and disconnectOutlet', function() {
  App.ApplicationRoute = Route.extend({
    actions: {
      showModal() {
        this.render({
          outlet: undefined,
          parentView: 'application'
        });
      },
      hideModal() {
        this.disconnectOutlet({
          outlet: undefined,
          parentView: 'application'
        });
      }
    }
  });

  bootApplication();

  expectAssertion(() => {
    run(() => router.send('showModal'));
  }, /You passed undefined as the outlet name/);

  expectAssertion(() => {
    run(() => router.send('hideModal'));
  }, /You passed undefined as the outlet name/);
});

QUnit.test('Route serializers work for Engines', function(assert) {
  assert.expect(2);

  // Register engine
  let BlogEngine = Engine.extend();
  registry.register('engine:blog', BlogEngine);

  // Register engine route map
  let postSerialize = function(params) {
    assert.ok(true, 'serialize hook runs');
    return {
      post_id: params.id
    };
  };
  let BlogMap = function() {
    this.route('post', { path: '/post/:post_id', serialize: postSerialize });
  };
  registry.register('route-map:blog', BlogMap);

  Router.map(function() {
    this.mount('blog');
  });

  bootApplication();

  assert.equal(router._routerMicrolib.generate('blog.post', { id: '13' }), '/blog/post/13', 'url is generated properly');
});

QUnit.test('Defining a Route#serialize method in an Engine throws an error', function(assert) {
  assert.expect(1);

  // Register engine
  let BlogEngine = Engine.extend();
  registry.register('engine:blog', BlogEngine);

  // Register engine route map
  let BlogMap = function() {
    this.route('post');
  };
  registry.register('route-map:blog', BlogMap);

  Router.map(function() {
    this.mount('blog');
  });

  bootApplication();

  let PostRoute = Route.extend({ serialize() {} });
  container.lookup('engine:blog').register('route:post', PostRoute);

  assert.throws(() => router.transitionTo('blog.post'), /Defining a custom serialize method on an Engine route is not supported/);
});

QUnit.test('App.destroy does not leave undestroyed views after clearing engines', function(assert) {
  assert.expect(4);

  let engineInstance;
  // Register engine
  let BlogEngine = Engine.extend();
  registry.register('engine:blog', BlogEngine);
  let EngineIndexRoute = Route.extend({
    init() {
      this._super(...arguments);
      engineInstance = getOwner(this);
    }
  });

  // Register engine route map
  let BlogMap = function() {
    this.route('post');
  };
  registry.register('route-map:blog', BlogMap);

  Router.map(function() {
    this.mount('blog');
  });

  bootApplication();

  let engine = container.lookup('engine:blog');
  engine.register('route:index', EngineIndexRoute);
  engine.register('template:index', compile('Engine Post!'));

  handleURL(assert, '/blog');

  let route = engineInstance.lookup('route:index');

  run(router, 'destroy');
  assert.equal(router._toplevelView, null, 'the toplevelView was cleared');

  run(route, 'destroy');
  assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');

  run(App, 'destroy');
  assert.equal(router._toplevelView, null, 'the toplevelView was not reinitialized');
});

QUnit.test('Generated route should be an instance of App.Route if provided', function (assert) {
  let generatedRoute;

  Router.map(function () {
    this.route('posts');
  });

  App.Route = Route.extend();

  bootApplication();

  handleURL(assert, '/posts');

  generatedRoute = container.lookup('route:posts');

  assert.ok(generatedRoute instanceof App.Route, 'should extend the correct route');
});

QUnit.test('Exception during load of non-initial route is not swallowed', function (assert) {
  Router.map(function () {
    this.route('boom');
  });
  let lookup = container.lookup;
  container.lookup = function () {
    if (arguments[0] === 'route:boom') {
      throw new Error('boom!');
    }
    return lookup.apply(this, arguments);
  };
  App.BoomRoute = Route.extend({
    init() {
      throw new Error('boom!');
    }
  });
  bootApplication();
  assert.throws(() => run(router, 'transitionTo', 'boom'));
});

QUnit.test('Exception during load of initial route is not swallowed', function (assert) {
  Router.map(function () {
    this.route('boom', { path: '/' });
  });
  let lookup = container.lookup;
  container.lookup = function () {
    if (arguments[0] === 'route:boom') {
      throw new Error('boom!');
    }
    return lookup.apply(this, arguments);
  };
  App.BoomRoute = Route.extend({
    init() {
      throw new Error('boom!');
    }
  });
  assert.throws(() => bootApplication(), /\bboom\b/);
});
