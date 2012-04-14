<!DOCTYPE html> 
<html> 
	<head> 
	<meta http-equiv="Pragma" content="no-cache">
	<meta http-equiv="Cache-Control" content="no-cache">
	<meta http-equiv="Expires" content="Thu, 01 Dec 1994 16:00:00 GMT"> 
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta id="viewport" name="viewport"
		content="width=auto; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
	<title>jqmdp test page</title> 


	<jsp:include page="/pack.jsp" >
		<jsp:param name="jqmver" value="<%= request.getParameter(&quot;jqmver&quot;)%>" />
	</jsp:include>
	
	<script>
var globalVar = {
	name: 'globalVar',
	a: 'globalVar',
	num: 123.4,
	bool: true,
	obj: {a:'a',b:123},
	ary: [1,2,3],
	nil: null,
	undef: undefined
}

function TestClass() {
	this.a = 'abc';
}
TestClass.prototype.name = "TestClass";
TestClass.prototype.foo =  function(n){
	return n + 11;
};

var dpidMap = {};
function dpidTest($cur) {
	var list = [];
	$("#dpidTest").find("[data-dp-id]").each(function(){
//console.log("---->"+$(this).attr("data-dp-id"));
		list.push($(this).attr("data-dp-id"));
	})
	for (var i = 0; i < list.length; i++) {
		try {
			var $node = $cur.jqmdp(list[i]);
			if ($node) {
				dpidMap[list[i]] = "" + $node.attr("data-dp-id");
			} else {
				dpidMap[list[i]] = "null";
			}
		} catch (e) {
			dpidMap[list[i]] = e.message;
		}
	}
}
	


	</script>


</head>

<body >
	<div data-role="page" id="index" >
		<div data-role="content" >
			<div id="inner-ok"              data-dp-template="#templ-01"></div>
			<hr/>
			<div id="inner-not-found"       data-dp-template="#not-found"></div>
			<hr/>
			<div id="inner-use-dp-attr"     data-dp-template="#templ-02"></div>
			<hr/>
			
			<div id="outer-ok"              data-dp-template="./templ-01.html"></div>
			<hr/>
			<div id="outer-not-found"       data-dp-template="./not-found.html"></div>
			<hr/>
			<div id="outer-use-dp-attr"     data-dp-template="./templ-02.html"></div>
			<hr/>
			<div id="outer-x-site"          data-dp-template="http://www.google.com/"></div>
			<hr/>
			<div id="outer-oncache"         data-dp-template="./templ-01.html"></div>
			<hr/>
		</div>
	</div>
	
	<hr/>
	<h4>templ-01</h4>
	<div id="templ-01">
		<div>Internal html template</div>
	</div>
	
	<hr/>
	<h4>templ-02</h4>
	<div id="templ-02">
		<div>Internal html template with data-dp- attribute.</div>
		<div data-dp-scope="({i:0})">
			<div data-dp-for="(i=0; i<3; i++)">
				<div class="loop-count" data-dp-text="(i)"></div>
			</div>
		</div>
	</div>
	

</body>

</html>
