
var Docs = {};

Docs.trimHtml = function(str) {
	return str.replace(/^\s*/,"")
		.replace(/\t/g,"  ")
		.replace(/<head>([\r\n]|.)*<\/head>/,"<head>...</head>")
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/(data-dp-[a-z]+=".*")/g,"<b>$1</b>")
		.replace(/(on[a-z]+="[^"]*[$][.]jqmdp[.(][^"]*")/g,"<b>$1</b>")
		.replace(/(on[a-z]+="[^"]*[$][.]scope[.(][^"]*")/g,"<b>$1</b>")
		.replace(/&lt;!--(.*)-->/g,"&lt;!--<i>$1</i>-->")
	;
}

Docs.trimJs = function(str) {
	return str.replace(/\t/g,"  ")
		.replace(/\/\/(.*)$/mg,"//<i>$1</i>")
	;
}
