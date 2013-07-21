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
        __changes = [],

        __lineNumber = 1,
        __lastLineNumber = 1,

        __steps = [],
        __stepNumber = 0,

        __resetChanges = function() {
          __changes = [];
          $.each(__environment, function(key, _) {
            __environment[key].changed = false;
          });
        },

        __recordTypes = function() {
          if (__changes.length) {
            $.each(__changes, function(i, key) {
              __environment[key].type =
                eval('typeof ' + key);
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

        __assign = function(key, value) {
          __changes.push(key);
          __environment[key] = {
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
