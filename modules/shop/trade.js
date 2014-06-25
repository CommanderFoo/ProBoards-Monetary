pixeldepth.monetary.shop.trade = (function(){

	return {

		settings: {

			enabled: true,

			text: {

				trade: "Trade"

			}

		},

		images: {},

		init: function(){
			this.setup();
		},

		register: function(){
			pixeldepth.monetary.shop.modules.push(this);
			return this;
		},

		setup: function(){
			this.shop = pixeldepth.monetary.shop;

			var plugin = this.shop.plugin;
			var settings = plugin.settings;

			this.images = plugin.images;
		},

		request: function(item){
			var title = this.settings.text.trade + " Request";
			var viewing_id = yootil.page.member.id() || null;

			if(!viewing_id){

				// Display error here?

				return false;
			}

			var own_items = pixeldepth.monetary.shop.data(yootil.user.id()).get.items();
			var with_items = pixeldepth.monetary.shop.data(viewing_id).get.items();
			var html = "<div>";

			var owner_html = "<div style='display: none; float: right;' class='mini-profile trade_profile'>";

			owner_html += "<div style='text-align: center; font-weight: bold;'>You</div><br /><div>";

			for(var key in own_items){
				var item = this.shop.lookup[key];

				if(item){
					owner_html += '<span class="pd_shop_mini_item" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '" /></span>';
				}
			}

			owner_html += "</div></div>";

			var with_html = "<div style='display: none; float: left' class='mini-profile trade_profile'>";

			with_html += "<div style='text-align: center; font-weight: bold;'>" + yootil.html_encode(yootil.page.member.name()) + "</div><br /><div>";

			for(var key in with_items){
				var item = this.shop.lookup[key];

				if(item){
					with_html += '<span class="pd_shop_mini_item" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '" /></span>';
				}
			}

			with_html += "</div></div>";

			html += owner_html + with_html + "</div>";

			var buttons = {};

			buttons["Cancel " + this.settings.text.trade] = function(){
				$(this).dialog("close");
			};

			buttons["Send " + this.settings.text.trade] = function(){
				console.log("go go go");
			};

			proboards.dialog("monetaryshop-trade-dialog", {
				modal: true,
				height: 400,
				width: 700,
				title: title,
				html: html,
				resizable: false,
				draggable: false,
				buttons: buttons

			});

			$("#monetaryshop-trade-dialog span[data-shop-item-id] img").bind("load", function(){
				var width = this.width;
				var height = this.height;

				this.width = width * .6;
				this.height = height * .6;
			});

			$("#monetaryshop-trade-dialog .trade_profile").fadeIn("slow");
		}

	};

})().register();