// TODO(akavel): "use strict"; ?

var RN = require('react-native');
// FIXME(akavel): unify 'require' vs 'import', etc.; I'm a total JS noob
import { AppRegistry } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge.js';

// var DEBUGF = function(args)
// {
//   console.log(`** ${args.callee}(${JSON.stringify(args)})`);
// }
var DEBUGF = function() {};

function prepare()
{
  if (typeof document !== 'undefined')
  {
    // TODO(akavel): add support for multiple docs; if 'Object' and document.constructor == ExpoDOM, then should be OK
    throw ('Cannot create new Elm-RN bridge, global document is already set to: ' + document);
  }
  document = new ExpoDocument();

  bridgeEvents();
}

// bridge connects an Elm program to a React Native root element.
// WARNING: Bridge works by exploiting low level internal mechanisms of both
// Elm and React Native / Expo. It is thus potentially highly fragile and
// dependant on exact versions of Elm, RN and Expo. Currently, bridge is tested
// to work with: Elm 0.18, RN 0.55, Expo [TODO].[TODO].
function bridge(elmMainModule)
{
  // Intercept all calls to AppRegistry.registerComponent(). If a caller (RN
  // runtime) tries to register a 'main' function, inject our own function
  // instead.
  var oldf = AppRegistry.registerComponent;
  AppRegistry.registerComponent = function(appKey, componentProvider, section)
  {
    if (appKey !== 'main')
    {
      // Default behavior - run original registerComponent.
      return oldf(appKey, componentProvider, section);
    }
    // Our new 'main' function will replace the one provided by RN.
    var main = function(appParameters)
    {
      // ExpoDOM exposes a DOM-like API to RN nodes/views. Here, we wrap the
      // root RN node in ExpoDOM, and run the provided Elm.Main module on it.
      var fakeDOM = new ExpoDOM(appParameters.rootTag);
      fakeDOM._inflated = true;
      fakeDOM._root = appParameters.rootTag;
      elmMainModule.embed(fakeDOM);
    };
    // TODO(akavel): choice below seems to depend on RN version? or what?
    // return AppRegistry.registerRunnable(appKey, {run: main});
    return AppRegistry.registerRunnable(appKey, main);
  };
}

function bridgeEvents()
{
  console.log('...bridgeEvents init');
  var oldEmitter = BatchedBridge.getCallableModule('RCTEventEmitter');
  // NOTE(akavel): It seems we must do a copy of object properties here, as
  // otherwise a simple assignment of .receiveTouches didn't work (maybe the
  // object is made immutable somehow?)
  var newEmitter = {};
  Object.keys(oldEmitter).forEach(function(key) {
    newEmitter[key] = oldEmitter[key];
  });
  // TODO(akavel): what is 'changedIndices', and why 'touches' is an array? Is
  // it for multi-touch?
  newEmitter.receiveTouches = function(name, touches, changedIndices)
  {
    console.log(`...receiveTouches: args=${JSON.stringify(arguments)}`);
    // Translate RN touch events to DOM mouse events
    if (touchToMouse.hasOwnProperty(name))
    {
      // TODO(akavel): should we first process DOM handlers, or global handlers?
      // Also, how does stopPropagation work between them?
      // TODO(akavel): handle multi-touch
      // TODO(akavel): generate 'click' events
      // TODO(akavel): handle all touching in similar way as in RN (esp. scrolling)
      var event = {
        pageX: (touches[0].pageX + 0.5)|0,
        pageY: (touches[0].pageY + 0.5)|0,
        stopPropagation: function() { event._stopPropagation = true; },
        _stopPropagation: false,
      };

      // DOM handlers
      // TODO(akavel): find and understand com.facebook.react.uimanager.TouchTargetHelper#findTouchTargetView
      // TODO(akavel): findTouchTargetViewWithPointerEvents does some checks, so it may be important to try to please it
      var view = views[touches[0].target];
      if (view)
      {
        for (; view._tag !== view._root; view = view.parentNode)
        {
          console.log(`...bubbling mouseEvent: ${touchToMouse[name]} @ view ${view._tag}`);
          var handlers = view._handlers;
          if (!handlers)
            continue;
          handlers = handlers[touchToMouse[name]];
          if (!handlers)
            continue;
          for (var i = 0; i < handlers.length; i++)
            handlers[i].apply(null, [event]);
          if (event._stopPropagation)
            break;
        }
      }

      // Global handlers
      var handlers = mouseEventHandlers[touchToMouse[name]];
      // console.log(`...mouseEvent: ${touchToMouse[name]} x${handlers.length} (${JSON.stringify(event)})`);
      // TODO(akavel): call all, or only first?
      if (handlers.length > 0)
      {
        handlers[0].apply(null, [event]);
      }
    }
  };
  BatchedBridge.registerCallableModule('RCTEventEmitter', newEmitter);
}

var touchToMouse = {
  topTouchStart: 'mousedown',
  topTouchMove: 'mousemove',
  topTouchEnd: 'mouseup',
}

var mouseEventHandlers = {
  mousedown: [],
  mousemove: [],
  mouseup: [],
}

function ExpoDocument()
{
}
ExpoDocument.prototype.createDocumentFragment = function()
{
  return new ExpoDOM('FRAG');
}
ExpoDocument.prototype.addEventListener = function(name, handler)
{
  if (!mouseEventHandlers.hasOwnProperty(name))
  {
    // TODO(akavel): throw an exception? or what?... :/
    throw `...WARN: elm-rn-bridge/addEventListener: event name '${name}' not supported!`;
  }
  // TODO(akavel): keep more than 1 handler?
  mouseEventHandlers[name].length = 0;
  mouseEventHandlers[name].push(handler);
  console.log(`...addEventListener: added handler! ${name}=${handler}`);
}
ExpoDocument.prototype.removeEventListener = function(name, handler)
{
  if (!mouseEventHandlers.hasOwnProperty(name))
  {
    // TODO(akavel): throw an exception? or what?... :/
    throw `...WARN: elm-rn-bridge/removeEventListener: event name '${name}' not supported!`;
  }
  if (mouseEventHandlers[name].length > 0 &&
    mouseEventHandlers[name][0] == handler)
  {
    // TODO(akavel): somehow test if we entered this block and if it worked
    mouseEventHandlers[name].length = 0;
  }
}
ExpoDocument.prototype.createElement = function(name)
{
  var child = new ExpoDOM(allocateTag());
  child._name = name;
  child._attrs = {};
  // child._root = this._tag;
  // RN.UIManager.createView(child._tag, name, this._tag, {});
  return child;
}

// Java: Integer.MAX_VALUE/2, adjusted so that nextReactTag%10 == 3, to step around special RN values
// Other than that, the code is copied from RN source.
if (typeof elmRN_nextReactTag === 'undefined') {
  // NOTE: a global variable, to hopefully better support dynamic/hot reloading of Expo & RN during development
  elmRN_nextReactTag = (1<<30)-1;
}
function allocateTag() {
  var tag = elmRN_nextReactTag;
  1 === tag % 10 && (tag += 2);
  elmRN_nextReactTag = tag + 2;
  return tag;
}

// TODO(akavel): inspect VirtualDom: makeStepper(), setTimeout(), applyEvents()

// TODO(akavel): make sure I'm not shooting myself in the foot somehow as a JS newb :/
function ExpoDOM(tag)
{
  // _tag is the node ID in React Native system (passed to createView(), etc.)
  this._tag = tag;
  // NOTE(akavel): the following are public properties, part of DOM specification
  this.childNodes = [];
  this.lastChild = undefined;
  this.parentNode = undefined;
}
ExpoDOM.prototype._inflate = function()
{
  if (this.parentNode && this.parentNode._inflated && !this._inflated)
  {
    // TODO(akavel): prepend below field with '_'
    this._root = this.parentNode._root;
    RN.UIManager.createView(this._tag, this._name, this._root, Object.assign({}, this._attrs));
    this._inflated = true;
    var childTags = [];
    for (var i = 0; i < this.childNodes.length; i++)
    {
      var child = this.childNodes[i];
      child._inflate();
      childTags.push(child._tag);
      // RN.UIManager.manageChildren(this._tag, [], [], [child._tag], [i], []);
    }
    // NOTE(akavel): optimization attempt; if this makes problems, try reverting to manageChildren above
    if (childTags.length > 0)
    {
      RN.UIManager.setChildren(this._tag, childTags);
    }
    views[this._tag] = this;
  }
}
ExpoDOM.prototype._orphanize = function()
{
  // TODO(akavel): just: `if (this.parentNode)` ?
  if (this._inflated && this.parentNode)
  {
    this.parentNode.removeChild(this);
  }
}
ExpoDOM.prototype._resetLast = function()
{
  var n = this.childNodes.length;
  if (n > 0)
  {
    this.lastChild = this.childNodes[n-1];
  }
  else
  {
    delete this.lastChild;
  }
}

ExpoDOM.prototype.appendChild = function(child)
{
  this._inflate();
  if (child._tag === 'FRAG')
  {
    // TODO(akavel): optimize this
    for (var i = 0; i < child.childNodes.length; i++)
    {
      this.appendChild(child.childNodes[i]);
    }
    return;
  }
  child._orphanize();
  this.childNodes.push(child);
  child.parentNode = this;
  this.lastChild = child;
  child._inflate();
  if (this._inflated)
  {
    RN.UIManager.manageChildren(this._tag, [], [], [child._tag], [this.childNodes.length-1], []);
  }
}
ExpoDOM.prototype.insertBefore = function(newNode, refNode)
{
  if (refNode === null)
  {
    return this.appendNode(newNode);
  }
  var i = this.childNodes.indexOf(refNode);
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  if (i > -1)
  {
    newNode._orphanize();
    this.childNodes.splice(i, 0, newNode);
    newNode.parentNode = this;
    this._resetLast();
    newNode._inflate();
    if (this._inflated)
    {
      RN.UIManager.manageChildren(this._tag, [], [], [newNode._tag], [i], []);
    }
  }
}
ExpoDOM.prototype.removeChild = function(child)
{
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  var i = this.childNodes.indexOf(child);
  if (i > -1)
  {
    this.childNodes.splice(i, 1);
    delete child.parentNode;
    if (this._inflated)
    {
      // FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
      RN.UIManager.manageChildren(this._tag, [], [], [], [], [i]);
    }
  }
  this._resetLast();
}
ExpoDOM.prototype.replaceChild = function(newChild, oldChild)
{
  // newChild._orphanize();
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  var i = this.childNodes.indexOf(oldChild);
  if (i > -1)
  {
    // TODO(akavel): optimize
    this.insertBefore(newChild, oldChild);
    this.removeChild(oldChild);
    // this.childNodes[i] = newChild;
    // newChild.parentNode = this;
    // delete oldChild.parentNode;
    // newChild._inflate();
    // if (this._inflated)
    // {
    // 	// FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
    // 	RN.UIManager.manageChildren(this._tag, [], [], [newChild._tag], [i], [i]);
    // }
  }
  // this._resetLast();
}

ExpoDOM.prototype.setAttribute = function(prefixedKey, value)
{
  DEBUGF(arguments);
  // Workaround for:
  //   Error while updating property 'flex' in shadow node of type: RCTView
  //
  //   java.lang.String cannot be cast to java.lang.Double
  //
  //   updateShadowNodeProp - ViewManagersPropertyCache.java:113
  //   setProperty - ViewmanagerPropertyUpdater.java:154
  //   ...
  // FIXME(akavel): add more types, all that are necessary for all views in Java
  var key = prefixedKey.substring(1);
  this._attrs[key] = cast[prefixedKey.charAt(0)](value);
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, Object.assign({}, this._attrs));
  }
}
var cast = {
  D: function(x) { return +(x); },  // java.lang.Double
  S: function(x) { return x; },     // java.lang.String
}
ExpoDOM.prototype.removeAttribute = function(key)
{
  DEBUGF(arguments);
  delete this._attrs[key];
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, Object.assign({}, this._attrs));
  }
}
ExpoDOM.prototype.replaceData = function(_1, _2, text)
{
  DEBUGF(arguments);
  this._attrs.text = text;
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, Object.assign({}, this._attrs));
  }
}


// Global tracker of all inflated views, for events dispatching purposes.
// FIXME(akavel): remove from this list when a view is destroyed!
var views = {
};


module.exports = {
  prepare: prepare,
  bridge: bridge,
};
