money.wages = (function(){

	return {
	
		data: {
					
			// Posts
			
			p: 0,
			
			// Timestamp expiry
			
			e: 0,
			
			// When do they get paid
			
			w: 0,
			
			// Staff expiry
		
			s: 0
		},
		
		total_wage_amount: 0,
		
		settings: {
		
			enabled: true,
			how_often: 2,
			bonuses_enabled: true,
			bonus_amount: 10,
			paid_into: 0,
			
			rules: [],
			staff_rules: []
			
		},
		
		ms: {
		
			day: 86400000,
			week: 604800000
		
		},
		
		init: function(){
		
			// Basic checking so we don't need to run setup on each page
			
			if(yootil.user.logged_in() && money.can_earn_money && (yootil.location.check.posting() || yootil.location.check.thread())){
				this.setup();
			}
		},
		
		setup: function(){
			if(money.plugin){
				this.data = money.data.w || {};
							
				var settings = money.plugin.settings;
			
				this.settings.enabled = (settings.wages_enabled && settings.wages_enabled == "0")? false : this.settings.enabled;
				this.settings.how_often = (settings.wages_how_often && parseInt(settings.wages_how_often) > 0)? parseInt(settings.wages_how_often) : this.settings.how_often;
				this.settings.bonuses_enabled = (settings.wages_enable_bonuses && settings.wages_enable_bonuses == "0")? false : this.settings.bonuses_enabled;
				this.settings.bonus_amount = (settings.wages_bonus_amount && parseInt(settings.wages_bonus_amount) > 0)? parseInt(settings.wages_bonus_amount) : this.settings.bonus_amount;
				this.settings.paid_into = (settings.wages_paid_into && settings.wages_paid_into == "1")? 1 : this.settings.paid_into;
				this.settings.rules = (settings.wage_rules && settings.wage_rules.length)? settings.wage_rules : [];
				this.settings.staff_rules = (settings.staff_wage_rules && settings.staff_wage_rules.length)? settings.staff_wage_rules : [];
				
				if(!money.bank.settings.enabled){
					this.settings.paid_into = 1;
				}
				
				// Disable wages if there are no rules
				
				if(!this.settings.rules.length && (!this.settings.staff_rules.length || !yootil.user.is_staff())){
					this.settings.enabled = false;
				}
				
				if(!this.data.p){
					this.data.p = 0;
				} else {
					this.data.p = parseInt(this.data.p);
				}
				
				if(this.data.e){
					this.data.e = parseInt(this.data.e);
				}
				
				if(!this.data.w){
					this.data.w = parseInt(this.settings.how_often);
				} else {
					this.data.w = parseInt(this.data.w);
				}
				
				if(this.data.s){
					this.data.s = parseInt(this.data.s);
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
			this.workout_staff_pay();
			
			return true;
		},
		
		pay_staff: function(){			
			this.workout_staff_pay();
		},
		
		workout_staff_pay: function(){
			var amount_per_period = this.get_staff_wage_amount();
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			
			if(!amount_per_period){
				if(!this.data.s){
					this.data.s = (today.getTime() / 1000);
					this.set_money_data();
				}
				
				return;
			}
			
			var last_paid = (this.data.s)? (this.data.s * 1000) : today.getTime();
			var when = (this.data.w)? this.data.w : this.settings.how_often;
			var diff = Math.abs(today - last_paid);
			var amount = 0;
			
			switch(when){
			
				case 1 :
					var days = Math.floor(diff / this.ms.day);
					
					amount = (days * amount_per_period);
					break;
					
				case 2 :
					var weeks = Math.floor(diff / this.ms.week);
					
					amount = (weeks * amount_per_period);
					break;
					
				case 3 :
					var fortnights = Math.floor(diff / (this.ms.week * 2));
					
					amount = (fortnights * amount_per_period);
					break;
					
				case 4 :
					var months = Math.floor(diff / (this.ms.week * 4));
					
					amount = (months * amount_per_period);
					break;
			
			}
			
			if(amount){
				var into_bank = false;
			
				if(this.settings.paid_into == 1){
					into_bank = true;
				}

				money.add(amount, into_bank, true);
				
				if(into_bank){
					money.bank.create_transaction(7, amount, 0, true);
				}
			
				this.data.s = (today.getTime() / 1000);
				this.set_money_data();
			}
		},
		
		workout_pay: function(){
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var wage_amount = 0;
			var wage_bonus = 0;
			var when = (this.data.w)? this.data.w : this.settings.how_often;
			var set_wage = false;
			
			switch(when){
			
				// Daily
				
				case 1 :
				
					// Set default if no expire is set
					
					this.set_default(today, this.settings.how_often);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - this.ms.day) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						set_wage = true;
					}
										
					break;
					
				// Weekly
				
				case 2 :
				
					this.set_default(today, this.settings.how_often);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - this.ms.week) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						set_wage = true;
					}
					
					break;
					
				// Fortnightly
				
				case 3 :
				
					this.set_default(today, this.settings.how_often);
					
					var expires = (this.data.e * 1000);
										
					if(today.getTime() >= (expires - (this.ms.week * 2)) && today.getTime() <= expires){
						this.data.p ++;
					} else {
						set_wage = true;
					}
					
					break;
					
				// Monthly
				
				case 4 : 
				
					this.set_default(today, this.settings.how_often);
					
					var expires = (this.data.e * 1000);
					var expires_date = new Date(expires);
					var new_expires_ts = new Date(expires_date.getFullYear(), expires_date.getMonth() - 1, expires_date.getDate()).getTime();
										
					if(today.getTime() >= new_expires_ts && today.getTime() <= expires){
						this.data.p ++;
					} else {
						set_wage = true;
					}
					
					break;
			
			}
			
			if(set_wage){
				wage_amount = this.get_wage_amount();
				wage_bonus = this.get_wage_bonus();
				
				if(wage_amount == 0){
					wage_bonus = 0;
				}
				
				this.set_default(today, this.settings.how_often, true);
			}
			
			if(!this.settings.bonuses_enabled){
				wage_bonus = 0;
			}
			
			this.total_earned_amount = (wage_amount + wage_bonus);
			this.update_data();
		},
	
		// If admin changes how often the member is paid, we use the stored value for the member until
		// it expires, and we keep checking so we make sure to get the member onto the forum default
		
		set_default: function(todays_date, when, reset){
			
			switch(when){
				
				case 1:
					this.set_expiry(todays_date, 0, 1, reset);
					break;
				
				case 2:
					this.set_expiry(todays_date, 0, 7, reset);
					break;
				
				case 3:
					this.set_expiry(todays_date, 0, 14, reset);
					break;
				
				case 4:
					this.set_expiry(todays_date, 1, 0, reset);
					break;
				
			}
			
			if(reset){
				this.data.p = 0;
				this.data.w = when;
			}
		},
		
		set_expiry: function(todays_date, months, days, reset){
			if(!this.data.e || !this.data.e.toString().length || typeof parseInt(this.data.e) != "number" || reset){
				this.data.e = (new Date(todays_date.getFullYear(), todays_date.getMonth() + months, todays_date.getDate() + days) / 1000);
			}
		},
		
		update_data: function(reset){
			if(reset){
				this.data.p = this.data.e = this.data.w = 0;
			}
			
			this.set_money_data();
			
			if(this.total_earned_amount > 0){
				var into_bank = false;
			
				if(this.settings.paid_into == 1){
					into_bank = true;
				}

				money.add(this.total_earned_amount, into_bank, true);
				
				if(into_bank){
					money.bank.create_transaction(5, this.total_earned_amount, 0, true);
				}
			}
		},
		
		set_money_data: function(){
			money.data.w = this.data;
		},
		
		get_wage_amount: function(){
			var rules = this.settings.rules;
			var amount = 0;
			
			// Loop through and find highest possible wage
			
			for(var a = 0, l = rules.length; a < l; a ++){
				if(this.data.p >= parseInt(rules[a].posts)){
					amount = parseFloat(rules[a].wage_amount);
				}
			}
						
			return amount;
		},
		
		get_staff_wage_amount: function(){
			var rules = this.settings.staff_rules;
			var user_groups = yootil.user.group_ids();
			var amount = 0;
			
			for(var a = 0, l = rules.length; a < l; a ++){
				for(var g = 0, l = user_groups.length; g < l; g ++){
					if($.inArrayLoose(user_groups[g], rules[a].groups) > -1){
						amount = parseFloat(rules[a].amount);
					}
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
			this.data.s = 0;
			yootil.key.set("pixeldepth_money", money.data, null, true);
		}
		
	};
	
})().register();