var app = angular.module('main', []);

// Routes
app.config(function($routeProvider) {
    $routeProvider
        .when("/", {controller: 'RootCtrl', templateUrl: '/views/root.html'})
        .when("/about", {controller: 'AboutCtrl', templateUrl: '/views/about.html'})
        .when("/portfolio", {controller: 'PortfolioCtrl', templateUrl: '/views/portfolio.html'})
});
