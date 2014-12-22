pixeldepth.monetary.shop.trade = (function(){

	return {

		settings: {

			enabled: true,
			show_trade_button: true,
			page_timer_enabled: true,

			text: {

				gift: "Gift",
				trade: "Trade",
				request: "Request",
				sent: "Sent",
				received: "Received",
				sending: "Sending",
				receiving: "Receiving",
				requesting: "Requesting",
				item: "Item"	

			}

		},

		page_timer: 0,
		PAGE_TIME_EXPIRY: 45,
		interval: 0,
		expired: false,
		timer_running: false,
		timer_paused: false,

		images: {},

		init: function(){
			this.setup();

			if(!this.settings.enabled){
				return;
			}
			
			yootil.bar.add("/user/" + yootil.user.id() + "?monetaryshop&tradeview=1", this.shop.images.trade, this.settings.text.gift + " / " + this.settings.text.trade + " " + this.settings.text.request + "s", "pdmstrade");
			
			if(yootil.location.check.profile_home()){
				if(location.href.match(/\?monetaryshop&tradeview=(\d+)/i) && RegExp.$1){
					var view = ~~ RegExp.$1;
					var user_id = yootil.user.id();
					
					switch(view){

						// Sent / Received Trades

						case 1:
							if(yootil.page.member.id() == user_id){
								yootil.create.page(new RegExp("\\/user\\/" + user_id + "\\?monetaryshop&tradeview=1"), this.settings.text.gift + " / " + this.settings.text.trade + " " + this.settings.text.request +  "s");
								yootil.create.nav_branch("/user/" + user_id + "?monetaryshop&tradeview=1", "<span id='trade-branch-sent-received'>" + this.settings.text.received + "</span> " + this.settings.text.gift + " / " + this.settings.text.trade + " " + this.settings.text.request +  "s");

								this.build_sent_received_trade_requests_html();
							}
							
							break;
						
						// Received request
						
						case 2:
							var trade_id = (location.href.match(/tradeview=2&id=(\d+)/))? RegExp.$1 : -1;

							if(trade_id){
								var id = ~~ yootil.page.member.id();
								var the_trade = this.shop.data(yootil.user.id()).get.trade(trade_id);
								var valid_trade = (the_trade && the_trade.f && the_trade.f.i)? true : false;
								var title = "Viewing ";
								var gift = false;
								
								if(valid_trade){
									var total_items_requesting = this.get_total_items(the_trade.f, true);
									var total_items_receiving = this.get_total_items(the_trade.t, true);
									
									if(total_items_requesting && !total_items_receiving){
										title += this.settings.text.gift;
										gift = true;
									} else {
										title += this.settings.text.trade + " " + this.settings.text.request;	
									}
								} else {
									title = "An Error Has Occurred";
									proboards.alert("An Error Has Occurred", "The trade request could not be found.");									
								}
								
								yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetaryshop&tradeview=2&id=[\\d\\.]+"), title);
								yootil.create.nav_branch("/user/" + user_id + "?monetaryshop&tradeview=1", title);
								this.build_received_trade_request_html(the_trade, title, gift);
							} else {
								pixeldepth.monetary.show_default();
							}

							break;
						
						// Sent request
						
						case 3:
							var trade_id = (location.href.match(/tradeview=3&id=(\d+)/))? RegExp.$1 : -1;

							if(trade_id){
								var id = ~~ yootil.page.member.id();
								var the_trade = this.shop.data(yootil.user.id()).get.trade(trade_id);
								var valid_trade = (the_trade && the_trade.f && the_trade.f.i)? true : false;
								var title = "Viewing Sent ";
								var gift = false;
								
								if(valid_trade){
									var total_items_requesting = this.get_total_items(the_trade.f, true);
									var total_items_receiving = this.get_total_items(the_trade.t, true);
									
									if(total_items_requesting && !total_items_receiving){
										title += this.settings.text.gift;
										gift = true;
									} else {
										title += this.settings.text.trade + " " + this.settings.text.request;	
									}
								} else {
									title = "An Error Has Occurred";
									proboards.alert("An Error Has Occurred", "The trade request could not be found.");									
								}
								
								yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetaryshop&tradeview=3&id=[\\d\\.]+"), title);
								yootil.create.nav_branch("/user/" + user_id + "?monetaryshop&tradeview=1", title);
								
								this.build_sent_trade_request_html(the_trade, title, gift);
							} else {
								pixeldepth.monetary.show_default();
							}

							break;
							
					}
				} else if(yootil.page.member.id() != yootil.user.id() && this.settings.show_trade_button){
					if(this.shop.can_use_shop()){
						this.create_trade_button();
					}
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

				clone.attr("href", "#").text(this.shop.trade.settings.text.gift + " / " + this.shop.trade.settings.text.trade);

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

		monitor_time_on_page: function(objs){
			var self = this;
			
			if(this.timer_paused){
				return false;	
			}
			
			if(this.timer_running){
				return false;
			}

			this.interval = setInterval(function(){
				if(self.page_timer >= self.PAGE_TIME_EXPIRY){
					self.expired = true;
					
					if(objs){
						for(var o = 0, l = objs.length; o < l; o ++){
							objs[o].css("opacity", .5);	
						}	
					}
					
					$("#monetary-trade-page-expiry").html("Page Expires In: expired");

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
			var dialog_title = this.settings.text.gift + " / " + this.settings.text.trade + " " + this.settings.text.request + " - <span id='monetary-trade-page-expiry'>Page Expires In: " + expiry_str + "</span>";
			var viewing_id = yootil.page.member.id() || null;

			if(!viewing_id){
				proboards.alert("An Error Has Occurred", "Could not find user ID.", {
					modal: true,
					height: 160,
					resizable: false,
					draggable: false
				});

				return false;
			}

			if(this.settings.page_timer_enabled){
				this.monitor_time_on_page([
					$("#monetaryshop-trade-dialog div.trade_wrapper"),
					$("#trade_accept_btn").css("opacity", .5)
				]);
				
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

						text: "Cancel " + this.settings.text.gift + " / " + this.settings.text.trade,
						click: function(){
							$(this).dialog("close");
						}

					},

					{

						text: "Send " + this.settings.text.gift + " / " + this.settings.text.trade,
						click: function(){
							if(self.expired){
								return false;
							}

							var dialog = this;
							
							if($("#trade_right_offer img").length || $("#trade_left_offer img").length){
								var with_items = self.validate_trade_items($("#trade_right_offer img"), false);
								var owner_items = self.validate_trade_items($("#trade_left_offer img"), true);

								if(with_items || owner_items){
									$("#trade_accept_btn span").text("  Please Wait...  ");
									
									var to_details = [viewing_id, yootil.page.member.name()];
									var from_details = [yootil.user.id(), yootil.user.name()];
									
									self.shop.data(yootil.user.id()).trade.send(owner_items, from_details, with_items, to_details, true);
									self.timer_paused = true;
																		
									self.shop.data(viewing_id).update(false);
									
									self.shop.data(yootil.user.id()).update(false, {
										
										complete: function(){
											$(dialog).dialog("close");
									
											var msg = "You have successfully sent a ";
											
											if(with_items && owner_items){
												msg += self.settings.text.trade.toLowerCase();
												msg += " " + self.settings.text.request.toLowerCase();
											} else {
											 	msg += self.settings.text.gift.toLowerCase();
											}
											
											msg += " to <a href='/user/" + yootil.html_encode(viewing_id) + "'>";
											msg += yootil.html_encode(yootil.page.member.name()) + "</a>.";										
											   
											proboards.dialog("monetaryshop-trade-sent-dialog", {
											
												modal: true,
												height: 200,
												width: 420,
												title: self.settings.text.gift + " / " + self.settings.text.trade + " " + self.settings.text.sent,
												html: msg,
												resizable: false,
												draggable: false,
												buttons: {
											
													Close: function(){
														$(this).dialog("close");
														self.timer_paused = false;
													}
													
												}
											
											});	
										}
											
									});
								} else {
									proboards.alert("An Error Has Occurred", "Could not send request (#1).", {
										modal: true,
										height: 160,
										resizable: false,
										draggable: false
									});
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

				var user_id = (who == "trade_owner_items")? yootil.user.id() : yootil.page.member.id();
				var where_to = (who == "trade_owner_items")? $("#trade_left_offer") : $("#trade_right_offer");
				var item_image = span.find("img");
				var img = $("<img />").attr("src", item_image.attr("src"));
				var current_total_offer = where_to.find("img[data-shop-item-id=" + item_id + "]").length;
				var current_quantity = self.shop.data(user_id).get.quantity(item_id);

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

				if(who == "trade_owner_items" && where_to.find("img").length){
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

						q: 1

					};
				} else {
					grouped_items[item_id].q ++;
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

			return (count > 0)? grouped_items : false;
		},
		
		get_total_items: function(items, receiving){
			var total = 0;
			var the_items = {};
			
			if(receiving && items.i){
				the_items = items.i;
			} else if(items.i){
				the_items = items.i;	
			}
			
			for(var k in the_items){
				total += the_items[k].q;
			}
			
			return total;
		},
		
		build_sent_requests: function(trades_sent){
			var html = "";
					
			html += '<div id="trade_requests_sent" style="display: none">';
			html += "<table class='monetary-shop-trades-list list'>";
			html += "<thead><tr class='head'>";
			html += "<th class='monetary-shop-trade-list-icon'> </th>";
			html += "<th class='monetary-shop-trade-list-sending'>" + this.settings.text.sending + "</th>";
			html += "<th class='monetary-shop-trade-list-requesting'>" + this.settings.text.requesting + "</th>";
			html += "<th class='monetary-shop-trade-list-to'>" + this.settings.text.request + " To</th>";
			html += "<th class='monetary-shop-trade-list-date'>Date Sent</th>";
			html += "<th></th></tr></thead>";
			html += "<tbody class='list-content'>";

			var counter = 0;
			var time_24 = (yootil.user.time_format() == "12hr")? false : true;

			if(trades_sent.length){
				for(var t = 0, l = trades_sent.length; t < l; t ++){
					var date = new Date(trades_sent[t].d);
					var day = date.getDate() || 1;
					var month = pixeldepth.monetary.months[date.getMonth()];
					var year = date.getFullYear();
					var hours = date.getHours();
					var mins = date.getMinutes();
					var date_str = pixeldepth.monetary.days[date.getDay()] + " " + day + "<sup>" + pixeldepth.monetary.get_suffix(day) + "</sup> of " + month + ", " + year + " at ";
					var am_pm = "";

					mins = (mins < 10)? "0" + mins : mins;

					if(!time_24){
						am_pm = (hours > 11)? "pm" : "am";
						hours = hours % 12;
						hours = (hours)? hours : 12;
					}

					var total_items_sending = this.get_total_items(trades_sent[t].f, false);
					var total_items_requesting = this.get_total_items(trades_sent[t].t, true);
					var icon = this.shop.images.trade_32;
					
					if(!total_items_requesting){
						icon = this.shop.images.gift_32;
					}
					
					date_str += hours + ":" + mins + am_pm;

					klass = (counter == 0)? " first" : ((counter == (l - 1))? " last" : "");

					html += "<tr class='item conversation" + klass + "' data-trade-with='" + trades_sent[t].t.u[0] + "'>";
					html += "<td><img src='" + icon + "' /></td>";
					html += "<td>" + total_items_sending + " " + this.settings.text.item.toLowerCase() + ((total_items_sending == 1)? "" : "s") + "</td>";
					html += "<td>" + total_items_requesting + " " + this.settings.text.item.toLowerCase() + ((total_items_requesting == 1)? "" : "s") + "</td>";
					html += "<td><a href='/user/" + yootil.html_encode(trades_sent[t].t.u[0]) + "'>" + yootil.html_encode(trades_sent[t].t.u[1]) + "</a></td>";
					html += "<td>" + date_str + "</td>";
					html += "<td class='monetary-shop-trade-list-button'><button class='trade-request-sent-button' data-trade-id='" + yootil.html_encode(trades_sent[t].d) + "'>View " + this.settings.text.request + "</button></td>";
					html += "</tr>";

					counter ++;
				}
			} else {
				html += "<tr class='item conversation last'><td colspan='5'><em>You have not " + this.settings.text.sent.toLowerCase() + " any " + this.settings.text.gift.toLowerCase() + " / " + this.settings.text.trade.toLowerCase() + " " + this.settings.text.request.toLowerCase() + "s.</em></td></tr>";
			}

			html += "</tbody></table></div>";
			
			return html;
		},
		
		build_received_requests: function(trades_received){
			var html = "";
					
			html += '<div id="trade_requests_received">';
			html += "<table class='monetary-shop-trades-list list'>";
			html += "<thead><tr class='head'>";
			html += "<th class='monetary-shop-trade-list-icon'> </th>";
			html += "<th class='monetary-shop-trade-list-receiving'>" + this.settings.text.sending + "</th>";
			html += "<th class='monetary-shop-trade-list-requesting'>" + this.settings.text.requesting + "</th>";
			html += "<th class='monetary-shop-trade-list-to'>" + this.settings.text.request + " From</th>";
			html += "<th class='monetary-shop-trade-list-date'>Date Sent</th>";
			html += "<th></th></tr></thead>";
			html += "<tbody class='list-content'>";

			var counter = 0;
			var time_24 = (yootil.user.time_format() == "12hr")? false : true;

			if(trades_received.length){
				for(var t = 0, l = trades_received.length; t < l; t ++){
					var date = new Date(trades_received[t].d);
					var day = date.getDate() || 1;
					var month = pixeldepth.monetary.months[date.getMonth()];
					var year = date.getFullYear();
					var hours = date.getHours();
					var mins = date.getMinutes();
					var date_str = pixeldepth.monetary.days[date.getDay()] + " " + day + "<sup>" + pixeldepth.monetary.get_suffix(day) + "</sup> of " + month + ", " + year + " at ";
					var am_pm = "";

					mins = (mins < 10)? "0" + mins : mins;

					if(!time_24){
						am_pm = (hours > 11)? "pm" : "am";
						hours = hours % 12;
						hours = (hours)? hours : 12;
					}

					var total_items_receiving = this.get_total_items(trades_received[t].f, false);
					var total_items_requesting = this.get_total_items(trades_received[t].t, true);
					var icon = this.shop.images.trade_32;
					
					if(!total_items_requesting){
						icon = this.shop.images.gift_32;
					}
					
					date_str += hours + ":" + mins + am_pm;

					klass = (counter == 0)? " first" : ((counter == (l - 1))? " last" : "");

					html += "<tr class='item conversation" + klass + "' data-trade-with='" + trades_received[t].f.u[0] + "'>";
					html += "<td><img src='" + icon + "' /></td>";
					html += "<td>" + total_items_receiving + " " + this.settings.text.item.toLowerCase() + ((total_items_receiving == 1)? "" : "s") + "</td>";
					html += "<td>" + total_items_requesting + " " + this.settings.text.item.toLowerCase() + ((total_items_requesting == 1)? "" : "s") + "</td>";
					html += "<td><a href='/user/" + yootil.html_encode(trades_received[t].f.u[0]) + "'>" + yootil.html_encode(trades_received[t].f.u[1]) + "</a></td>";
					html += "<td>" + date_str + "</td>";
					html += "<td class='monetary-shop-trade-list-button'><button class='trade-request-received-button' data-trade-id='" + yootil.html_encode(trades_received[t].d) + "'>View " + this.settings.text.request + "</button></td>";
					html += "</tr>";

					counter ++;
				}
			} else {
				html += "<tr class='item conversation last'><td colspan='5'><em>You have not " + this.settings.text.received.toLowerCase() + " any " + this.settings.text.gift.toLowerCase() + " / " + this.settings.text.trade.toLowerCase() + " " + this.settings.text.request.toLowerCase() + "s.</em></td></tr>";
			}

			html += "</tbody></table></div>";
			
			return html;
		},
			
		build_sent_received_trade_requests_html: function(){
			var self = this;
			var trades_sent = this.shop.data(yootil.user.id()).get.trades.sent();
			var trades_received = this.shop.data(yootil.user.id()).get.trades.received();
			var html = '<div class="ui-tabMenu"><ul class="ui-helper-clearfix">';
			
			html += '<li class="ui-active" id="tab_trade_requests_received"><a href="#">' + this.settings.text.received + ' (' + trades_received.length + ')</a></li>';
			html += '<li id="tab_trade_requests_sent"><a href="#">' + this.settings.text.sent + ' (' + trades_sent.length + ')</a></li>';
						
			html += "</ul></div>";
			
			html += this.build_received_requests(trades_received);
			html += this.build_sent_requests(trades_sent);			
			
			var container = yootil.create.container("<span id='trade-title-sent-received'>" + this.settings.text.received + "</span> " + this.settings.text.gift + " / " + this.settings.text.trade + " " + this.settings.text.request + "s", html).show();

			container.find("tr.item").mouseenter(function(){
				$(this).addClass("state-hover");
			}).mouseleave(function(){
				$(this).removeClass("state-hover");
			});
			
			container.addClass("container_monetaryshop_trades");

			var tabs = container.find("div.ui-tabMenu li[id*=tab_trade_]");
			
			tabs.click(function(e){
				var id = $(this).attr("id");

				if(id){
					var tab_sent = $("div.container_monetaryshop_trades li#tab_trade_requests_sent");
					var div_sent = $("div.container_monetaryshop_trades div#trade_requests_sent");
					var tab_received = $("div.container_monetaryshop_trades li#tab_trade_requests_received");
					var div_received = $("div.container_monetaryshop_trades div#trade_requests_received");
						
					if(id == "tab_trade_requests_sent"){
						$("#trade-title-sent-received").text(self.settings.text.sent);
						$("#trade-branch-sent-received").text(self.settings.text.sent);
						
						tab_received.removeClass("ui-active");
						div_received.hide();
						tab_sent.addClass("ui-active");
						div_sent.show();
					} else if(id == "tab_trade_requests_received"){
						$("#trade-title-sent-received").text(self.settings.text.received);
						$("#trade-branch-sent-received").text(self.settings.text.received);
						
						tab_sent.removeClass("ui-active");
						div_sent.hide();
						tab_received.addClass("ui-active");
						div_received.show();
					}
				}

				e.preventDefault();
				return false;
			});
			
			container.find(".monetary-shop-trade-list-button button").click(function(){
				var id = $(this).attr("data-trade-id");
				var from = ~~ $(this).parent().parent().attr("data-trade-with");
				var trade_view = ($(this).hasClass("trade-request-received-button"))? 2 : 3; 
								
				location.href = "/user/" + from + "?monetaryshop&tradeview=" + trade_view + "&id=" + id;
			});
			
			container.find("div.pad-all").removeClass("pad-all").addClass("cap-bottom");
			container.appendTo("#content");
		},
		
		build_received_trade_request_html: function(the_trade, title, gift){
			var self = this;
			var can_trade = true;
			var member_id = yootil.page.member.id();
			var html = "";
			var img_size = this.shop.get_size_css(true);
			var disp = (!img_size.length && parseInt(this.shop.settings.mini_image_percent) > 0)? " style='display: none;'" : "";
			var valid_trade = (the_trade && the_trade.f && the_trade.f.i)? true : false;
			var trader_name = (valid_trade)? yootil.html_encode(the_trade.f.u[1]) : "Member";
			var trade_gift_img = (gift)? this.shop.images.gift_big : this.shop.images.trade_big;
			var trade_gift_txt = (gift)? this.settings.text.gift : this.settings.text.trade;
						
			html += "<div style='float: left; margin-top: 35px; width: 160px; text-align: center;'>";
			html += "<img src='" + trade_gift_img + "'>";
  			html += "</div>";
  			
  			if(valid_trade){
	  			trader_name = "<a class='trader-requester-name' href='/user/" + yootil.html_encode(the_trade.f.u[0]) + "'>" + yootil.html_encode(trader_name) + "</a>";  	
	  		}
	  		
  			html += "<div class='trade_wrapper' style='float: left; margin-top: 10px;'><div style='float: left;'>";
  			html += "<strong style='padding-left: 2px;'>" + trader_name + "</strong> wants to " + trade_gift_txt.toLowerCase() + ":<br />";
  			html += "<div class='trade_with trade_profile' style='height: 140px; width: 250px; margin-top: 3px; margin-right: 40px; cursor: default;'>";
  			
  			var trading_content = "";
  			var missing_shop_items = false;
  			  			
	  		if(valid_trade){
	  			for(var id in the_trade.f.i){
	  				var qty = the_trade.f.i[id].q;
	  				
	  				for(var q = 0; q < qty; q ++){
	  					var item = this.shop.lookup[id];
	  					
	  					if(item){	  						
	  						trading_content += '<span class="pd_shop_mini_item" data-shop-item-id="' + item.item_id + '" title="' + yootil.html_encode(item.item_name) + '"><img src="' + this.shop.settings.base_image + item.item_image + '"' + img_size + disp + ' /></span>';				
	  						/*var num = "";
	  						
	  						if(qty > 1){
	  							
								num = '<span class="shop_item">';
								num += '<img' + disp + ' class="shop_item_x" src="' + this.shop.images.x + '" />';
		
								if(qty >= 99){
									num += 	'<img' + disp + ' class="shop_item_num" src="' + this.shop.images["9"] + '" /><img class="shop_item_num shop_item_num_last" src="' + this.shop.images["9"] + '" />';
								} else {
									var str = qty.toString();
		
									for(var s = 0; s < str.length; s ++){
										var klass = (s > 0)? " shop_item_num_last" : "";
		
										num += 	'<img' + disp + ' class="shop_item_num' + klass + '" src="' + this.shop.images[str.substr(s, 1)] + '" />';
									}
								}
		
								num += '</span>';
							}
	  						
	  						trading_content += '<div class="shop_items_list" data-shop-item-id="' + item.item_id + '" title="' + yootil.html_encode(item.item_name) + '"><img src="' + this.shop.settings.base_image + item.item_image + '"' + img_size + disp + ' />' + num + '</div>';*/
	  					} else {
	  						missing_shop_items = true;
	  						break;	
	  					}
	  				}
	  			}
  			}
  			
  			if(!trading_content.length){
  				can_trade = false;
  				trading_content = "<em>An error has occurred.</em>";
  			}
  			
  			if(missing_shop_items){
  				can_trade = false;
  				trading_content = "<em>Missing shop items.</em>";
  			}
  			
  			html += trading_content;
  			
  			html += "</div>";
    		html += "</div>";
    		html += "<div style='float: left; margin-top: 15px;'>";
    		html += "<img src='" + this.shop.images.arrow_right + "' /><br />";
    		html += "<img src='" + this.shop.images.arrow_left + "' /></div>";
    		html += "<div style='float: left; margin-left: 40px;'>";
    		html += "<strong style='padding-left: 2px;'>For</strong> the following:<br><div class='trade_with trade_profile' style='height: 140px; width: 250px; margin-top: 3px; cursor: default;'>";
    		
    		var requesting_content = "";
  			
  			if(valid_trade){
	  			for(var id in the_trade.t.i){
	  				var qty = the_trade.t.i[id].q;
	  				
	  				for(var q = 0; q < qty; q ++){
	  					var item = this.shop.lookup[id];
	  					
	  					if(item){
	  						requesting_content += '<span class="pd_shop_mini_item" data-shop-item-id="' + item.item_id + '" title="' + yootil.html_encode(item.item_name) + '"><img src="' + this.shop.settings.base_image + item.item_image + '"' + img_size + disp + ' /></span>';				
	  					} else {
	  						missing_shop_items = true;
	  						break;	
	  					}
	  				}
	  			}
  			}
  			
  			if(gift){
  				requesting_content = "<span class='trader-not-requesting'>" + trader_name + " is not requesting any items.</span>";
  			} else if(!requesting_content.length){
  				can_trade = false;
  				requesting_content = "<em>An error has occurred</em>";
  			}
  			
  			if(missing_shop_items){
  				can_trade = false;
  				requesting_content = "<em>Missing shop items.</em>";
  				
  				setTimeout(function(){
	  				proboards.alert("An Error Has Occurred", "There are items in this request that no longer exist in the shop, so this request can not be accepted, only declined.", {
  				
		  				modal: true,
						height: 180,
						width: 350,
						resizable: false,
						draggable: false	
	  					
  					});
  				}, 500);
  			}
  			
  			html += requesting_content;
    		
    		html += "</div></div><br style='clear: both' />";
    		html += "<div style='margin-top: 25px; margin-bottom: 10px; text-align: center;'>";
    		
    		var trade_disabled = (can_trade)? "" : " style='opacity: 0.5;'";
    		var decline_disabled = (can_trade)? "" : ((missing_shop_items)? "" : " style='opacity: 0.5;'");
    		 
    		html += "<button id='accept_trade'" + trade_disabled + ">Accept " + trade_gift_txt + "</button> <button id='reject_trade'" + decline_disabled + ">Decline " + trade_gift_txt + "</button></div></div>";

			if(this.settings.page_timer_enabled){
				var expiry_str = (this.expired)? "expired" : ((this.PAGE_TIME_EXPIRY  - this.page_timer) + " seconds");
								
				title += " - <span id='monetary-trade-page-expiry'>Page Expires In: " + expiry_str + "</span>";
			}
			
			var container = yootil.create.container(title, html).show();
			
			if(can_trade){
				container.find("button#accept_trade").click(function(){
					if(self.expired){
						proboards.alert("Page Expired", "This page has expired, please refresh.", {
							modal: true,
							height: 160,
							resizable: false,
							draggable: false
						});
		
						return;
					}
					
					// Need to make sure all items that are in this request still exist
					// for both parties
					
					if(!self.has_items_for_trade(the_trade)){
						can_trade = false;
						error_code = 1002;	
					}
					
					if(can_trade){
						
						// Need to disable buttons and add complete event
						// Once accepted, send back to requests page
						
						var return_obj = self.shop.data(yootil.user.id()).trade.accept(the_trade, gift, true);
						
						if(return_obj.can_accept){
							self.timer_paused = true;
							self.shop.data(yootil.user.id()).update(false);
							self.shop.data(the_trade.f.u[0]).update(false, {
																	
								complete: function(){
									var msg = "You have successfully accepted this request ";
																		   
									proboards.dialog("monetaryshop-trade-accept-success-dialog", {
									
										modal: true,
										height: 200,
										width: 420,
										title: self.settings.text.gift + " / " + self.settings.text.trade + " Accepted",
										html: msg,
										resizable: false,
										draggable: false,
										buttons: {
									
											Close: function(){
												$(this).dialog("close");
												location.href = "/user/" + yootil.user.id() + "?monetaryshop&tradeview=1";
											}
											
										}
									
									});	
								}
								
							});
						} else {
							var error = "An unknown error has occurred (error code: 1003).";
							
							if(return_obj.error.length){
								error = return_obj.error;
							}
							
							proboards.alert("The following error has occurred.", error, {
								modal: true,
								height: 180,
								width: 400,
								resizable: false,
								draggable: false
						});
						}
					} else {
						proboards.alert("An Error Has Occurred", "There is an error (error code: " + error_code + ") with this request, it can only be declined.", {
							modal: true,
							height: 160,
							resizable: false,
							draggable: false
						});	
					}
				});
			}
			
			container.find("button#reject_trade").click(function(){
				if(self.expired){
					proboards.alert("Page Expired", "This page has expired, please refresh.", {
						modal: true,
						height: 160,
						resizable: false,
						draggable: false
					});
	
					return;
				}
				
				proboards.dialog("shop-trade-decline-confirm", {
					
					title: "Confirm",
					html: "Are you sure you want to decline this " + trade_gift_txt.toLowerCase() + "?",
					modal: true,
					width: 350,
					height: 170,
					resizable: false,
					draggable: false,
					buttons: [
					
						{
							
							text: "Cancel",
							click: function(){
								$(this).dialog("close");	
							}
							
						},
						
						{
							
							text: "Decline " + trade_gift_txt,
							click: function(){
								if(self.expired){
									$(this).dialog("close");
									
									proboards.alert("Page Expired", "This page has expired, please refresh.", {
										modal: true,
										height: 160,
										resizable: false,
										draggable: false
									});
					
									return;	
								}
								
								var what = $(this);
								
								self.shop.data(yootil.user.id()).trade.decline(the_trade, false, {
									
									complete: function(){
										what.dialog("close");
										
										proboards.alert(trade_gift_txt + " Declined", "This " + trade_gift_txt.toLowerCase() + " was successfully declined.", {
									
											modal: true,
											resizable: false,
											draggable: false,
											buttons: [
										
												{
													text: "Ok",
													click: function(){
														$(this).dialog("close");
														location.href = "/user/" + yootil.user.id() + "?monetaryshop&tradeview=1";			
													}
												}
											
											]
										
										});
									},
									
									error: function(){
										proboards.alert("An Error Occurred", "Could not decline " + trade_gift_txt.toLowerCase() + ", please try again.");
									}
									
								});
							}
						
						}
					]
				});
			});	
			
			container.appendTo("#content");
			
			if(this.settings.page_timer_enabled){
				this.monitor_time_on_page([
					$("button#accept_trade"),
					$("button#reject_trade")	
				]);
				
				this.timer_running = true;	
			}
			
			if(parseInt(self.shop.settings.mini_image_percent) > 0){
				$("div.trade_profile span.pd_shop_mini_item img").bind("load", function(){
					var width = this.width;
					var height = this.height;
					var percent = parseInt(self.shop.settings.mini_image_percent);

					this.width = (width - (width * (percent / 100)));
					this.height = (height - (height * (percent / 100)));

					$(this).fadeIn("slow");
				});
			}
		},
		
		has_items_for_trade: function(the_trade){
			if(!the_trade){
				return false;
			}
			
			var total_items_requesting = this.get_total_items(the_trade.f, true);
			
			// Need to check if items exist if this is not a gift
			// If they don't, then we can't allow the user to accept
			// the trade request
			
			if(total_items_requesting > 0){
				var items = the_trade.t.i;
				var current_items = this.shop.data(yootil.user.id()).get.items();
				var can_accept = true;
				
				for(var id in items){
					if(!current_items[id] || current_items[id].q < items[id].q){
						can_accept = false;
						break;	
					}
				}
				
				if(can_accept){
					return true;	
				}				
			}

			return false;
		},
		
		build_sent_trade_request_html: function(the_trade, title, gift){
			var self = this;
			var can_trade = true;
			var member_id = yootil.page.member.id();
			var html = "";
			var img_size = this.shop.get_size_css(true);
			var disp = (!img_size.length && parseInt(this.shop.settings.mini_image_percent) > 0)? " style='display: none;'" : "";
			var valid_trade = (the_trade && the_trade.f && the_trade.f.i)? true : false;
			var trader_name = "You";
			var trade_gift_img = (gift)? this.shop.images.gift_big : this.shop.images.trade_big;
			var trade_gift_txt = (gift)? this.settings.text.gift : this.settings.text.trade;
			var receiver_name = "";
			
			html += "<div style='float: left; margin-top: 35px; width: 160px; text-align: center;'>";
			html += "<img src='" + trade_gift_img + "'>";
  			html += "</div>";
  			  			
  			if(valid_trade){
	  			receiver_name = "<a class='trader-requester-name' href='/user/" + yootil.html_encode(the_trade.t.u[0]) + "'>" + yootil.html_encode(the_trade.t.u[1]) + "</a>";  	
	  		}
	  		
  			html += "<div class='trade_wrapper' style='float: left; margin-top: 10px;'><div style='float: left;'>";
  			html += "<strong style='padding-left: 2px;'>" + trader_name + "</strong> want to " + trade_gift_txt.toLowerCase() + ":<br />";
  			html += "<div class='trade_with trade_profile' style='height: 140px; width: 250px; margin-top: 3px; margin-right: 40px; cursor: default;'>";
  			
  			var trading_content = "";
  			var missing_shop_items = false;
  			  			
	  		if(valid_trade){
	  			for(var id in the_trade.f.i){
	  				var qty = the_trade.f.i[id].q;
	  				
	  				for(var q = 0; q < qty; q ++){
	  					var item = this.shop.lookup[id];
	  					
	  					if(item){	  						
	  						trading_content += '<span class="pd_shop_mini_item" data-shop-item-id="' + item.item_id + '" title="' + yootil.html_encode(item.item_name) + '"><img src="' + this.shop.settings.base_image + item.item_image + '"' + img_size + disp + ' /></span>';	
	  					} else {
	  						missing_shop_items = true;
	  						break;	
	  					}
	  				}
	  			}
  			}
  			
  			if(!trading_content.length){
  				can_trade = false;
  				trading_content = "<em>An error has occurred.</em>";
  			}
  			
  			if(missing_shop_items){
  				can_trade = false;
  				trading_content = "<em>Missing shop items.</em>";
  			}
  			
  			html += trading_content;
  			
  			html += "</div>";
    		html += "</div>";
    		html += "<div style='float: left; margin-top: 15px;'>";
    		html += "<img src='" + this.shop.images.arrow_right + "' /><br />";
    		html += "<img src='" + this.shop.images.arrow_left + "' /></div>";
    		html += "<div style='float: left; margin-left: 40px;'>";
    		
    		var f_case = "F";
    		
    		if(receiver_name){
    			if(!gift){
    				html += "With " + receiver_name + ", ";
    				f_case.toLowerCase();
    			}	
    		}

    		html += "<strong style='padding-left: 2px;'>" + f_case + "or</strong> the following:<br><div class='trade_with trade_profile' style='height: 140px; width: 250px; margin-top: 3px; cursor: default;'>";
    				
    		var requesting_content = "";
  			
  			if(valid_trade){
	  			for(var id in the_trade.t.i){
	  				var qty = the_trade.t.i[id].q;
	  				
	  				for(var q = 0; q < qty; q ++){
	  					var item = this.shop.lookup[id];
	  					
	  					if(item){
	  						requesting_content += '<span class="pd_shop_mini_item" data-shop-item-id="' + item.item_id + '" title="' + yootil.html_encode(item.item_name) + '"><img src="' + this.shop.settings.base_image + item.item_image + '"' + img_size + disp + ' /></span>';				
	  					} else {
	  						missing_shop_items = true;
	  						break;	
	  					}
	  				}
	  			}
  			}
  			
  			if(gift){
  				requesting_content = "<span class='trader-not-requesting'>You are not requesting any items from " + receiver_name + ".</span>";
  			} else if(!requesting_content.length){
  				can_trade = false;
  				requesting_content = "<em>An error has occurred</em>";
  			}
  			
  			if(missing_shop_items){
  				can_trade = false;
  				requesting_content = "<em>Missing shop items.</em>";
  				
  				setTimeout(function(){
	  				proboards.alert("An Error Has Occurred", "There are items in this request that no longer exist in the shop, so this request can not be accepted, only declined.", {
  				
		  				modal: true,
						height: 180,
						width: 350,
						resizable: false,
						draggable: false	
	  					
  					});
  				}, 500);
  			}
  			
  			html += requesting_content;
    		
    		html += "</div></div><br style='clear: both' />";
    		html += "<div style='margin-top: 25px; margin-bottom: 10px; text-align: center;'>";
    		
    		var decline_disabled = (can_trade)? "" : ((missing_shop_items)? "" : " style='opacity: 0.5;'");
    		 
    		html += "<button id='reject_trade'" + decline_disabled + ">Cancel " + trade_gift_txt + "</button></div></div>";

			if(this.settings.page_timer_enabled){
				var expiry_str = (this.expired)? "expired" : ((this.PAGE_TIME_EXPIRY  - this.page_timer) + " seconds");
								
				title += " - <span id='monetary-trade-page-expiry'>Page Expires In: " + expiry_str + "</span>";
			}
			
			var container = yootil.create.container(title, html).show();
			
			container.find("button#reject_trade").click(function(){
				if(self.expired){
					proboards.alert("Page Expired", "This page has expired, please refresh.", {
						modal: true,
						height: 160,
						resizable: false,
						draggable: false
					});
	
					return;
				}
				
				proboards.dialog("shop-trade-decline-confirm", {
					
					title: "Confirm",
					html: "Are you sure you want to cancel this " + trade_gift_txt.toLowerCase() + "?",
					modal: true,
					width: 350,
					height: 170,
					resizable: false,
					draggable: false,
					buttons: [
					
						{
							
							text: "Cancel",
							click: function(){
								$(this).dialog("close");
							}
							
						},
						
						{
							
							text: "Yes, Cancel Request",
							click: function(){
								var what = $(this);
								$(this).dialog("close");
								
								self.shop.data(yootil.user.id()).trade.decline(the_trade, false, {
									
									complete: function(){
										what.dialog("close");
										
										proboards.alert(trade_gift_txt + " Cancel", "This " + trade_gift_txt.toLowerCase() + " was successfully cancelled.", {
									
											modal: true,
											resizable: false,
											draggable: false,
											buttons: [
										
												{
													text: "Ok",
													click: function(){
														$(this).dialog("close");
														location.href = "/user/" + yootil.user.id() + "?monetaryshop&tradeview=1";			
													}
												}
											
											]
										
										});
									},
									
									error: function(){
										proboards.alert("An Error Occurred", "Could not cancel " + trade_gift_txt.toLowerCase() + ", please try again.");
									}
								});
							}
							
						}
					]
				});
			});	
			
			container.appendTo("#content");
			
			if(this.settings.page_timer_enabled){
				this.monitor_time_on_page([
					$("button#reject_trade")	
				]);
				
				this.timer_running = true;	
			}
			
			if(parseInt(self.shop.settings.mini_image_percent) > 0){
				$("div.trade_profile span.pd_shop_mini_item img").bind("load", function(){
					var width = this.width;
					var height = this.height;
					var percent = parseInt(self.shop.settings.mini_image_percent);

					this.width = (width - (width * (percent / 100)));
					this.height = (height - (height * (percent / 100)));

					$(this).fadeIn("slow");
				});
			}
		}

	};

})().register();