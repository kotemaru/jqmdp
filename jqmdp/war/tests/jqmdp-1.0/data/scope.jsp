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
	<div data-role="page" id="index" 
			data-dp-scope="({name:'ancest',ancest:'page',or1:'a',or2:'a',or3:'a'})">
		<div data-role="content" >
			
			<div id="inner" data-dp-scope="({name:'parent',parent:'inner',or2:'p',or3:'p'})">
				<div id="nest-3" data-dp-scope="({name:'current',current:'nest-3',or3:'c'})">
					<div id="current" data-dp-text="(current)"></div>
					<div id="parent" data-dp-text="(parent)"></div>
					<div id="ancest" data-dp-text="(ancest)"></div>
					<div id="current-or" data-dp-text="(or3)"></div>
					<div id="parent-or" data-dp-text="(or2)"></div>
					<div id="ancest-or" data-dp-text="(or1)"></div>
					<div id="child" data-dp-text="(childData)"></div>
					<div id="brother" data-dp-text="(brotherData)"></div>
					<div id="childSc" data-dp-scope="({name:'child',childData:'child'})">
					</div>
				</div>
				<div id="brotherSc" data-dp-scope="({name:'brother',brotherData:'brother'})">
				</div>
			</div>
			
			<div id="globalVarSc" data-dp-scope="(globalVar)">
				<div id="globalVar" data-dp-text="(a)"></div>
				<div id="type-num" data-dp-text="(num)"></div>
				<div id="type-bool" data-dp-text="(bool)"></div>
				<div id="type-obj" data-dp-text="(obj)"></div>
				<div id="type-ary" data-dp-text="(ary)"></div>
				<div id="type-nil" data-dp-text="(nil)"></div>
				<div id="type-undef" data-dp-text="(undef)"></div>
			</div>
			
			<div id="newTestClassSc" data-dp-scope="(new TestClass())">
				<div id="newTestClass" data-dp-text="(a)"></div>
				<div id="func" data-dp-text="(foo(100))"></div>
			</div>
			
			<div data-dp-id="a0z9-_" data-dp-scope="({name:'a0z9-_'})"></div>
			<div data-dp-id="!@#$%^" data-dp-scope="({name:'!@#$%^'})"></div>
			<div data-dp-id="dup-id" data-dp-scope="({name:'dup-1'})"></div>
			<div data-dp-id="dup-id" data-dp-scope="({name:'dup-2'})"></div>

			<div>
				<div id="dpid-error"  data-dp-text="($this.scope('!@#$%^').name)"></div>
				<div id="dpid-dup"    data-dp-text="($this.scope('dup-id').name)"></div>
				<div id="dpid-normal" data-dp-text="($this.scope('a0z9-_').name)"></div>
			</div>

		  <div id="dpidTest" >
			<div data-dp-id="ancest" data-dp-scope="({name:'ancest'})">
				<div data-dp-id="ancest-child">ancest-child</div>
				<div data-dp-id="parent" data-dp-scope="({name:'parent'})">
					<div data-dp-id="parent-child">parent-child</div>
					<div data-dp-id="current" data-dp-scope="({name:'current'})">	
						<div data-dp-id="current-ancest" >
							<div data-dp-id="current-parent" >
								<div data-dp-id="current-current" data-dp-args="(dpidTest($this))">
									<div data-dp-id="current-child" >
										<div data-dp-id="current-descent" >
										</div>
									</div>
									<div data-dp-id="current-child-sc" data-dp-scope="{name:'current-child'}" >
										<div data-dp-id="current-child-sc-child" ></div>
										<div data-dp-id="current-descent-sc" data-dp-scope="{name:'current-descent'}" >
											<div data-dp-id="current-descent-sc-child" >
											</div>
										</div>
									</div>
								</div>
								<div data-dp-id="current-brother"></div>
								<div data-dp-id="current-brother-sc" data-dp-scope="{name:'current-brother'}" >
									<div data-dp-id="current-brother-sc-child" >
									</div>
								</div>
							</div>
						</div>
					</div>
					<div data-dp-id="brother" data-dp-scope="({name:'brother'})">
						<div data-dp-id="brother-child"></div>
					</div>
				</div>
			</div>
		  </div>

		</div>
	</div>
</body>

</html>
