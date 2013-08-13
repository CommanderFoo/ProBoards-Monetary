money.gift_money = (function(){

	return {
		 
		data: {
					
			g: []
		
		},
		
		settings: {
		
			enabled: true,
			paid_into: 0,
			codes: []
			
		},
		
		lookup: {},
		
		array_lookup: [],
		
		current_code:  "",
			
		init: function(){
		
			// Basic checking so we don't need to run setup on each page
			
			if(yootil.user.logged_in() && money.can_earn_money && location.href.match(/\?monetarygift=/i)){
				this.setup();
				
				yootil.create.nav_branch(location.href, "Money Gift");
				
				if(!this.gift_money()){
					proboards.alert("An Error Occurred", "Gift could not be found, or has already been collected.", {
						modal: true,
						resizable: false,
						draggable: false
					});
					
					money.show_default();
				}
			} else {
				money.show_default();
			}
		},
		
		setup: function(){
			if(money.plugin){
				this.data.g = money.data.g || [];
							
				var settings = money.plugin.settings;
			
				this.settings.enabled = (settings.free_money_enabled && settings.free_money_enabled == "0")? false : this.settings.enabled;
				this.settings.paid_into = (settings.free_money_paid_into && settings.free_money_paid_into == "1")? 1 : this.settings.paid_into;
				this.settings.codes = (settings.free_money_codes && settings.free_money_codes.length)? settings.free_money_codes : [];
				
				if(!money.bank.settings.enabled){
					this.settings.paid_into = 1;
				}
				
				if(settings.gift_money_image && settings.gift_money_image.length){
					money.images.giftmoney = settings.gift_money_image;
				}
				
				for(var c = 0, l = this.settings.codes.length; c < l; c ++){
					this.lookup[this.settings.codes[c].unique_code.toLowerCase()] = {
						code: this.settings.codes[c].unique_code.toLowerCase(),
						amount: this.settings.codes[c].amount,
						message: this.settings.codes[c].message,
						members: this.settings.codes[c].members,
						groups: this.settings.codes[c].groups
					};
					
					this.array_lookup.push(this.settings.codes[c].unique_code.toLowerCase());
				}
			}
		},
		
		register: function(){
			money.modules.push(this);
			return this;
		},
		
		gift_money: function(){
			var code = this.get_gift_code();
			var gift = this.valid_code(code);
			
			if(gift){
				if(!this.has_received(code) && this.allowed_gift(gift)){
					var html = "";
					var paid_where = (this.settings.paid_into == 1)? money.bank.settings.text.bank : money.settings.text.wallet;
					
					html += "<div class='monetary-gift-notice-icon'><img src='" + money.images.giftmoney + "' /></div>";
					html += "<div class='monetary-gift-notice-content'><p>You have recieved a gift of <strong>" + money.settings.money_symbol + money.format(gift.amount) + "</strong> that will be paid into your " + paid_where + ".</p>";
					
					if(gift.message.length){
						html += "<p>" + gift.message + "</p>";
					}
					
					html += "<p>Do you want to accept this gift?  <button>Yes</button></p></div><br style='clear: both' />";
					
					var container = yootil.create.container("You Have Received Some Money", html).show();
					var self = this;
					
					container.find("button").click(function(){
						if(self.collect_gift()){
							console.log("YES");
						} else {
							proboards.alert("An Error Occurred", "Could not collect gift.", {
								modal: true,
								resizable: false,
								draggable: false
							});
						}
					});
					
					container.appendTo("#content");
					
					return true;
				}
			}
			
			return false;
		},
		
		collect_gift: function(){
			if(this.current_code){
				this.data.g.push(this.current_code);
				this.update_money_data();
				this.save_money_data();
				
				return true;
			}
			
			return false;
		},
		
		update_money_data: function(){
			money.data.g = this.data.g;
		},
		
		save_money_data: function(){
			//yootil.key.set("pixeldepth_money", money.data, null, true);
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
		
		has_received: function(code){
			if($.inArrayLoose(code, this.data.g) != -1){
				return true;
			}
			
			return false;
		},
		
		get_gift_code: function(){
			var url = location.href;
			
			if(location.href.match(/\?monetarygift=(\w+)/i)){
				return RegExp.$1.toLowerCase();
			}
			
			return false;
		},
		
		valid_code: function(code){
			if(code){
				if(this.lookup[code]){
					this.current_code = code;
					
					return this.lookup[code];
				}
			}
			
			return false;
		},
		
		// Remove old codes that are no longer used
		
		remove_old_codes: function(){
			if(!this.codes.length){
				this.data.g = [];
				
				return;
			}
			
			for(var c = 0, l = this.data.g.length; c < l; c ++){
				if(!this.lookup[this.data.g[c]]){
					this.data.g.splice(c, 1); 
				}
			}
		},
			
		clear_codes: function(){
			this.data.g = money.data.g = [];
			yootil.key.set("pixeldepth_money", money.data, null, true);
		}
		
	};
	
})().register();