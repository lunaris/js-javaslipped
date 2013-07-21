var js = angular.module('js', []);

js.filter('trace', function() {
  var captureAndMark = function(body) {
    var lines = body.split(/\n/),
        capturedBody =
          body.replace(/(var\s+)?(\w+)\s*(=|\+=|-=)\s*([^=][^;]+)(;)?$/gm,
            function(match, varOrNot, name, operator, value, semiOrNot) {
              varOrNot = typeof varOrNot === 'undefined' ? '' : varOrNot;
              semiOrNot = typeof semiOrNot === 'undefined' ? '' : semiOrNot;

              switch (operator) {
                case '=':
                  return varOrNot + name + ' = __assign("' + name + '", ' +
                    value + ')' + semiOrNot;

                case '+=':
                  return varOrNot + name + ' = __assign("' + name + '", ' +
                    name + ' + ' + value + ')' + semiOrNot;

                case '-=':
                  return varOrNot + name + ' = __assign("' + name + '", ' +
                    name + ' - ' + value + ')' + semiOrNot;
              }
            }),

        capturedLines = capturedBody.split(/\n/);

    for (var i = 0; i < lines.length; ++i) {
      var markLineNumber =
            '; __line(' + (i + 1) + ', atob("' + btoa(lines[i]) + '"));';

      capturedLines[i] = markLineNumber + capturedLines[i] + markLineNumber;
    }

    return capturedLines.join('\n');
  };

  var execute = function(capturedMarkedBody) {
    var __environment = {},
        __lineNumber = 1,
        __lastLineNumber = 1,
        __steps = [],
        __stepNumber = 0,
        __line = function(i, lineSource) {
          if (i != __lastLineNumber) {
            __stepNumber++;
          }

          __lineNumber = i;
          __steps[__stepNumber] = {
            lineNumber: __lineNumber,
            lineSource: lineSource,
            environment: $.extend({}, __environment)
          };

          __lastLineNumber = __lineNumber;
        },

        __assign = function(key, value) {
          __environment[key] = value;

          return value;
        },

        __result = eval(capturedMarkedBody);

    return {
      result: __result,
      steps: __steps
    };
  };

  return function(body) {
    return execute(captureAndMark(body));
  };
});

js.directive('jsTraceView', function($filter) {
  return {
    restrict: 'A',
    scope: {
      'body': '@'
    },
    template:
      '<div class="row-fluid" ng-repeat="step in steps">' +
        '<div class="span6">' +
          '<pre>{{ step }}</pre>' +
        '</div>' +
      '</div>',

    link: function(scope, element, attrs) {
      scope.$watch('body', function(body) {
        scope.steps = $filter('trace')(body).steps;
      });
    }
  };
});

function FunctionCtrl($scope) {
  $scope.body = '';
}
