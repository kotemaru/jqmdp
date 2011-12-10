function ImageManager(){this.initialize.apply(this, arguments)};
(function(Class){
	var This = Class.prototype;

	This.initialize = function($elem, dialog){
		this.$elem = $elem;
		this.dialog = dialog;
		this.src = "../../images/noimage.gif";
	}

	This.openDialog = function() {
		var self = this;
		var picasa = $(this.dialog).scope();
		picasa.setCallback(function(photo){
			self.src = photo.src;
			self.$elem.jqmdp().refresh();
		});
		$.mobile.changePage(this.dialog,'pop');
	}
})(ImageManager);


//------------------------------------------------------
function Picasa(){this.initialize.apply(this, arguments)};
(function(Class){
	var This = Class.prototype;
	

	var URL_ALBUM = 
		"http://picasaweb.google.com/data/feed/api/user/${user}"
		+"?kind=album&alt=json";
	var URL_PHOTO = 
		"http://picasaweb.google.com/data/feed/api/user/${user}"
		+"/albumid/${albumid}?alt=json";
		
	This.initialize = function($elem, user){
		this.$elem = $elem;
		this.albumid = null;
		this.albums = [];
		this.photos = [];
		this.setUser(user);
	}
	
	This.album = function($img) {
		var idx = $img.jqmdp().args();
		return this.albums[idx];
	} 
	This.photo = function($img) {
		var idx = $img.jqmdp().args();
		return this.photos[idx];
	} 
	This.setUser = function(user) {
		this.user = user;
		this.listAlbum();
	}
	This.setCallback = function(callback) {
		this.callback = callback;
	} 
	This.clickPhoto = function(img) {
		if (this.callback) {
			this.callback(this.photo($(img)));
		}
		this.$elem.dialog('close');
	} 

	This.listAlbum = function() {
		var self = this;
		var url = URL_ALBUM.replace(/[$][{]user[}]/,self.user);
		var type = $.browser.msie ? "jsonp" : "json";
		
		$.ajax({
			url:url, cache:true, dataType: type,
			error: function(xreq,stat,err) {
				alert("load error:"+err+" "+url);
			},
			success: function(json, type) {
				var list = [];
				for (var i=0; i<json.feed.entry.length; i++) {
					var e = json.feed.entry[i];
					if (e.gphoto$access.$t == "public") {
						list.push({
							thumbnail: e.media$group.media$thumbnail[0].url,
							albumid: e.gphoto$id.$t
						});
					}
				}
				self.albums = list;
				self.$elem.jqmdp("albums").show().refresh();
				self.$elem.jqmdp("photos").hide();
			}
		});
	}
	
	This.listPhoto = function(albumElem) {
		var self = this;
		var idx = $(albumElem).jqmdp().args();
		this.albumid = this.albums[idx].albumid;
		
		var url = URL_PHOTO.replace(/[$][{]user[}]/,self.user)
					.replace(/[$][{]albumid[}]/,self.albumid);
	
		var type = $.browser.msie ? "jsonp" : "json";
		$.ajax({
			url:url, cache:true, dataType: type,
			error: function(xreq,stat,err) {
				alert("load error:"+err+" "+url);
			},
			success: function(json, type){
				var list = [];
				if (json.feed.entry == null) {
					self.photos = list;
					self.$elem.jqmdp("photos").refresh();
					return;
				}
				for (var i = 0; i < json.feed.entry.length; i++) {
					var e = json.feed.entry[i];
					if (e.gphoto$access.$t == "public") {
						list.push({
							thumbnail: e.media$group.media$thumbnail[0].url,
							w: e.media$group.media$thumbnail[0].width,
							h: e.media$group.media$thumbnail[0].height,
							src: e.content.src,
						});
					}
				}
				
				self.photos = list;
				self.$elem.jqmdp("albums").hide();
				self.$elem.jqmdp("photos").show().refresh();
			}
		});
	}

})(Picasa);
