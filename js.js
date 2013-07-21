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
        __changed = null,

        __lineNumber = 1,
        __lastLineNumber = 1,

        __steps = [],
        __stepNumber = 0,

        __line = function(i, lineSource) {
          if (i != __lastLineNumber) {
            __changed = null;
            __stepNumber++;
          }

          if (__changed != null) {
            __environment[__changed].type =
              eval('typeof ' + __changed);
          }

          __lineNumber = i;
          __steps[__stepNumber] = {
            changed: __changed,
            environment: $.extend({}, __environment),
            lineNumber: __lineNumber,
            lineSource: lineSource
          };

          __lastLineNumber = __lineNumber;
        },

        __assign = function(key, value) {
          __changed = key;
          __environment[key] = {
            type: null,
            value: value
          };

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
    templateUrl: '/js-trace-view.html',
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
