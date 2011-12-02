/**
 * Google Map basic style.
 */
(function(){
	var Package = window;
	var Class = function Map(){this.initialize.apply(this, arguments)};
	var This = Class.prototype;
	Package[Class.name] = Class;

	var LatLng = google.maps.LatLng;

	// Default Map options.
	var DEFAULT_CENTER = new google.maps.LatLng(35.684699,139.753897);
	var OPTIONS = {
		zoom: 14,
		center: DEFAULT_CENTER ,
		scaleControl: true,
		mapTypeControl: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	/**
	 * Constructer.
	 * Initialized google map.
	 * @param {jQuery} $page Page of map.
	 * @param {Object} opts  Google map options.
	 */
	This.initialize = function($page, opts) {
		this.$page = $page;
		this.$canvas = $page.find("div[data-role='content']");
		this.$canvas.css("padding","0");
		var _opts = $.extend({},OPTIONS,opts);
	
		this.map = new google.maps.Map(this.$canvas[0], _opts);
		this.marker = new google.maps.Marker({position:DEFAULT_CENTER, map:this.map});
		this.address = "";
		this.changeAddr(DEFAULT_CENTER);

		// set event listener.
		var _this = this;
		google.maps.event.addListener(this.map, 'click', function(ev){
			_this.marker.setPosition(ev.latLng);
			_this.changeAddr(ev.latLng);
		});
		$(window).bind('resize',function(ev){
			_this.updateSize();
		})
	}

	/**
	 * Because height of header is not fixed until this timing,
	 * screen size is set here.
	 * @param {Event} ev event.
	 */
	This.onShow = function (ev, $this) {
		this.updateSize();
	}

	/**
	 * The screen size of the map is set.
	 * It is size that deducted a header from size of windiw.
	 */
	This.updateSize = function() {
		var h = window.innerHeight;
		var h1 = this.$page.find("div[data-role='header']").height();
		this.$canvas.height(h - h1);
	}
	
	/**
	 * The central location of map is set at position obtained from GPS.
	 */
	This.setCenterFromGPS = function() {
		var _this = this;
		navigator.geolocation.getCurrentPosition(function(position){
			var lat = position.coords.latitude;
			var lng = position.coords.longitude;
			var center = new LatLng(lat, lng);
			_this.map.setCenter(center);
			_this.marker.setPosition(center);
			_this.changeAddr(center);
		}, function(e){
			alert(e.message);
		});
	}
	
	/**
	 * Location to address convertion.
	 * @param {LatLng} pos New location.
	 */
	This.changeAddr = function(pos){
		var _this = this;
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode({
			latLng: pos
		}, function(results, status){
			if (status == google.maps.GeocoderStatus.OK) {
				var addr = results[0].formatted_address;
				_this.address = addr.replace(/^[^,]*[,][ ]/, "");
				_this.$page.jqmdp().refresh();
			}
		});
	}
	
	
})();