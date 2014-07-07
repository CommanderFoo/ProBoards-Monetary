// @TODO Errors

pixeldepth.monetary.shop.trade = (function(){

	return {

		settings: {

			enabled: true,
			show_trade_button: true,
			page_timer_enabled: true,

			text: {

				trade: "Gift / Trade"

			}

		},

		page_timer: 0,
		PAGE_TIME_EXPIRY: 45,
		interval: 0,
		expired: false,
		timer_running: false,

		images: {},

		init: function(){
			this.setup();

			if(!this.settings.enabled){
				return;
			}

			if(yootil.page.member.id() != yootil.user.id() && this.settings.show_trade_button){
				if(this.shop.can_use_shop()){
					this.create_trade_button();
				}
			}
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

		create_trade_button: function(){
			var trade_button = $(".controls a.button[href^='/conversation/new/']");

			if(trade_button.length){
				var self = this;
				var clone = trade_button.clone();
				var id = yootil.page.member.id();

				clone.attr("href", "#").text(this.shop.trade.settings.text.trade);

				clone.click(function(){
					self.shop.trade.request();
					return false;
				});

				clone.insertAfter(trade_button);
			}
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

		monitor_time_on_page: function(){
			var self = this;

			if(this.timer_running){
				return false;
			}

			this.interval = setInterval(function(){
				if(self.page_timer >= self.PAGE_TIME_EXPIRY){
					self.expired = true;
					$("#monetaryshop-trade-dialog div.trade_wrapper").css("opacity", .5);
					$("#monetary-trade-page-expiry").html("Page Expires In: expired");
					$("#trade_accept_btn").css("opacity", .5);

					proboards.alert("Page Expired", "This page has expired, please refresh.", {
						modal: true,
						height: 160,
						resizable: false,
						draggable: false
					});

					clearInterval(self.interval);

					return;
				}

				self.page_timer ++;

				var time_left = self.PAGE_TIME_EXPIRY - self.page_timer;

				time_left = (time_left < 0)? 0 : time_left;

				$("#monetary-trade-page-expiry").html("Page Expires In: " + time_left + " second" + ((time_left == 1)? "" : "s"));
			}, 1000);
		},

		request: function(){
			if(this.expired){
				proboards.alert("Page Expired", "This page has expired, please refresh.", {
					modal: true,
					height: 160,
					resizable: false,
					draggable: false
				});

				return;
			}

			var self = this;
			var expiry_str = (this.expired)? "expired" : ((this.PAGE_TIME_EXPIRY  - this.page_timer) + " seconds");
			var dialog_title = this.settings.text.trade + " Request - <span id='monetary-trade-page-expiry'>Page Expires In: " + expiry_str + "</span>";
			var viewing_id = yootil.page.member.id() || null;

			if(!viewing_id){

				// Display error here?

				return false;
			}

			if(this.settings.page_timer_enabled){
				this.monitor_time_on_page();
				this.timer_running = true;
			}

			var own_items = this.shop.data(yootil.user.id()).get.items();
			var with_items = this.shop.data(viewing_id).get.items();
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
				title: dialog_title,
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
							if(self.expired){
								return false;
							}

							if($("#trade_right_offer img").length || $("#trade_left_offer img").length){
								var with_items = self.validate_trade_items($("#trade_right_offer img"), false);
								var owner_items = self.validate_trade_items($("#trade_left_offer img"), true);

								if(with_items || owner_items){

								} else {

									// Show error

								}
							}
						},

						id: "trade_accept_btn",
						style: "opacity: 0.5;"

					}

				]

			});

			$("#monetaryshop-trade-dialog span.pd_shop_mini_item").click(function(){
				if(self.expired){
					return false;
				}

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
				var current_quantity = self.shop.data(yootil.user.id()).get.quantity(item_id);

				if(current_total_offer < current_quantity){
					img.attr("data-shop-item-id", item_id);

					img.click(function(){
						if(self.expired){
							return false;
						}

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

				if(!grouped_items[item_id]){
					grouped_items[item_id] = {

						quantity: 1

					};
				} else {
					grouped_items[item_id].quantity ++;
				}
			});

			var user_id = (owner)? yootil.user.id() : yootil.page.member.id();
			var count = 0;

			for(var k in grouped_items){
				if(!this.shop.data(user_id).get.quantity(k)){
					delete grouped_items[k];
				} else {
					count ++;
				}
			}

			return (count > 0)? true : false;
		}

	};

})().register();