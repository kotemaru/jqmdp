/*
* jQuery Mobile Dynamic Page plugin
*
* Copyright 2011 (c) kotemaru@kotemaru.org
* Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
*/
/*
 * Warn: My English is very doubtful.
 * Note: JQM and $.data() problem. Data are cleared.
 */

//TODO: docsにスコープインスタンスの用語定義。
//TODO: data-dp-id のスコープをスコープに載せる
//TODO: jqmdp() の戻り値を $this に上書きに変える。

(function($) {
	var isDebug = false;

	var PRE = "data-dp-";
	
	var SCOPE = PRE+"scope";
	var DP_ID  = PRE+"id";
	var SHOW  = PRE+"show";
	var SRC   = PRE+"src";
	var HREF  = PRE+"href";
	var HTML  = PRE+"html";
	var TEXT  = PRE+"text";
	var VALUE = PRE+"value";
	var TEMPLATE = PRE+"template";
	var ACTIVE = PRE+"active";
	var ACTIVE_CLASS = ACTIVE+"-class";

	var IF    = PRE+"if";
	var IFSELF= PRE+"if-self";
	var FOR   = PRE+"for";

	var XP_SCOPE = "*["+SCOPE+"]";
	var XP_DP_ID  = "*["+DP_ID+"]";
	var XP_SHOW  = "*["+SHOW+"]";
	var XP_SRC   = "*["+SRC+"]";
	var XP_HREF  = "*["+HREF+"]";
	var XP_HTML  = "*["+HTML+"]";
	var XP_TEXT  = "*["+TEXT+"]";
	var XP_VALUE = "*["+VALUE+"]";
	var XP_TEMPLATE = "*["+TEMPLATE+"]";
	var XP_ACTIVE = "*["+ACTIVE+"]";
	var XP_ACTIVE_CLASS = "*["+ACTIVE_CLASS+"]";

	var XP_IF    = "*["+IF+"]";
	var XP_IFSELF= "*["+IFSELF+"]";
	var XP_FOR   = "*["+FOR+"]";
	
	/**
	 * The preservation of the outside template.
	 * Key is url, Value is {q:[], node: $(DOM fragment)}.
	 * q is queue of the template application of the load waiting.
	 * @see $.jqmdp.exTemplate()
	 */
	var exTemplates = {};

	/**
	 * The function sets an event handler of jqmdp in all JQM Pages.
	 * @param root Usually appoint document.body.
	 */
	function init(root) {
		var $pages = $(root).find("div[data-role='page']");

		$pages.live('pageinit', function(ev) {
			var $page = $(ev.target);
			doScopes(ev, $page, initScope);
			doScopes(ev, $page, onPageInit);
		}).live('pagebeforeshow', function(ev) {
			// The 'pagebeforeshow' event is accompanied by DynamicPage processing.
			doScopes(ev, $(ev.target), onBeforeShow, processPage);
		}).live('pageshow', function(ev) {
			doScopes(ev, $(ev.target), onShow);
		}).live('pagebeforehide', function(ev) {
			doScopes(ev, $(ev.target), onBeforeHide, processPage);
		}).live('pagehide', function(ev) {
			doScopes(ev, $(ev.target), onHide);
		})
		;
	}

	/**
	 * A convenient function to transmit an event to the scope of subordinates.
	 * The exception captures it and displays warning.
	 * @param ev original event.
	 * @param $elem Page or other jQuery object.
	 * @param hander event handler.
	 * @param afterHander Finally the handler which is called once.
	 */
	function doScopes(ev, $elem, hander, afterHander) {
		try {
			hander(ev, $elem);
			$elem.find(XP_SCOPE).each(function(){
				hander(ev, $(this));
			});
			if (afterHander) afterHander($elem, ev);
		} catch(e) {
			// Because JQM stops when I throw an exception.
			console.error(e.stack);
			alert(e.message+"\n"+e.stack);
		}
	}

	/**
	 * Event handler of 'pageinit'.
	 * This is evaluate the scope attribute of descendant and stick it on an element.
	 * Because $.data() is a dune buggy, I set scope instance directly in Element.jqmdp_scope.
	 * @param ev original event.
	 * @param $elem Page or other jQuery object.
	 */
	function initScope(ev, $elem) {
		var scope = $elem[0].jqmdp_scope;
		if (scope !== undefined) return;
		
		var scopeSrc = $elem.attr(SCOPE);
		if (scopeSrc != null) {
			$elem[0].jqmdp_scope = localEval(scopeSrc, null, {$this: $elem});
		}
	}
	
	/**
	 * If scope instance has the function of the handler, I call it.
	 * @param ev original event.
	 * @param $elem Page or other jQuery object.
	 * @param mname Hander function name.
	 */
	function onOther(ev, $elem, mname) {
		var scope = $elem[0].jqmdp_scope;
		if (scope && scope[mname]) {
			scope[mname](ev,$elem);
		}
	}
	function onPageInit(ev, $elem) {onOther(ev, $elem, "onPageInit");}
	function onBeforeShow(ev, $elem) {onOther(ev, $elem, "onBeforeShow");}
	function onShow(ev, $elem) {onOther(ev, $elem, "onShow");}
	function onBeforeHide(ev, $elem) {onOther(ev, $elem, "onBeforeHide");}
	function onHide(ev, $elem) {onOther(ev, $elem, "onHide");}


	/**
	 * Dynamic page attributes processes all scopes of the descendant of the page.
	 * The range of the descendant is removed from the DOM tree temporarily.
	 * After having handled it independently, each scope is put back.
	 * TODO: This implementation is not stylish.
	 * @param $page Page jQuery object.
	 */
	function processPage($page) {
		if ($page == null) {
			console.error("JQMDP processing Page is null? ignore.");
			return;
		}

		// Take off and backup scope elements.
		var $locals = $page.find(XP_SCOPE);
		var roots       = new Array($locals.length);
		var markers     = new Array($locals.length);
		var scopeElmes  = new Array($locals.length);
		var scopeAttrs  = new Array($locals.length);
		var scopeStacks = new Array($locals.length);
		
		// Take off and backup scope elements.
		for (var i=0; i<$locals.length; i++) {
			scopeElmes[i] = $($locals[i]);
			roots[i] = getAncestor(scopeElmes[i]);
		}
		// Scope partitioning.
		for (var i=0; i<$locals.length; i++) {
			markers[i] = $("<div>marker="+i+"</div>");
			scopeElmes[i].replaceWith(markers[i]);
		}

		// Make attrs and scope stack in scope.
		var pageAttrs = getAttrs($page);
		var pageScopeStack = getScopeStack(getAncestor($page), pageAttrs);
		for (var i = 0; i < scopeElmes.length; i++) {
			scopeAttrs[i] = getAttrs(scopeElmes[i]);
			scopeStacks[i] = getScopeStack(roots[i], scopeAttrs[i]);
		}

		// Put back scope elements.
		for (var i=markers.length-1; i>=0; i--) {
			markers[i].replaceWith(scopeElmes[i]);
		}

		// Processing DynamicPage attributs.
		process($page, pageAttrs, pageScopeStack);
		for (var i = 0; i < scopeElmes.length; i++) {
			try {
				process(scopeElmes[i], scopeAttrs[i], scopeStacks[i]);
			} catch (e) {
				console.error(e.stack);
				alert(e+"\n"+e.stack);
			}
		}

	}

	function getAncestor($elem) {
		var node = $elem[0];
		var roots = [];
		while (node != null && node != window) {
			if (node.jqmdp_scope !== undefined) {
				roots.push(node);
			}
			node = node.parentNode;
		}
		return roots;
	}
	
	function getScopeStack(roots, attrs) {
		var stack = [];
		for (var i=0; i<roots.length; i++) {
			if (roots[i].jqmdp_scope) {
				stack.push(roots[i].jqmdp_scope);
			}
			/*
			var names = $(roots[i]).find(XP_DP_ID);
			if (names.length > 0) {
				var nameScope = {};
				names.each(function(){
					var $e = $(this);
					nameScope[$e.attr(DP_ID)] = $e;
				});
				stack.push(nameScope);
			}
			*/
		};
		return stack;
	}

	function getAttrs($elem) {
		// Predisposal to handle health of "if" and "for".
		preProcess($elem);

		// Various substituted processing.
		return {
			SHOW   :$elem.find(XP_SHOW),
			SRC    :$elem.find(XP_SRC),
			HREF   :$elem.find(XP_HREF),
			VALUE  :$elem.find(XP_VALUE),
			TEXT   :$elem.find(XP_TEXT),
			HTML   :$elem.find(XP_HTML),
			TEMPLATE:$elem.find(XP_TEMPLATE),
			ACTIVE_CLASS:$elem.find(XP_ACTIVE_CLASS),
			IF     :$elem.find(XP_IF),
			IFSELF :$elem.find(XP_IFSELF),
			FOR    :$elem.find(XP_FOR)
		};
	}

	/**
	 * DynamicPage attributes processing in one scope.
	 * 
	 * 
	 * 
	 * @param $elem Page or scope element jQuery object.
	 * @param scopes scope instance array.
	 */
	function process($elem, attrs, scopes) {
		//console.log("process:"+$elem+"|"+attrs+"|"+scopes);

		var localScope = {};
		// Control sentence structure processing.
		processCond($elem, attrs.IF, "if", IF, scopes, localScope);
		processCond($elem, attrs.IFSELF, "if", IFSELF, scopes, localScope);
		processCond($elem, attrs.FOR, "for", FOR, scopes, localScope);

		// Various substituted processing.
		attrs.SHOW.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			var bool = localEval($e.attr(SHOW), scopes, localScope);
			bool ? $e.show() : $e.hide();
		});
		attrs.SRC.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$e.attr("src",localEval($e.attr(SRC), scopes, localScope));
		});
		attrs.HREF.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$e.attr("href",localEval($e.attr(HREF), scopes, localScope));
		});
		attrs.VALUE.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$e.val(localEval($e.attr(VALUE), scopes, localScope));
		});
		attrs.TEXT.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$e.text(""+localEval($e.attr(TEXT), scopes, localScope));
		});
		attrs.HTML.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$e.html(localEval($e.attr(HTML), scopes, localScope));
		});
		attrs.TEMPLATE.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			$.jqmdp.template($e, $e.attr(TEMPLATE));
		});
		attrs.ACTIVE_CLASS.each(function(){
			var $e = $(this);
			localScope.$this = $e;
			var bool = localEval($e.attr(ACTIVE), scopes, localScope);
			var classes = localEval($e.attr(ACTIVE_CLASS), scopes, localScope);
			for (var i=0; i<classes.length; i++) {
				$e.toggleClass(classes[i], bool);
			}
		});

		
		return $elem;
	}
	
	/**
	 * Control sentence structure processing.
	 * The control sentence is composed as character string and is execute by eval() function.
	 * The body of the control sentence is stored by preprocessing.
	 * Behavior of "if" or "for" is realized by adding the clone to DOM tree when a 
	 * control sentence is  carried out.
	 * 
	 * @param $parent   Page or scope element jQuery object.
	 * @param xpath     XPath to search an attribute.
	 * @param cmd       Control sentence token "if" or "for".
	 * @param attr		Attribute name.
	 * @param scope     scope instance.
	 */
	function processCond(_$parent, _attrs, _cmd, _attr, _scopes, _localScope) {
		_attrs.each(function(){
			var $this = $(this);
			_localScope.$this = $this;
			var _$body = this.jqmdp_body;
			if (isDebug) console.log(_cmd+"-body="+_$body.html());

			$this.html("");
			var _script = _cmd+$this.attr(_attr)+"{"
				+"_processClone($this, _$body, _scopes);"
				+"}"
			;
			if (_attr == IFSELF) {
				_script += "else {$this.remove();}";
			}
			if (isDebug) console.log("cond-Eval:"+_script);
			eval(wrapScopes(_script, _scopes, _localScope));
		});
	}

	/**
	 * The body of the control sentence is reproduced and is added to an element.
	 * The original body must not be modified.
	 * 
	 * @param $elem   scope element jQuery object.
	 * @param $body   Stored Control sentence.
	 * @param scopes   scope instance array.
	 */
	function _processClone($elem, $body, scopes) {
		var $clone = $body.clone();
		var attrs = getAttrs($clone);
		process($clone, attrs, scopes);
		$elem.append($clone.contents());
	}


	/**
	 * JavaScript character string is execute in scope instance.
	 * 
	 * @param _script  javascript code string.
	 * @param _scopes  scope instance array.
	 * @return result value of javascript code.
	 */
	function localEval(_script, _scopes, _localScope){
		if (isDebug) console.log("localEval:"+_script);
		var _res;
		if (_scopes == null || _scopes.length == 0) {
			with (_localScope) {
				_res = eval(_script);
			}
		} else if (_scopes.length == 1) {
			with (_scopes[0]) {
				with (_localScope) {
					_res = eval(_script);
				}
			}
		} else {
			if (isDebug) console.log("localEval:::"+_script);
			_res = eval(wrapScopes(_script, _scopes, _localScope));
		}
		if (isDebug) console.log("localEval=" + _res);
		return _res;
	}
	
	/**
	 * Wrapping scopes javascript code.
	 * @param script  javascript code string.
	 * @param scopes  scope instance array.
	 * @return result Wrapping scopes javascript code.
	 */
	function wrapScopes(script, scopes, _localScope) {
		if (_localScope) {
			script = "with(_localScope){"+script+"}";
		}
		for (var i=0; i<scopes.length; i++) {
			script = "with(_scopes["+i+"]){"+script+"}";
		}
		if (isDebug) console.log("wrapScopes:"+script);
		return script;	
	}
	
	/**
	 * The predisposal of the control sentence structure.
	 * if and for suppot.
	 * @param $elem   scope element jQuery object.
	 */
	function preProcess($elem){
		preProcess0($elem, XP_FOR);
		preProcess0($elem, XP_IF);
		preProcess0($elem, XP_IFSELF);
		return $elem;
	}
	
	/**
	 * The predisposal of the control sentence structure.
	 * Subroutine.
	 * It is cut, and the body is stored.
	 * The control sentence structure will have an empty body.
	 * @param $elem   scope element jQuery object.
	 * @param xpath   XPath to search an attribute.
	 */
	function preProcess0($elem, xpath) {
		$elem.find(xpath).each(function(){
			if (this.jqmdp_body == null) {
				var $body = $(this).clone();
				this.jqmdp_body = $body;
			}
		})
		$elem.find(xpath).html("");
	}
	
	/**
	 * Ancestors element having the nearest scope is returned.
	 * @param elem   Any element or jQuery object.
	 * @return scope element.
	 */
	function getScopeNode(elem) {
		var $this = (elem instanceof jQuery) ? elem : $(elem);
		while ($this != null && $this.length != 0 && $this[0] != window) {
			if ($this.attr(SCOPE)) return $this;
			$this = $this.parent();
		}
		return null;
	}

	/**
	 * An element having data-dp-id in the scope returns.
	 * The parent scope is not targeted for a search.
	 * 
	 * @param $this   Any element or jQuery object.
	 * @param name    data-dp-id value.
	 * @return scope  jQuery object or null.
	 */
	function byId($this, name) {
		var $scope = getScopeNode($this);
		if ($scope == null) return null;
		
		var $elems = $scope.find("*["+DP_ID+"='"+name+"']");
		var result = null;
		$elems.each(function(){
			var $e = $(this);
			if ($scope[0] == getScopeNode($e)[0]) {
				if (result) throw new Error("Duplecate "+DP_ID+"="+name);
				result = this;
			}
		});
		if (result) return $(result);
		return byId($scope.parent(), name);
	}

	//----------------------------------------------------------------------
	// Public functions.
	function Jqmdp(){};
	$.extend({jqmdp: Jqmdp});
	$.jqmdp.getScopeNode = getScopeNode;
	$.jqmdp.byId = byId;

	/**
	 * The scope instance to belong to of the element is returned.
	 * If a value is appointed, I replace scope instance.
	 * @param $this   Any element or jQuery object.
	 * @param val    scope instance.
	 * @return scope instance or $this.
	 */
	$.jqmdp.scope = function($this, val) {
		var $scopeNode = getScopeNode($this);
		if ($scopeNode == null) return null;
		if (val) {
			$scopeNode[0].jqmdp_scope = val;
			return $this;
		} else {
			if (undefined === $scopeNode[0].jqmdp_scope) {
				doScopes(null, $this, onPageInit);
			}
			return $scopeNode[0].jqmdp_scope;
		}
	}

	/**
	 * A supporting function to make a part.
	 * The reproduction which applied conversion handling of JQM is added.
	 * @param $this  template target jQuery object.
	 * @param src    Template jQuery object or url string.
	 */
	$.jqmdp.template = function($this, src) {
		if ( typeof src === "string") {
			if (src.indexOf("#") == 0) {
				template($this, $(src));
			} else {
				$.jqmdp.exTemplate($this, src);
			}
		} else {
			template($this, src);
		}
		return $this;
	}
	function template($this, $src) {
		$src.page();
		$this.html("");
		$this.append($src.clone().contents());
	}

	/**
	 * An outside template is applied.
	 * Because it is load by async, the outside template may be behind with the real application.
	 * If it has been already loaded, it is applied immediately.
	 * @param $this  template target jQuery object.
	 * @param url    outside template url.
	 */
	$.jqmdp.exTemplate = function($this, url) {
		if (exTemplates[url] === undefined) {
			exTemplates[url] = {q:[$this]};
			$.get(url, null, function(data){onLoadTempl(data,url);});
		} else if (exTemplates[url].node === undefined) {
			exTemplates[url].q.push($this);
		} else {
			$.jqmdp.template($this, exTemplates[url].node);
		}
		return $this;
	}
	function onLoadTempl(data, url) {
		var $t = $(data);
		$(document.body).append($t); // JQM requires it.
		exTemplates[url].node = $t;
		var q = exTemplates[url].q;
		for (var i=0; i<q.length; i++) {
			$.jqmdp.template(q[i], $t);
			$.jqmdp.refresh(q[i]);
		};
	}

	
	/**
	 * Handling JQM attribute.
	 * Note: use the unofficial JQM function.
	 * @param $this  target jQuery object.
	 */
	$.jqmdp.markup = function($this) {
		var $backup = $("<div></div>");
		$this.replaceWith($backup);
		var $fragment = $("<div></div>").append($this);
		$fragment.page();
		$backup.replaceWith($this);
		$this.show();
		return $this;
	}
	
	/**
	 * The inside of the scope is drawn again.
	 * @param $this  Any jQuery object.
	 */
	$.jqmdp.refresh = function($this, delay) {
		if (delay == null) {
			processPage(getScopeNode($this));
			return;
		}

		var $elem = getScopeNode($this);
		var elem = $elem[0];
		elem.jqmdp_refresh = (elem.jqmdp_refresh==null) ? 1 : elem.jqmdp_refresh++;

		setTimeout(function(){
			if (--(elem.jqmdp_refresh) > 0) return;
			processPage($elem);
		}, delay);

		return $this;
	}

	/**
	 * Scope instance can call this function before 'pageinit' event, if necessary.
	 * @param $this  Any jQuery object.
	 */
	$.jqmdp.init = function($this) {
		doScopes(null, $this, onPageInit);
		return $this;
	}
	/**
	 * debug mode on/off;
	 */
	$.jqmdp.debug = function(b) {
		isDebug = b;
	}
	
	/**
	 * The relative path from a JavaScript source file is converted into an absolute path.
	 * @param path relative path
	 */
	$.jqmdp.absPath = function(path) {
		if (!(path.match(/^\//) || path.match(/^https?:/i))) {
			var scripts = document.getElementsByTagName("script");
			path = (scripts[scripts.length-1].src).replace(/[^\/]*$/,path);
		}
		return path;
	}
	

	/**
	 * A bridge function.
	 * @param method  $.jqmdp.* function name string.
	 * @param a?      Any arguments.
	 */
	function jqmdp(method,a1,a2,a3,a4,a5,a6){
		var $this = this;
		if (method === undefined) return new Handle($this);
		if ($this[0] === window) {
			alert("JQMDP alert!\nThis is window. \nhref='javascript:$(this)' is not usable.\nPlease use onclick.");
			return;
		}
		if ($.jqmdp[method]) {
			return $.jqmdp[method]($this,a1,a2,a3,a4,a5,a6);
		}
		
		return new Handle($.jqmdp.byId($this,method));
	}

	$.fn.extend({jqmdp: jqmdp});

	/**
	 * Handle class for convenience.
	 * @param $this  Target jQuery object.
	 */
	function Handle($this) {
		this.$this = $this;
	}
	function initHandle() {
		var pt = Handle.prototype;
		for (k in $.fn) {
			pt[k] = eval(
				"(function(){return $.fn."+k+".call(this.$this, arguments);})"
			);
		}
		pt.origin=    function(){return this.$this;};
		pt.scope=     function(val){return $.jqmdp.scope(this.$this,val);};
		pt.refresh=   function(delay){$.jqmdp.refresh(this.$this,delay);return this;};
		pt.byId=      function(id){return new Handle(byId(this.$this,id));};
		pt.scopeById= function(id,val){return this.byId(id).scope(val);};
		pt.template=  function($src){$.jqmdp.template(this.$this,$src);return this;};
		pt.exTemplate=function(url){$.jqmdp.exTemplate(this.$this,url);return this;};
		pt.markup=    function(){$.jqmdp.markup(this.$this);return this;};
	}

	//------------------------------------------------------------------------
	// bootup.
	// TODO: $(document).bind("mobileinit", function(){init(document.body);});
	if ($.mobile != null) alert("You must load 'jqmdp' before than 'jQuery mobile'.");
	$(function(){initHandle();init(document.body);});

})(jQuery);
//EOF.