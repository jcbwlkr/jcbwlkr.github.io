function PortfolioCtrl($scope, $location, $route, $routeParams, $http) {
    $http
        .get('/api/projects.json')
        .success(function(data) {
            projects = data.result;
            projects.sort(function(a, b) {
                if (a.order == b.order) {
                    return 0;
                }
                return (a.order < b.order) ? -1 : 1;
            });
            $scope.projects = projects;
        });

    $scope.loadProject = function(id) {

        // Register a listener to prevent the view from reloading when we
        // change location below
        var lastRoute = $route.current;
        $scope.$on('$locationChangeSuccess', function(event) {
            $route.current = lastRoute;
        });
        // Update location for bookmarks/history
        $location.path('/portfolio/' + id);

        // Fetch details on this item
        $http
            .get('/api/projects/' + id + '.json')
            .success(function(data) {
                $scope.currentProject = data.result;
            });
    };

    if ($routeParams.id) {
        $scope.loadProject($routeParams.id);
    }

    $scope.projectClass = function(id) {
        if ($scope.currentProject && id == $scope.currentProject._id) {
            return 'active';
        }

        return '';
    };
}
