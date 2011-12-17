
var Sandbox = function(url){
	this.url = url;
	this.win = null;
	this.onload = [];
	this.autoClose = true;
}
Sandbox.prototype = {
	setup: function() {
		var self = this;
		this.win = window.open(this.url, "_blank");
		$(this.win).load(function(){
			var $handle = $(this.document);
			for (var i=0; i<self.onload.length; i++) {
				self.onload[i]($handle);
			}
		});
	},
	teardown: function() {
		if (this.autoClose) this.win.close()
	},
	load: function(callback){
		this.onload.push(callback);
	}
};

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
var sandbox;
module("scope", new Sandbox("data/scope.html"));

test("position", function() {
	stop();
	this.load(function($sandbox){
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
	this.load(function($sandbox){
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
	this.load(function($sandbox){
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
	this.load(function($sandbox){
		start();
		same($sandbox.find("#dpid-normal").text(),"a0z9-_");
		same($sandbox.find("#dpid-error").text(),"undefined");
		same($sandbox.find("#dpid-dup").text(),"undefined");
	});
});

test("dpid-ref", function() {
	stop();
	this.load(function($sandbox){
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
module("template", new Sandbox("data/template.html"));

test("inner", function() {
	stop();
	this.load(function($sandbox){
		setTimeout(function(){
			start();
			same($sandbox.find("#inner-ok").html(), $sandbox.find("#templ-01").html());
			same($sandbox.find("#inner-not-found").text().substr(0,15), "Template error:");
	
			var $loopCnt = $sandbox.find("#inner-use-dp-attr").find(".loop-count");
			same($loopCnt.length, 3);
			same($loopCnt.text(), "012");
		}, 500);
	});
});

test("outer", function() {
	stop();
	this.load(function($sandbox){
		setTimeout(function(){
			start();
			same($sandbox.find("#outer-ok").html(), "<div>External html template</div>");
			same($sandbox.find("#outer-not-found").text().substr(0,15), "Template error:");
			same($sandbox.find("#outer-x-site").text().substr(0,15), "Template error:");
			same($sandbox.find("#outer-oncache").html(), "<div>External html template</div>");
	
			var $loopCnt = $sandbox.find("#outer-use-dp-attr").find(".loop-count");
			same($loopCnt.length, 3);
			same($loopCnt.text(), "012");
		}, 500);
	});
});

// --------------------------------------------------------------
module("replace-attr", new Sandbox("data/replace-attr.html"));


test("text", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#text-a").text(),"a<b>&amp;c</b>d");
		same($sandbox.find("#text-b").text(),"123.4");
	});
});

test("html", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#html-a").text(),"a&cd");
		same($sandbox.find("#html-b").text(),"123.4");
	});
});

test("src", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#img-normal").attr('src'),"test.png");
		same($sandbox.find("#img-not-found").attr('src'),"not-found.png");
		//equal($sandbox.find("#img-null").attr('src'), null);
		same($sandbox.find("#iframe-notmal").attr('src'),"templ-01.html");
	});
});

test("value", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#input-normal").val(),"test-data");
		same($sandbox.find("#input-nil").val(),"");
		//same($sandbox.find("#input-null").val(),"initial");

		same($sandbox.find("#textarea-normal").val(),"test-data");
		same($sandbox.find("#textarea-nil").val(),"");

		same($sandbox.find("#select-normal").val(),"b");
		//same($sandbox.find("#select-not-found").val(),"");
		//same($sandbox.find("#select-nil").val(),"");
	});
});

test("show", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#show-true").css("display"),"block");
		same($sandbox.find("#show-false").css("display"),"none");
		same($sandbox.find("#show-null").css("display"),"none");
	});
});

test("class", function() {
	function toSet(cls) {
		var map = {};
		var clss = cls.split(" ");
		for (var i=0; i<clss.length; i++) {
			map[clss[i]] = clss[i];
		}
		return map;
	}
	stop();
	this.load(function($sandbox){
		start();
		deepEqual(
			toSet($sandbox.find("#class-true").attr("class")),
			toSet("class1 class2 class3")
		);
		same($sandbox.find("#class-false").attr("class"),"class3");
	});
});



test("args", function() {
	stop();
	this.load(function($sandbox){
		start();
		var $count = $sandbox.find("#args-count").find(".args-count");
		same($count.length, 3);
		for (var i=0; i<3; i++) {
			equal($($count[i]).jqmdp().args(), i*i);
		}
		equal($sandbox.find("#args-const").jqmdp().args(), 123);
	});
});


// --------------------------------------------------------------
module("ctrl-attr", new Sandbox("data/ctrl-attr.html"));


test("for", function() {
	stop();
	this.load(function($sandbox){
		start();
		var $count = $sandbox.find("#for-count").find(".for-count");
		same($count.length, 3);
		for (var i=0; i<3; i++) {
			equal($($count[i]).text(), i);
		}
		
		var $each = $sandbox.find("#for-each").find(".for-each");
		same($each.length, 3);
		for (var i=0; i<3; i++) {
			equal($($each[i]).jqmdp().args().toUpperCase(), $($each[i]).text());
		}
	});
});

test("if", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#if-true").text(), "test-1");
		same($sandbox.find("#if-false").length, 0);
	});
});

test("if-self", function() {
	stop();
	this.load(function($sandbox){
		start();
		same($sandbox.find("#if-self-true").length, 1);
		same($sandbox.find("#if-self-false").length, 0);
	});
});

test("mix", function() {
	//this.autoClose = false;
	stop();
	this.load(function($sandbox){
		start();
		var $mix = $sandbox.find("#mix-test").find(".mix-test");

		var trueData = [];
		for (var x=0; x<6; x+=2) {
			for (var y=0; y<6; y+=2) {
				for (var z = 0; z < 3; z++) {
					trueData.push(x+","+y+","+z);
				}
			}
		}
		
		same($mix.length, trueData.length);
		for (var i=0; i<trueData.length; i++) {
			same($($mix[i]).text(), trueData[i]);
		}
	});
});
