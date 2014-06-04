pixeldepth.monetary.shop = (function(){

	return {

		settings: {

			enabled: true,
			base_image: ""

		},

		plugin: {},

		items: [],

		categories: [],
		category_lookup: {},

		category_items: {},

		cart: [],

		lookup: {},

		init: function(){
			if(yootil.user.logged_in()){
				this.setup();

				if(!this.settings.enabled){
					pixeldepth.monetary.show_default();
					return;
				}

				if(location.href.match(/\?monetaryshop(&view=(\d+))?/i)){
					if(RegExp.$2 && parseInt(RegExp.$2) > 1 && yootil.location.check.profile_home()){
						console.log("Viewing bought items");
					} else {
						yootil.create.nav_branch(yootil.html_encode(location.href), "Monetary Shop");
						yootil.create.page("?monetaryshop", "Monetary Shop");
						this.build_shop_html();
					}
				}
			}
		},

		setup: function(){
			if(pixeldepth.monetary.plugin){
				this.plugin = proboards.plugin.get("pixeldepth_monetary_shop");

				var settings = this.plugin.settings;

				if(this.plugin && this.plugin.settings){
					this.settings.enabled = (settings.shop_enabled && settings.shop_enabled == "0")? false : this.settings.enabled;
					this.items = (settings.shop_items && settings.shop_items.length)? settings.shop_items : this.items;
					this.settings.base_image = (settings.item_image_base && settings.item_image_base.length)? settings.item_image_base : this.settings.base_image;

					var categories = settings.categories;

					if(categories.length){
						categories = categories.sort(function(a, b){
   							return (a["category_name"] > b["category_name"])? 1 : 0;
						});

						for(var c = 0; c < categories.length; c ++){
							this.category_lookup[categories[c].category_id] = categories[c];
							this.categories.push(categories[c].category_name);
						}

						this.categories.sort();
					}

					for(var i = 0, l = this.items.length; i < l; i ++){
						this.lookup[this.items[i].item_id] = this.items[i];

						if(this.category_lookup[this.items[i].item_category]){
							if(!this.category_items[this.items[i].item_category]){
								this.category_items[this.items[i].item_category] = [];
							}

							this.category_items[this.items[i].item_category].push(this.items[i]);
						}
					}

					//this.setup_specials();
				}
			}
		},

		setup_specials: function(){
			var colored_name = {

				item_id: "s1",
				item_name: "Colored Name",
				item_description: "Have a colored name across the forum.",
				item_price: 1500,
				item_image: "",
				item_category: 99,
				item_refundable: 0,
				item_tradable: 0

			};

			this.category_items[99] = [];
			this.category_items[99].push(colored_name);
			this.lookup["s1"] = colored_name;
		},

		register: function(){
			pixeldepth.monetary.modules.push(this);
			return this;
		},

		build_shop_html: function(){
			var self = this;
			var title = '<div>';

			title += '<div style="float: left">Monetary Shop</div>';
			title += '<div style="float: right" id="pd_money_wallet">' + pixeldepth.monetary.settings.text.wallet + ': ' + pixeldepth.monetary.settings.money_symbol + '<span id="pd_money_wallet_amount">' + yootil.html_encode(pixeldepth.monetary.data(yootil.user.id()).get.money(true)) + '</span></div>';

			title += '</div><br style="clear: both" />';

			var html = "";
			var div_counter = 0;

			html += this.create_shop_tabs();

			for(var key in this.category_items){
				var cat_id = parseInt(key);

				html += '<div id="item_category_' + cat_id + '"' + ((div_counter != 0)? ' style="display: none;"' : '') + '>';
				html += '<table class="list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">Item Name</th><th style="width: 78%" class="main">Description</th><th style="width: 110px">Price</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content">';

				var counter = 0;

				for(var i = 0; i < this.category_items[key].length; i ++){
					klass = (counter == 0)? " first" : ((counter == (this.category_items.length - 1))? " last" : "");

					html += '<tr class="item' + klass + '">';
					html += '<td style="text-align: center;"><img src="' + this.settings.base_image + this.category_items[key][i].item_image + '" alt="' + yootil.html_encode(this.category_items[key][i].item_name) + '" title="' + yootil.html_encode(this.category_items[key][i].item_name) + '" /></td>';
					html += '<td>' + this.category_items[key][i].item_name + '</td>';
					html += '<td>' + this.category_items[key][i].item_description + '</td>';
					html += '<td>' + pixeldepth.monetary.settings.money_symbol + pixeldepth.monetary.format(this.category_items[key][i].item_price, true) + '</td>';
					html += '<td style="text-align: center;"><button data-item-id="' + this.category_items[key][i].item_id + '">Add To Cart</button></td>';

					counter ++;
				}

				html += '</tbody></table></div>';
				div_counter ++;
			}

			html += '<div id="search_results" style="display: none;">';
			html += '<div id="search_no_results" style="display: none; text-align: center; padding: 5px;">No items were found.</div>';
			html += '<table style="display: none" class="list" id="search_results_items"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">Item Name</th><th style="width: 78%" class="main">Description</th><th style="width: 110px">Price</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content"></tbody></table></div>';

			html += '<div id="basket_items" style="display: none;">';
			html += '<div id="basket_no_items" style="display: none; text-align: center; padding: 5px;">You have no items in your basket</div>';
			html += '<table style="display: none" class="list" id="basket_items_list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">Item Name</th><th style="width: 78%" class="main">Description</th><th style="width: 110px">Price</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content"></tbody></table></div>';

			var container = yootil.create.container(title, html).show();

			container.find("div.pad-all").removeClass("pad-all").addClass("cap-bottom");

			var tabs = container.find("div.ui-tabMenu li[id*=category_tab_]");

			tabs.click(function(e){
				var id = $(this).attr("id").match(/(\d+)$/)[1];

				if(id){
					$("div.container_monetaryshop div[id*=item_category_]").hide();
					$("div.container_monetaryshop li[id*=category_tab_]").removeClass("ui-active");

					$("div.container_monetaryshop li#search_results_tab").removeClass("ui-active");
					$("div.container_monetaryshop div#search_results").hide();

					$("div.container_monetaryshop li#basket_items_tab").removeClass("ui-active");
					$("div.container_monetaryshop div#basket_items").hide();

					$("div.container_monetaryshop li#category_tab_" + id).addClass("ui-active");
					$("div.container_monetaryshop div#item_category_" + id).show();
				}

				return false;
			});

			container.find("div[id*=item_category_] button[data-item-id]").click(function(){
				self.add_to_cart(this, $(this).attr("data-item-id"));
			});

			container.find("input#search_field").on("keyup", function(){
				var val = this.value;

				if(val.length >= 3){
					self.search_shop(val);
				}
			});

			container.find("li#search_results_tab").click(function(){
				$("div.container_monetaryshop div[id*=item_category_]").hide();
				$("div.container_monetaryshop li[id*=category_tab_]").removeClass("ui-active");

				$("div.container_monetaryshop li#search_results_tab").addClass("ui-active");
				$("div.container_monetaryshop div#search_results").show();

				$("div.container_monetaryshop li#basket_items_tab").removeClass("ui-active");
				$("div.container_monetaryshop div#basket_items").hide();

				return false;
			});

			container.find("li#basket_items_tab").click(function(){
				$("div.container_monetaryshop div[id*=item_category_]").hide();
				$("div.container_monetaryshop li[id*=category_tab_]").removeClass("ui-active");
				$("div.container_monetaryshop li#search_results_tab").removeClass("ui-active");
				$("div.container_monetaryshop div#search_results").hide();

				$("div.container_monetaryshop li#basket_items_tab").addClass("ui-active");
				$("div.container_monetaryshop div#basket_items_list tbody").empty();

				if(self.cart.length){
					self.populate_basket_list();
					$("div.container_monetaryshop div#basket_no_items").hide();
					$("div.container_monetaryshop div#basket_items_list").show();
				} else {
					$("div.container_monetaryshop table#basket_items_list").hide();
					$("div.container_monetaryshop div#basket_no_items").show();
				}

				$("div.container_monetaryshop div#basket_items").show();

				return false;
			});

			container.addClass("container_monetaryshop");
			container.appendTo("#content");
		},

		create_shop_tabs: function(){
			var html = '<div class="ui-tabMenu"><ul class="ui-helper-clearfix">';
			var counter = 0;

			for(var key in this.category_items){
				var id = parseInt(key);

				if(this.category_lookup[id]){
					var klass = (counter == 0)? ' class="ui-active"' : "";
					var cat_name = (id == 99)? "Forum Enhancements" : this.category_lookup[id].category_name;
					var css = (id == 99)? " style='margin-left: 25px'" : "";

					html += '<li' + css + klass + ' id="category_tab_' + id + '"><a href="#">' + cat_name + '</a></li>';
					counter ++;
				}
			}

			html += '<li style="float: right"><div class="ui-search" style="padding: 3px 10px 0px 4px;"><input width="90px" style="height: 17px" type="text" class="search-input" maxlength="50" placeholder="Search Shop..." role="search" accesskey="w" id="search_field"><span style="height: 16px" class="search-filters-button"><span class="icon"><img src="//images.proboards.com/v5/images/icon-search-filters.png"></span></span></div></li>';

			html += '<li style="float: right; margin-right: 10px" id="basket_items_tab"><a href="#">Basket (0)</a></li>';
			html += '<li style="float: right; margin-right: 10px; display: none;" id="search_results_tab"><a href="#">Search Results (0)</a></li>';

			html += "</ul></div>";

			return html;
		},

		search_shop: function(txt){
			if(txt && txt.length >= 3){
				var self = this;

				$("div.container_monetaryshop div[id*=item_category_]").hide();
				$("div.container_monetaryshop li[id*=category_tab_]").removeClass("ui-active");

				$("div.container_monetaryshop li#basket_items_tab").removeClass("ui-active");
				$("div.container_monetaryshop div#basket_items").hide();

				$("div.container_monetaryshop div#search_results").show();
				$("div.container_monetaryshop li#search_results_tab").addClass("ui-active").show();

				txt = txt.toLowerCase();

				var results = [];

				for(var i = 0, l = this.items.length; i < l; i ++){
					var name = this.items[i].item_name.toLowerCase();
					var desc = this.items[i].item_description.toLowerCase();

					if(name.match(txt) || desc.match(txt)){
						results.push(this.items[i]);
					}
				}

				$("div.container_monetaryshop li#search_results_tab a").html("Search Results (" + yootil.number_format(results.length) + ")");

				if(results.length){
					$("div.container_monetaryshop div#search_no_results").hide();

					var results_table = $("div.container_monetaryshop table#search_results_items");

					results_table.find("tbody").empty();
					results_table.show();

					var counter = 0;
					var result_html = "";

					for(var r = 0; r < results.length; r ++){
						klass = (counter == 0)? " first" : ((counter == (results.length - 1))? " last" : "");

						result_html += '<tr class="item' + klass + '">';
						result_html += '<td style="text-align: center;"><img src="' + this.settings.base_image + results[r].item_image + '" alt="' + yootil.html_encode(results[r].item_name) + '" title="' + yootil.html_encode(results[r].item_name) + '" /></td>';
						result_html += '<td>' + results[r].item_name + '</td>';
						result_html += '<td>' + results[r].item_description + '</td>';
						result_html += '<td>' + pixeldepth.monetary.settings.money_symbol + pixeldepth.monetary.format(results[r].item_price, true) + '</td>';
						result_html += '<td style="text-align: center;"><button data-item-id="' + results[r].item_id + '">Add To Cart</button></td>';

						counter ++;
					}

					var result_items_table = $("div.container_monetaryshop table#search_results_items");

					result_items_table.find("tbody").html(result_html);
					result_items_table.find("button[data-item-id]").click(function(){
						self.add_to_cart(this, $(this).attr("data-item-id"));
					});
				} else {
					$("div.container_monetaryshop div#search_no_results").show();
					$("div.container_monetaryshop table#search_results_items").hide();
				}
			}
		},

		add_to_cart: function(button, item_id){
			if(button && this.lookup[item_id]){
				this.cart.push(item_id);
				$("div.container_monetaryshop li#basket_items_tab a").html("Basket (" + yootil.number_format(this.cart.length) + ")");

				var img = $(button).parent().parent().find("img:first");
				var clone = img.clone();

				clone.offset({

					top: img.offset().top,
					left: img.offset().left

				}).css({

					opacity: "0.5",
					position: "absolute",
					height: img.height(),
					width: img.width(),
					"z-index": 100,
					display: ""

				}).appendTo($("body")).animate({

					top: $("div.container_monetaryshop li#basket_items_tab").offset().top + 7,
					left: $("div.container_monetaryshop li#basket_items_tab").offset().left + 40,
					width: img.width() / 4,
					height: img.height() / 4

				}, {
					duration: 2500,
					easing: "easeInOutExpo",
					queue: true,
					complete: function(){
						$(this).remove();
					}
				});

				setTimeout(function(){
					var basket = $("div.container_monetaryshop li#basket_items_tab");

					basket.css("background-color", "#FCFCFC").delay(1600).queue(function(next){
						basket.css("background-color", "");
						next();
					});
				}, 1500);
			}
		},

		populate_basket_list: function(){
			var self = this;
			var counter = 0;
			var basket_html = "";
			var total = 0;

			for(var i = 0; i < this.cart.length; i ++){
				var item = self.lookup[this.cart[i]];

				klass = (counter == 0)? " first" : "";

				basket_html += '<tr class="item' + klass + '">';
				basket_html += '<td style="text-align: center;"><img src="' + this.settings.base_image + item.item_image + '" alt="' + yootil.html_encode(item.item_name) + '" title="' + yootil.html_encode(item.item_name) + '" /></td>';
				basket_html += '<td>' + item.item_name + '</td>';
				basket_html += '<td>' + item.item_description + '</td>';
				basket_html += '<td>' + pixeldepth.monetary.settings.money_symbol + pixeldepth.monetary.format(item.item_price, true) + '</td>';
				basket_html += '<td style="text-align: center;"><button data-item-id="' + item.item_id + '">Remove</button></td>';

				total += parseFloat(item.item_price);
				counter ++;
			}

			var total_html = "<tr class='item' style='height: 30px'><td colspan='5'></td></tr>";

			total_html += "<tr class='item last'><td colspan='3' style='text-align: right; font-weight: bold'>Total Amount: </td><td style='font-weight: bold'>" + pixeldepth.monetary.settings.money_symbol + "<span id='basket_total_amount'>" + pixeldepth.monetary.format(total, true) + "</span></td><td style='text-align: center'><button id='shop_checkout'>Checkout</button></td></tr>";

			var basket_items_table = $("div.container_monetaryshop table#basket_items_list");

			basket_items_table.find("tbody").html(basket_html + total_html);
			basket_items_table.find("button[data-item-id]").click(function(){
				self.remove_from_cart(this, $(this).attr("data-item-id"));
			});

			basket_items_table.find("button#shop_checkout").click(function(){
				self.checkout();
			});

			basket_items_table.show();
		},

		update_total_amount: function(){
			var total = 0;

			for(var i = 0; i < this.cart.length; i ++){
				var item = this.lookup[this.cart[i]];

				total += parseFloat(item.item_price);
			}

			$("div.container_monetaryshop span#basket_total_amount").html(pixeldepth.monetary.format(total, true));
		},

		remove_from_cart: function(button, item_id){
			var self = this;
			var index = $.inArrayLoose(item_id, this.cart);

			if(index > -1){
				this.cart.splice(index, 1);
				$(button).parent().parent().hide("slow", function(){
					$(this).remove();

					if(!self.cart.length){
						$("div.container_monetaryshop table#basket_items_list").hide();
						$("div.container_monetaryshop div#basket_no_items").show();
					} else if(self.cart.length == 1){
						$("div.container_monetaryshop table#basket_items_list tbody tr:first").addClass("first");
					}
				});

				self.update_total_amount();

				$("div.container_monetaryshop li#basket_items_tab a").html("Basket (" + yootil.number_format(this.cart.length) + ")");
			}
		},

		checkout: function(){
			console.log(1);
		}

	};

})().register();