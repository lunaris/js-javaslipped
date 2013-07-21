var js = angular.module('js', []);

js.filter('trace', function() {
  var captureAndMark = function(body) {
    var captured =
          body.replace(/(var\s+)?(\w+)\s*=\s*([^;]+)(;)?$/gm,
            "$1$2 = __assign('$2', $3)$4"),

        lines = captured.split(/\n/);

    for (var i = 0; i < lines.length; ++i) {
      var markLineNumber = '; __line(' + (i + 1) + ');';
      lines[i] = markLineNumber + lines[i] + markLineNumber;
    }

    return lines.join('\n');
  };

  var execute = function(capturedMarkedBody) {
    var __environment = {},
        __lineNumber = 1,
        __lastLineNumber = 1,
        __trace = [],
        __step = 0,
        __line = function(i) {
          if (i != __lastLineNumber) {
            __step++;
          }

          __lineNumber = i;
          __trace[__step] = {
            lineNumber: __lineNumber,
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
      trace: __trace
    };
  };

  return function(body) {
    return execute(captureAndMark(body));
  };
});

function FunctionCtrl($scope) {
  $scope.body = '';
}
