'use strict';

app.controller('ProcedureController', function ($scope, $http, messagePassing) {
    $http.get('/getRecipe').then(function (response) {
        $scope.ingredients = response.data;
    });

    // Plan B, fetch data from python server
    // CORS is enabled
    $http.get('http://127.0.0.1:8081').then(function (response) {
        console.log(response);
        $scope.ingredients = response.data;
    });

    $http.get('/procedureView/procedureView.static.json').then(function (response) {
        $scope.operations = response.data.operations;
        $scope.adjacencyMatrix = response.data.adjacencyMatrix;
        $scope.generateText = "Generate";
        $scope.isGenerating = false;
        $scope.calories = messagePassing.calories;
    });

    $scope.generate = function () {
        $scope.isGenerating = true;
        $scope.generateText = "Generating";

        $scope.allowedClasses = [];
        for (var i = 0; i < messagePassing.allowedClasses.length; i++) {
            if (messagePassing.allowedClasses[i].value) {
                $scope.allowedClasses.push(messagePassing.allowedClasses[i].name);
            }
        }
        $scope.calories.value = 0;
        //$scope.targetCalories = messagePassing.targetCalories.value;
        $scope.buildProcedure();

        $scope.generateText = "Generate";
        $scope.isGenerating = false;
    }

    $scope.buildProcedure = function () {
        // Select random number of ingredients of filtered classes
        var kitchenTable = $scope.populateKitchenTable();

        // Generate a recipe name using the ingredients chosen
        $scope.recipeName = $scope.generateRecipeName(kitchenTable);

        // Select a random number of operations to be performed on the food
        var actions = $scope.generateActions(kitchenTable);

        // Build steps for each operations and push in procedure
        $scope.procedure = [];
        for (var i = 0; i < actions.length; i++) {
            $scope.procedure.push($scope.buildStep(actions[i]));
        }
    }

    $scope.generateRecipeName = function (kitchenTable) {
        var prefix = ['Royal', 'Indian', 'Chinese', 'Tandoor'];
        var suffix1 = ['ey', 'ed', ''];
        var suffix2 = ['delight', 'delux', ''];

        var shortList1 = [];
        for (var i = 0; i < kitchenTable.length; i++)
            if (kitchenTable[i].class == 'fat' || kitchenTable[i].class == 'egg')
                shortList1.push(kitchenTable[i]);

        var shortList2 = [];
        for (var i = 0; i < kitchenTable.length; i++)
            if (kitchenTable[i].class == 'vegetable' || kitchenTable[i].class == 'meat')
                shortList2.push(kitchenTable[i]);

        var index1 = Math.floor(Math.random() * shortList1.length);
        var index2 = Math.floor(Math.random() * shortList2.length);

        var item1 = shortList1[index1] == null ? 'double' : shortList1[index1].name;
        var item2 = shortList2[index1] == null ? 'combo' : shortList2[index1].name;

        return prefix[Math.floor(Math.random() * prefix.length)] + ' ' + item1 +
            suffix1[Math.floor(Math.random() * suffix1.length)] + ' ' + item2 + ' '
            + suffix2[Math.floor(Math.random() * suffix2.length)];
    }

    $scope.populateKitchenTable = function () {
        var kitchenTable = [];
        var ingredientsCount = $scope.ingredients.length;
        var numberOfIngredients = Math.floor(Math.random() * ingredientsCount / 4 + ingredientsCount / 4);
        var chanceOfSelection = 0.5;

        var lastIngredient = $scope.ingredients[Math.floor(Math.random() * ingredientsCount)];
        kitchenTable[0] = lastIngredient;
        $scope.calories.value += lastIngredient.calorie;

        for (var i = 1; i < numberOfIngredients; i++) {
            var weights = $scope.adjacencyMatrix[lastIngredient.id % $scope.adjacencyMatrix.length];
            for (var j = 0; j < weights.length; j++) {
                var ingredient = $scope.ingredients[j];
                if (ingredient.class == 'essential') continue;
                if ($scope.allowedClasses.indexOf(ingredient.class) == -1)
                    weights[j] = 0;
            }
            var nextIngredientIndex = $scope.rouletteWheel(weights);
            var lastIngredient = $scope.ingredients[nextIngredientIndex];
            kitchenTable.push(lastIngredient);
            $scope.calories.value += lastIngredient.calorie;
        }
        return kitchenTable;
    }

    $scope.generateActions = function (kitchenTable) {
        var actions = [];
        // Preprocess stage
        for (var i = 0; i < kitchenTable.length; i++) {
            actions.push($scope.findValidAction(kitchenTable[i], actions, false));
        }

        // Assembly stage
        while (kitchenTable.length != 1) {
            var index1 = Math.floor(Math.random() * kitchenTable.length);
            var item1 = kitchenTable.splice(index1, 1);
            var index2 = Math.floor(Math.random() * kitchenTable.length);
            //var index2 = $scope.getOtherItem(item1.id, kitchenTable);
            var item2 = kitchenTable.splice(index2, 1);
            var component = [item1, item2];
            kitchenTable.push(component);
            actions.push($scope.findValidAction(component, actions, true));
        }
        return actions;
    }

    $scope.findValidAction = function (component, prevActions, isAssembly) {
        var validOperations = [];
        var label = isAssembly ? "assembly" : component.class;

        for (var i = 0; i < $scope.operations.length; i++) {
            if ($scope.operations[i].class == label) {
                validOperations.push($scope.operations[i]);
            }
        }
        var index = Math.floor(Math.random() * validOperations.length);
        var selectedOperation = validOperations[index];
        var action = { "component": component, "operation": selectedOperation, "amount": Math.floor(Math.random() * 5 + 1) };
        return action;
    }

    $scope.buildStep = function (action) {
        var step = '';
        step += action.operation.begin != null ? action.operation.begin + ' ' : ' ';
        if (Array.isArray(action.component)) {
            var components = [];
            $scope.linearize(action.component, components);
            for (var i = 0; i < components.length - 1; i++) {
                step += components[i] + ', ';
            }
            step += 'and ' + components[components.length - 1] + ' ';
        } else {
            step += action.amount + ' ';
            step += action.component.unit != null ? action.component.unit + ' of ' : '';
            step += action.component.name != null ? action.component.name + ' ' : '';
        }

        step += action.operation.end != null ? action.operation.end + ' ' : ' ';
        return step;
    }

    $scope.linearize = function (components, list) {
        for (var i = 0; i < components.length; i++) {
            if (Array.isArray(components[i])) {
                list.concat($scope.linearize(components[i], list));
            } else {
                list.push(components[i].name);
            }
        }
        return list;
    }

    $scope.rouletteWheel = function (weights) {
        var weightSum = 0;
        for (var i = 0; i < weights.length; i++)
            weightSum += weights[i];

        var value = weightSum * Math.random();
        for (var i = 0; i < weights.length; i++) {
            value -= weights[i];
            if (value <= 0) return i;
        }
        return 0;
    }

});