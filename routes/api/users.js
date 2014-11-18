var express = require('express');
var router = express.Router();
var User = require('../../models/user');
var Transaction = require('../../models/transaction');
var utils = require('../../utils');

/* POST /users
 * create new user
 * firstName, lastName, email, and password cannot be empty
 */
router.post('/', function(req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  if(!firstName || !lastName || !email || !password) {
    res.json({error: 'All fields are required.', success: false});
  } else {
    User.userExists(email, function(exists) {
      if (exists) {
        res.json({error: 'User with that email exists.', success: false});
      } else {  
        User.createUser(firstName, lastName, email, password, function(user) {
          return res.json({user: user, success: true});
        });
      }
    });
  }
});

// GET /users/:user_id
// get user with user_id
router.get('/:user_id', function(req, res) {
  var user_id = req.param('user_id');
  User.getUserById(user_id, function(user) {
    if (user) {
      res.json({user: user, success: true});
    } else {
      res.json({error: 'User does not exist.', success: false});
    }
  });
});

// GET /users/:user_id/transactions
// get all transactions of user with user_id
router.get('/:user_id/transactions', function(req, res) {
  var user_id = req.param('user_id');
  User.getUserTransactions(user_id, function(transactions) {
    if (transactions != null) {
      res.json({transactions: transactions, success: true});
    } else {
      res.json({success: false});
    }
  });
});

// GET /users/:user_id/transactions/:transaction_id
// get transaction with transaction_id
router.get('/:user_id/transactions/:transaction_id', function(req, res) {
  var user_id = req.param('user_id');
  var transaction_id = req.param('transaction_id');
  Transaction.getTransactionById(user_id, transaction_id, function(transaction) {
    res.json({transaction: transaction});
  });
});

// POST /users/:user_id/transactions/:transaction_id
// rate and review transaction with transaction_id with user user_id
router.post('/:user_id/transactions/:transaction_id', function(req, res) {
  var user_id = req.param('user_id');
  var transaction_id = req.param('transaction_id');
  var review = req.body.review;
  Transaction.addTransactionReview(user_id, transaction_id, review, function(transaction) {
    res.json({transaction: transaction});
  });
});

// GET /users/:user_id/offers
// get all offers for a user
router.get('/:user_id/offers', function(req, res) {
  var user_id = req.param('user_id');
  User.getOffers(user_id, function(offers) {
    if(offers != null) {
      res.json({offers: offers, success: true});
    } else {
      res.json({success: false});
    }
  });
});

module.exports = router;