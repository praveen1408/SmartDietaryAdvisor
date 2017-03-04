'use strict';

var app = angular.module('SmartDietaryAdvisor', []);

app.service('messagePassing', function () {
    this.allowedClasses = {};
    this.calories = {"value":0};
});