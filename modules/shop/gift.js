pixeldepth.monetary.shop.gift = (function(){

	return {

		settings: {

			gifts_enabled: true,
			gift_codes: [],

			text: {

				gift: "Gift"

			}

		},

		shop: null,

		images: {},

		gift_lookup: {},
		gift_code_lookup: [],

		init: function(){
			this.setup();

			 if(yootil.user.logged_in()){
			 	this.add_gift_to_yootil_bar();

			 	if(location.href.match(/\?monetaryshop&gift=.+?$/i)){
					this.gift();
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

			this.settings.text.gift = (settings.txt_gift && settings.txt_gift.length)? settings.txt_gift : this.settings.text.gift;
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

		gift: function(){
			if(!this.settings.gifts_enabled){
				pixeldepth.monetary.show_default();
				return;
			}

			var has_error = true;
			var code = this.get_gift_code();
			var gift = this.valid_code(code);

			if(code && gift && gift.item_id && this.shop.lookup[gift.item_id]){
				if(!this.has_received(code) && this.allowed_gift(gift)){
					has_error = false;

					var html = "";

					html += "<div class='monetary-gift-notice-icon'><img src='" + this.images.gift_big + "' /></div>";
					html += "<div class='monetary-gift-notice-content'><div class='monetary-gift-notice-content-top'><p>You have recieved a " + this.settings.text.gift.toLowerCase() + " " + this.shop.settings.text.item.toLowerCase() + ".</p>";

					if(gift.message.length){
						html += "<p>" + gift.message.replace(/\n/g, "<br />") + "</p>";
					}

					html+= "</div>";

					html += "<p class='monetary-gift-notice-content-accept'>Do you want to accept this " + this.settings.text.gift.toLowerCase() + "?  <button>Yes</button></p></div><br style='clear: both' />";

					var container = yootil.create.container("You Have Received A " + this.settings.text.gift + " " + this.shop.settings.text.item, html).show();
					var self = this;

					container.find("button").click(function(){
						if(self.collect_gift()){
							var msg = "";

							msg += "<p>You have successfully received the " + self.settings.text.gift.toLowerCase() + " " + self.shop.settings.text.item.toLowerCase() + ".</p>";

							$(".monetary-gift-notice-content").html(msg);

							yootil.bar.remove("giftitem_" + gift.code);

							var item_id = gift.item_id;
							var shop_item = self.shop.lookup[item_id];
							var msg = "";

							msg += "<div>";

							msg += "<div class='item_info_img'><img src='" + self.shop.settings.base_image + shop_item.item_image + "' /></div>";
							msg += "<div class='item_info_info'>";

							msg += "<p><strong>" + self.shop.settings.text.item + " " + self.shop.settings.text.name + ":</strong> " + shop_item.item_name + "</p>";
							msg += "<p><strong>" + self.shop.settings.text.quantity + ":</strong> <span id='shop_item_quantity'>" + gift.quantity + "</span></p>";
							msg += "<p><strong>" + self.shop.settings.text.item + " " + self.shop.settings.text.price + ":</strong> " + pixeldepth.monetary.settings.money_symbol + yootil.number_format(pixeldepth.monetary.format(shop_item.item_price, true)) + "</p>";
							msg += "<p class='item_info_desc'>" + pb.text.nl2br(shop_item.item_description) + "</p>";

							msg += "</div>";
							msg += "</div>";

							proboards.dialog("monetaryshop-item-info-dialog", {
								modal: true,
								height: 280,
								width: 500,
								title: "You received the following " + self.shop.settings.text.item.toLowerCase(),
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
							proboards.alert("An Error Occurred", "Could not collect " + this.settings.text.gift.toLowerCase() + " " + this.shop.settings.text.item.toLowerCase() + ".", {
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
			var data = pixeldepth.monetary.shop.data(yootil.user.id());

			if($.inArrayLoose(code, data.get.gifts()) != -1){
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
				var item = this.shop.lookup[gift.item_id];
				var data = pixeldepth.monetary.shop.data(yootil.user.id());

				data.push.gift(this.current_code, true);
				data.add.item({

					id: gift.item_id,
					quantity: gift.quantity,
					price: item.item_price,
					time: (+ new Date())

				});

				this.remove_old_codes();

				return true;
			}

			return false;
		},

		remove_old_codes: function(){
			var data = pixeldepth.monetary.shop.data(yootil.user.id());

			if(!this.settings.gift_codes.length){
				data.clear.gifts();

				return;
			}

			var gifts = data.get.gifts();
			var len = gifts.length;

			while(len --){
				if(!this.gift_lookup[gifts[len]]){
					gifts.splice(len, 1);
				}
			}

			data.set.gifts(gifts);
		}

	};

})().register();