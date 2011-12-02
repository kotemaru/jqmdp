//---------------------------------------------------
// 星評価部品。
//---------------------------------------------------
(function(){
	var Package = window;
	var Class = function Rating(){this.initialize.apply(this, arguments)};
	var This = Class.prototype;
	Package[Class.name] = Class;

	// リソースのURLをこのJSファイルからの相対パスから絶対パスに変換している。
	var TEMPL   = $.jqmdp.absPath("Rating.html");
	var IMG_ON  = $.jqmdp.absPath("star-1.0.png");
	var IMG_HALF= $.jqmdp.absPath("star-0.5.png");
	var IMG_OFF = $.jqmdp.absPath("star-0.0.png");

	// コンストラクタ
	This.initialize = function($this, val) {
		this.$this = $this;
		this.value = val;
		// Rating.html をテンプレート適用している。
		$.jqmdp.template($this, TEMPL, function($this, $src){
			$this.jqmdp().refresh();
		});
	}
	// 値の変更
	This.val = function(v){
		this.value = v;
		// 画面に反映している。
		$.jqmdp.refresh(this.$this);
	}
	// 各値の表示すべき画像を帰す。
	This.star = function(v){
		var sub = this.value+1.0 - v;
		if (sub >= 1.0) return IMG_ON;
		if (sub >= 0.5) return IMG_HALF;
		return IMG_OFF;
	}
})();
