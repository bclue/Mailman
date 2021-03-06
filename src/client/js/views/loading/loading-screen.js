/**
 * This module exports the LoadingScreen object as a singleton.
 *
 * @author {@link https://github.com/j-rewerts|Jared Rewerts}
 * @module
 */


var baseHTML = require('./loading-screen.html');
var Util = require('../../util/util.js');



/**
 * This object is a loading screen with a fairly simple animation.
 *
 * @constructor
 */
var LoadingScreen = function() {
  // private variables
  var initialized = false;
  var self = this;
  var MIN_DISPLAY = 5000;
  var elapsed = false;

  // jQuery objects
  var base = $(baseHTML);

  //***** private methods *****//

  //***** public methods *****//

  /**
   * Initializes the LoadingScreen. This MUST be called.
   *
   * @param  {jquery} appendTo The jquery object to append this to.
   */
  this.init = function(appendTo) {
    if (initialized) {
      return;
    }

    appendTo.append(base);
    initialized = true;
  };

  /**
   * Hides the loading screen.
   *
   */
  this.hide = function() {

    if (elapsed) {
      base.hide('fade', {}, 1000);
      elapsed = false;
    }
    else {
      setTimeout(function() {
        self.hide();
      }, 1000);
    }
  };

  /**
   * Shows the loading screen.
   *
   */
  this.show = function() {
    Util.setHidden(base, false);

    setTimeout(function() {
      elapsed = true;
    }, MIN_DISPLAY);
  };

};


/** */
module.exports = new LoadingScreen();
