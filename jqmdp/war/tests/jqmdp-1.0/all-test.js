
var $sandbox;
var timeout = 3;
function wait(cond, func, args) {
	var bool = (typeof cond === "function") ? cond() : eval(cond);
	if (bool) {
		func(args);
	} else{
		console.log("waiting:"+cond);
		var me = arguments.callee;
		setTimeout(function(){
			me(cond, func, args);
		}, 200);
	}
}

// --------------------------------------------------------------

module("scope", {
	setup: function() {
		var $iframe = $("#sandbox");
		$iframe.load(function(){
			$sandbox = $iframe.contents();
		})
		$iframe.attr("src","data/scope.html");
	},
	teardown: function() {
		$sandbox = null;
	}
});

test("scope", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#index").scope().name,"ancest","場所/page");
		same($sandbox.find("#inner").scope().name,"parent","場所/div");
		same($sandbox.find("#nest-3").scope().name,"current");
		same($sandbox.find("#childSc").scope().name,"child");
		same($sandbox.find("#brotherSc").scope().name,"brother");
		same($sandbox.find("#globalVarSc").scope().name,"globalVar");
		same($sandbox.find("#newTestClassSc").scope().name,"TestClass");
	});
});

test("data-ref", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#current").text(),"nest-3");
		same($sandbox.find("#parent").text(),"inner");
		same($sandbox.find("#ancest").text(),"page");
		same($sandbox.find("#current-or").text(),"c");
		same($sandbox.find("#parent-or").text(),"p");
		same($sandbox.find("#ancest-or").text(),"a");
		same($sandbox.find("#child").text(),"undefined");
		same($sandbox.find("#brother").text(),"undefined");
		same($sandbox.find("#globalVar").text(),"globalVar");
		same($sandbox.find("#newTestClass").text(),"abc");
	});
});

test("data-type", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#type-num").text(),"123.4");
		same($sandbox.find("#type-bool").text(),"true");
		same($sandbox.find("#type-obj").text(),"[object Object]");
		same($sandbox.find("#type-ary").text(),"1,2,3");
		same($sandbox.find("#type-nil").text(),"null");
		same($sandbox.find("#type-undef").text(),"undefined");
		same($sandbox.find("#func").text(),"111");
	});
});

test("dpid-name", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#dpid-normal").text(),"a0z9-_");
		same($sandbox.find("#dpid-error").text(),"undefined");
		same($sandbox.find("#dpid-dup").text(),"undefined");
	});
});

test("dpid-ref", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		var $iframe = $("#sandbox");
		var dpidMap = $iframe[0].contentWindow.dpidMap;

		var errMap = {
			"brother-child": "null",
			"current-brother-sc-child":  "null",
			"current-child-sc-child":    "null",
			"current-descent-sc-child":  "null",
			"current-descent-sc":        "null"
		};
		for (k in dpidMap) {
			var trueRes = errMap[k] ? errMap[k] : k;
			same(dpidMap[k], trueRes, k);
		}
	});
});


// --------------------------------------------------------------

module("replace-attr", {
	setup: function() {
		var $iframe = $("#sandbox");
		$iframe.load(function(){
			$sandbox = $iframe.contents();
		})
		$iframe.attr("src","data/replace-attr.html");
	},
	teardown: function() {
		$sandbox = null;
	}
});


test("text", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#text-a").text(),"a<b>&amp;c</b>d");
		same($sandbox.find("#text-b").text(),"123.4");
	});
});

test("html", function() {
	stop();
	wait("($sandbox)", function(){
		start();
		same($sandbox.find("#html-a").text(),"a&cd");
		same($sandbox.find("#html-b").text(),"123.4");
	});
});



