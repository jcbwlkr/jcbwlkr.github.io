function PortfolioCtrl($scope, $routeParams, $http) {
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

    if ($routeParams.id) {
        $http
            .get('/api/projects/' + $routeParams.id + '.json')
            .success(function(data) {
                $scope.currentProject = data.result;
            });
    } else {
        $scope.placeholder = "Choose a Project From the List";
    }

    $scope.projectClass = function(id) {
        if (id == $routeParams.id) {
            return 'active';
        }

        return '';
    };
}
