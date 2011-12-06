/*
* jQuery Mobile Dynamic Page plugin v1.0b2
*
* Copyright 2011 (c) kotemaru@kotemaru.org
* Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
*/
/*
 * Warn: My English is very doubtful.
 * Note: JQM and $.data() problem. Data are cleared.
 *       I pollute jqmdp_scope and jqmdp_body of HTMLElement.
 */

(function($) {
	//-------------------------------------------------------------------------
	// Degbus.
	//-------------------------------------------------------------------------
	var isDebug = false;
	if (undefined === window.console) {
		window.console = {log:function(){}, error:function(){}}; 
	}
	/**
	 * For a bug of IE.
	 * $(e).attr(key,val)   -> IE is error.
	 * $(e).attr({key:val}) -> IE is success.
	 * IE death.
	 */
	function keyval(key, val) {
		var obj = {};
		obj[key] = val;
		return obj;
	}
	if(! Array.indexOf) {
		Array.prototype.indexOf = function(o) {
			for(var i=0; i<this.length; i++) {
				if(this[i] == o) return i;
			}
			return -1;
		}
  	}


	//-------------------------------------------------------------------------
	// Static variables.
	//-------------------------------------------------------------------------
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

	/** data-dp-* attributes listing. */
	var DP_ATTRS = {};
	DP_ATTRS[SCOPE   ] = {xpath:"*["+SCOPE   +"]"};
	DP_ATTRS[DP_ID   ] = {xpath:"*["+DP_ID   +"]"};
	DP_ATTRS[SHOW    ] = {xpath:"*["+SHOW    +"]"};
	DP_ATTRS[SRC     ] = {xpath:"*["+SRC     +"]"};
	DP_ATTRS[HREF    ] = {xpath:"*["+HREF    +"]"};
	DP_ATTRS[HTML    ] = {xpath:"*["+HTML    +"]"};
	DP_ATTRS[TEXT    ] = {xpath:"*["+TEXT    +"]"};
	DP_ATTRS[VALUE   ] = {xpath:"*["+VALUE   +"]"};
	DP_ATTRS[CHECKED ] = {xpath:"*["+CHECKED +"]"};
	DP_ATTRS[TEMPLATE] = {xpath:"*["+TEMPLATE+"]"};
	DP_ATTRS[CLASS   ] = {xpath:"*["+CLASS   +"]"};
	DP_ATTRS[ARGS    ] = {xpath:"*["+ARGS    +"]"};
	//DP_ATTRS[VALS    ] = {xpath:"*["+VALS    +"]"};
	
	DP_ATTRS[IF      ] = {xpath:"*["+IF      +"]"};
	DP_ATTRS[IFSELF  ] = {xpath:"*["+IFSELF  +"]"};
	DP_ATTRS[FOR     ] = {xpath:"*["+FOR     +"]"};


	/**
	 * Replace attribute processors.
	 */
	var REPLACE_DRIVER = {}
	REPLACE_DRIVER[SHOW] = function ($e, scopes, localScope){
		var bool = localEval($e.attr(SHOW), scopes, localScope);
		bool ? $e.show() : $e.hide();
	};
	REPLACE_DRIVER[SRC] = function ($e, scopes, localScope){
		$e.attr({src: localEval($e.attr(SRC), scopes, localScope)});
	};
	REPLACE_DRIVER[HREF] = function ($e, scopes, localScope){
		$e.attr({href: localEval($e.attr(HREF), scopes, localScope)});
	};
	REPLACE_DRIVER[VALUE] = function ($e, scopes, localScope){
		$e.val(localEval($e.attr(VALUE), scopes, localScope));
	};
	REPLACE_DRIVER[CHECKED] = function ($e, scopes, localScope){
		var bool = localEval($e.attr(CHECKED), scopes, localScope);
		$e.attr({'checked': bool});
		if ($e.jqmData("checkboxradio")) $e.checkboxradio('refresh');
	};
	REPLACE_DRIVER[TEXT] = function ($e, scopes, localScope){
		$e.text(""+localEval($e.attr(TEXT), scopes, localScope));
	};
	REPLACE_DRIVER[HTML] = function ($e, scopes, localScope){
		$e.html(localEval($e.attr(HTML), scopes, localScope));
	};
	REPLACE_DRIVER[TEMPLATE] = function ($e, scopes, localScope){
		template($e, $e.attr(TEMPLATE));
	};
	REPLACE_DRIVER[CLASS] = function ($e, scopes, localScope){
		var classes = localEval($e.attr(CLASS), scopes, localScope);
		if (classes == null || !(classes.length)) {
			throw new Error(CLASS + "is not array.");
		}
		var bool = classes[0];
		for (var i=1; i<classes.length; i++) {
			$e.toggleClass(classes[i], bool);
		}
	};
	REPLACE_DRIVER[ARGS] = function ($e, scopes, localScope){
		var val = localEval($e.attr(ARGS), scopes, localScope);
		$e.attr(keyval(VALS, val));
	};


	/**
	 * The preservation of the outside template.
	 * Key is url, Value is {q:[], node: $(DOM fragment)}.
	 * q is queue of the template application of the load waiting.
	 * @see exTemplate()
	 */
	var exTemplates = {};
	
	
	//-------------------------------------------------------------------------
	// Initialize.
	//-------------------------------------------------------------------------

	/**
	 * 'mobileinit' event action.
	 */
	function mobileinit(){
		// nop.
		//init(document.body);
	}
	
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
			doScopes(ev, $(ev.target), onBeforeHide);
		}).live('pagehide', function(ev) {
			doScopes(ev, $(ev.target), onHide);
		}).live('pagebeforecreate', function(ev) {
			preProcess($(ev.target))
		}).each(function(){
			var $page = $(this);
			if ($page.attr(SCOPE) == null) {
				$page.attr(keyval(SCOPE,"({})")); // Page is default scope.
			}
		})
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
			if (afterHander) afterHander($elem);
		} catch(e) {
			// Because JQM stops when I throw an exception.
			console.error(e.stack);
			alert(e.message+"\n"+e.stack);
			throw e;
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
		if (scope != null) return;
		
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

	//-------------------------------------------------------------------------
	// Processing data-dp-* attributes.
	//-------------------------------------------------------------------------

	/**
	 * Dynamic page attributes processes all scopes of the descendant of the page.
	 * @param $page Page jQuery object.
	 */
	function processPage($page) {
		if ($page == null) {
			console.error("JQMDP processing Page is null? ignore.");
			return;
		}

		// --- inner functions. ---
		function _makeStack($e) {
			var node = $e[0];
			var stack = [];
			while (node != null && node != document && node != window) {
				if (node.jqmdp_scope != null) {
					stack.push(node.jqmdp_scope);
				}
				node = node.parentNode;
			}
			return stack;
		};
		function _initScope($e) {
			var attrs = {};
			for (var key in DP_ATTRS) attrs[key] = [];
			return {elem:$e[0], $elem:$e, stack:_makeStack($e), attrs:attrs};
		};
		function _findScope(scopes, node) {
			for (var i=0; i<scopes.length; i++) {
				if (scopes[i].elem == node) return scopes[i];
			}
			return scopes[0];
		};
		//--- ---


		preProcess($page);

		// init subscopes in page.
		var scopes = [];
		scopes.push(_initScope($page));
		$page.find(XP_SCOPE).each(function(){
			scopes.push(_initScope($(this)));
		});

		// data-dp-* attribute is allotted to a subscope.
		for (var key in DP_ATTRS) {
			$page.find(DP_ATTRS[key].xpath).each(function(){
				var $e = $(this);
				var scope = _findScope(scopes, getScopeNode($e)[0]);
				scope.attrs[key].push($e);
			});
		}

		// Processing attributes every subscope.
		for (var i=0; i<scopes.length; i++) {
			process(scopes[i].$elem, scopes[i].attrs, scopes[i].stack);
		}
	}

	/**
	 * DynamicPage attributes processing in one scope.
	 * @param $elem Page or scope element jQuery object.
	 * @param attrs Array of element with data-dp-* attribute.
	 * @param scopes scope instance array.
	 */
	function process($elem, attrs, scopes) {
		var localScope = {};
		// Control sentence structure processing.
		processCond($elem, attrs[IF],     "if",  IF,     scopes, localScope);
		processCond($elem, attrs[IFSELF], "if",  IFSELF, scopes, localScope);
		processCond($elem, attrs[FOR],    "for", FOR,    scopes, localScope);

		function _drive(key) {
			for (var i=0; i<attrs[key].length; i++) {
				localScope.$this = attrs[key][i];
				REPLACE_DRIVER[key](localScope.$this, scopes, localScope);
			};
			if ($elem.attr(key)) {
				localScope.$this = $elem;
				REPLACE_DRIVER[key]($elem, scopes, localScope);
			}
		}


		// Various substituted processing.
		_drive(ARGS);
		for (var key in REPLACE_DRIVER) _drive(key);
		
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
	 * @param scopes    scopes stack.
	 * @param localScope  The most recent scope.
	 */
	function processCond($parent, attrs, cmd, attr, scopes, localScope) {
		// --- inner functions ---
		function _driver($this){
			var $body = $this[0].jqmdp_body;
			if (isDebug) console.log(cmd+"-body="+($body ? $body.html() : "null"));
			localScope.$this = $this;
			localScope.__$body = $body;
			localScope.__scopes = scopes;

			var script = 
				cmd+$this.attr(attr)+"{_processClone($this, __$body, __scopes);}"
			if (attr == IFSELF) script += "else {$this.remove();}";

			localEval(script, scopes, localScope);
			_markup($this);
		}
		/**
		 * JQM Element refresh.
		 * It is necessary to handle JQM by manual refresh() for a dynamic change.
		 * @param {jQuery} $elem
		 */
		function _markup($elem) {
			// Only document descended.
			// DOM falgment is processing $.mobile.page() in _processClone().
			for (var e=$elem[0]; e != null && e != document; e=e.parentNode);
			if (e == null) return;
	
			// TODO: other no-role of listing widget.
			var role = $elem.jqmData("role");
			var widget = role ? $elem.jqmData(role) : $elem.jqmData("selectmenu");
			if (widget && widget.refresh) widget.refresh(true);
		}
		// --- ---
	
		for (var i = 0; i < attrs.length; i++) {
			_driver(attrs[i]);
		}
		if ($parent.attr(attr)) {
			_driver($parent);
		}
	}

	/**
	 * The body of the control sentence is reproduced and is added to an element.
	 * The original body must not be modified.
	 * 
	 * @param $elem   scope element jQuery object.
	 * @param $body   Stored Control sentence.
	 * @param scopes   scope stack array.
	 */
	function _processClone($elem, $body, scopes) {
		var $clone = $body.clone();
		var attrs = _getAttrs($clone);
		process($clone, attrs, scopes);
		$clone.jqmData("theme", $.mobile.getInheritedTheme($elem, "c"));
		$clone.page();
		$elem.append($clone.contents());
	}
	function _getAttrs($elem) {
		preProcess($elem);
		var attrs = {};
		for (var key in DP_ATTRS) {
			attrs[key] = [];
			$elem.find(DP_ATTRS[key].xpath).each(function(){
				attrs[key].push($(this))
			});
		}
		return attrs;
	}
	/**
	 * The predisposal of the control sentence structure.
	 * if and for suppot.
	 * @param $elem   scope element jQuery object.
	 */
	function preProcess($elem){
		_preProcess0($elem, FOR);
		_preProcess0($elem, IF);
		_preProcess0($elem, IFSELF);
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
	function _preProcess0($elem, attr) {
		function setBody() {
			if (this.jqmdp_body == null) {
				this.jqmdp_body = $("<div></div>");
				this.jqmdp_body.append($(this).contents().clone());
				if (isDebug) console.log("save body="+this.jqmdp_body.html());
			}
		}
		
		if ($elem.attr(attr)) setBody.call($elem[0]);
		$elem.find(DP_ATTRS[attr].xpath).each(setBody).html("");
		if ($elem.attr(attr)) $elem[0].html("");
	}

	/**
	 * JavaScript character string is execute in scope instance.
	 * 
	 * @param _script  javascript code string.
	 * @param _scopes  scope stack array.
	 * @param _localScope  The most recent scope.
	 * @return result value of javascript code.
	 */
	function localEval(_script, _scopes, _localScope){
		if (isDebug) console.log("localEval:"+_script);

		try {
			var _res;
			if (_scopes == null || _scopes.length == 0) {
				with (_localScope) {
					_res = eval(_script);
				}
			} else if (_scopes.length == 1) {
				with (_scopes[0]) {	with (_localScope) {
					_res = eval(_script);
				}}
			} else {
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
	 * Wrapping scope stack javascript code.
	 * @param script  javascript code string.
	 * @param scopes  scope instance array.
	 * @param _localScope  The most recent scope.
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
	
	
	//-------------------------------------------------------------------------
	// API & Util.
	//-------------------------------------------------------------------------

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
		if ($scopeNode == null) {
			throw new Error("Not found scope." + $this);
		}
		if (val) {
			$scopeNode[0].jqmdp_scope = val;
			return $this;
		} else {
			if (null == $scopeNode[0].jqmdp_scope) {
				doScopes(null, $this, initScope);
			}
			if ($scopeNode.length > 0 && $scopeNode[0].jqmdp_scope) {
				return $scopeNode[0].jqmdp_scope
			}
			throw new Error("Not found scope."+$this);
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
		if ( typeof src == "string") {
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
		var $clone = $src.clone();
		$clone.page();
		$this.html("");
		$this.append($clone.contents());
		//var xxx = $this.contents();
		//xxx.each(function(){
		//	console.log(this.parentNode == $this[0]);
		//});
		if (callback) {
			setTimeout(function(){callback($this, $src);}, 5);
		}
	}

	/**
	 * An outside template is applied.
	 * Because it is load by async, the outside template may be behind with the real application.
	 * If it has been already loaded, it is applied immediately.
	 * @param $this  template target jQuery object.
	 * @param url    outside template url.
	 */
	function exTemplate($this, url, callback) {
		if (exTemplates[url] == null) {
			exTemplates[url] = {q:[{$this:$this, callback:callback}]};
			$.ajax({
				url:url, cache:false, dataType:"text",
				success: function(data){_onLoadTempl(data,url);},
				error: function(xreq,stat,err) {
					var msg = (location.protocol == "file:")
						? "\nYour browser does not support LocalFile XHR."
						  +"\n'localfile Access-Control-Allow-Origin' on Google :-P" : "";
					alert("Template load error:"+err+" "+url+msg);
				}
			});
		} else if (exTemplates[url].node == null) {
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
			$e.attr({'href': $.mobile.path.makePathAbsolute($e.attr('href'), base)});
		});
		$elem.find("*[src]").each(function(){
			var $e = $(this);
			$e.attr({'src': $.mobile.path.makePathAbsolute($e.attr('src'), base)});
		});
		return $elem;
	}
	
	/**
	 * Handling JQM attribute.
	 * Note: It causes malfunction of JQM to use the purge of DOM.
	 * @param $this  target jQuery object.
	 */
	function markup($this, purge) {
		if (purge) {
			var $backup = $("<div></div>");
			$this.replaceWith($backup);
			var $fragment = $("<div></div>").append($this);
			$fragment.page();
			$backup.replaceWith($this);
		} else {
			$this.page();
		}
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
	//-------------------------------------------------------------------------
	/**
	 * A bridge function.
	 * Extends JQMDP functions for $this.
	 * 
	 * @param $this   jQuery object or HTMLElement.
	 * @param dpId    find data-dp-id attribute value. null is current.
	 * @return Extends jQuery object.
	 */
	function export_jqmdp($this, dpId){
		if ($this == null)  throw new Error(NULL_OBJ_ERROR);
		if (!($this instanceof jQuery)) $this = $($this);
		if ($this[0] == window) throw new Error(WINDOW_OBJ_ERROR);
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
		if ($this == null)  throw new Error(NULL_OBJ_ERROR);
		if (!($this instanceof jQuery)) $this = $($this);
		if ($this[0] == window) throw new Error(WINDOW_OBJ_ERROR);
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
	// Bootup.
	//------------------------------------------------------------------------
	// TODO: $(document).bind("mobileinit", function(){init(document.body);});
	if ($.mobile != null) alert("You must load 'jqmdp' before than 'jQuery mobile'.");
	$(function(){init(document.body);});
	//$(document).bind('mobileinit', mobileinit);

})(jQuery);
//EOF.