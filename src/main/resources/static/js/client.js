angular.module('client', [ 'ngRoute' ]).config([ '$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'home'
	}).otherwise('/');
	
	$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
	$httpProvider.defaults.headers.common["Accept"] = "application/json";
	$httpProvider.defaults.headers.common["Content-Type"] = "application/json";
	
	//configure $http to view a login whenever a 403 unauthorized response arrives
	//http://www.bennadel.com/blog/2777-monitoring-http-activity-with-http-interceptors-in-angularjs.htm
    $httpProvider.interceptors.push(function ($rootScope, $q) {
        return({
            responseError: responseError
        });
        
    	function responseError( response ) {
    		console.log(response.config.method + ' ' + response.config.url + ' ' + response.status + ' ' + response.data);
    		if (response.status == 403) {
    			$rootScope.$broadcast('event:accessDenied');
    		}
    		return( $q.reject( response ) );
    	}
    });
    
}]).controller('navigation', function($rootScope, $scope, $http, $location, $route) {

	$scope.tab = function(route) {
		return $route.current && route === $route.current.controller;
	};

	$http.get('user').success(function(data) {
		if (data.name) {
			$rootScope.authenticated = true;
		} else {
			$rootScope.authenticated = false;
		}
	}).error(function() {
		$rootScope.authenticated = false;
	});

	$scope.credentials = {};

	$scope.logout = function() {
		$http.delete('revoke', {}).success(function() {
			$rootScope.authenticated = false;
			$location.path("/");
		}).error(function(data) {
			console.log("Logout failed")
			$rootScope.authenticated = false;
		});
	}

}).controller('home', function($rootScope, $scope, $http, $q) {

    $scope.creating = false;
    $scope.editing = false;

    $scope.openEditingForm  = function() {
            $scope.editing = true;
            $scope.creating = false;
    	}

    	$scope.openCreatingForm  = function() {
    	    initCustomer();
            $scope.creating = true;
    	}

    	$scope.closeCreatingForm  = function() {
            $scope.creating = false;
            $scope.editing = false;
    	}

	$scope.getAll = function() {
		$rootScope.hasError = false;
		var d = $q.defer();
		$http.get('customer')
		.success(function (response) {
		    console.log(JSON.stringify(response));
			d.resolve(response);
		})
		.error(function () {
			d.reject();
		});
		d.promise.then(
				function success(response) {
					$scope.customers = response;
					hideErrorMsg();
				},
				function error(error) {
					showErrorMsg('Something went wrong!');
				});
	}

	$scope.getOne = function(id) {
		$rootScope.hasError = false;
		var d = $q.defer();
		$http.get('customer/' + id)
		.success(function (response) {
		    console.log(JSON.stringify(response));
			d.resolve(response);
		})
		.error(function () {
			d.reject();
		});
		d.promise.then(
				function success(response) {
					$scope.createOrUpdateModel = response;
					$scope.openEditingForm();
					hideErrorMsg();
				},
				function error(error) {
					showErrorMsg('Something went wrong!');
				});
	}

	$scope.add = function() {
		$rootScope.hasError = false;
		var d = $q.defer();
		$http.post('customer', $scope.createOrUpdateModel)
		.success(function (response) {
			d.resolve(response);
		})
		.error(function () {
			d.reject();
		});
		d.promise.then(
				function success(response) {
				  hideErrorMsg();
				  $scope.createOrUpdateModel = null;
				  $scope.getAll();
				},
				function error(error) {
				    showErrorMsg('Bad request!');
				});
	}

	$scope.update = function() {
		$rootScope.hasError = false;
		var d = $q.defer();
		$http.put('customer/' + $scope.createOrUpdateModel.id, $scope.createOrUpdateModel)
		.success(function (response) {
			d.resolve(response);
		})
		.error(function () {
			d.reject();
		});
		d.promise.then(
				function success(response) {
				  hideErrorMsg();

				  $scope.getAll();
				},
				function error(error) {
				    showErrorMsg('Bad request!');
				});
	}

	$scope.delete = function(id) {
        $rootScope.hasError = false;
        var d = $q.defer();
        $http.delete('customer/' + id)
		.success(function (response) {
			d.resolve(response);
		})
		.error(function () {
			d.reject();
		});
		d.promise.then(
				function success(response) {
				  hideErrorMsg();
				  $scope.getAll();
				},
				function error(error) {
				    showErrorMsg('Bad request!');
				});
	}


	function showErrorMsg(errorMsg) {
	    $rootScope.hasError = true;
    	$rootScope.errorMsg = errorMsg;
	}

	function hideErrorMsg() {
	    $rootScope.hasError = false;
        $rootScope.errorMsg = '';
	}

	function initCustomer() {
	$scope.createOrUpdateModel = {
	name:'',
	email:'',
	phone:''
	}
	}
}).run(function ($rootScope) {
	$rootScope.$on('event:accessDenied', function () {
        $rootScope.requests403 = [];
        console.log('Access denied');
        $rootScope.errorMsg = "You don't have the access to resource";
        $rootScope.hasError = true;
    });
});