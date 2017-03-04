'use strict';

app.controller('FilterController', function ($scope, $http,messagePassing) {    
    $scope.targetCalories = {"value":NaN};
    $http.get('/filterView/filterView.static.json').then(function (response) {
        $scope.filters = response.data;
        messagePassing.allowedClasses = $scope.filters;
        messagePassing.targetCalories = $scope.targetCalories;
        $scope.calories = messagePassing.calories;
    });
});

