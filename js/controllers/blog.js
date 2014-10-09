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
                // Sort by date with newest posts at the top
                data.result.sort(function(a, b) {
                    a = new Date(a.date);
                    b = new Date(b.date);
                    return a == b ? 0 : a > b ? -1 : 1;
                });
                $scope.posts = data.result;
            });
    }
}
