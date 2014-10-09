function BlogCtrl($scope, $routeParams, $http) {

    if ($routeParams.id) {
        $http
            .get('/api/posts/' + $routeParams.id + '.json')
            .success(function(data) {
                $scope.post = data.result;
            });
    } else {
        $http
            .get('/api/posts.json') // TODO request a smaller version of this
            .success(function(data) {
                // TODO sort by date
                $scope.posts = data.result;
            });
    }
}
