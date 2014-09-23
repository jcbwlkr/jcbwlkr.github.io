function PortfolioCtrl($scope, $routeParams, $http) {
    $http
        .get('/api/projects.json')
        .success(function(data) {
            $scope.projects = data.result;
        });

    if ($routeParams.id) {
        $http
            .get('/api/projects/' + $routeParams.id + '.json')
            .success(function(data) {
                $scope.currentProject = data.result;
            });
    }

    $scope.projectClass = function(id) {
        if (id == $routeParams.id) {
            return 'active';
        }

        return '';
    };
}
