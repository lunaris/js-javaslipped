var js = angular.module('js', []);

js.factory('Define', function() {
  return function(name, args, body) {
    var wrappedBody = '(function() {' + body + '})();'
    eval(
      'window["' + name + '"] = function(' + args + ') {' +
        'return eval(atob("' + btoa(wrappedBody) + '"));' +
      '};'
    );
  };
});

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
                    value + '); __recordType("' + name + '", ' + value + ');' +
                    semiOrNot;

                case '+=':
                  return varOrNot + name + ' = __assign("' + name + '", ' +
                    name + ' + ' + value + '); __recordType("' + name + '", ' +
                    name + ' + ' + value + ');' + semiOrNot;

                case '-=':
                  return varOrNot + name + ' = __assign("' + name + '", ' +
                    name + ' - ' + value + '); __recordType("' + name + '", ' +
                    name + ' - ' + value + ');' + semiOrNot;
              }
            }),

        capturedLines = capturedBody.split(/\n/);


    $.each(lines, function(i, line) {
      var markLineNumber =
            '; __line(' + (i + 1) + ', atob("' + btoa(line) + '"));';

      capturedLines[i] = markLineNumber + capturedLines[i] + markLineNumber;
    });

    return '(function() {' + capturedLines.join('\n') + '})()';
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

        __recordType = function(name, value) {
          __environment[name].type = typeof value;
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

  return function(argValues, body) {
    var capturedMarkedBody = captureAndMark(body),
        argumentDeclarations = '';

    $.each(argValues, function(arg, value) {
      argumentDeclarations += 'var ' + arg + ' = ' + value + ';';
    });

    var fullBody = argumentDeclarations + capturedMarkedBody;
    return execute(fullBody);
  };
});

js.directive('jsTraceView', function(Define, Trace) {
  return {
    restrict: 'A',
    scope: {
      name: '=',
      args: '=',
      body: '='
    },
    templateUrl: '/js-trace-view.html',
    link: function(scope, element, attrs) {
      scope.argValues = {};

      scope.$watch('name', function(newName, oldName) {
        delete window[oldName];
        Define(newName, scope.args, scope.body);

        scope.trace = Trace(scope.argValues, scope.body);
      });

      scope.$watch('args', function(args) {
        Define(scope.name, args, scope.body);
        scope.trace = Trace(scope.argValues, scope.body);
      });

      scope.$watch('argValues', function(argValues) {
        Define(scope.name, scope.args, scope.body);
        scope.trace = Trace(argValues, scope.body);
      }, true);

      scope.$watch('body', function(body) {
        Define(scope.name, scope.args, body);
        scope.trace = Trace(scope.argValues, body);
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
  $scope.name = '';
  $scope.args = [];
  $scope.body = '';

  $scope.setupTest = function() {
    $scope.name = 'f';
    $scope.args = ['firstArgument', 'secondArgument'];

    $scope.body =
      "var x = 'hello';\n" +
      "var y = 'world';\n" +
      "o = { 'first': 1, second: '2nd' };\n" +
      "copy = firstArgument;\n" +
      "x = secondArgument;\n" +
      "if (x == y) {\n" +
      "  z = 5;\n" +
      "} else {\n" +
      "  z = 6;\n" +
      "}\n" +
      "\n" +
      "var f = function() { return 4 };\n" +
      "return z;";
  }
}
