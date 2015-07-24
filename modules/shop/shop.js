/**
 * @class monetary.shop
 * @static
 *
 * Creates a shop on the forum so that members can purchase items.
 */

monetary.shop = (function(){

	return {

		/**
		 * @property {String} required_monetary_version The minimum version required of the Monetary System.
		 */

		required_monetary_version: "0.8.6",

		/**
		 * @property {String} VERSION Current version.
		 */

		VERSION: "{VER}",

		/**
		 * @property {Object} settings Default settings for the shop, these get overwritten in setup.
		 */

		settings: {

			enabled: true,
			icon_enabled: true,
			base_image: "",
			show_total_bought: true,
			items_private: false,
			refund_percent: 50,
			allow_removing: false,
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
			
			show_quantity_drop_down: false,

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
				accept: "Accept"

			},

			welcome_message_enabled: false,
			welcome_message_title: "",
			welcome_message_message: "",
			
			random_image: null

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

		modules: [],
		
		random_id_pool: {},

		init: function(){
			if(typeof yootil == "undefined"){
				return;
			}

			this.check_monetary_version();
			this.setup_user_data_table();
			this.setup();

			if(!this.settings.enabled){
				monetary.show_default();
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

					html += "<div class='monetary-shop-notice-icon'><img src='" + monetary.images.info + "' /></div>";
					html += "<div class='monetary-shop-notice-content'>You do not have permission to access the " + this.settings.text.shop + ".</div>";

					var container = yootil.create.container("An Error Has Occurred", html).show();

					container.appendTo("#content");
				}
			} else if(yootil.location.profile_home()){
				if(yootil.user.is_staff() || !this.settings.items_private || (this.settings.items_private && yootil.user.id() == yootil.page.member.id())){
					this.create_shop_item_box();
				}
			}

			var location_check = (yootil.location.search_results() || yootil.location.message_thread() || yootil.location.thread() || yootil.location.recent_posts());

			if(this.settings.show_in_mini_profile && location_check){
				this.show_in_mini_profile();
				yootil.ajax.after_search(this.show_in_mini_profile, this);
			}

			if(this.modules.length){
				for(var m = 0, ml = this.modules.length; m < ml; m ++){
					if(this.modules[m].init){
						this.modules[m].init();
					}
				}
			}
		},

		version: function(){
			return this.VERSION;
		},
		
		check_monetary_version: function(){
			var versions = yootil.convert_versions(monetary.version(), this.required_monetary_version);

			if(versions[0] < versions[1]){
				var msg = "<p>The Monetary System - Shop requires at least " + yootil.html_encode(this.required_monetary_version) + " of the <a href='http://support.proboards.com/thread/429360/'>Monetary System</a> plugin to function correctly.</p>";
				msg += "<p style='margin-top: 8px;'>For more information, please visit the the <a href='http://support.proboards.com'>ProBoards support forum</a>.</p>";

				var container = yootil.create.container("Monetary System - Shop", msg).show();

				$("div#content").prepend(container);
			}
		},

		setup: function(){
			if(monetary.plugin){
				this.plugin = pb.plugin.get("pixeldepth_monetary_shop");

				var settings = this.plugin.settings;

				this.images = this.plugin.images;

				if(this.plugin && this.plugin.settings){
					this.settings.enabled = (!! ~~ settings.shop_enabled)? true : false;
					this.settings.icon_enabled = (!! ~~ settings.shop_icon_enabled)? true : false;
					this.items = (settings.shop_items && settings.shop_items.length)? settings.shop_items : this.items;
					this.settings.base_image = (settings.item_image_base && settings.item_image_base.length)? settings.item_image_base : this.settings.base_image;
					this.settings.refund_percent = (settings.refund_percent && settings.refund_percent.length)? settings.refund_percent : this.settings.refund_amount;
					this.settings.show_total_bought = (!! ~~ settings.show_total_bought)? true : false;
					this.settings.items_private = (!! ~~ settings.items_private)? true : false;
					this.settings.allow_removing = (!! ~~ settings.allow_removing)? true : false;
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
					this.settings.text.accept = (settings.txt_accept && settings.txt_accept.length)? settings.txt_accept : this.settings.text.accept;

					this.settings.welcome_message_enabled = (!! ~~ settings.show_message)? true : false;
					this.settings.welcome_message_title = (settings.welcome_title && settings.welcome_title.length)? settings.welcome_title : this.settings.welcome_message_title;
					this.settings.welcome_message_message = (settings.welcome_message && settings.welcome_message.length)? settings.welcome_message : this.settings.welcome_message_message;

					this.settings.image_width = (settings.item_img_width && settings.item_img_width.length)? settings.item_img_width : 0;
					this.settings.image_height = (settings.item_img_height && settings.item_img_height.length)? settings.item_img_height : 0;
					this.settings.image_percent = (settings.img_size_percent && settings.img_size_percent.length)? settings.img_size_percent : 0;

					this.settings.show_in_mini_profile = (!! ~~ settings.show_in_mini_profile)? true : false;
					this.settings.mini_image_width = (settings.mini_img_width && settings.mini_img_width.length)? settings.mini_img_width : 0;
					this.settings.mini_image_height = (settings.mini_img_height && settings.mini_img_height.length)? settings.mini_img_height : 0;
					this.settings.mini_image_percent = (settings.mini_img_percent && settings.mini_img_percent.length)? settings.mini_img_percent : 0;
					this.settings.mini_limit_shown = (!! ~~ settings.limit_shown)? (~~ settings.limit_shown) : 0;

					this.settings.show_quantity_drop_down = (!! ~~ settings.show_quantity_select)? true : false;

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
					
					// Support for extra items
					// Current we support 3 extra plugins, but it does allow for more
					
					var extra_items_plugin_1 = proboards.plugin.get("monetary_shop_extra_items_1");
					
					if(extra_items_plugin_1 && extra_items_plugin_1.settings){
						var extra_1_settings = extra_items_plugin_1.settings;
						
						if(extra_1_settings.shop_items && extra_1_settings.shop_items.length){
							this.items = this.items.concat(extra_1_settings.shop_items);
						}
					}

					var extra_items_plugin_2 = proboards.plugin.get("monetary_shop_extra_items_2");

					if(extra_items_plugin_2 && extra_items_plugin_2.settings){
						var extra_2_settings = extra_items_plugin_2.settings;

						if(extra_2_settings.shop_items && extra_2_settings.shop_items.length){
							this.items = this.items.concat(extra_2_settings.shop_items);
						}
					}

					var extra_items_plugin_3 = proboards.plugin.get("monetary_shop_extra_items_3");

					if(extra_items_plugin_3 && extra_items_plugin_3.settings){
						var extra_3_settings = extra_items_plugin_3.settings;

						if(extra_3_settings.shop_items && extra_3_settings.shop_items.length){
							this.items = this.items.concat(extra_3_settings.shop_items);
						}
					}
					
					for(var i = 0, l = this.items.length; i < l; i ++){
						this.lookup[this.items[i].item_id] = this.items[i];

						if(typeof this.items[i].item_max_quantity === "undefined"){
							this.lookup[this.items[i].item_id].item_max_quantity = 0;
						}

						if(typeof this.items[i].item_show === "undefined" || !this.items[i].item_show.length){
							this.lookup[this.items[i].item_id].item_show = 1;
						}

						if(this.category_lookup[this.items[i].item_category]){
							if(this.items[i].item_show == 1){
								if(!this.category_items[this.items[i].item_category]){
									this.category_items[this.items[i].item_category] = [];
								}

								this.category_items[this.items[i].item_category].push(this.items[i]);
							}
						}
					}
					
					this.settings.random_image = this.images.hidden;
					
					if(settings.random_items && settings.random_items.length){
						this.prepare_random_items(settings.random_items);	
					}

					//this.setup_specials();
				}
			}
		},
		
		// If there is no id pool, then we don't add the random item
		// to the lookup table
		
		prepare_random_items: function(items){
			for(var i = 0, l = items.length; i < l; i ++){
				var id_pool = [];
				
				if(items[i].item_ids.length){
					var tmp_id_pool = items[i].item_ids.replace(/\s+/g, "").split(",");

					// Loop through and make sure the item exists

					for(var e = 0, el = tmp_id_pool.length; e < el; e ++){
						if(this.lookup[tmp_id_pool[e]]){
							id_pool.push(tmp_id_pool[e]);
						}
					}
				}

				if(items[i].minimum_price && items[i].maximum_price && items[i].minimum_price.length && items[i].maximum_price.length){
					var min_price = parseFloat(items[i].minimum_price);
					var max_price = parseFloat(items[i].maximum_price);

					if(max_price < min_price){
						max_price = min_price;
					}
					
					for(var key in this.lookup){
						if(parseFloat(this.lookup[key].item_price) >= min_price && parseFloat(this.lookup[key].item_price) <= max_price){
							id_pool.push(key);
						}	
					}
				}

				if(items[i].use_cat_id && items[i].use_cat_id.length){
					var the_items = this.category_items[items[i].use_cat_id];

					if(the_items && the_items.length){
						for(var ci = 0, cil = the_items.length; ci < cil; ci ++){
							id_pool.push(the_items[ci].item_id);
						}
					}
				}

				if(id_pool.length){
					this.random_id_pool["___" + i + "___"] = id_pool;
				} else {
					continue;	
				}
				
				items[i].item_id = "___" + i + "___";
				items[i].item_discount = 0;
				items[i].item_show = 1;
				items[i].item_tradable = 1;
				items[i].item_refundable = 1;
				
				this.lookup[items[i].item_id] = items[i];

				if(typeof items[i].item_max_quantity === "undefined"){
					this.lookup[items[i].item_id].item_max_quantity = 0;
				}

				if(typeof items[i].item_show === "undefined" || !items[i].item_show.length){
					this.lookup[items[i].item_id].item_show = 1;
				}
				
				if(this.category_lookup[items[i].item_category]){
					if(!this.category_items[items[i].item_category]){
						this.category_items[items[i].item_category] = [];
					}

					this.category_items[items[i].item_category].push(items[i]);
				}
			}
		},

		safe_id: function(id){
			return id.toString().replace(/[^\d\.\_]+/g, "");
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
			monetary.modules.push(this);
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
					return 'style="max-height: ' + this.settings.mini_image_height + 'px; max-width: ' + this.settings.mini_image_width + 'px;"';
				}
			} else {
				if(this.settings.image_width > 0 && this.settings.image_height > 0){
					return ' style="max-height: ' + this.settings.image_height + 'px; max-width: ' + this.settings.image_width + 'px;"';
				}
			}

			return "";
		},

		get_image_src: function(item){
			var img = (item.item_image && item.item_image.length)? item.item_image : this.settings.random_image;
			
			if(!img.match(/^http/i)){
				img = this.settings.base_image + img;	
			}
			
			return img;
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
				var disp = (!img_size.length && parseInt(this.settings.image_percent) > 0)? " style='display: none;'" : "";

				for(var key in items){
					var num = "";

					if(items[key].q > 1 && this.settings.show_total_bought){
						num = '<span class="shop_item">';
						num += '<img' + disp + ' class="shop_item_x" src="' + this.images.x + '" />';

						if(items[key].q >= 99){
							num += 	'<img' + disp + ' class="shop_item_num" src="' + this.images["9"] + '" /><img class="shop_item_num shop_item_num_last" src="' + this.images["9"] + '" />';
						} else {
							var str = items[key].q.toString();

							for(var s = 0; s < str.length; s ++){
								var klass = (s > 0)? " shop_item_num_last" : "";

								num += 	'<img' + disp + ' class="shop_item_num' + klass + '" src="' + this.images[str.substr(s, 1)] + '" />';
							}
						}

						num += '</span>';
					}

					if(this.lookup[key]){
						items_html += '<div data-shop-item-id="' + this.lookup[key].item_id + '" title="' + yootil.html_encode(this.lookup[key].item_name) + '" class="shop_items_list"><img src="' + this.get_image_src(this.lookup[key]) + '"' + img_size + disp + ' />' + num + '</div>';
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

							this.width = (width - (width * (parseInt(self.settings.image_percent) / 100)));
							this.height = (height - (height * (parseInt(self.settings.image_percent) / 100)));

							$(this).parent().find("img").fadeIn("slow");
						});
					});
				}

				this.bind_refundable_dialog();

				/*if(yootil.user.id() == yootil.page.member.id()){
					this.setup_reordering();
				}*/
			}
		},

		// Browsers reorder the elements if the keys look like numbers
		// It's too later to be changing the type, and I don't really
		// want to start storing indexes in the key to allow ordering.
		// Disabled for now.

		/*setup_reordering: function(){
			var self = this;
			var box = $(".monetary_shop_profile_box");

			if(box.length){
				box.sortable({

					axis: "x",
					cursor: "move",
					items: " > div",
					opacity: 0.5,
					revert: true,
					helper: "clone",
					update: function(evt, ui){
						var item_id = ui.item.attr("data-shop-item-id");
						var items = self.data(yootil.user.id()).get.items();
						var tmp_obj = {};

						if(items[item_id]){
							tmp_obj[item_id.toString()] = items[item_id];

							for(var k in items){
								if(k != item_id){
									tmp_obj[k.toString()] = items[k];
								}
							}

							console.log(tmp_obj);
						}
					}

				});
			}
		},*/

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

			msg += "<div class='item_info_img'><img src='" + self.get_image_src(shop_item) + "' /></div>";
			msg += "<div class='item_info_info'>";

			msg += "<p><strong>" + self.settings.text.item + " " + self.settings.text.name + ":</strong> " + shop_item.item_name + "</p>";
			msg += "<p><strong>" + self.settings.text.quantity + ":</strong> <span id='shop_item_quantity'>" + bought_item.q + "</span></p>";
			msg += "<p><strong>" + self.settings.text.price + " " + self.settings.text.paid + ":</strong> " + monetary.settings.money_symbol + yootil.number_format(monetary.format(bought_item.p, true)) + "</p>";
			msg += "<p><strong>" + self.settings.text.total_cost + ":</strong> <span id='shop_item_total_cost'>" + monetary.settings.money_symbol + yootil.number_format(monetary.format(bought_item.p * bought_item.q, true)) + "</span></p>";

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

				refund_buttons[self.settings.text.accept + " " + self.settings.text.refund] = this.build_refund_dialog(item_id);

				info_buttons[self.settings.text.refund] = function(){
					pb.window.dialog("monetaryshop-item-refund-dialog", {
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

			if(this.settings.allow_removing && yootil.user.is_staff()){
				info_buttons["Remove"] = function(){
					var elem = this;

					pb.window.dialog("monetaryshop-item-remove-dialog", {
						modal: true,
						height: 160,
						width: 350,
						title: self.settings.text.remove,
						html: self.build_remove_msg(item_id),
						resizable: false,
						draggable: false,
						buttons: {

							"Cancel": function(){
								$(this).dialog("close");
							},

							"Remove": self.build_remove_dialog(item_id)

						}
					});
				};
			}

			var refund_txt = "";

			if(yootil.user.id() == owner){
				refund_txt = (shop_item.item_refundable == "1")? "" : " (Not Refundable)";
			}

			pb.window.dialog("monetaryshop-item-info-dialog", {
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

		build_remove_msg: function(item_id){
			var self = this;
			var item_counter = 0;
			var remove_msg = "<strong>" + self.settings.text.quantity + " to " + self.settings.text.remove.toLowerCase() + ":</strong> ";
			var	bought_item = self.data(yootil.page.member.id()).get.item(item_id);
			var one_remove = (parseFloat(bought_item.p) * (self.settings.refund_percent / 100)) * 1;

			remove_msg += "<select id='shop_item_remove_quantity'>";

			while(item_counter < bought_item.q){
				item_counter ++;
				remove_msg += "<option value='" + item_counter + "'> " + item_counter + " </option>";
			}

			remove_msg += "</select>";
			remove_msg = $("<div>" + remove_msg + "</div>");

			return remove_msg;
		},
		
		build_remove_dialog: function(item_id){
			var self = this;

			return function(){
				var remove_quantity = parseInt($("#shop_item_remove_quantity option:selected").val());
				var bought_item = self.data(yootil.page.member.id()).get.item(item_id);

				if(remove_quantity <= bought_item.q){
					var info_dialog = $("#monetaryshop-item-info-dialog");

					self.data(yootil.page.member.id()).reduce.quantity(item_id, remove_quantity);

					bought_item = self.data(yootil.page.member.id()).get.item(item_id);

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
						info_dialog.find("span#shop_item_total_cost").html(monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(bought_item.q * bought_item.p, true))));
						self.update_item_count(item_id, bought_item.q);

					}
				} else {
					self.error("Could not remove item");
				}

				$(this).dialog("destroy").remove();
			};
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
			refund_msg += "<br /><br /><span id='shop_item_refund_total_back'><strong>" + self.settings.text.refund + ":</strong> " + monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(one_refund, true))) + " (" + self.settings.refund_percent + "%)</span>";
			refund_msg = $("<div>" + refund_msg + "</div>");

			refund_msg.find("select").change(function(){
				var selected_quantity = parseInt(this.value);
				var refund_amount = (parseFloat(bought_item.p) * (self.settings.refund_percent / 100)) * selected_quantity;

				$("#shop_item_refund_total_back").html("<strong>" + self.settings.text.refund + "</strong>: " + monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(refund_amount, true))) + " (" + self.settings.refund_percent + "%)");
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
					monetary.data(yootil.user.id()).increase.money(amount, false, null, true);

					// Update wallet & profile money

					var user_money = monetary.data(yootil.user.id()).get.money(true);

					$(".pd_money_amount_" + yootil.user.id()).text(yootil.number_format(user_money));

					var wallet = $("#pd_money_wallet_amount");

					if(wallet.length){
						wallet.text(yootil.number_format(user_money));
					}

					var other_wallet = $(".money_wallet_amount");

					if(other_wallet.length){
						other_wallet.html(monetary.settings.text.wallet + monetary.settings.money_separator + monetary.settings.money_symbol + yootil.html_encode(user_money));
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
						info_dialog.find("span#shop_item_total_cost").html(monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(bought_item.q * bought_item.p, true))));
						self.update_item_count(item_id, bought_item.q);

					}
				} else {
					self.error("Could not issue refund");
				}

				$(this).dialog("destroy").remove();
			};
		},

		error: function(){
			pb.window.alert("An Error Has Occurred", msg, {
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
			title += '<div style="float: right" id="pd_money_wallet">' + monetary.settings.text.wallet + ': ' + monetary.settings.money_symbol + '<span id="pd_money_wallet_amount">' + yootil.html_encode(monetary.data(yootil.user.id()).get.money(true)) + '</span></div>';

			title += '</div><br style="clear: both" />';

			var html = "";
			var div_counter = 0;

			html += this.create_shop_tabs();

			var img_size = this.get_size_css();
			var disp = (!img_size.length && parseInt(this.settings.image_percent) > 0)? " style='display: none;'" : "";
			var quantity_options = "";
			var q_counter = 0;
			
			if(this.settings.show_quantity_drop_down){
				while(q_counter < 100){
					quantity_options += "<option value='" + (++ q_counter) + "'>" + q_counter + "</option>";	
				}
			}
			
			for(var key in this.category_items){
				var cat_id = parseInt(key);
				var inline_css = "";
				
				html += '<div id="item_category_' + cat_id + '"' + ((div_counter != 0)? ' style="display: none;"' : '') + '>';
				
				if(this.category_lookup[cat_id].category_desc && this.category_lookup[cat_id].category_desc.length){
					html += '<div class="item_shop_category_description">' + pb.text.nl2br(this.category_lookup[cat_id].category_desc) + '</div>';
					inline_css = " border-top-width: 1px;";
				}
				
				html += '<table class="list"><thead><tr class="head"><th style="width: 140px;' + inline_css + '">&nbsp;</th><th style="width: 22%;' + inline_css + '">' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th style="width: 78%;' + inline_css + '" class="main">' + this.settings.text.description + '</th><th style="width: 110px;' + inline_css + '">' + this.settings.text.price + '</th><th style="width: 150px;' + inline_css + '">&nbsp;</th></tr></thead><tbody class="list-content">';

				var counter = 0;

				for(var i = 0; i < this.category_items[key].length; i ++){
					klass = (counter == 0)? " first" : ((counter == (this.category_items.length - 1))? " last" : "");

					var ribbon = "";
					var extra_ribbon_class = "";
					var price = parseFloat(this.category_items[key][i].item_price);

					if(this.category_items[key][i].item_discount && this.category_items[key][i].item_discount > 0){
						var discount = this.category_items[key][i].item_discount | 0;

						if(this.images["ribbon" + discount]){
							ribbon = "background-image: url(" + this.images["ribbon" + discount] + ");";
							extra_ribbon_class = " shop_ribbon_" + discount;
							price -= (price * (discount / 100));
						}
					}

					html += '<tr class="item' + klass + '">';
					html += '<td style="text-align: center;' + ribbon + '" class="shop_ribbon' + extra_ribbon_class + '"><img src="' + this.get_image_src(this.category_items[key][i]) + '"' + img_size + disp + ' alt="' + yootil.html_encode(this.category_items[key][i].item_name) + '" title="' + yootil.html_encode(this.category_items[key][i].item_name) + '" /></td>';
					html += '<td>' + this.category_items[key][i].item_name + '</td>';
					html += '<td>' + pb.text.nl2br(this.category_items[key][i].item_description) + '</td>';
					html += '<td>' + monetary.settings.money_symbol + yootil.number_format(monetary.format(price, true)) + '</td>';

					var disabled_button = "";
					var current_qty = this.data(yootil.user.id()).get.quantity(this.category_items[key][i].item_id);
					var id = this.category_items[key][i].item_id;

					if(this.lookup[id].item_max_quantity != 0 && current_qty >= this.category_items[key][i].item_max_quantity){
						disabled_button = " style='opacity: 0.5;'";
					}

					html += '<td style="text-align: center;">';
					
					if(this.settings.show_quantity_drop_down){
						html += '<select class="monetary-shop-cart-quantity" name="quantity" data-item-id="' + this.category_items[key][i].item_id + '">';
						html += quantity_options;
						html += "</select><br />";
					}
					
					html += '<button' + disabled_button + ' class="add_to_cart" data-item-id="' + this.category_items[key][i].item_id + '">' + this.settings.text.add_to_cart + '</button></td>';

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
				var id = $(this).attr("data-item-id");
				var current_qty = self.data(yootil.user.id()).get.quantity(id);
				var wanted_quantity = 1;
				var item_max_quantity = ~~ self.lookup[id].item_max_quantity;
				
				if(self.settings.show_quantity_drop_down){
					wanted_quantity = ~~ $("select.monetary-shop-cart-quantity[data-item-id=" + id + "]").val();
				}
				
				if(item_max_quantity == 0 || current_qty < item_max_quantity){
					if(item_max_quantity != 0 && wanted_quantity >= item_max_quantity){
						wanted_quantity = item_max_quantity;
						
						if((wanted_quantity + current_qty) > item_max_quantity){
							wanted_quantity = Math.abs(item_max_quantity - current_qty);	
						}
						
						if(wanted_quantity > item_max_quantity){
							wanted_quantity = 0;	
						}
					}

					self.add_to_cart(this, id, wanted_quantity);
				}
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

			if(parseInt(this.settings.image_percent) > 0){
				$(".container_monetaryshop table tr td.shop_ribbon img").bind("load", function(){
					var width = this.width;
					var height = this.height;

					this.width = (width - (width * (parseInt(self.settings.image_percent) / 100)));
					this.height = (height - (height * (parseInt(self.settings.image_percent) / 100)));

					$(this).fadeIn("slow");
				});
			}
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
					if(this.items[i].item_show == 1){
						var name = this.items[i].item_name.toLowerCase();
						var desc = this.items[i].item_description.toLowerCase();

						if(name.match(txt) || desc.match(txt)){
							results.push(this.items[i]);
						}
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
					var img_size = this.get_size_css();
					var disp = (!img_size.length && parseInt(this.settings.image_percent) > 0)? " style='display: none;'" : "";

					var quantity_options = "";
					var q_counter = 0;

					if(this.settings.show_quantity_drop_down){
						while(q_counter < 100){
							quantity_options += "<option value='" + (++ q_counter) + "'>" + q_counter + "</option>";
						}
					}

					for(var r = 0; r < results.length; r ++){
						klass = (counter == 0)? " first" : ((counter == (results.length - 1))? " last" : "");

						var ribbon = "";
						var extra_ribbon_class = "";
						var price = parseFloat(results[r].item_price);

						if(results[r].item_discount && results[r].item_discount > 0){
							var discount = results[r].item_discount | 0;

							if(this.images["ribbon" + discount]){
								ribbon = "background-image: url(" + this.images["ribbon" + discount] + ");";
								extra_ribbon_class = " shop_ribbon_" + discount;
								price -= (price * (discount / 100));
							}
						}

						var disabled_button = "";

						if(this.lookup[results[r].item_id].item_max_quantity != 0 && this.at_max_quantity(results[r].item_id)){
							disabled_button = " style='opacity: 0.5;'";
						}

						result_html += '<tr class="item' + klass + '">';
						result_html += '<td style="text-align: center;' + ribbon + '" class="shop_ribbon' + extra_ribbon_class + '"><img src="' + this.get_image_src(results[r]) + '"' + img_size + disp + ' alt="' + yootil.html_encode(results[r].item_name) + '" title="' + yootil.html_encode(results[r].item_name) + '" /></td>';
						result_html += '<td>' + results[r].item_name + '</td>';
						result_html += '<td>' + pb.text.nl2br(results[r].item_description) + '</td>';
						result_html += '<td>' + monetary.settings.money_symbol + yootil.number_format(monetary.format(price, true)) + '</td>';

						result_html += '<td style="text-align: center;">';

						if(this.settings.show_quantity_drop_down){
							result_html += '<select class="monetary-shop-cart-quantity monetary-shop-search-quantity" name="quantity" data-item-id="' + results[r].item_id + '">';
							result_html += quantity_options;
							result_html += "</select><br />";
						}

						result_html += '<button' + disabled_button + ' class="add_to_cart" data-item-id="' + results[r].item_id + '">' + this.settings.text.add_to_cart + '</button></td>';

						counter ++;
					}

					var result_items_table = $("div.container_monetaryshop table#search_results_items");

					result_items_table.find("tbody").html(result_html);

					result_items_table.find("button[data-item-id]").click(function(){
						var id = $(this).attr("data-item-id");
						var current_qty = self.data(yootil.user.id()).get.quantity(id);
						var wanted_quantity = 1;
						var item_max_quantity = ~~ self.lookup[id].item_max_quantity;

						if(self.settings.show_quantity_drop_down){
							wanted_quantity = ~~ $("select.monetary-shop-search-quantity[data-item-id=" + id + "]").val();
						}

						if(item_max_quantity == 0 || current_qty < item_max_quantity){
							if(item_max_quantity != 0 && wanted_quantity >= item_max_quantity){
								wanted_quantity = item_max_quantity;

								if((wanted_quantity + current_qty) > item_max_quantity){
									wanted_quantity = Math.abs(item_max_quantity - current_qty);
								}

								if(wanted_quantity > item_max_quantity){
									wanted_quantity = 0;
								}
							}

							self.add_to_cart(this, id, wanted_quantity);
						}
					});

					if(parseInt(this.settings.image_percent) > 0){
						$(".container_monetaryshop table tr td.shop_ribbon img").bind("load", function(){
							var width = this.width;
							var height = this.height;

							this.width = (width - (width * (parseInt(self.settings.image_percent) / 100)));
							this.height = (height - (height * (parseInt(self.settings.image_percent) / 100)));

							$(this).fadeIn("slow");
						});
					}
				} else {
					$("div.container_monetaryshop div#search_no_results").show();
					$("div.container_monetaryshop table#search_results_items").hide();
				}
			}
		},

		at_max_quantity: function(id){
			var current_qty = ~~ this.data(yootil.user.id()).get.quantity(id);
			var cart_quantity = 0;

			for(var c = 0; c < this.cart.length; c ++){
				if(this.cart[c] == id){
					cart_quantity ++;
				}
			}

			if((current_qty + cart_quantity) >= this.lookup[id].item_max_quantity){
				return true;
			}

			return false;
		},

		add_to_cart: function(button, item_id, quantity){
			if(button && this.lookup[item_id] && this.lookup[item_id].item_show == 1){
				var add_button = $(".container_monetaryshop button.add_to_cart[data-item-id=" + item_id + "]");

				if(this.lookup[item_id].item_max_quantity != 0 && this.at_max_quantity(item_id)){
					return;
				} else {
					while(quantity){
						this.cart.push(item_id);
						quantity --;
					}

					if(this.lookup[item_id].item_max_quantity != 0 && this.at_max_quantity(item_id)){
						add_button.css("opacity", .5);
					}
				}

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
			var img_size = this.get_size_css();
			var disp = (!img_size.length && parseInt(this.settings.image_percent) > 0)? " style='display: none;'" : "";

			for(var i = 0; i < this.cart.length; i ++){
				var item = self.lookup[this.cart[i]];

				if(item.item_show != 1){
					continue;
				}

				klass = (counter == 0)? " first" : "";

				var ribbon = "";
				var extra_ribbon_class = "";
				var price = parseFloat(item.item_price);

				if(item.item_discount && item.item_discount > 0){
					var discount = item.item_discount | 0;

					if(this.images["ribbon" + discount]){
						ribbon = "background-image: url(" + this.images["ribbon" + discount] + ");";
						extra_ribbon_class = " shop_ribbon_" + discount;
						price -= (price * (discount / 100));
					}
				}

				basket_html += '<tr class="item' + klass + '">';
				basket_html += '<td style="text-align: center;' + ribbon + '" class="shop_ribbon' + extra_ribbon_class + '"><img src="' + this.get_image_src(item) + '"' + img_size + disp + ' alt="' + yootil.html_encode(item.item_name) + '" title="' + yootil.html_encode(item.item_name) + '" /></td>';
				basket_html += '<td>' + item.item_name + '</td>';
				basket_html += '<td>' + pb.text.nl2br(item.item_description) + '</td>';
				basket_html += '<td>' + monetary.settings.money_symbol + yootil.number_format(monetary.format(price, true)) + '</td>';
				basket_html += '<td style="text-align: center;"><button data-item-id="' + item.item_id + '">' + this.settings.text.remove + '</button></td>';

				total += parseFloat(price);
				counter ++;
			}

			var total_html = "<tr class='item' style='height: 30px'><td colspan='5'></td></tr>";

			total_html += "<tr class='item last'><td colspan='3' style='text-align: right; font-weight: bold'>" + this.settings.text.total_amount + ": </td><td style='font-weight: bold'>" + monetary.settings.money_symbol + "<span id='basket_total_amount'>" + yootil.number_format(monetary.format(total, true)) + "</span></td><td style='text-align: center'><button id='shop_checkout'>" + this.settings.text.checkout + "</button></td></tr>";

			var basket_items_table = $("div.container_monetaryshop table#basket_items_list");

			basket_items_table.find("tbody").html(basket_html + total_html);
			basket_items_table.find("button[data-item-id]").click(function(){
				self.remove_from_cart(this, $(this).attr("data-item-id"));
			});

			basket_items_table.find("button#shop_checkout").click(function(){
				self.checkout();
			});

			if(parseInt(this.settings.image_percent) > 0){
				$(".container_monetaryshop table tr td.shop_ribbon img").bind("load", function(){
					var width = this.width;
					var height = this.height;

					this.width = (width - (width * (parseInt(self.settings.image_percent) / 100)));
					this.height = (height - (height * (parseInt(self.settings.image_percent) / 100)));

					$(this).fadeIn("slow");
				});
			}

			basket_items_table.show();
		},

		update_total_amount: function(){
			var total = 0;

			for(var i = 0; i < this.cart.length; i ++){
				var item = this.lookup[this.cart[i]];

				if(item.item_show != 1){
					continue;
				}

				var price = parseFloat(item.item_price);

				if(item.item_discount && item.item_discount > 0){
					var discount = item.item_discount | 0;

					if(this.images["ribbon" + discount]){
						price -= (price * (discount / 100));
					}
				}

				total += parseFloat(price);
			}

			$("div.container_monetaryshop span#basket_total_amount").html(yootil.number_format(monetary.format(total, true)));
		},

		remove_from_cart: function(button, item_id){
			var self = this;
			var index = $.inArrayLoose(item_id, this.cart);

			if(index > -1){
				var add_button = $(".container_monetaryshop button.add_to_cart[data-item-id=" + item_id + "]");

				add_button.css("opacity", "1");
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
			var users_money = parseFloat(monetary.data(yootil.user.id()).get.money());
			var total = 0;

			for(var i = 0; i < this.cart.length; i ++){
				var item = this.lookup[this.cart[i]];

				if(item.item_show != 1){
					continue;
				}

				var price = parseFloat(item.item_price);

				if(item.item_discount && item.item_discount > 0){
					var discount = item.item_discount | 0;

					if(this.images["ribbon" + discount]){
						price -= (price * (discount / 100));
					}
				}

				total += parseFloat(price);
			}

			if(total > users_money){
				var msg = "You do not have enough money to pay for the " + this.settings.text.item + "s in your " + this.settings.text.basket.toLowerCase() + ".<br /><br />";

				msg += this.settings.text.total_amount + ": <strong>" + monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(total, true))) + "</strong><br /><br />";
				msg += "You need <strong>" + monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(total - users_money, true))) + "</strong> more in your " + monetary.settings.text.wallet + ", then you can " + this.settings.text.checkout.toLowerCase() + ".";

				pb.window.alert("Not Enough Money", msg, {
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

				msg += this.settings.text.total_amount + ": <strong>" + monetary.settings.money_symbol + yootil.html_encode(yootil.number_format(monetary.format(total, true))) + "</strong><br /><br />";

				msg += '<table class="list"><thead><tr class="head"><th style="width: 130px;">&nbsp;</th><th>' + this.settings.text.item + ' ' + this.settings.text.name + '</th><th>' + this.settings.text.quantity + '</th><th>' + this.settings.text.item + ' ' + this.settings.text.price + '</th><th>' + this.settings.text.total_cost + '</th></tr></thead><tbody class="list-content">';

				var img_size = this.get_size_css();
				var disp = (!img_size.length && parseInt(this.settings.image_percent) > 0)? " style='display: none;'" : "";

				for(var key in grouped_items){
					var item = this.lookup[key];

					if(item.item_show != 1){
						continue;
					}

					total_items ++;

					var ribbon = "";
					var extra_ribbon_class = "";
					var price = parseFloat(item.item_price);

					if(item.item_discount && item.item_discount > 0){
						var discount = item.item_discount | 0;

						if(this.images["ribbon" + discount]){
							ribbon = "background-image: url(" + this.images["ribbon" + discount] + ");";
							extra_ribbon_class = " shop_ribbon_" + discount;
							price -= (price * (discount / 100));
						}
					}

					msg += "<tr class='item'>";
					msg += "<td style='width: 130px;" + ribbon + "' class='monetaryshop_item_img shop_ribbon" + extra_ribbon_class + "'><img src='" + this.get_image_src(item) + "'' + img_size + disp + ' /></td>";
					msg += "<td>" + item.item_name + "</td>";
					msg += "<td style='width: 80px;'>" + grouped_items[key].quantity + "</td>";
					msg += "<td>" + monetary.settings.money_symbol + yootil.number_format(monetary.format(price, true)) + "</td>";
					msg += "<td>" + monetary.settings.money_symbol + yootil.number_format(monetary.format(price * grouped_items[key].quantity, true)) + "</td>";
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

				var return_data = self.check_and_give_random_items(grouped_items);
				
				grouped_items = return_data[0];

				buttons[this.settings.text.purchase] = function(){
					var total = 0;

					for(var key in grouped_items){
						var item = self.lookup[key];

						// This line breaks "secret" items
						// Is there a reason we need this?
						// If yes, then lookup in the pool to see
						// if it is in a secret item.

						if(item.item_show != 1){
							if(return_data[2]){
								var random_but_can_buy = false;

								for(var the_pool_id in return_data[2]){
									if($.inArrayLoose(key, self.random_id_pool[the_pool_id]) != -1){
										random_but_can_buy = true;
										break;
									}
								}
							}

							if(!random_but_can_buy) {
								continue;
							}
						}

						var price = (grouped_items[key].temp_price)? parseFloat(grouped_items[key].temp_price) : parseFloat(item.item_price);

						if(item.item_discount && item.item_discount > 0){
							var discount = item.item_discount | 0;

							if(self.images["ribbon" + discount]){
								price -= (price * (discount / 100));
							}
						}

						var the_item = {

							id: key,
							quantity: grouped_items[key].quantity,
							price: parseFloat(item.item_price)

						};
						
						self.data(yootil.user.id()).add.item(the_item, true);

						total += price * grouped_items[key].quantity;
					}

					self.cart = [];
					self.data(yootil.user.id()).update();
					monetary.data(yootil.user.id()).decrease.money(total, false, null, true);

					var wallet = $("#pd_money_wallet_amount");

					if(wallet.length){
						wallet.text(yootil.number_format(monetary.data(yootil.user.id()).get.money(true)));
					}

					$("div.container_monetaryshop div#basket_items_list tbody").empty();
					$("div.container_monetaryshop table#basket_items_list").hide();
					$("div.container_monetaryshop div#basket_no_items").show();
					$("div.container_monetaryshop li#basket_items_tab a").html("Basket (0)");

					var msg = "Your " + self.settings.text.item.toLowerCase() + " was successfully " + self.settings.text.purchased + ".<br /><br />You can view your " + self.settings.text.purchased + " " + self.settings.text.item + " from the profile page <a href='/user/" + yootil.user.id() + "/'>here</a>.";

					if(total_items > 1){
						msg = "Your " + self.settings.text.item.toLowerCase() + "s were successfully " + self.settings.text.purchased + ".<br /><br />You can view your " + self.settings.text.purchased + " " + self.settings.text.item + "s from the profile page <a href='/user/" + yootil.user.id() + "/'>here</a>.";
					}

					var height = 200;
										
					if(return_data[1] && return_data[1].length){
						var random_items = return_data[1];
						
						height = 300;
						
						msg += "<br /><br /><strong>Your random " + self.settings.text.item.toLowerCase() + "s:</strong><div style='margin-top: 10px; margin-left: 10px;'>";
						
						for(var index in random_items){
							var item = self.lookup[random_items[index].item_id];
							
							if(item){
								msg += "<img src='" + self.get_image_src(item) + "'' + img_size + disp + ' /> ";
							}	
						}
						
						msg += "</div>";
					}

					$(this).dialog("close");

					pb.window.dialog("monetaryshop-thanks-dialog", {
						modal: true,
						height: height,
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

				var confirm = pb.window.dialog("monetaryshop-buy-dialog", {
					modal: true,
					height: 380,
					width: 700,
					title: title,
					html: msg,
					resizable: false,
					draggable: false,

					buttons: buttons

				});

				if(parseInt(this.settings.image_percent) > 0){
					$("#monetaryshop-buy-dialog table tr td.shop_ribbon img").bind("load", function(){
						var width = this.width;
						var height = this.height;

						this.width = (width - (width * (parseInt(self.settings.image_percent) / 100)));
						this.height = (height - (height * (parseInt(self.settings.image_percent) / 100)));

						$(this).fadeIn("slow");
					});
				}
			}
		},

		check_and_give_random_items: function(grouped_items){
			var random_items = [];
			var random_item_ids = {};

			for(var key in grouped_items){
				var item = this.lookup[key];
				
				if(item.item_ids || (item.maximum_price && item.minimum_price) || item.use_cat_id){
					if(key.match(/^___\d+___$/)){						
						var total = grouped_items[key].quantity;
						var id_pool = this.random_id_pool[key];

						random_item_ids[key] = key;

						while(total --){
							var rand = Math.floor(Math.random() * id_pool.length);
							var random_id = id_pool[rand];
							
							if(random_id && this.lookup[random_id]){
								random_items.push(this.lookup[random_id]);
								
								if(!grouped_items[random_id]){
									grouped_items[random_id] = {
										
										quantity: 1
										
									};
								} else {
									grouped_items[random_id].quantity ++;
								}
								
								grouped_items[random_id].temp_price = item.item_price;
							}	
						}
						
						delete grouped_items[key];
					}
				} 
			}
			
			return [grouped_items, random_items, random_item_ids];
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
				var disp = (!img_size.length && parseInt(this.settings.mini_image_percent) > 0)? " style='display: none;'" : "";

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
									str += '<span class="pd_shop_mini_item" data-shop-item-id="' + self.lookup[key].item_id + '" title="' + yootil.html_encode(self.lookup[key].item_name) + ' (x' + items[key].q + ')"><img src="' + self.get_image_src(self.lookup[key]) + '"' + img_size + disp + ' /></span>';

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

									this.width = (width - (width * (parseInt(self.settings.mini_image_percent) / 100)));
									this.height = (height - (height * (parseInt(self.settings.mini_image_percent) / 100)));

									$(this).fadeIn("slow");
								});
							}
						}
					}
				});
			}
		}

	};

})().register();