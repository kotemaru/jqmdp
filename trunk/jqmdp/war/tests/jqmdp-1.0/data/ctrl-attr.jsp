<!DOCTYPE html> 
<html> 
	<head> 
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta id="viewport" name="viewport"
		content="width=auto; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />
	<title>jqmdp test page</title> 

	<jsp:include page="/pack.jsp" >
		<jsp:param name="jqmver" value="<%= request.getParameter(&quot;jqmver&quot;)%>" />
	</jsp:include>

	<script>
var data = {
	a: 'a<b>&amp;c</b>d',
	b: 123.4
}
	</script>


</head>

<body >
	<div data-role="page" id="index" data-dp-scope="(data)">
		<div data-role="content" >
			<div id="for-count" data-dp-scope="({i:0})">
				<div data-dp-for="(i=0; i<3; i++)">
					<div class="for-count" data-dp-text="(i)"></div>
				</div>
			</div>
			
			<div id="for-each" data-dp-scope="({k:0, map:{a:'A', b:'B', c:'C'}})">
				<div data-dp-for="(k in map)">
					<div class="for-each" data-dp-args="(k)" data-dp-text="(map[k])"></div>
				</div>
			</div>

			<div data-dp-scope="({value:'abc'})">
			  <div>test-1:
			    <span data-dp-if="(value=='abc')">
			      <span id='if-true'>test-1</span>
			    </span>
			  </div>
			  <div>test-2:
			    <span data-dp-if="(value=='def')">
			      <span id='if-false'>test-2</span>
			    </span>
			  </div>
			</div>
 
			<div data-dp-scope="({value:'abc'})">
			  <div>test-1:
			    <span id='if-self-true' data-dp-if-self="(value=='abc')">
			      <span >test-1</span>
			    </span>
			  </div>
			  <div>test-2:
			    <span id='if-self-false' data-dp-if-self="(value=='def')">
			      <span >test-2</span>
			    </span>
			  </div>
			</div>
 
			<div id="mix-test" data-dp-scope="({x:0, y:0, z:0})">
				<div data-dp-for="(x=0; x<6; x++)">
					<div data-dp-if="(x%2==0)">
						<div data-dp-for="(y=0; y<6; y++)">
							<div data-dp-if-self="(y%2==0)">
								<div data-dp-for="(z=0; z<3; z++)">
									<span class='mix-test' data-dp-text="(x+','+y+','+z)"></span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
</body>

</html>
