money.wages = (function(){

	return {
	
		data: {
					
			// Posts
			
			p: 0,
			
			// Timestamp expiry
			
			e: 0
		
		},
		
		total_wage_amount: 0,
		
		settings: {
		
			enabled: true,
			how_often: 2,
			bonuses_enabled: true,
			bonus_amount: 10,
			paid_into: 0,
			
			rules: []
			
		},
		
		ms: {
		
			day: 86400000,
			week: 604800000
		
		},
		
		init: function(){
		
			// Basic checking so we don't need to run setup on each page
			
			if(yootil.user.logged_in() && money.can_earn && (yootil.location.check.posting() || yootil.location.check.thread())){
				this.setup();
			}
		},
		
		setup: function(){
			if(money.plugin){
				this.data = money.data.w || {};
				
				if(!this.data.p){
					this.data.p = 0;
				} else {
					this.data.p = parseInt(this.data.p);
				}
				
				if(this.data.e){
					this.data.e = parseInt(this.data.e);
				}
			
				var settings = money.plugin.settings;
			
				this.settings.enabled = (settings.wages_enabled && settings.wages_enabled == "0")? false : this.settings.enabled;
				this.settings.how_often = (settings.wages_how_often && parseInt(settings.wages_how_often) > 0)? settings.wages_how_often : this.settings.how_often;
				this.settings.bonuses_enabled = (settings.wages_enable_bonuses && settings.wages_enable_bonuses == "0")? false : this.settings.bonuses_enabled;
				this.settings.bonus_amount = (settings.wages_bonus_amount && parseInt(settings.wages_bonus_amount) > 0)? settings.wages_bonus_amount : this.settings.bonus_amount;
				this.settings.paid_into = (settings.wages_paid_into && settings.wages_paid_into == "1")? 1 : this.settings.paid_into;
				this.settings.rules = (settings.wage_rules && settings.wage_rules.length)? settings.wage_rules : [];
				
				// Disable wages if there are no rules
				
				if(!this.settings.rules.length){
					this.settings.enabled = false;
				}
			}
		},
		
		register: function(){
			money.modules.push(this);
			return this;
		},
		
		pay: function(){
			if(!this.settings.enabled){
				return false;
			}
			
			this.workout_pay();
			
			return true;
		},
		
		workout_pay: function(){
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var wage_amount = 0;
			var wage_bonus = 0;
			
			switch(parseInt(this.settings.how_often)){
			
				// Daily
				
				case 1 :
				
					// Set default if no expire is set
					
					this.set_default(today, 0, 1);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - this.ms.day) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						wage_amount = this.get_wage_amount();
						wage_bonus = this.get_wage_bonus();
						this.set_default(today, 0, 1, true);
					}
										
					break;
					
				// Weekly
				
				case 2 :
				
					this.set_default(today, 0, 7);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - this.ms.week) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						wage_amount = this.get_wage_amount();
						wage_bonus = this.get_wage_bonus();
						this.set_default(today, 0, 7, true);
					}
					
					break;
					
				// Fortnightly
				
				case 3 :
				
					this.set_default(today, 0, 14);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - (this.ms.week * 2)) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						wage_amount = this.get_wage_amount();
						wage_bonus = this.get_wage_bonus();
						this.set_default(today, 0, 14, true);
					}
					
					break;
					
				// Monthly
				
				case 4 : 
				
					this.set_default(today, 1, 0);
					
					var expires = (this.data.e * 1000);
					var expires_date = new Date(expires);
					var new_expires_ts = new Date(expires_date.getFullYear(), expires_date.getMonth() - 1, expires_date.getDate()).getTime();
					
					if(today.getTime() >= new_Expire_ts && today.getTime() <= expires){
						this.data.p ++;
					} else {
						wage_amount = this.get_wage_amount();
						wage_bonus = this.get_wage_bonus();
						this.set_default(today, 1, 0, true);
					}
					
					break;
			
			}
			
			if(!this.settings.bonuses_enabled){
				wage_bonus = 0;
			}
			
			this.total_earned_amount = (wage_amount + wage_bonus);
			this.update_data();
		},
		
		set_default: function(todays_date, months, days, reset){
			if(!this.data.e || !this.data.e.toString().length || typeof parseInt(this.data.e) != "number" || reset){
				this.data.e = (new Date(todays_date.getFullYear(), todays_date.getMonth() + months, todays_date.getDate() + days) / 1000);
				this.data.p = 0;
			}
		},
		
		update_data: function(reset){
			if(reset){
				this.data.p = this.data.e = 0;
			}
			
			money.data.w = this.data;
			
			var into_bank = false;
			
			if(this.settings.paid_into == 1){
				into_bank = true;
			}
			
			money.add(this.total_wage_amount, into_bank, true);
			money.bank.create_transaction(5, this.total_wage_amount, 0, true);
		},
		
		get_wage_amount: function(){
			var rules = this.settings.rules;
			var amount = 0;
			
			// Loop through and find highest possible wage amount
			
			for(var a = 0, l = rules.length; a < l; a ++){
				if(this.data.p >= parseInt(rules[a].posts)){
					amount = parseFloat(rules[a].wage_amount);
				}
			}
			
			return amount;
		},
		
		get_wage_bonus: function(){
			if(this.settings.bonuses_enabled){
				return ((this.data.p * parseInt(this.settings.bonus_amount) / 100));
			}
			
			return 0;
		},
		
		clear: function(){
			this.update_data(true);
			yootil.key.set("pixeldepth_money", money.data, null, true);
		}
		
	};
	
})().register();