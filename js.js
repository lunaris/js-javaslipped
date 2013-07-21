var js = angular.module('js', []);

js.factory('Trace', function() {
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


    $.each(lines, function(i, line) {
      var markLineNumber =
            '; __line(' + (i + 1) + ', atob("' + btoa(line) + '"));';

      capturedLines[i] = markLineNumber + capturedLines[i] + markLineNumber;
    });

    return capturedLines.join('\n');
  };

  var execute = function(capturedMarkedBody) {
    var __environment = {},
        __changes = [],

        __lineNumber = 1,
        __lastLineNumber = 1,

        __steps = [],
        __stepNumber = 0,

        __resetChanges = function() {
          __changes = [];
          $.each(__environment, function(name, _) {
            __environment[name].changed = false;
          });
        },

        __recordTypes = function() {
          if (__changes.length) {
            $.each(__changes, function(i, name) {
              __environment[name].type =
                eval('typeof ' + name);
            });
          }
        };

        __line = function(i, lineSource) {
          if (i != __lastLineNumber) {
            __resetChanges();
            __stepNumber++;
          }

          __recordTypes();

          __lineNumber = i;
          __steps[__stepNumber] = {
            changes: __changes,
            environment: $.extend(true, {}, __environment),
            lineNumber: __lineNumber,
            lineSource: lineSource
          };

          __lastLineNumber = __lineNumber;
        },

        __assign = function(name, value) {
          __changes.push(name);
          __environment[name] = {
            changed: true,
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

  return function(args, body) {
    var capturedMarkedBody = captureAndMark(body),
        argumentPrefix = '';

    $.each(args, function(arg, value) {
      argumentPrefix += 'var ' + arg + ' = ' + value + ';';
    });

    var fullBody = argumentPrefix + capturedMarkedBody;
    return execute(fullBody);
  };
});

js.directive('jsTraceView', function(Trace) {
  return {
    restrict: 'A',
    scope: {
      'args': '=',
      'body': '='
    },
    templateUrl: '/js-trace-view.html',
    link: function(scope, element, attrs) {
      scope.argValues = {};

      scope.$watch('args', function(args) {
        scope.steps = Trace({}, scope.body).steps;
      });

      scope.$watch('argValues', function(argValues) {
        scope.steps = Trace(argValues, scope.body).steps;
      }, true);

      scope.$watch('body', function(body) {
        scope.steps = Trace({}, body).steps;
      });
    }
  };
});

js.directive('jsArgumentList', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      var fromString = function(s) {
            return s.split(/\s*,\s*/);
          },

          toString = function(args) {
            return args.join(', ');
          };

      ngModel.$parsers.push(fromString);
      ngModel.$formatters.push(toString);
    }
  };
});

function FunctionCtrl($scope) {
  $scope.args = [];
  $scope.body = '';

  $scope.setupTest = function() {
    $scope.body =
      "var x = 'hello';\n" +
      "var y = 'world';\n" +
      "o = { 'first': 1, second: '2nd' };\n" +
      "copy = firstArgument;\n" +
      "if (x == y) {\n" +
      "  z = 5;\n" +
      "} else {\n" +
      "  z = 6;\n" +
      "}\n" +
      "\n" +
      "var f = function() { return 4 };";
  }
}
