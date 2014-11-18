/* Item Model */
var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var utils = require('../utils');
var Transaction = require('../models/transaction');
var User = require('../models/user');

// Offer schema
var offerSchema = mongoose.Schema({
  postedBy: {type: String, ref: 'User'},
  item: {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  postedAt: Date,
  price: Number,
  type: String
});

var Offer = mongoose.model('Offer', offerSchema);

// item schema
var itemSchema = mongoose.Schema({
  name: String,
  description: String,
  offers: [{
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  }]
});

// GET - returns all items
itemSchema.statics.getItems = function(callback) {
  Item.find({}, function(err, items) {
    utils.handleError(err);
    callback(items);
  });
}

// POST - create new item
itemSchema.statics.createItem = function(name, description, callback) {
  var item = new Item({
    name: name,
    description: description,
    offers: []
  });
  item.save(function(err, item) {
    callback(item);
  });
}

// GET - get item by id
itemSchema.statics.getItemById = function(item_id, callback) {
  Item.findOne({_id: item_id})
  .populate('offers')
  .exec(function(err, item) {
    utils.handleError(err);
    callback(item);
  });
}

// GET - get offers of item
itemSchema.statics.getItemOffers = function(item_id, callback) {
  Item.findOne({_id:item_id}, function(err, item) {
    utils.handleError(err);
    var offers = item.offers;
    callback(offers);
  });
}


// POST - create offer for item
// Check for offer matches and create Transactions
itemSchema.statics.createOffer = function(item_id, offerData, callback) {
  // offerData may need to be augmented with item_id and user_id
  offerData.postedBy = ObjectId(offerData.postedBy);
  var offer = new Offer(offerData);
  offer.save(function(err, offer){
    utils.handleError(err);
  });

  // console.log(offer);

  //offer matching
  // buy: match with LOWEST sell offer
  // sell: match with HIGHEST buy offer where sell < buy
  if (offer.type === "buy") {
    Item.findOne({_id: item_id})
    .populate({
      path: 'offers',
      match: { type: "sell"},
    })
    // .populate('offers', null, {type: "sell"})
    .exec(function(err, item) {
      utils.handleError(err);
      var minSell = undefined;
      for (selloffer in item.offers) {
        if (selloffer.price <= offer.price ) { // possible match
          if (minSell == undefined || selloffer.price < minSell) {
            minSell = selloffer;
          }
        }
      }
      if (! minSell) { // no matching offers; store offer for User and Item
        Item.update({_id: item_id}, {
          $addToSet: {
            offers: offer
          }
        }, function(err, numaffected, doc) {
          console.log("added buy offer!!!");
          console.log(doc);
        });
        User.update({_id: offerData.user_id}, {
          $addToSet: {
            offers: offer
          }
        });
        callback("No match");
      }
      else { // matching offers: create new transaction and store it under user
        Transaction.createTransaction(offer, minSell, price, function(transaction) {
          callback(transaction);
        });
      }
    });
    // Item.findOne({_id:item_id})
    // .populate('offers')
    // .exec(function(err,item) {
    //   console.log("this is the item!");
    //   console.log(item);
    // });
  }
  if (offer.type === "sell") {
    Item.findOne({_id:item_id})
    .populate('offers', null, {type: "buy"})
    .exec(function(err, item) {
      utils.handleError(err);
      var maxBuy = undefined;
      for (buyoffer in item.offers) {
        if (buyoffer.price >= offer.price ) { // possible match
          if (maxBuy == undefined || buyoffer.price > maxBuy) {
            maxBuy = buyoffer;
          }
        }
      }
      if (! maxBuy) { // no matching offers; store offer for User and Item
        Item.update({_id: item_id}, {
          $addToSet: {
            offers: offer
          }
        });
        User.update({_id: offerData.user_id}, {
          $addToSet: {
            offers: offer
          }
        });
        callback("No match");
      }
      else { // matching offers: create new transaction and store it under user
        Transaction.createTransaction(maxBuy, offer, price, function(transaction) {
          callback(transaction);
        });
      }
    });
  }
}

// GET - get offer by id
// TODO: populate offer
itemSchema.statics.getOfferById = function(item_id, offer_id, callback) {
  Offer.findOne({_id:offer_id}, function(err, offer){
    utils.handleError(err);
    if (offer) {
      callback(offer);
    }
    else {
      callback("Failed to find offer with given id.");
    }
  });
}

// DELETE - delete offer
itemSchema.statics.deleteOffer = function(item_id, offer_id, callback) {
  Offer.findOneAndRemove({_id:offer_id}, function(err, offer) {
    utils.handleError(err);
    callback(offer);
  });
}

// create model

var Item = mongoose.model('Item', itemSchema);

// export
module.exports = {
  Offer: Offer,
  Item: Item
}
