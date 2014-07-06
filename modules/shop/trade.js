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
			var self = this;
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

			var img_size = this.shop.get_size_css(true);
			var disp = (!img_size.length && parseInt(self.shop.settings.mini_image_percent) > 0)? " style='display: none;'" : "";

			for(var key in own_items){
				var item = this.shop.lookup[key];

				if(item){
					var klass = (this.shop.lookup[key].item_tradable == 1)? "" : " trade_item_disabled";
					var title = (klass.length)? " (Not Tradable)" : "";

					owner_html += '<span class="pd_shop_mini_item' + klass + '" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + title + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '"' + img_size + disp + ' /></span>';
				}
			}

			owner_html += "</div></div>";

			var with_html = "<div class='trade_with trade_profile'>";

			with_html += "<div class='trader_name'>" + yootil.html_encode(yootil.page.member.name()) + "</div><br /><div id='trade_with_items'>";

			for(var key in with_items){
				var item = this.shop.lookup[key];

				if(item){
					var klass = (this.shop.lookup[key].item_tradable == 1)? "" : " trade_item_disabled";
					var title = (klass.length)? " (Not Tradable)" : "";

					with_html += '<span class="pd_shop_mini_item' + klass + '" data-shop-item-id="' + this.shop.lookup[key].item_id + '" title="' + yootil.html_encode(this.shop.lookup[key].item_name) + title + '"><img src="' + this.shop.settings.base_image + this.shop.lookup[key].item_image + '"' + img_size + disp + ' /></span>';
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
							if($("#trade_right_offer img").length || $("#trade_left_offer img").length){
								var owner_items = self.validate_trade_items($("#trade_right_offer img"), true);
								var with_items = self.validate_trade_items($("#trade_right_offer img"), false);

							}
						},

						id: "trade_accept_btn",
						style: "opacity: 0.5;"

					}

				]

			});

			$("#monetaryshop-trade-dialog span.pd_shop_mini_item").click(function(){
				var span = $(this);
				var who = span.parent().attr("id");
				var item_id = span.attr("data-shop-item-id");

				if(self.shop.lookup[item_id].item_tradable != 1){
					return;
				}

				var where_to = (who == "trade_owner_items")? $("#trade_left_offer") : $("#trade_right_offer");
				var item_image = span.find("img");
				var img = $("<img />").attr("src", item_image.attr("src"));
				var current_total_offer = where_to.find("img[data-shop-item-id=" + item_id + "]").length;
				var current_quantity = pixeldepth.monetary.shop.data(yootil.user.id()).get.quantity(item_id);

				if(current_total_offer < current_quantity){
					img.attr("data-shop-item-id", item_id);

					img.click(function(){
						$(this).hide("normal", function(){
							$(this).remove();

							if(!$("#trade_right_offer img").length && !$("#trade_left_offer img").length){
								$("#trade_accept_btn").css("opacity", .5);
							}

							span.css("opacity", 1);
						});
					});

					img.appendTo(where_to);
				}

				if(where_to.find("img[data-shop-item-id=" + item_id + "]").length == current_quantity){
					span.css("opacity", 0.5);
				}

				if(where_to.find("img").length){
					$("#trade_accept_btn").css("opacity", 1);
				}
			});

			if(parseInt(self.shop.settings.mini_image_percent) > 0){
				$("#monetaryshop-trade-dialog span[data-shop-item-id] img").bind("load", function(){
					var width = this.width;
					var height = this.height;
					var percent = parseInt(self.shop.settings.mini_image_percent);

					this.width = (width - (width * (percent / 100)));
					this.height = (height - (height * (percent / 100)));

					$(this).fadeIn("slow");
				});
			}
		},

		validate_trade_items: function(imgs, owner){
			var grouped_items = {};

			imgs.each(function(){
				var item_id = $(this).attr("data-shop-item-id");

				//if(!grouped_items
			});
		}

	};

})().register();