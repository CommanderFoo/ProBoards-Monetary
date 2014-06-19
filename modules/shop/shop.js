// @TODO
// Syncing of items between windows and tabs (new sync class or rewrite of Money syncing class)

pixeldepth.monetary.shop = (function(){

	return {

		required_monetary_version: "0.7.7",

		settings: {

			enabled: true,
			icon_enabled: true,
			base_image: "",
			show_total_bought: true,
			show_bought_date: true,
			items_private: false,
			refund_percent: 50,
			no_members: [],
			no_groups: [],

			image_width: 0,
			image_height: 0,
			image_percent: 0,

			show_in_mini_profile: true,
			mini_image_width: 0,
			mini_image_height: 0,
			mini_image_percent: 0,
			mini_limit_shown: 0,

			// Gift settings

			gifts_enabled: true,
			gift_codes: [],

			text: {

				monetary_shop: "Monetary Shop",
				shop: "Shop",
				name: "Name",
				description: "Description",
				item: "Item",
				basket: "Basket",
				search: "Search",
				results: "Results",
				purchase: "Purchase",
				purchased: "Purchased",
				price: "Price",
				last_bought: "Last Bought",
				total_cost: "Total Cost",
				total_amount: "Total Amount",
				thank_you: "Thank You",
				add_to_cart: "Add To Cart",
				checkout: "Checkout",
				remove: "Remove",
				quantity: "Quantity",
				paid: "Paid",
				refund: "Refund",
				gift: "Gift"

			},

			welcome_message_enabled: false,
			welcome_message_title: "",
			welcome_message_message: ""

		},

		images: {},

		plugin: {},

		items: [],

		categories: [],
		category_lookup: {},

		category_items: {},

		cart: [],

		lookup: {},

		user_data_table: {},

		KEY: "pixeldepth_money_shop",

		gift_lookup: {},
		gift_code_lookup: [],

		init: function(){
			if(typeof yootil == "undefined"){
				return;
			}

			this.check_monetary_version();
			this.setup_user_data_table();
			this.setup();

			if(!this.settings.enabled){
				pixeldepth.monetary.show_default();
				return;
			}

			if(yootil.user.logged_in() && this.settings.icon_enabled){
				if(this.images.shop){
					yootil.bar.add("/?monetaryshop", this.images.shop, this.settings.text.shop, "pdmsshop");
				}
			}

			if(yootil.user.logged_in() && location.href.match(/\?monetaryshop$/i)){
				if(this.can_use_shop()){
					yootil.create.nav_branch(yootil.html_encode(location.href), this.settings.text.monetary_shop);
					yootil.create.page("?monetaryshop", this.settings.text.monetary_shop);

					this.build_shop_html();
				} else {
					yootil.create.nav_branch(yootil.html_encode(location.href), this.settings.text.monetary_shop + " - An Error Has Occurred");
					yootil.create.page("?monetaryshop", this.settings.text.monetary_shop + " - An Error Has Occurred");

					var html = "";

					html += "<div class='monetary-shop-notice-icon'><img src='" + pixeldepth.monetary.images.info + "' /></div>";
					html += "<div class='monetary-shop-notice-content'>You do not have permission to access the " + this.settings.text.shop + ".</div>";

					var container = yootil.create.container("An Error Has Occurred", html).show();

					container.appendTo("#content");
				}
			} else if(yootil.location.check.profile_home()){
				if(yootil.user.is_staff() || !this.settings.items_private || (this.settings.items_private && yootil.user.id() == yootil.page.member.id())){
					this.create_shop_item_box();
				}
			} else if(yootil.user.logged_in() && location.href.match(/\?monetaryshop&gift=.+?$/i)){
				this.gift();
			}

			var location_check = (yootil.location.check.search_results() || yootil.location.check.message_thread() || yootil.location.check.thread() || yootil.location.check.recent_posts());

			if(this.settings.show_in_mini_profile && location_check){
				this.show_in_mini_profile();
				yootil.ajax.after_search(this.show_in_mini_profile, this);
			}
		},

		check_monetary_version: function(){
			var versions = yootil.convert_versions(pixeldepth.monetary.version(), this.required_monetary_version);

			if(versions[0] < versions[1]){
				var msg = "<p>The Monetary System - Shop requires at least " + yootil.html_encode(this.required_monetary_version) + " of the <a href='http://support.proboards.com/thread/429360/'>Monetary System</a> plugin to function correctly.</p>";
				msg += "<p style='margin-top: 8px;'>For more information, please visit the the <a href='http://support.proboards.com'>ProBoards support forum</a>.</p>";

				var container = yootil.create.container("Monetary System - Shop", msg).show();

				$("div#content").prepend(container);
			}
		},

		setup: function(){
			if(pixeldepth.monetary.plugin){
				this.plugin = proboards.plugin.get("pixeldepth_monetary_shop");

				var settings = this.plugin.settings;

				this.images = this.plugin.images;

				if(this.plugin && this.plugin.settings){
					this.settings.enabled = (settings.shop_enabled && settings.shop_enabled == "0")? false : this.settings.enabled;
					this.settings.icon_enabled = (settings.shop_icon_enabled && settings.shop_icon_enabled == "0")? false : this.settings.icon_enabled;
					this.items = (settings.shop_items && settings.shop_items.length)? settings.shop_items : this.items;
					this.settings.base_image = (settings.item_image_base && settings.item_image_base.length)? settings.item_image_base : this.settings.base_image;
					this.settings.refund_percent = (settings.refund_percent && settings.refund_percent.length)? settings.refund_percent : this.settings.refund_amount;
					this.settings.show_total_bought = (settings.show_total_bought && settings.show_total_bought == "0")? false : this.settings.show_total_bought;
					this.settings.show_bought_date = (settings.show_bought_date && settings.show_bought_date == "0")? false : this.settings.show_bought_date;
					this.settings.items_private = (settings.items_private && settings.items_private == "1")? true : this.settings.items_private;
					this.settings.no_members = settings.no_members || [];
					this.settings.no_groups = settings.no_groups || [];

					this.settings.text.monetary_shop = (settings.txt_monetary_shop && settings.txt_monetary_shop.length)? settings.txt_monetary_shop : this.settings.text.monetary_shop;
					this.settings.text.shop = (settings.txt_shop && settings.txt_shop.length)? settings.txt_shop : this.settings.text.shop;
					this.settings.text.name = (settings.txt_name && settings.txt_name.length)? settings.txt_name : this.settings.text.name;
					this.settings.text.description = (settings.txt_description && settings.txt_description.length)? settings.txt_description : this.settings.text.description;
					this.settings.text.item = (settings.txt_item && settings.txt_item.length)? settings.txt_item : this.settings.text.item;
					this.settings.text.basket = (settings.txt_basket && settings.txt_basket.length)? settings.txt_basket : this.settings.text.basket;
					this.settings.text.search = (settings.txt_search && settings.txt_search.length)? settings.txt_search : this.settings.text.search;
					this.settings.text.results = (settings.txt_results && settings.txt_results.length)? settings.txt_results : this.settings.text.results;
					this.settings.text.purchase = (settings.txt_purchase && settings.txt_purchase.length)? settings.txt_purchase : this.settings.text.purchase;
					this.settings.text.purchased = (settings.txt_purchased && settings.txt_purchased.length)? settings.txt_purchased : this.settings.text.purchased;
					this.settings.text.price = (settings.txt_price && settings.txt_price.length)? settings.txt_price : this.settings.text.price;
					this.settings.text.last_bought = (settings.txt_last_bought && settings.txt_last_bought.length)? settings.txt_last_bought : this.settings.text.last_bought;
					this.settings.text.total_cost = (settings.txt_total_cost && settings.txt_total_cost.length)? settings.txt_total_cost : this.settings.text.total_cost;
					this.settings.text.total_amount = (settings.txt_total_amount && settings.txt_total_amount.length)? settings.txt_total_amount : this.settings.text.total_amount;
					this.settings.text.thank_you = (settings.txt_thank_you && settings.txt_thank_you.length)? settings.txt_thank_you : this.settings.text.thank_you;
					this.settings.text.add_to_cart = (settings.txt_add_to_cart && settings.txt_add_to_cart.length)? settings.txt_add_to_cart : this.settings.text.add_to_cart;
					this.settings.text.checkout = (settings.txt_checkout && settings.txt_checkout.length)? settings.txt_checkout : this.settings.text.checkout;
					this.settings.text.remove = (settings.txt_remove && settings.txt_remove.length)? settings.txt_remove : this.settings.text.remove;
					this.settings.text.quantity = (settings.txt_quantity && settings.txt_quantity.length)? settings.txt_quantity : this.settings.text.quantity;
					this.settings.text.paid = (settings.txt_paid && settings.txt_paid.length)? settings.txt_paid : this.settings.text.paid;
					this.settings.text.refund = (settings.txt_refund && settings.txt_refund.length)? settings.txt_refund : this.settings.text.refund;
					this.settings.text.gift = (settings.txt_gift && settings.txt_gift.length)? settings.txt_gift : this.settings.text.gift;

					this.settings.welcome_message_enabled = (settings.show_message && settings.show_message == "1")? true : this.settings.welcome_message_enabled;
					this.settings.welcome_message_title = (settings.welcome_title && settings.welcome_title.length)? settings.welcome_title : this.settings.welcome_message_title;
					this.settings.welcome_message_message = (settings.welcome_message && settings.welcome_message.length)? settings.welcome_message : this.settings.welcome_message_message;

					this.settings.image_width = (settings.item_img_width && settings.item_img_width.length)? settings.item_img_width : 0;
					this.settings.image_height = (settings.item_img_height && settings.item_img_height.length)? settings.item_img_height : 0;
					this.settings.image_percent = (settings.img_size_percent && settings.img_size_percent.length)? settings.img_size_percent : 0;

					this.settings.show_in_mini_profile = (settings.show_in_mini_profile == "0")? false : this.settings.show_in_mini_profile;
					this.settings.mini_image_width = (settings.mini_img_width && settings.mini_img_width.length)? settings.mini_img_width : 0;
					this.settings.mini_image_height = (settings.mini_img_height && settings.mini_img_height.length)? settings.mini_img_height : 0;
					this.settings.mini_image_percent = (settings.mini_img_percent && settings.mini_img_percent.length)? settings.mini_img_percent : 0;
					this.settings.mini_limit_shown = (settings.limit_shown && settings.limit_shown.length)? settings.limit_shown : 0;

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

					this.setup_gift_settings(settings);
					this.add_gift_to_yootil_bar();
					//this.setup_specials();
				}
			}
		},

		setup_gift_settings: function(settings){
			this.settings.gifts_enabled = (settings.gifts_enabled && settings.gifts_enabled == "0")? false : this.settings.gifts_enabled;
			this.settings.gift_codes = (settings.gift_codes && settings.gift_codes.length)? settings.gift_codes : [];

			for(var c = 0, l = this.settings.gift_codes.length; c < l; c ++){
				this.gift_lookup[this.settings.gift_codes[c].unique_code.toLowerCase()] = {
					code: this.settings.gift_codes[c].unique_code.toLowerCase(),
					item_id: this.settings.gift_codes[c].item_id,
					quantity: this.settings.gift_codes[c].quantity,
					message: this.settings.gift_codes[c].message,
					members: this.settings.gift_codes[c].members,
					groups: this.settings.gift_codes[c].groups,
					show_icon: (this.settings.gift_codes[c].show_gift_icon && this.settings.gift_codes[c].show_gift_icon == "0")? false : true
				};

				this.gift_code_lookup.push(this.settings.gift_codes[c].unique_code.toLowerCase());
			}
		},

		safe_id: function(id){
			return id.toString().replace(/\D+/g, "");
		},

		can_use_shop: function(){
			if(this.settings.no_members.length){
				if($.inArrayLoose(yootil.user.id(), this.settings.no_members) > -1){
					return false;
				}
			}

			if(this.settings.no_groups.length){
				var user_groups = yootil.user.group_ids();

				for(var g = 0, l = user_groups.length; g < l; g ++){
					if($.inArrayLoose(user_groups[g], this.settings.no_groups) > -1){
						return false;
					}
				}
			}

			return true;
		},

		data: function(user_id){
			var user_data = this.user_data_table[((user_id)? user_id : yootil.user.id())];

			if(!user_data){
				user_data = new this.Data(user_id);
				this.user_data_table[user_id] = user_data;
			}

			return user_data;
		},

		setup_user_data_table: function(){
			var all_data = proboards.plugin.keys.data[this.KEY];

			for(var key in all_data){
				this.user_data_table[key] = new this.Data(key, all_data[key]);
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

		has_items: function(){
			var user_id = yootil.page.member.id() || yootil.user.id();
			var items = this.data(user_id).get.items();

			for(var key in items){
				if(this.lookup[key]){
					return true;
				}
			}

			return false;
		},

		get_size_css: function(mini){
			if(mini){
				if(this.settings.mini_image_width > 0 && this.settings.mini_image_height > 0){
					return 'style="height: ' + this.settings.mini_image_height + 'px; width: ' + this.settings.mini_image_width + 'px;"';
				}
			} else {
				if(this.settings.image_width > 0 && this.settings.image_height > 0){
					return ' style="height: ' + this.settings.image_height + 'px; width: ' + this.settings.image_width + 'px;"';
				}
			}

			return "";
		},

		create_shop_item_box: function(){
			if(!this.has_items()){
				return;
			}

			var box = yootil.create.profile_content_box();
			var first_box = $("form.form_user_status .content-box:first");
			var using_custom = false;

			if($("#monetary_shop_items").length){
				first_box = $("#monetary_shop_items");
				using_custom = true;
			}

			if(first_box.length){
				var items_html = "";
				var user_id = yootil.page.member.id() || yootil.user.id();
				var items = this.data(user_id).get.items();
				var time_24 = (yootil.user.time_format() == "12hr")? false : true;
				var img_size = this.get_size_css();

				for(var key in items){
					var num = "";
					var date_str = "";

					if(this.settings.show_bought_date){
						var date = new Date(items[key].t * 1000);
						var day = date.getDate() || 1;
						var month = pixeldepth.monetary.months[date.getMonth()];
						var year = date.getFullYear();
						var hours = date.getHours();
						var mins = date.getMinutes();

						date_str = pixeldepth.monetary.days[date.getDay()] + " " + day + pixeldepth.monetary.get_suffix(day) + " of " + month + ", " + year + " at ";
						var am_pm = "";

						mins = (mins < 10)? "0" + mins : mins;

						if(!time_24){
							am_pm = (hours > 11)? "pm" : "am";
							hours = hours % 12;
							hours = (hours)? hours : 12;
						}

						date_str += hours + ":" + mins + am_pm;

						date_str = " (" + this.settings.text.last_bought + ": " + date_str + ")";
					}

					if(items[key].q > 1 && this.settings.show_total_bought){
						num = '<span class="shop_item">';
						num += '<img class="shop_item_x" src="' + this.images.x + '" />';

						if(items[key].q >= 99){
							num += 	'<img class="shop_item_num" src="' + this.images["9"] + '" /><img class="shop_item_num shop_item_num_last" src="' + this.images["9"] + '" />';
						} else {
							var str = items[key].q.toString();

							for(var s = 0; s < str.length; s ++){
								var klass = (s > 0)? " shop_item_num_last" : "";

								num += 	'<img class="shop_item_num' + klass + '" src="' + this.images[str.substr(s, 1)] + '" />';
							}
						}

						num += '</span>';
					}

					if(this.lookup[key]){
						items_html += '<div data-shop-item-id="' + this.lookup[key].item_id + '" title="' + yootil.html_encode(this.lookup[key].item_name) + date_str + '" class="shop_items_list"><img src="' + this.settings.base_image + this.lookup[key].item_image + '"' + img_size + ' />' + num + '</div>';
					}
				}

				if(using_custom){
					first_box.addClass("monetary_shop_profile_box").show().html(items_html);
				} else {
					box.addClass("monetary_shop_profile_box");
					box.html(items_html);

					if(yootil.user.id() == yootil.page.member.id()){
						box.insertAfter(first_box);
					} else {
						box.insertBefore(first_box);
					}
				}

				if(parseInt(this.settings.image_percent) > 0){
					var self = this;

					$(".shop_items_list").each(function(){
						$(this).find("img:first").bind("load", function(){
							var width = this.width;
							var height = this.height;

							this.width = width * (parseInt(self.settings.image_percent) / 100);
							this.height = height * (parseInt(self.settings.image_percent) / 100);
						});
					});
				}

				this.bind_refundable_dialog();
			}
		},

		update_item_count: function(item_id, quantity){
			if(!this.settings.show_total_bought){
				return;
			}

			var item = $(".shop_items_list[data-shop-item-id='" + this.safe_id(item_id) + "'] .shop_item");

			if(item){
				item.empty();

				var num = "";

				if(quantity > 1){
					num += '<img class="shop_item_x" src="' + this.images.x + '" />';

					if(quantity >= 99){
						num += 	'<img class="shop_item_num" src="' + this.images["9"] + '" /><img class="shop_item_num shop_item_num_last" src="' + this.images["9"] + '" />';
					} else {
						var str = quantity.toString();

						for(var s = 0; s < str.length; s ++){
							var klass = (s > 0)? " shop_item_num_last" : "";

							num += 	'<img class="shop_item_num' + klass + '" src="' + this.images[str.substr(s, 1)] + '" />';
						}
					}
				}

				item.html(num);
			}
		},

		build_item_info_dialog: function(item_elem){
			var self = this;
			var owner = yootil.page.member.id() || yootil.user.id();
			var item_id = this.safe_id($(item_elem).attr("data-shop-item-id"));
			var bought_item = self.data(owner).get.item(item_id);
			var shop_item = self.lookup[item_id];

			if(!shop_item){
				return;
			}

			var msg = "";

			msg += "<div>";

			msg += "<div class='item_info_img'><img src='" + self.settings.base_image + shop_item.item_image + "' /></div>";
			msg += "<div class='item_info_info'>";

			msg += "<p><strong>" + self.settings.text.item + " " + self.settings.text.name + ":</strong> " + shop_item.item_name + "</p>";
			msg += "<p><strong>" + self.settings.text.quantity + ":</strong> <span id='shop_item_quantity'>" + bought_item.q + "</span></p>";
			msg += "<p><strong>" + self.settings.text.price + " " + self.settings.text.paid + ":</strong> " + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(bought_item.p, true)) + "</p>";
			msg += "<p><strong>" + self.settings.text.total_cost + ":</strong> <span id='shop_item_total_cost'>" + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(bought_item.p * bought_item.q, true)) + "</span></p>";

			if(self.settings.show_bought_date){
				var time_24 = (yootil.user.time_format() == "12hr")? false : true;
				var date_str = "";
				var date = new Date(bought_item.t * 1000);
				var day = date.getDate() || 1;
				var month = pixeldepth.monetary.months[date.getMonth()];
				var year = date.getFullYear();
				var hours = date.getHours();
				var mins = date.getMinutes();

				date_str = pixeldepth.monetary.days[date.getDay()] + " " + day + pixeldepth.monetary.get_suffix(day) + " of " + month + ", " + year + " at ";

				var am_pm = "";

				mins = (mins < 10)? "0" + mins : mins;

				if(!time_24){
					am_pm = (hours > 11)? "pm" : "am";
					hours = hours % 12;
					hours = (hours)? hours : 12;
				}

				date_str += hours + ":" + mins + am_pm;
				msg += "<p><strong>" + self.settings.text.last_bought + ": </strong>" + date_str + "</p>";
			}

			msg += "<p class='item_info_desc'>" + pb.text.nl2br(shop_item.item_description) + "</p>";

			msg += "</div>";
			msg += "</div>";

			var info_buttons = {

				"Close": function(){
					$(this).dialog("close");
				}

			};

			if(shop_item.item_refundable == "1" && yootil.user.id() == owner){
				var refund_buttons = {

					"Close": function(){
						$(this).dialog("close");
					}

				};

				refund_buttons["Accept " + self.settings.text.refund] = this.build_refund_dialog(item_id);

				info_buttons[self.settings.text.refund] = function(){
					proboards.dialog("monetaryshop-item-refund-dialog", {
						modal: true,
						height: 220,
						width: 350,
						title: self.settings.text.refund,
						html: self.build_refund_msg(item_id),
						resizable: false,
						draggable: false,
						buttons: refund_buttons
					});
				};
			}

			var refund_txt = "";

			if(yootil.user.id() == owner){
				refund_txt = (shop_item.item_refundable == "1")? "" : " (Not Refundable)";
			}

			proboards.dialog("monetaryshop-item-info-dialog", {
				modal: true,
				height: 320,
				width: 600,
				title: shop_item.item_name + refund_txt,
				html: msg,
				resizable: false,
				draggable: false,
				buttons: info_buttons

			});

		},

		build_refund_msg: function(item_id){
			var self = this;
			var item_counter = 0;
			var refund_msg = "<strong>" + self.settings.text.quantity + " to " + self.settings.text.refund.toLowerCase() + ":</strong> ";
			var	bought_item = self.data(yootil.user.id()).get.item(item_id);
			var one_refund = (parseFloat(bought_item.p) * (self.settings.refund_percent / 100)) * 1;

			refund_msg += "<select id='shop_item_refund_quantity'>";

			while(item_counter < bought_item.q){
				item_counter ++;
				refund_msg += "<option value='" + item_counter + "'> " + item_counter + " </option>";
			}

			refund_msg += "</select>";
			refund_msg += "<br /><br /><span id='shop_item_refund_total_back'><strong>" + self.settings.text.refund + ":</strong> " + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(one_refund, true))) + " (" + self.settings.refund_percent + "%)</span>";
			refund_msg = $("<div>" + refund_msg + "</div>");

			refund_msg.find("select").change(function(){
				var selected_quantity = parseInt(this.value);
				var refund_amount = (parseFloat(bought_item.p) * (self.settings.refund_percent / 100)) * selected_quantity;

				$("#shop_item_refund_total_back").html("<strong>" + self.settings.text.refund + "</strong>: " + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(refund_amount, true))) + " (" + self.settings.refund_percent + "%)");
			});

			return refund_msg;
		},

		build_refund_dialog: function(item_id){
			var self = this;

			return function(){
				var refund_quantity = parseInt($("#shop_item_refund_quantity option:selected").val());
				var bought_item = self.data(yootil.user.id()).get.item(item_id);

				if(refund_quantity <= bought_item.q){
					var amount = (parseFloat(bought_item.p) * (self.settings.refund_percent / 100)) * refund_quantity;
					var info_dialog = $("#monetaryshop-item-info-dialog");

					self.data(yootil.user.id()).refund.item(item_id, refund_quantity);
					pixeldepth.monetary.data(yootil.user.id()).increase.money(amount, false, null, true);

					// Update wallet & profile money

					var user_money = pixeldepth.monetary.data(yootil.user.id()).get.money(true);

					$(".pd_money_amount_" + yootil.user.id()).text(yootil.number_format(user_money));

					var wallet = $("#pd_money_wallet_amount");

					if(wallet.length){
						wallet.text(yootil.number_format(user_money));
					}

					var other_wallet = $(".money_wallet_amount");

					if(other_wallet.length){
						other_wallet.html(pixeldepth.monetary.settings.text.wallet + pixeldepth.monetary.settings.money_separator + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(user_money));
					}

					bought_item = self.data(yootil.user.id()).get.item(item_id);

					if(!bought_item){
						var item_elem = $(".shop_items_list[data-shop-item-id='" + self.safe_id(item_id) + "']");

						item_elem.hide("slow", function(){
							item_elem.remove();
						});

						info_dialog.dialog("close");

						if(!$(".shop_items_list").length){
							$(".monetary_shop_profile_box").hide();
						}
					} else {
						info_dialog.find("span#shop_item_quantity").html(bought_item.q);
						info_dialog.find("span#shop_item_total_cost").html(pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(bought_item.q * bought_item.p, true))));
						self.update_item_count(item_id, bought_item.q);

					}
				} else {
					self.error("Could not issue refund");
				}

				$(this).dialog("destroy").remove();
			};
		},

		error: function(){
			proboards.alert("An Error Has Occurred", msg, {
				modal: true,
				height: 220,
				width: 400,
				resizable: false,
				draggable: false
			});
		},

		bind_refundable_dialog: function(){
			var self = this;

			$("div[data-shop-item-id]").click(function(){
				self.build_item_info_dialog(this);
			});
		},

		build_shop_html: function(){
			var self = this;
			var title = '<div>';

			title += '<div style="float: left">' + this.settings.text.monetary_shop + '</div>';
			title += '<div style="float: right" id="pd_money_wallet">' + pixeldepth.monetary.settings.text.wallet + ': ' + pixeldepth.monetary.settings.money_symbol + '<span id="pd_money_wallet_amount">' + yootil.html_encode(pixeldepth.monetary.data(yootil.user.id()).get.money(true)) + '</span></div>';

			title += '</div><br style="clear: both" />';

			var html = "";
			var div_counter = 0;

			html += this.create_shop_tabs();

			for(var key in this.category_items){
				var cat_id = parseInt(key);

				html += '<div id="item_category_' + cat_id + '"' + ((div_counter != 0)? ' style="display: none;"' : '') + '>';
				html += '<table class="list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th style="width: 78%" class="main">' + this.settings.text.description + '</th><th style="width: 110px">' + this.settings.text.price + '</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content">';

				var counter = 0;

				for(var i = 0; i < this.category_items[key].length; i ++){
					klass = (counter == 0)? " first" : ((counter == (this.category_items.length - 1))? " last" : "");

					html += '<tr class="item' + klass + '">';
					html += '<td style="text-align: center;"><img src="' + this.settings.base_image + this.category_items[key][i].item_image + '" alt="' + yootil.html_encode(this.category_items[key][i].item_name) + '" title="' + yootil.html_encode(this.category_items[key][i].item_name) + '" /></td>';
					html += '<td>' + this.category_items[key][i].item_name + '</td>';
					html += '<td>' + pb.text.nl2br(this.category_items[key][i].item_description) + '</td>';
					html += '<td>' + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(this.category_items[key][i].item_price, true)) + '</td>';
					html += '<td style="text-align: center;"><button data-item-id="' + this.category_items[key][i].item_id + '">' + this.settings.text.add_to_cart + '</button></td>';

					counter ++;
				}

				html += '</tbody></table></div>';
				div_counter ++;
			}

			html += '<div id="search_results" style="display: none;">';
			html += '<div id="search_no_results" style="display: none; text-align: center; padding: 5px;">No ' + this.settings.text.item.toLowerCase() + 's were found.</div>';
			html += '<table style="display: none" class="list" id="search_results_items"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th style="width: 78%" class="main">' + this.settings.text.description + '</th><th style="width: 110px">' + this.settings.text.price + '</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content"></tbody></table></div>';

			html += '<div id="basket_items" style="display: none;">';
			html += '<div id="basket_no_items" style="display: none; text-align: center; padding: 5px;">You have no items in your ' + this.settings.text.basket.toLowerCase() + '</div>';
			html += '<table style="display: none" class="list" id="basket_items_list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th style="width: 22%">' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th style="width: 78%" class="main">' + this.settings.text.description + '</th><th style="width: 110px">' + this.settings.text.price + '</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content"></tbody></table></div>';

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

			if(this.settings.welcome_message_enabled){
				var welcome_container = yootil.create.container(this.settings.welcome_message_title, pb.text.nl2br(this.settings.welcome_message_message)).show();

				welcome_container.appendTo("#content");
			}

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

			html += '<li style="float: right"><div class="ui-search" style="padding: 3px 10px 0px 4px;"><input width="90px" style="height: 17px" type="text" class="search-input" maxlength="50" placeholder="' + this.settings.text.search + ' ' + this.settings.text.shop + '..." role="search" accesskey="w" id="search_field"><span style="height: 16px" class="search-filters-button"><span class="icon"><img src="//images.proboards.com/v5/images/icon-search-filters.png"></span></span></div></li>';

			html += '<li style="float: right; margin-right: 10px" id="basket_items_tab"><a href="#">' + this.settings.text.basket + ' (0)</a></li>';
			html += '<li style="float: right; margin-right: 10px; display: none;" id="search_results_tab"><a href="#">' + this.settings.text.search + ' ' + this.settings.text.results + ' (0)</a></li>';

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

				$("div.container_monetaryshop li#search_results_tab a").html(this.settings.text.search + " " + this.settings.text.results + " (" + yootil.number_format(results.length) + ")");

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
						result_html += '<td>' + pb.text.nl2br(results[r].item_description) + '</td>';
						result_html += '<td>' + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(results[r].item_price, true)) + '</td>';
						result_html += '<td style="text-align: center;"><button data-item-id="' + results[r].item_id + '">' + this.settings.text.add_to_cart + '</button></td>';

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
				$("div.container_monetaryshop li#basket_items_tab a").html(this.settings.text.basket + " (" + yootil.number_format(this.cart.length) + ")");

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
				basket_html += '<td>' + pb.text.nl2br(item.item_description) + '</td>';
				basket_html += '<td>' + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(item.item_price, true)) + '</td>';
				basket_html += '<td style="text-align: center;"><button data-item-id="' + item.item_id + '">' + this.settings.text.remove + '</button></td>';

				total += parseFloat(item.item_price);
				counter ++;
			}

			var total_html = "<tr class='item' style='height: 30px'><td colspan='5'></td></tr>";

			total_html += "<tr class='item last'><td colspan='3' style='text-align: right; font-weight: bold'>" + this.settings.text.total_amount + ": </td><td style='font-weight: bold'>" + pixeldepth.monetary.settings.money_symbol + "<span id='basket_total_amount'>" + yootil.number_format(pixeldepth.monetary.format(total, true)) + "</span></td><td style='text-align: center'><button id='shop_checkout'>" + this.settings.text.checkout + "</button></td></tr>";

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

			$("div.container_monetaryshop span#basket_total_amount").html(yootil.number_format(pixeldepth.monetary.format(total, true)));
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

				$("div.container_monetaryshop li#basket_items_tab a").html(self.settings.text.basket + " (" + yootil.number_format(this.cart.length) + ")");
			}
		},

		checkout: function(){
			var self = this;
			var users_money = parseFloat(pixeldepth.monetary.data(yootil.user.id()).get.money());
			var total = 0;

			for(var i = 0; i < this.cart.length; i ++){
				var item = this.lookup[this.cart[i]];

				total += parseFloat(item.item_price);
			}

			if(total > users_money){
				var msg = "You do not have enough money to pay for the " + this.settings.text.item + "s in your " + this.settings.text.basket.toLowerCase() + ".<br /><br />";

				msg += this.settings.text.total_amount + ": <strong>" + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(total, true))) + "</strong><br /><br />";
				msg += "You need <strong>" + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(total - users_money, true))) + "</strong> more in your " + pixeldepth.monetary.settings.text.wallet + ", then you can " + this.settings.text.checkout.toLowerCase() + ".";

				proboards.alert("Not Enough Money", msg, {
					modal: true,
					height: 220,
					width: 500,
					resizable: false,
					draggable: false
				});
			} else {
				var msg = "Are you sure you want to " + this.settings.text.purchase.toLowerCase() + " the following " + this.settings.text.item + "s?<br /><br />";
				var grouped_items = {};
				var total_items = 0;

				for(var i = 0; i < this.cart.length; i ++){
					if(grouped_items[this.cart[i]]){
						grouped_items[this.cart[i]].quantity ++;
					} else {
						grouped_items[this.cart[i]] = {

							quantity: 1

						};
					}
				}

				msg += this.settings.text.total_amount + ": <strong>" + pixeldepth.monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(pixeldepth.monetary.format(total, true))) + "</strong><br /><br />";

				msg += '<table class="list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th>' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th>' + this.settings.text.quantity + '</th><th>' + this.settings.text.item + ' ' + this.settings.text.price + '</th><th>' + this.settings.text.total_cost + '</th></tr></thead><tbody class="list-content">';

				for(var key in grouped_items){
					var item = this.lookup[key];

					total_items ++;

					msg += "<tr class='item'>";
					msg += "<td style='width: 130px;' class='monetaryshop_item_img'><img src='" + this.settings.base_image + item.item_image + "' /></td>";
					msg += "<td>" + item.item_name + "</td>";
					msg += "<td style='width: 80px;'>" + grouped_items[key].quantity + "</td>";
					msg += "<td>" + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(item.item_price, true)) + "</td>";
					msg += "<td>" + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(item.item_price * grouped_items[key].quantity, true)) + "</td>";
					msg += "</tr>";
				}

				msg + "</tbody></table>";

				var plu = (total_items == 1)? "" : "s";
				var title = "Confirm " + this.settings.text.purchase + plu;
				var buttons = {

					Cancel: function(){
						$(this).dialog("close");
					}

				};

				buttons[this.settings.text.purchase] = function(){
					var total = 0;

					for(var key in grouped_items){
						var item = self.lookup[key];

						self.data(yootil.user.id()).add.item({

							id: key,
							quantity: grouped_items[key].quantity,
							price: item.item_price,
							time: ((+ new Date()) / 1000)

						}, true);

						total += item.item_price * grouped_items[key].quantity;
					}

					self.cart = [];
					self.data(yootil.user.id()).update();
					pixeldepth.monetary.data(yootil.user.id()).decrease.money(total, false, null, true);

					var wallet = $("#pd_money_wallet_amount");

					if(wallet.length){
						wallet.text(yootil.number_format(pixeldepth.monetary.data(yootil.user.id()).get.money(true)));
					}

					$("div.container_monetaryshop div#basket_items_list tbody").empty();
					$("div.container_monetaryshop table#basket_items_list").hide();
					$("div.container_monetaryshop div#basket_no_items").show();
					$("div.container_monetaryshop li#basket_items_tab a").html("Basket (0)");

					var msg = "Your item was successfully purchased.<br /><br />You can view your " + self.settings.text.purchased + " " + self.settings.text.item + " from the profile page <a href='/user/" + yootil.user.id() + "/'>here</a>.";

					if(total_items > 1){
						msg = "Your " + self.settings.text.item + "s were successfully " + self.settings.text.purchased + ".<br /><br />You can view your " + self.settings.text.purchased + " " + self.settings.text.item + "s from the profile page <a href='/user/" + yootil.user.id() + "/'>here</a>.";
					}

					$(this).dialog("close");

					proboards.dialog("monetaryshop-thanks-dialog", {
						modal: true,
						height: 200,
						width: 460,
						title: "Thank You",
						html: msg,
						resizable: false,
						draggable: false,
						buttons: {

							"Close": function(){
								$(this).dialog("close");
							}

						}

					});

				};

				var confirm = proboards.dialog("monetaryshop-buy-dialog", {
					modal: true,
					height: 380,
					width: 650,
					title: title,
					html: msg,
					resizable: false,
					draggable: false,

					buttons: buttons

				});
			}
		},

		gift: function(){
			if(!this.settings.gifts_enabled){
				pixeldepth.monetary.show_default();
				return;
			}

			var has_error = true;
			var code = this.get_gift_code();
			var gift = this.valid_code(code);

			if(code && gift && gift.item_id && this.lookup[gift.item_id]){
				if(!this.has_received(code) && this.allowed_gift(gift)){
					has_error = false;

					var html = "";

					html += "<div class='monetary-gift-notice-icon'><img src='" + this.images.gift_big + "' /></div>";
					html += "<div class='monetary-gift-notice-content'><div class='monetary-gift-notice-content-top'><p>You have recieved a " + this.settings.text.gift.toLowerCase() + " " + this.settings.text.item.toLowerCase() + ".</p>";

					if(gift.message.length){
						html += "<p>" + gift.message.replace(/\n/g, "<br />") + "</p>";
					}

					html+= "</div>";

					html += "<p class='monetary-gift-notice-content-accept'>Do you want to accept this " + this.settings.text.gift.toLowerCase() + "?  <button>Yes</button></p></div><br style='clear: both' />";

					var container = yootil.create.container("You Have Received A " + this.settings.text.gift + " " + this.settings.text.item, html).show();
					var self = this;

					container.find("button").click(function(){
						if(self.collect_gift()){
							var msg = "";

							msg += "<p>You have successfully received the " + self.settings.text.gift.toLowerCase() + " " + self.settings.text.item.toLowerCase() + ".</p>";

							$(".monetary-gift-notice-content").html(msg);

							yootil.bar.remove("giftitem_" + gift.code);

							var item_id = gift.item_id;
							var shop_item = self.lookup[item_id];
							var msg = "";

							msg += "<div>";

							msg += "<div class='item_info_img'><img src='" + self.settings.base_image + shop_item.item_image + "' /></div>";
							msg += "<div class='item_info_info'>";

							msg += "<p><strong>" + self.settings.text.item + " " + self.settings.text.name + ":</strong> " + shop_item.item_name + "</p>";
							msg += "<p><strong>" + self.settings.text.quantity + ":</strong> <span id='shop_item_quantity'>" + gift.quantity + "</span></p>";
							msg += "<p><strong>" + self.settings.text.item + " " + self.settings.text.price + ":</strong> " + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(shop_item.item_price, true)) + "</p>";
							msg += "<p class='item_info_desc'>" + pb.text.nl2br(shop_item.item_description) + "</p>";

							msg += "</div>";
							msg += "</div>";

							proboards.dialog("monetaryshop-item-info-dialog", {
								modal: true,
								height: 280,
								width: 500,
								title: "You received the following " + self.settings.text.item.toLowerCase(),
								html: msg,
								resizable: false,
								draggable: false,
								buttons: {

									"Close": function(){
										$(this).dialog("close");
									}

								}

							});
						} else {
							proboards.alert("An Error Occurred", "Could not collect " + this.settings.text.gift.toLowerCase() + " " + this.settings.text.item.toLowerCase() + ".", {
								modal: true,
								resizable: false,
								draggable: false
							});
						}
					});

					container.appendTo("#content");
				}
			}

			if(has_error){
				var html = "";

				html += "<div class='monetary-gift-notice-icon'><img src='" + this.images.gift_big + "' /></div>";
				html += "<div class='monetary-gift-notice-content'><p>The gift code you are trying to access either isn't for you, doesn't exist, or you have already accepted.</p><p>If you think this is an error, please contact a member of staff quoting <strong>\"" + yootil.html_encode(code) + "</strong>\".</p></div>";

				var container = yootil.create.container("An Error Has Occurred", html).show();

				container.appendTo("#content");
			}
		},

		allowed_gift: function(gift){
			if(gift){

				// Check if this is for everyone

				if(!gift.members.length && !gift.groups.length){
					return true;
				} else {

					// Check members first, this overrides groups

					if($.inArrayLoose(yootil.user.id(), gift.members) > -1){
						return true;
					}

					// Now check the group

					var user_groups = yootil.user.group_ids();

					for(var g = 0, l = user_groups.length; g < l; g ++){
						if($.inArrayLoose(user_groups[g], gift.groups) > -1){
							return true;
						}
					}
				}
			}

			return false;
		},


		add_gift_to_yootil_bar: function(){
			if(!this.settings.gifts_enabled){
				return;
			}

			for(var key in this.gift_lookup){
				if(this.gift_lookup[key].show_icon){
					if(!this.has_received(key) && this.allowed_gift(this.gift_lookup[key])){
						yootil.bar.add("/?monetaryshop&gift=" + key, this.images.gift, "Gift Item", "giftitem_" + key);
					}
				}
			}
		},

		has_received: function(code){
			if($.inArrayLoose(code, this.data(yootil.user.id()).get.gifts()) != -1){
				return true;
			}

			return false;
		},

		get_gift_code: function(){
			var url = location.href;

			if(location.href.match(/\?monetaryshop&gift=(\w+)/i)){
				return RegExp.$1.toLowerCase();
			}

			return false;
		},

		valid_code: function(code){
			if(code){
				if(this.gift_lookup[code]){
					this.current_code = code;

					return this.gift_lookup[code];
				}
			}

			return false;
		},

		collect_gift: function(){
			var gift = this.gift_lookup[this.current_code];

			if(this.current_code && gift){
				var item = this.lookup[gift.item_id];

				this.data(yootil.user.id()).push.gift(this.current_code, true);
				this.data(yootil.user.id()).add.item({

					id: gift.item_id,
					quantity: gift.quantity,
					price: item.item_price,
					time: ((+ new Date()) / 1000)

				});

				this.remove_old_codes();

				return true;
			}

			return false;
		},

		remove_old_codes: function(){
			if(!this.settings.gift_codes.length){
				this.data(yootil.user.id()).clear.gifts();

				return;
			}

			var gifts = this.data(yootil.user.id()).get.gifts();
			var len = gifts.length;

			while(len --){
				if(!this.gift_lookup[gifts[len]]){
					gifts.splice(len, 1);
				}
			}

			this.data(yootil.user.id()).set.gifts(gifts);
		},

		show_in_mini_profile: function(){
			var minis = $("div.mini-profile");

			if(minis && minis.length){
				if(minis.find("div.info div[class*=pd_shop_]").length){
					return;
				}

				var self = this;
				var time_24 = (yootil.user.time_format() == "12hr")? false : true;
				var img_size = this.get_size_css();

				minis.each(function(){
					var user_link = $(this).find("a.user-link[href*='user']:first");

					if(user_link && user_link.length){
						var user_id_match = user_link.attr("href").match(/\/user\/(\d+)\/?/i);

						if(user_id_match && user_id_match.length == 2){
							var user_id = parseInt(user_id_match[1]);

							if(!user_id){
								return;
							}

							var items = self.data(user_id).get.items();
							var str = "";

							var counter = 0;

							for(var key in items){
								if(self.settings.mini_limit_shown != 0 && counter >= self.settings.mini_limit_shown){
									break;
								}

								if(self.lookup[key]){
									str += '<span class="pd_shop_mini_item" data-shop-item-id="' + self.lookup[key].item_id + '" title="' + yootil.html_encode(self.lookup[key].item_name) + ' (x' + items[key].q + ')"><img src="' + self.settings.base_image + self.lookup[key].item_image + '"' + img_size + ' /></span>';

									counter ++;
								}
							}

							var custom = $(this).find(".monetary_shop_items");

							if(custom.length){
								custom.append($(str));
							} else {
								var info = $(this).find("div.info");

								str = "<br /><div class='monetary_shop_items pd_shop_items_" + user_id + "'>" + str + "</div>";

								if(info.length){
									$(str).insertAfter(info);
								} else {
									$(this).append($(str));
								}
							}

							if(parseInt(self.settings.mini_image_percent) > 0){
								$(this).find(".monetary_shop_items span[data-shop-item-id] img").bind("load", function(){
									var width = this.width;
									var height = this.height;

									this.width = width * (parseInt(self.settings.mini_image_percent) / 100);
									this.height = height * (parseInt(self.settings.mini_image_percent) / 100);
								});
							}
						}
					}
				});
			}
		}

	};

})().register();