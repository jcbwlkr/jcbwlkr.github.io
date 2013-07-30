function PortfolioCtrl($scope, $routeParams, $http) {
    $scope.projects = [
        { name: "jacob-walker.com",          id: 1},
        { name: "yagl-JS",                   id: 2},
        { name: "Regular Expressions 101",   id: 3},
        { name: "find.torrent",              id: 4},
        { name: "UpFront Wichita",           id: 5},
        { name: "Jekyll D&D Blog",           id: 6},
        { name: "TimeIPS",                   id: 7},
        { name: "Natural Organic Warehouse", id: 8},
        { name: "GeoServices API",           id: 9},
        { name: "My Dotfiles",               id: 10},
        { name: "VIM Config",                id: 11},
    ];

    $scope.currentProject = $http({ method: 'GET', url: '/views/projects/' + parseInt($routeParams.id) + '.html' });

    $scope.projectClass = function(id) {
        if (id == $routeParams.id) {
            return 'active';
        }

        return '';
    };
}
