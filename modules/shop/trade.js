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

		build_trading_box: function(){
			var html = "<div class='trade_middle'>";

			html += "<div class='trade_box_left'>";
			html += "<div class='arrow_left'><img src='" + this.images.arrow_right + "' /></div>";
			html += "<div class='trade_item_box_left' id='trade_left_offer'></div>";
			html += "</div>";

			html += "<div class='trade_box_right'>";
			html += "<div class='trade_item_box_right' id='trade_right_offer'></div>";
			html += "<div class='arrow_right'><img src='" + this.images.arrow_left + "' /></div>";
			html += "</div>";

			html += "</div>";

			return html;
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
			var html = "<div class='trade_wrapper'>";

			var owner_html = "<div class='trade_owner trade_profile'>";

			owner_html += "<div class='trader_name'>You</div><br /><div id='trade_owner_items'>";

			for(var key in own_items){
				var item = this.shop.lookup[key];

				if(item){
					owner_html += '<span class="pd_shop_mini_item" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '" /></span>';
				}
			}

			owner_html += "</div></div>";

			var with_html = "<div class='trade_with trade_profile'>";

			with_html += "<div class='trader_name'>" + yootil.html_encode(yootil.page.member.name()) + "</div><br /><div id='trade_with_items'>";

			for(var key in with_items){
				var item = this.shop.lookup[key];

				if(item){
					with_html += '<span class="pd_shop_mini_item" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '" /></span>';
				}
			}

			with_html += "</div></div>";

			html += owner_html + with_html + this.build_trading_box() + "</div>";

			proboards.dialog("monetaryshop-trade-dialog", {
				modal: true,
				height: 400,
				width: 700,
				title: title,
				html: html,
				resizable: false,
				draggable: false,
				buttons: [

					{

						text: "Cancel " + this.settings.text.trade,
						click: function(){
							$(this).dialog("close");
						}

					},

					{

						text: "Send " + this.settings.text.trade,
						click: function(){
							console.log("go go go");
						},
						id: "trade_accept_btn",
						style: "opacity: 0.5;"

					}

				]

			});

			$("#monetaryshop-trade-dialog span.pd_shop_mini_item").click(function(){
				var who = $(this).parent().attr("id");
				var where_to = (who == "trade_owner_items")? $("#trade_left_offer") : $("#trade_right_offer");

				where_to.css("background-image", "url(" + $(this).find("img").attr("src") + ")");

				$(this).parent().find("span").css("opacity", 1);
				$(this).css("opacity", 0.4);
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