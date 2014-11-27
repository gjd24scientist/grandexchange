/**
 * Contains the definition of the main module, the configuration, and the
 * services used by the controllers.
 */
angular.module('thegrandexchange', ['ui.router', 'ngCookies', 'ngTable'], function($httpProvider) {
  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

  // Converts an object to x-www-form-urlencoded serialization.
  // Credit: http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for (name in obj) {
      value = obj[name];

      if (value instanceof Array) {
        for (i = 0; i < value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if (value instanceof Object) {
        for (subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if (value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
})
.config([
  '$stateProvider',
  '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: '/views/login.html',
      controller: 'LoginCtrl'
    })
    .state('newUser', {
      url: '/newUser',
      templateUrl: '/views/newUser.html',
      controller: 'NewUsersCtrl'
    })
    .state('marketplace', {
      url: '/marketplace',
      templateUrl: '/views/marketplace.html',
      controller: 'MainCtrl'
    })
    .state('offers', {
      url: '/offers',
      templateUrl: '/views/offers.html',
      controller: 'OffersCtrl'
    })
    .state('completed', {
      url: '/completed',
      templateUrl: '/views/completed.html',
      controller: 'CompletedCtrl'
    })
    .state('profile', {
      url: '/profile',
      templateUrl: '/views/profile.html',
      controller: 'ProfileCtrl'
    })
    .state('item', {
      url: '/items/{id}',
      templateUrl: '/views/item.html',
      controller: 'ItemCtrl'
    })
  $urlRouterProvider.otherwise('login');
}])

// Handle highlighting in the menubar.
$(document).ready(function() {
  $('.sidebar-item').on('click', function(e) {
    var previous = $(this).parent().children(".active");
    previous.removeClass('active'); // previous list-item
    if (e.target.id === 'logout-tab') {
      $('#market-tab').addClass('active');
    }
    else {
      $(this).addClass('active'); // activated list-item
    }
  });
});angular.module('thegrandexchange')
.factory('items', ['$http', function($http) {
  return {
    getAll: function() {
      return $http.get('/api/items');
    },
    create: function(newItem) {
      return $http.post('/api/items', newItem);
    },
    get: function(itemID) {
      return $http.get('/api/items/' + itemID);
    },
    getOffers: function(itemID) {
      return $http.get('/api/items/' + itemID + '/offers');
    },
    postOffer: function(itemID, offer) {
      return $http.post('/api/items/' + itemID + '/offers', offer);
    },
    deleteOffer: function(itemID, offerID) {
      return $http.delete('/api/items/' + itemID + '/offers/' + offerID);
    }
  }
}]);angular.module('thegrandexchange')
.factory('session', ['$cookieStore', function($cookieStore) {
  return {
    name: function() {
      return $cookieStore.get('username');
    },
    setName: function(username) {
      $cookieStore.put('username', username);
    },
    clear: function() {
      $cookieStore.remove('username');
    }
  };
}]);angular.module('thegrandexchange')
.factory('users', ['$http', function($http) {
  return {
    create: function(userData) {
      return $http.post('/api/users', userData);
    },
    get: function(userID) {
      return $http.get('/api/users/' + userID);
    },
    getOffers: function(userID) {
      return $http.get('/api/users/' + userID + '/offers');
    },
    getReviews: function(userID) {
      return $http.get('/api/users/' + userID + '/reviews');
    },
    getTransactions: function(userID) {
      return $http.get('/api/users/' + userID + '/transactions');
    },
    postReview: function(userID, transactionID, review) {
      return $http.post('/api/users/' + userID + '/transactions/' + transactionID, review);
    }
  };
}]);angular.module('thegrandexchange')
.controller('CompletedCtrl',[
  '$scope',
  'users',
  'session',
  function($scope, users, session) {
    users.getTransactions(session.name()._id).then(function (response) {
      transactions = response.data.transactions;
      displayed_transactions = [];
      for (var i = 0; i < transactions.length; i++) {
        if(transactions[i].buyOffer.postedBy._id === session.name()._id && !transactions[i].buyerRated){
          transactions[i].isBuyer = true;
          displayed_transactions.push(transactions[i]);
        } else if (transactions[i].sellOffer.postedBy._id === session.name()._id && !transactions[i].sellerRated){
          transactions[i].isBuyer = false;
          displayed_transactions.push(transactions[i]);
        }
      }
      $scope.transactions = displayed_transactions;
    });

    $scope.review = function(transaction) {
      var review_score = 0;
      // completed if checkbox is checked
      if(transaction.completed){
        review_score = 1;
      } else {
        review_score = -1;
      }
      var newReview = {
        text: transaction.review_content,
        score: review_score
      };
      users.postReview(session.name()._id, transaction._id, newReview).then(function (response) {
        if(response.data.success) {
          transactions.remove(transaction);
        } else {
        }
      });
    };
  }
]);angular.module('thegrandexchange')
.controller('ItemCtrl', [
  '$http',
  '$scope',
  '$location',
  '$stateParams',
  'session',
  'items',
  function($http, $scope, $location, $stateParams, session, items) {
    $scope.order = 'price';
    items.get($stateParams.id).then(function(response) {
      $scope.item = response.data.item;
    });
    $scope.offer = function(type) {
      // type = 'buy' or 'sell'
      var newOffer = {
        postedBy: session.name()._id,
        item: $scope.item._id,
        postedAt: Date.now(),
        price: parseInt($scope.price, 10),
        type: type
      };
      items.postOffer($scope.item._id, newOffer).then(function(response) {
        if (response.data.transaction === 'No match') {
          newOffer.postedBy = {
            firstName: session.name().firstName,
            lastName: session.name().lastName
          }
          $scope.item.offers.push(newOffer);
        }
        else if (response.data.transaction) {
          var offers = $scope.item.offers;
          for (var i = 0; i < offers.length; i++) {
            if (offers[i].price === response.data.transaction.price) {
              offers.splice(i, 1);
              return;
            }
          }
        }
      }.bind(this), function(error) {
      });
    }
  }
]);angular.module('thegrandexchange')
.controller('LoginCtrl', [
  '$http',
  '$scope',
  '$location',
  'session',
  function($http, $scope, $location, session) {
    if (session.name()) {
      $http.post('/api/sessions', session.name()).success(function(response) {
        if (response.success === true) {
          $location.path('marketplace');
        } else {
          session.clear();
        }
      });
    }

    $scope.authenticate = function() {
      var userFields = {
        username: $scope.email,
        password: $scope.password
      };
      $http.post('/api/sessions', userFields).then(function(response) {
        var data = response.data;
        if (data.success === true) {
          userFields._id = data.userID;
          userFields.firstName = data.firstName;
          userFields.lastName = data.lastName;
          session.setName(userFields);
          $location.path('marketplace');
        } else {
          $scope.warning = response.data.message;
        }
      }, function(error) {
        $scope.warning = 'Invalid username and password.';
      });
      $scope.email = '';
      $scope.password = '';
    }
}]);angular.module('thegrandexchange')
.controller('MainCtrl', [
  '$scope',
  '$location',
  'session',
  'items',
  function($scope, $location, session, items) {

    $scope.isLoggedIn = function() {
      return session.name() !== undefined;
    }

    $scope.logout = function() {
      session.clear();
      $location.path('login');
    }
    $scope.toItem = function(item){
      $location.url('items/'+ item._id);
    }
    items.getAll().success(function(response) {
      $scope.items = response.items;
      if (response.success === true) {
        for (var i = 0; i < $scope.items.length; i++){
          var item = $scope.items[i];
          var offers = item.offers;
          var buyPrices = [];
          var sellPrices = [];
          for (var j = 0; j < offers.length; j++){
            var offer = offers[j];
            var price = offer.price;
            if(offer.type === 'buy'){
              buyPrices.push(price);
            } else if (offer.type === 'sell') {
              sellPrices.push(price);
            }
          }
          if(buyPrices.length > 0){
            item.bestBuy = '$' + Math.max.apply(null, buyPrices);
          } else {
            item.bestBuy = 'No offers';
          }
          if(sellPrices.length > 0){
            item.bestSell = '$' + Math.min.apply(null, sellPrices);
          } else {
            item.bestSell = 'No offers'
          }
        }

      }
      else {
        $scope.items = [{name:'no items found', description:'rekt'}];
      }
    });
}]);angular.module('thegrandexchange')
.controller('NewUsersCtrl', [
  '$http',
  '$scope',
  '$location',
  'users',
  function($http, $scope, $location, users) {
    $scope.addUser = function() {
      var newUser = {
        firstName: $scope.firstName,
        lastName: $scope.lastName,
        email: $scope.email,
        password: $scope.password
      };
      users.create(newUser).then(function (response) {
        var data = response.data;
        if (data.success === true) {
          $location.path('sessions');
        } else {
          $scope.warning = response.data.message;
        }
      }, function(error) {
        $scope.warning = error.data.message;
      });
      $scope.name = '';
      $scope.password = '';
      $scope.department = '';
    }
  }
]);angular.module('thegrandexchange')
.controller('OffersCtrl', [
  '$http',
  '$scope',
  '$filter',
  'users',
  'session',
  'items',
  'ngTableParams',
  function($http, $scope, $filter, users, session, items, ngTableParams) {
    $scope.deleteOffer = function (offer) {
      items.deleteOffer('offer.item._id', offer._id); // 'offer.item._id' doesn't actually get used
    }
    users.getOffers(session.name()._id).then(function(response) {
      $scope.offers = response.data.offers;

      // Set up the table that allows sorting by field.
      // Credit: http://bazalt-cms.com/ng-table/example/3
      $scope.tableParams = new ngTableParams({
        page: 1,          // show first page
        count: 10,        // count per page
        sorting: {
          name: 'asc'     // initial sorting
        }
      }, {
        total: $scope.offers.length, // length of data
        getData: function($defer, params) {
          // use built-in angular filter
          var orderedData = params.sorting() ?
                            $filter('orderBy')($scope.offers, params.orderBy()) :
                            $scope.offers;
          $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      });
    });
  }
]);angular.module('thegrandexchange')
.controller('ProfileCtrl',[
  '$http',
  '$scope',
  '$location',
  'session',
  'users',
  function($http, $scope, $location, session, users) {
    users.get(session.name()._id).success(function(response) {
      if (response.success === true) {
        $scope.user = response.user;
      }
    });
  }
])