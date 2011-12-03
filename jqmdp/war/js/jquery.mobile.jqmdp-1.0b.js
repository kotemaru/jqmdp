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

// TODO:li bug.

(function($) {
	var isDebug = false;

	var PRE = "data-dp-";
	
	var SCOPE = PRE+"scope";
	var DP_ID = PRE+"id";
	var SHOW  = PRE+"show";
	var SRC   = PRE+"src";
	var HREF  = PRE+"href";
	var HTML  = PRE+"html";
	var TEXT  = PRE+"text";
	var VALUE = PRE+"value";
	var CHECKED = PRE+"checked";
	var TEMPLATE = PRE+"template";
	var CLASS = PRE+"class";
	var ARGS = PRE+"args";
	var VALS = PRE+"vals";

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
	var XP_CHECKED = "*["+CHECKED+"]";
	var XP_TEMPLATE = "*["+TEMPLATE+"]";
	var XP_CLASS = "*["+CLASS+"]";
	var XP_ARGS   = "*["+ARGS+"]";

	var XP_IF    = "*["+IF+"]";
	var XP_IFSELF= "*["+IFSELF+"]";
	var XP_FOR   = "*["+FOR+"]";
	
	/**
	 * The preservation of the outside template.
	 * Key is url, Value is {q:[], node: $(DOM fragment)}.
	 * q is queue of the template application of the load waiting.
	 * @see exTemplate()
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
		}).each(function(){
			var $page = $(this);
			if ($page.attr(SCOPE) == null) {
				$page.attr(SCOPE,"({})"); // Page is scope
			}
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
			alert(e.stack);
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
				alert(e.stack);
			}
		}

	}

	function getAncestor($elem) {
		//return $elem.parents("*[data-dp-scope]");

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
		var attrs = {};
		attrs[SHOW]   =$elem.find(XP_SHOW);
		attrs[SRC]    =$elem.find(XP_SRC);
		attrs[HREF]   =$elem.find(XP_HREF);
		attrs[VALUE]  =$elem.find(XP_VALUE);
		attrs[CHECKED]=$elem.find(XP_CHECKED);
		attrs[TEXT]   =$elem.find(XP_TEXT);
		attrs[HTML]   =$elem.find(XP_HTML);
		attrs[TEMPLATE]=$elem.find(XP_TEMPLATE);
		attrs[CLASS]  =$elem.find(XP_CLASS);
		attrs[ARGS]   =$elem.find(XP_ARGS);
		attrs[IF]     =$elem.find(XP_IF);
		attrs[IFSELF] =$elem.find(XP_IFSELF);
		attrs[FOR]    =$elem.find(XP_FOR);
		return attrs;
	}
	
	var replaceDriver = {}
	replaceDriver[SHOW] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		var bool = localEval($e.attr(SHOW), scopes, localScope);
		bool ? $e.show() : $e.hide();
	};
	replaceDriver[SRC] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.attr("src",localEval($e.attr(SRC), scopes, localScope));
	};
	replaceDriver[HREF] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.attr("href",localEval($e.attr(HREF), scopes, localScope));
	};
	replaceDriver[VALUE] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.val(localEval($e.attr(VALUE), scopes, localScope));
	};
	replaceDriver[CHECKED] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		var bool = localEval($e.attr(CHECKED), scopes, localScope);
		$e.attr('checked', bool);
		if ($e.data("checkboxradio")) $e.checkboxradio('refresh');
	};
	replaceDriver[TEXT] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.text(""+localEval($e.attr(TEXT), scopes, localScope));
	};
	replaceDriver[HTML] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.html(localEval($e.attr(HTML), scopes, localScope));
	};
	replaceDriver[TEMPLATE] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		template($e, $e.attr(TEMPLATE));
	};
	replaceDriver[CLASS] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		var classes = localEval($e.attr(CLASS), scopes, localScope);
		if (classes == null || !(classes.length)) {
			throw new Error(CLASS + "is not array.");
		}
		var bool = classes[0];
		for (var i=1; i<classes.length; i++) {
			$e.toggleClass(classes[i], bool);
		}
	};
	replaceDriver[ARGS] = function (scopes, localScope){
		var $e = localScope.$this = $(this);
		$e.attr(VALS, localEval($e.attr(ARGS), scopes, localScope));
	};


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
		processCond($elem, attrs[IF], "if", IF, scopes, localScope);
		processCond($elem, attrs[IFSELF], "if", IFSELF, scopes, localScope);
		processCond($elem, attrs[FOR], "for", FOR, scopes, localScope);

		// Various substituted processing.
		for (var key in replaceDriver) {
			attrs[key].each(function(){
				replaceDriver[key].call(this, scopes, localScope);
			});
			if ($elem.attr(key)) {
				replaceDriver[key].call($elem[0], scopes, localScope);
			}
		}
		
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
		function _driver(){
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
			try {
				eval(wrapScopes(_script, _scopes, _localScope));
			} catch (e) {
				e.message = "eval: "+_script+"\n\n"+e.message;
				throw e;
			}
		}
		
		_attrs.each(_driver);
		if (_$parent.attr(_attr)) {
			_driver.call(_$parent[0]);
		}
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

		try {
			var _res;
			//var _this = _localScope.$this ? _localScope.$this[0] : window;
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

		} catch (e) {
			e.message = "eval: "+_script+"\n\n"+e.message;
			throw e;
		}
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
		preProcess0($elem, XP_FOR, FOR);
		preProcess0($elem, XP_IF, IF);
		preProcess0($elem, XP_IFSELF, IFSELF);
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
	function preProcess0($elem, xpath, attr) {
		function setBody() {
			if (this.jqmdp_body == null) {
				this.jqmdp_body = $("<div></div>");
				this.jqmdp_body.append($(this).contents().clone());
				if (isDebug) console.log("save body="+this.jqmdp_body.html());
			}
		}
		
		if ($elem.attr(attr)) {
			setBody.call($elem[0]);
		}
		$elem.find(xpath).each(setBody);
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
		var $thisScope = getScopeNode($this);
		if ($thisScope == null) return null;

		if ($thisScope.attr(DP_ID) == name) return $thisScope;

		var $elems = $thisScope.find("*["+DP_ID+"='"+name+"']");
		var result = null;
		$elems.each(function(){
			var $e = $(this);
			var $tgtScope = $e.attr(SCOPE) 
					? getScopeNode($e.parent()) : getScopeNode($e);
			if ($thisScope[0] == $tgtScope[0]) {
				if (result) throw new Error("Duplecate "+DP_ID+"="+name);
				result = this;
			}
		});
		if (result) return $(result);
		return byId($thisScope.parent(), name);
	}
	
	/**
	 * The scope instance to belong to of the element is returned.
	 * If a value is appointed, I replace scope instance.
	 * @param $this   Any element or jQuery object.
	 * @param val    scope instance.
	 * @return scope instance or $this.
	 */
	function scope($this, val) {
		var $scopeNode = getScopeNode($this);
		if ($scopeNode == null) return null;
		if (val) {
			$scopeNode[0].jqmdp_scope = val;
			return $this;
		} else {
			if (undefined === $scopeNode[0].jqmdp_scope) {
				doScopes(null, $this, initScope);
			}
			return $scopeNode[0].jqmdp_scope;
		}
	}

	/**
	 * data-dp-vals attribute value is returned.
	 * @param $this   jQuery object.
	 */
	function args($this) {
		return $this.attr(VALS);
	}

	/**
	 * A supporting function to make a part.
	 * The reproduction which applied conversion handling of JQM is added.
	 * @param $this  template target jQuery object.
	 * @param src    Template jQuery object or url string.
	 */
	function template($this, src, callback) {
		if ( typeof src === "string") {
			if (src.indexOf("#") == 0) {
				_template($this, $(src), callback);
			} else {
				exTemplate($this, src, callback);
			}
		} else {
			_template($this, src, callback);
		}
		return $this;
	}
	function _template($this, $src, callback) {
		$src.page();
		$this.html("");
		$this.append($src.clone().contents());
		if (callback) callback($this, $src);
	}

	/**
	 * An outside template is applied.
	 * Because it is load by async, the outside template may be behind with the real application.
	 * If it has been already loaded, it is applied immediately.
	 * @param $this  template target jQuery object.
	 * @param url    outside template url.
	 */
	function exTemplate($this, url, callback) {
		if (exTemplates[url] === undefined) {
			exTemplates[url] = {q:[{$this:$this, callback:callback}]};
			$.get(url, null, function(data){_onLoadTempl(data,url);});
		} else if (exTemplates[url].node === undefined) {
			exTemplates[url].q.push({$this:$this, callback:callback});
		} else {
			_template($this, exTemplates[url].node, callback);
		}
		return $this;
	}
	function _onLoadTempl(data, url, callback) {
		var $t = _replaceAbsPath($(data), url);
		$(document.body).append($t); // JQM requires it.
		exTemplates[url].node = $t;
		var q = exTemplates[url].q;
		for (var i=0; i<q.length; i++) {
			_template(q[i].$this, $t, q[i].callback);
		};
	}
	function _replaceAbsPath($elem, url){
		var base = $.mobile.path.makePathAbsolute(url, location.pathname);
		$elem.find("*[href]").each(function(){
			var $e = $(this);
			$e.attr('href',$.mobile.path.makePathAbsolute($e.attr('href'),base));
		});
		$elem.find("*[src]").each(function(){
			var $e = $(this);
			$e.attr('src',$.mobile.path.makePathAbsolute($e.attr('src'),base));
		});
		return $elem;
	}
	
	/**
	 * Handling JQM attribute.
	 * Note: use the unofficial JQM function.
	 * @param $this  target jQuery object.
	 */
	function markup($this) {
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
	function refresh($this, delay) {
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
	 * debug mode on/off;
	 */
	function debug(b) {
		isDebug = b;
	}
	
	/**
	 * The relative path from a JavaScript source file is converted into an absolute path.
	 * @param path relative path
	 */
	function absPath(path) {
		if (!(path.match(/^\//) || path.match(/^https?:/i))) {
			var scripts = document.getElementsByTagName("script");
			path = (scripts[scripts.length-1].src).replace(/[^\/]*$/,path);
		}
		return path;
	}
	
	//-------------------------------------------------------------------------
	// Exports functions.
	/**
	 * A bridge function.
	 * Extends JQMDP functions for $this.
	 * 
	 * @param $this   jQuery object or HTMLElement.
	 * @param dpId    find data-dp-id attribute value. null is current.
	 * @return Extends jQuery object.
	 */
	function export_jqmdp($this, dpId){
		if ($this === undefined)  throw new Error(NULL_OBJ_ERROR);
		if (!($this instanceof jQuery)) $this = $($this);
		if ($this[0] === window) throw new Error(WINDOW_OBJ_ERROR);
		var $e = (dpId == null) ? $this : byId($this, dpId);
		if ($e == null) return null;
		return $.extend($e, jqmdp_fn);
	}
	export_jqmdp.refresh=   refresh;
	export_jqmdp.args=      args;
	export_jqmdp.template=  template;
	export_jqmdp.markup=    markup;
	export_jqmdp.absPath=   absPath;
	export_jqmdp.debug=     debug;
	export_jqmdp.getScopeNode = getScopeNode;

	var jqmdp_fn = {};
	jqmdp_fn.refresh=   function(delay){return refresh(this,delay);};
	jqmdp_fn.args=      function(){return args(this);};

	/**
	 * Set or get scope instance.
	 * If val is not undefined, set scope instance.
	 * 
	 * @param $this   jQuery object or HTMLElement.
	 * @param dpId    find data-dp-id attribute value. null is current.
	 * @param val     new scope instance.
	 * @return scope instance. 
	 */
	function export_scope($this, dpId, val) {
		if ($this === undefined)  throw new Error(NULL_OBJ_ERROR);
		if (!($this instanceof jQuery)) $this = $($this);
		if ($this[0] === window) throw new Error(WINDOW_OBJ_ERROR);
		var $e = (dpId == null) ? $this : byId($this, dpId);
		return scope($e, val);
	}
	var WINDOW_OBJ_ERROR = "JQMDP alert!\nThis is window. \n"
		+"href='javascript:$(this)' is not usable.\nPlease use onclick.";
	var NULL_OBJ_ERROR = "Target element is null.";

	//-------------------------------------------------------------------------
	// jQuery extends.
	$.extend({scope: export_scope, jqmdp: export_jqmdp});
	$.fn.extend({
		scope: function(a1,a2,a3,a4,a5){return export_scope(this, a1,a2,a3,a4,a5);},
		jqmdp: function(a1,a2,a3,a4,a5){return export_jqmdp(this, a1,a2,a3,a4,a5);}
	});

	//------------------------------------------------------------------------
	// bootup.
	// TODO: $(document).bind("mobileinit", function(){init(document.body);});
	if ($.mobile != null) alert("You must load 'jqmdp' before than 'jQuery mobile'.");
	$(function(){init(document.body);});

})(jQuery);
//EOF.