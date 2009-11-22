// recreates some things to make scripts with firebug debugging functions
// work in other browsers (especially Opera)
// (just a quick'n'dirty drop-in approach; could perhaps be used as a user javascript)
if (!window.console || !window.console.firebug) {
	var names = ["dir", "dirxml", "group", "groupEnd", "trace", "profile", "profileEnd"];
	var logFx = ["log", "debug", "info", "warn", "error"];
	window.console = {};
	// no more javascript errors in non-firefox browsers
	for (i in names) {
		window.console[names[i]] = function() {};
	}
	for (i in logFx) {
		if (window.opera) {
			// simple replacement of the console.log() etc methods of firebug
			window.console[logFx[i]] = (function (logtype) {
											// using scope to remember the instances of the local variables
											// save function name for later use (logtype === logFx[i])
											// see http://www.howtocreate.co.uk/referencedvariables.html
											return function() {
												if (typeof arguments === "undefined") { // no arguments at all
													return null;
												}
												if (arguments.length === 1) { // single argument provided
													opera.postError(logtype+': '+arguments[0]);
													return logtype+': '+arguments[0];
												}
												var string = arguments[0];
												var regexp = new RegExp(/%([sdifo])/g); // string substitution patterns of firebug console
												var count = 0;
												var match = null;
												// replace found matches with given arguments
												while (match = regexp.exec(string)) {
													string = string.replace(match[0], String(arguments[++count]));
												}
												// display log messages
												var len = arguments.length;
												while (len > count++) {
													if (arguments[count]) {
														string += ' ';
														string += String(arguments[count]);
													}
												}
												opera.postError(logtype+': '+string);
											};
										})(logFx[i]);
		} else {
			window.console[logFx[i]] = function(){};
		}
	}
	if (window.opera) {
		// most simple assertion method with parameters: fn(expected, message)
		window.console['assert'] = function() {
										if (arguments.length !== 2) {
											throw new Exception('Please specify an assertion and a message.');
										}
										if (!arguments[0]) {
											opera.postError('Assertion failed: '+arguments[1]);
										}
									};
		// not a good exchange for the firebug version, as this is dependant of
		// the used counter name and displays a log message for every execution
		window.console['count'] = function(arg) {
									var title = arg || 'defaultCounter';
									if (!window.opera['FireBugEquivalent']) {
										window.opera['FireBugEquivalent'] = [];
									}
									if (!window.opera['FireBugEquivalent'][title]) {
										window.opera['FireBugEquivalent'][title] = 0;
									}
									window.opera['FireBugEquivalent'][title] = window.opera['FireBugEquivalent'][title]+1;
									opera.postError('Counter "'+title+'" '+window.opera['FireBugEquivalent'][title]+'x called.');
								  };
		// start a timer specified by a name
		window.console['time'] = function(arg) {
									var timerName = arg || 'defaultTimer';
									if (!window.opera['FireBugEquivalent']) {
										window.opera['FireBugEquivalent'] = [];
									}
									window.opera['FireBugEquivalent'][timerName] = new Date().getTime();
								  };
		// stops a timer specified by name
		window.console['timeEnd'] = function(arg) {
									var timerName = arg || 'default';
									if (window.opera['FireBugEquivalent']) {
										var startTime = window.opera['FireBugEquivalent'][timerName];
										if (startTime) {
											var stopTime = new Date().getTime();
											var elapsed = (stopTime - startTime);
											opera.postError('Timer "'+timerName+'" took '+elapsed+' millisecond'+((elapsed==1)?'':'s'));
											delete window.opera['FireBugTimerEquivalent'][timerName];
										} else { // no start timer found
											opera.postError('No start timer defined - check timer name or call console.time("timerName").');
										}
									} else { // no timers at all
										opera.postError('No previously stored timers found.');
									}
								  };
	}
}
