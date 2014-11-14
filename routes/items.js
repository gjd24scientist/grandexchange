var express = require('express');
var router = express.Router();
var Item = require('../models/item');
var Offer = require('../models/offer');
var utils = require('../utils');

// GET /items - get all items
router.get('/items', utils.loggedIn, function(req, res) {
  Items.getItems(function(items) {
    res.json({items: items});
  });
});

// POST /items - create items
router.post('/items', utils.loggedIn, function(req, res) {
  var name = req.body.name;
  var description = req.body.description;
  Item.createItem(name, description, function(item) {
    res.json({item: item});
  });
});

// GET /items/:item_id - get item with item_id
router.get('/items/:item_id', utils.loggedIn, function(req, res) {
  var item_id = req.param('item_id');
  Item.getItemById(item_id, function(item) {
    res.json({item: item});
  });
});

// POST /items/:item_id - add offer to item
router.post('/items/:item_id', utils.loggedIn, function(req, res) {
  var item_id = req.param('item_id');
  var offer = req.body.offer;
  Item.addOfferToItem(offer, item_id, function(offer) {
    res.json({offer: offer});
  });
});

// GET /items/:item_id/offers/:offer_id - get offer with offer_id
router.get('/items/:item_id/offers/:offer_id', utils.loggedIn, function(req, res) {
  var offer_id = req.param('offer_id');
  Offer.getOfferById(offer_id, function(offer) {
    res.json({offer: offer});
  });
});

// POST /items/item_id/offers/offer_id - create new offer
router.post('/items/:item_id/offers', utils.loggedIn, function(req, res) {
  var offer_id = req.param('offer_id');
  var postedBy = req.body.postedBy;
  var postedAt = req.body.postedAt;
  var price = req.body.price;
  var type = req.body.type;
  Offer.createOffer(postedBy, postedAt, price, type, function(offer) {
    res.json({offer: offer});
  });
});

// DELETE /items/item_id/offers/offer_id - delete offer
router.delete('/items/:item_id/offers/:offer_id', utils.loggedIn, function(req, res){
  var offer_id = req.param('offer_id');
  Offer.deleteOffer(offer_id, function(offer) {
    res.json({offer: offer});
  });
});

