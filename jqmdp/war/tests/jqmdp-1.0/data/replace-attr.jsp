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
			<div id="text-a" data-dp-text="(a)"></div>
			<div id="text-b" data-dp-text="(b)"></div>
			<div id="html-a" data-dp-html="(a)"></div>
			<div id="html-b" data-dp-html="(b)"></div>

			<hr/>

			<img id="img-normal" data-dp-src="('test.png')" />
			<img id="img-not-found" data-dp-src="('not-found.png')" />
			<img id="img-null" src="test.png" data-dp-src="(null)" />
			<iframe id="iframe-notmal" data-dp-src="('templ-01.html')"></iframe>

			<hr/>
		
			<a id="href-normal" data-dp-href="('templ-01.html')" >link</a>
			<a id="href-not-found" data-dp-href="('not-found.html')" >link</a>
			<a id="href-null" href="templ-01.html" data-dp-href="(null)" >link</a>

			<hr/>

			<input id="input-normal" value="xx" data-dp-value="('test-data')" />
			<input id="input-nil" value="xx"  data-dp-value="('')" />
			<input id="input-null" value="initial"  data-dp-value="(null)" />

			<hr/>

			<textarea id="textarea-normal"  data-dp-value="('test-data')" >xx</textarea>
			<textarea id="textarea-nil"  data-dp-value="('')" >xx</textarea>
			<textarea id="textarea-null"  data-dp-value="(null)" >initial</textarea>

			<hr/>

			<select id="select-normal" data-dp-value="(['b'])" >
				<option value="a">a</option>
				<option value="b">b</option>
				<option value="c">c</option>
			</select>
			<select id="select-not-found" data-dp-value="(['x'])" >
				<option value="a">a</option>
				<option value="b">b</option>
				<option value="c">c</option>
			</select>
			<select id="select-nil" data-dp-value="([])" >
				<option value="a">a</option>
				<option value="b">b</option>
				<option value="c">c</option>
			</select>
			<select id="select-null" data-dp-value="(null)" >
				<option value="a">a</option>
				<option value="b">b</option>
				<option value="c">c</option>
			</select>
	
			<hr/>

			<div id="show-true" data-dp-show="(true)" >SHOW</div>
			<div id="show-false" data-dp-show="(false)" >HIDE</div>
			<div id="show-null" data-dp-show="(null)" >HIDE</div>

			<hr/>

			<div id="class-true" class="class1 class3" data-dp-class="([true,'class1','class2'])" >SHOW</div>
			<div id="class-false" class="class1 class3" data-dp-class="([false,'class1','class2'])" >HIDE</div>

			<hr/>

			<div id="args-count" data-dp-scope="({i:0})">
				<div data-dp-for="(i=0; i<3; i++)">
					<div class="args-count" data-dp-args="(i*i)" ></div>
				</div>
			</div>
			<div id="args-const" data-dp-args="(123)" ></div>

		</div>
	</div>
</body>

</html>
