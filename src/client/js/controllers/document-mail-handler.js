/**
 * This module exports an Object used for initializing the mergeTemplate for emails set up.
 * This is one of the modules that would need to be swapped out if Mailman were to be repurposed.
 * This merges from a Google Doc.
 *
 * @author {@link https://github.com/j-rewerts|Jared Rewerts}
 * @module
 */


var List = require('../list/list.js');
var CardsConfig = require('./document-mail-config.js');
var CardNames = require('./names.js');
var MergeTemplate = require('../data/merge-template/merge-template.js');



/**
 * The handler used for managing the Cards used in Mailman. These are used to gather user input for creating an email
 * MergeTemplate. If this were to be swapped out, it could easily be repurposed for document merge.
 * This object has 2 methods for managing the set of Cards:
 * 1. The CardRepository. This is a map between Card names and the Card itself.
 * 2. The linked list of Cards. This is a convenient way to step forwards and backwards, as well as knowing when you are
 * at the start or end of the list of Cards.
 *
 * @constructor
 * @param {jQuery} parent The jquery object that will contain all the Cards.
 */
var DocumentMailHandler = function(parent) {

  var self = this;
  var activeNode;
  var contentArea = parent;
  var cardsList;
  var cardRepository = CardsConfig.buildCardRepo(contentArea);
  var updateConfig = {};

  //***** private functions *****//

  this.init_ = function() {
    cardRepository[CardNames.title].setValidation(cardValidator);
    cardRepository[CardNames.sheet].setValidation(cardValidator);
    cardRepository[CardNames.row].setValidation(cardValidator);
    cardRepository[CardNames.documentSelector].setValidation(cardValidator);
    cardRepository[CardNames.conditional].setValidation(function() {
      if (cardRepository[CardNames.conditional].isEnabled() && cardRepository[CardNames.conditional].getValue() == '') {
        return false;
      }

      return true;
    });

    cardsList = buildDocumentFlow();
    activeNode = cardsList.head;
    show(activeNode.data);
  };

  var cardValidator = function(card) {
    if (card.getValue() == '') {
      return false;
    }

    return true;
  };

  var show = function(name) {
    hideAll();
    cardRepository[name].show();
  };

  var hideAll = function() {
    for (var name in cardRepository) {
      if (cardRepository.hasOwnProperty(name)) {
        cardRepository[name].hide();
      }
    }
  };

  var buildDocumentFlow = function() {
    var cards = new List();
    cards.add(CardNames.title);
    cards.add(CardNames.sheet);
    cards.add(CardNames.row);
    cards.add(CardNames.to);
    cards.add(CardNames.subject);
    cards.add(CardNames.documentSelector);
    cards.add(CardNames.conditional);
    cards.add(CardNames.sendNow);
    return cards;
  };

  //***** public functions *****//

  /**
   * Sets the MergeTemplate to edit.
   *
   * @param {MergeTemplate} template The template to make edits to.
   */
  this.setMergeTemplate = function(template) {
    updateConfig = template.toConfig();

    cardRepository[CardNames.title].setValue(updateConfig.mergeData.title);
    cardRepository[CardNames.sheet].setValue(updateConfig.mergeData.sheet);
    cardRepository[CardNames.row].setValue(updateConfig.mergeData.headerRow);
    cardRepository[CardNames.to].setValue({
      to: updateConfig.mergeData.data.to,
      cc: updateConfig.mergeData.data.cc,
      bcc: updateConfig.mergeData.data.bcc
    });
    cardRepository[CardNames.subject].setValue(updateConfig.mergeData.data.subject);
    cardRepository[CardNames.documentSelector].setValue({
      id: updateConfig.mergeData.data.documentID
    });


    if (updateConfig.mergeData.conditional != null) {
      cardRepository[CardNames.conditional].check();
      cardRepository[CardNames.conditional].setValue(updateConfig.mergeData.conditional);
    }
    else {
      cardRepository[CardNames.conditional].uncheck();
    }
  };

  /**
   * Gets a new MergeTemplate, built from the inputs of all the Cards.
   *
   * @return {MergeTemplate} The new MergeTemplate.
   */
  this.getMergeTemplate = function() {
    var toVals = cardRepository[CardNames.to].getValue();
    return new MergeTemplate(
      Object.assign({}, updateConfig, {
        mergeData: {
          title: cardRepository[CardNames.title].getValue(),
          sheet: cardRepository[CardNames.sheet].getValue(),
          headerRow: cardRepository[CardNames.row].getValue(),
          conditional: cardRepository[CardNames.conditional].getValue(),
          type: 'document',
          data: {
            to: toVals.to,
            cc: toVals.cc,
            bcc: toVals.bcc,
            subject: cardRepository[CardNames.subject].getValue(),
            documentID: cardRepository[CardNames.documentSelector].getValue(),
          }
        }
      }
    ));
  };

  /**
   * Displays the next Card. If the Card is the last one, nothing happens.
   *
   * @return {Node|undefined} The newly active Node.
   */
  this.next = function() {
    if (self.isLast()) {
      return;
    }

    cardRepository[activeNode.data].hide();
    activeNode = activeNode.next;
    cardRepository[activeNode.data].show();

    return activeNode;
  };

  /**
   * Displays the previous Card. If the Card is the first one, nothing happens.
   *
   * @return {Node|undefined} The newly active Node.
   */
  this.back = function() {
    if (self.isFirst()) {
      return;
    }

    cardRepository[activeNode.data].hide();
    activeNode = activeNode.previous;
    cardRepository[activeNode.data].show();

    return activeNode;
  };

  /**
   * Determines if the active Card is the first Card.
   *
   * @return {boolean} True if the active Card is the first Card, false otherwise.
   */
  this.isFirst = function() {
    return activeNode === cardsList.head;
  };

  /**
   * Determines if the active Card is the last Card.
   *
   * @return {boolean} Returns true if the active Card is the last Card.
   */
  this.isLast = function() {
    return activeNode === cardsList.tail;
  };

  /**
   * Validates the currently active Card.
   *
   * @return {boolean} Returns true if the active Card is valid, false if it is invalid.
   */
  this.validateState = function() {
    if (cardRepository[activeNode.data].isValid !== undefined) {
      return cardRepository[activeNode.data].isValid();
    }
    return true;
  };

  this.init_();
};


/** */
module.exports = DocumentMailHandler;
