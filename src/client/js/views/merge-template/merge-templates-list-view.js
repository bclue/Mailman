/**
 * This module exports the MergeTemplatesListView object.
 *
 * @author {@link https://github.com/j-rewerts|Jared Rewerts}
 * @module
 */


var baseHTML = require('./merge-templates-list-view.html');
var MergeTemplateListItem = require('./merge-template-list-item.js');
var MergeTemplate = require('../../data/merge-template/merge-template.js');
var MergeTemplateContainer = require('../../data/merge-template-container.js');
var Util = require('../../util/util.js');
var PubSub = require('pubsub-js');
var ActionBar = require('../action-bar/action-bar.js');



/**
 * This view displays all of the MergeTemplates. Each MergeTemplate corresponds to a MergeTemplateListItem.
 * This view responds to the following PubSub events: Rules.delete, Rules.add, Rules.update.
 * This view publishes the following events: Mailman.RulesListView.show.
 * @constructor
 * @param {jquery} appendTo The element this view should be appended to.
 */
var MergeTemplatesListView = function(appendTo, metadataService) {
  // contract block
  if (!appendTo)
    throw "appendTo cannot be null";
  if (!metadataService) {
    throw "metadataService cannot be null";
  }


  // private variables
  var self = this;
  var base = $(baseHTML);
  var listItems = [];
  var mergeTemplates;
  var actionBar = ActionBar;
  var repeatDialog;
  var runDialog;
  var deleteDialog;
  var SPEED_DIAL_VISIBLE = 'is-showing-options';

  // jQuery Objects
  var list = base.find('[data-id="list"]');
  var emptyContainer = base.find('[data-id="empty-container"]');
  var emailButton = base.find('[data-id="plain-text-button"]');
  var documentButton = base.find('[data-id="document-button"]');
  var fabButton = base.find('[data-id="fab-button"]');
  var fabContainer = base.find('[data-id="fab-container"]');

  // Event callbacks
  var deletionCallback;
  var editCallback;
  var previewCallback;
  var runCallback;
  var emailCB;
  var documentCB;
  var repeatCB;
  var unrepeatCB;


  //***** private methods *****//

  this.init_ = function(appendTo) {
    appendTo.append(base);

    // simply hooking up the main button to the plain-text cards,
    // and leaving the From Document functionality and speed dial in,
    // in case we want to put them back at some point -DC 2017.11.23
    //emailButton.on('click', newEmailTemplate);
    //documentButton.on('click', newDocumentTemplate);
    //fabButton.on('click', toggleSpeedDial);
    fabButton.on('click', newEmailTemplate);

    PubSub.subscribe('Rules.delete', rebuild);
    PubSub.subscribe('Rules.add', rebuild);
    PubSub.subscribe('Rules.update', rebuild);
    PubSub.subscribe('Rules.repeater', rebuild);
    PubSub.subscribe('Mailman.SettingsView.hide', self.show);
  };

  var itemEdit = function(e) {
    editCallback(e.data);
  };

  var itemPreview = function(e) {
    previewCallback(e.data);
  }

  var newEmailTemplate = function(e) {
    emailCB(e);
  };

  var newDocumentTemplate = function(e) {
    documentCB(e);
  };

  var toggleSpeedDial = function(e) {
    fabContainer.toggleClass(SPEED_DIAL_VISIBLE);
  };

  var rebuild = function() {
    for (var i = 0; i < listItems.length; i++) {
      listItems[i].cleanup();
    }

    listItems = [];
    for (var i = 0; i < mergeTemplates.length(); i++) {
      self.add(mergeTemplates.get(i), metadataService);
    }

    setEmptyDisplay();
  };

  var setEmptyDisplay = function() {
    if (listItems.length === 0) {
      Util.setHidden(list, true);
      Util.setHidden(emptyContainer, false);
      actionBar.hideBranding();
    }
    else {
      Util.setHidden(list, false);
      Util.setHidden(emptyContainer, true);
      actionBar.showBranding();
    }
  };

  //***** public methods *****//

  /**
   * Sets the MergeTemplateContainer this view uses.
   *
   * @param {MergeTemplateContainer} container This is the model used by the view to update.
   */
  this.setContainer = function(container) {
    mergeTemplates = container;
    rebuild();
  };

  /**
   * Adds a new MergeTemplateListItem to this view.
   *
   * @param {MergeTemplate} template The model that is used to build the view.
   */
  this.add = function(template) {

    var item = new MergeTemplateListItem(list, template, metadataService);
    item.setDeleteHandler(deletionCallback);
    item.setEditHandler(itemEdit);
    item.setPreviewHandler(itemPreview);
    item.setRunHandler(runCallback);
    item.setRepeatHandlers(repeatCB, unrepeatCB);
    item.setRepeatDialog(repeatDialog);
    item.setRunDialog(runDialog);
    item.setDeleteDialog(deleteDialog);

    listItems.push(item);
  };

  /**
   * Hides this view.
   *
   */
  this.hide = function() {
    Util.setHidden(base, true);
    actionBar.showBranding();
  };

  /**
   * Shows this view.
   *
   */
  this.show = function() {
    setEmptyDisplay();
    Util.setHidden(base, false);
    PubSub.publish('Mailman.RulesListView.show');
  };

  /**
   * Sets the handler for each list item deletion.
   *
   * @param {Function} callback Called when the delete icon is clicked.
   */
  this.setDeleteHandler = function(callback) {
    deletionCallback = callback;
  };

  /**
   * Sets the handler for each list item edit.
   *
   * @param {Function} callback Called when the edit icon is clicked.
   */
  this.setEditHandler = function(callback) {
    editCallback = callback;
  };

  /**
   * Sets the handler for previewing templates
   * 
   * @param {Function} callback 
   */
  this.setPreviewHandler = function(callback) {
    previewCallback = callback;
  }

  /**
   * Sets the handler for each list item run.
   *
   * @param {Function} callback Called when the run icon is clicked.
   */
  this.setRunHandler = function(callback) {
    runCallback = callback;
  };

  /**
   * Sets the handler for each list item repeat.
   *
   * @param {Function} onCallback Called when the repeat icon is clicked on.
   * @param {Function} offCallback Called when the repeat icon is clicked off.
   */
  this.setRepeatHandlers = function(onCallback, offCallback) {
    repeatCB = onCallback;
    unrepeatCB = offCallback;
  };

  /**
   * Sets the handler for the email button click.
   *
   * @param {Function} callback Called when the email button is clicked.
   */
  this.setEmailHandler = function(callback) {
    emailCB = callback;
  };

  /**
   * Sets the handler for the document button click.
   *
   * @param {Function} callback Called when the document button is clicked.
   */
  this.setDocumentHandler = function(callback) {
    documentCB = callback;
  };

  this.setRepeatDialog = function(dialog) {
    repeatDialog = dialog;
  };

  this.setRunDialog = function(dialog) {
    runDialog = dialog;
  };

  this.setDeleteDialog = function(dialog) {
    deleteDialog = dialog;
  };

  this.init_(appendTo);
};


/** */
module.exports = MergeTemplatesListView;
