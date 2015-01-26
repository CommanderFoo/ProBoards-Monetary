/**
* Namespace: money.wages
*
* 	Allows members and staff to earn wages from actively posting.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

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
				var settings = money.plugin.settings;

				this.settings.enabled = (!! ~~ settings.wages_enabled)? true : false;
				this.settings.how_often = (settings.wages_how_often && parseInt(settings.wages_how_often) > 0)? parseInt(settings.wages_how_often) : this.settings.how_often;
				this.settings.bonuses_enabled = (!! ~~ settings.wages_enable_bonuses)? true : false;
				this.settings.bonus_amount = (settings.wages_bonus_amount && parseInt(settings.wages_bonus_amount) > 0)? parseInt(settings.wages_bonus_amount) : this.settings.bonus_amount;
				this.settings.paid_into = (!! ~~ settings.wages_paid_into)? 1 : 0;
				this.settings.rules = (settings.wage_rules && settings.wage_rules.length)? settings.wage_rules : [];
				this.settings.staff_rules = (settings.staff_wage_rules && settings.staff_wage_rules.length)? settings.staff_wage_rules : [];

				if(!money.bank.settings.enabled){
					this.settings.paid_into = 1;
				}

				// Disable wages if there are no rules

				if(!this.settings.rules.length && (!this.settings.staff_rules.length || !yootil.user.is_staff())){
					this.settings.enabled = false;
				}

				var data = money.data(yootil.user.id()).get.wages();

				if(!data.p){
					data.p = 0;
				} else {
					data.p = parseInt(data.p);
				}

				if(data.e){
					data.e = parseInt(data.e);
				}

				if(!data.w){
					data.w = parseInt(this.settings.how_often);
				} else {
					data.w = parseInt(data.w);
				}

				if(data.s){
					data.s = parseInt(data.s);
				}

				money.data(yootil.user.id()).set.wages(data, true);
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
			var data = money.data(yootil.user.id()).get.wages();

			if(!amount_per_period){
				if(!data.s){
					data.s = today.getTime();
					money.data(yootil.user.id()).set.wages(data, true);
				}

				return;
			}

			var last_paid = (data.s)? (money.correct_date(data.s)) : today.getTime();
			var when = (data.w)? data.w : this.settings.how_often;
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

				money.data(yootil.user.id()).increase[((into_bank)? "bank" : "money")](amount, true);

				if(into_bank){
					money.bank.create_transaction(7, amount, 0, true);
				}

				var data = money.data(yootil.user.id()).get.wages();

				data.s = today.getTime();
				money.data(yootil.user.id()).set.wages(data, true);
			}
		},

		workout_pay: function(){
			var data = money.data(yootil.user.id()).get.wages();
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var wage_amount = 0;
			var wage_bonus = 0;
			var when = (data.w)? data.w : this.settings.how_often;
			var set_wage = false;

			switch(when){

				// Daily

				case 1 :

					// Set default if no expire is set

					this.set_default(today, this.settings.how_often);

					var expires = data.e;

					if(today.getTime() >= (expires - this.ms.day) && today.getTime() <= expires){
						data.p ++;
					} else {
						set_wage = true;
					}

					break;

				// Weekly

				case 2 :

					this.set_default(today, this.settings.how_often);

					var expires = data.e;

					if(today.getTime() >= (expires - this.ms.week) && today.getTime() <= expires){
						data.p ++;
					} else {
						set_wage = true;
					}

					break;

				// Fortnightly

				case 3 :

					this.set_default(today, this.settings.how_often);

					var expires = data.e;

					if(today.getTime() >= (expires - (this.ms.week * 2)) && today.getTime() <= expires){
						data.p ++;
					} else {
						set_wage = true;
					}

					break;

				// Monthly

				case 4 :

					this.set_default(today, this.settings.how_often);

					var expires = data.e;
					var expires_date = new Date(expires);
					var new_expires_ts = new Date(expires_date.getFullYear(), expires_date.getMonth() - 1, expires_date.getDate()).getTime();

					if(today.getTime() >= new_expires_ts && today.getTime() <= expires){
						data.p ++;
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

			money.data(yootil.user.id()).set.wages(data, true);

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
				var data = money.data(yootil.user.id()).get.wages();

				data.p = 0;
				data.w = when;

				money.data(yootil.user.id()).set.wages(data, true);
			}
		},

		set_expiry: function(todays_date, months, days, reset){
			var data = money.data(yootil.user.id()).get.wages();

			if(!data.e || !data.e.toString().length || typeof parseInt(data.e) != "number" || reset){
				data.e = new Date(todays_date.getFullYear(), todays_date.getMonth() + months, todays_date.getDate() + days);
				money.data(yootil.user.id()).set.wages(data, true);
			}
		},

		update_data: function(reset){
			var data = money.data(yootil.user.id()).get.wages();

			if(reset){
				data.p = data.e = data.w = 0;
			}

			money.data(yootil.user.id()).set.wages(data, true);

			if(this.total_earned_amount > 0){
				var into_bank = false;

				if(this.settings.paid_into == 1){
					into_bank = true;
				}

				money.data(yootil.user.id()).increase[((into_bank)? "bank" : "money")](this.total_earned_amount, true);

				if(into_bank){
					money.bank.create_transaction(5, this.total_earned_amount, 0, true);
				}
			}
		},

		get_wage_amount: function(){
			var data = money.data(yootil.user.id()).get.wages();
			var rules = this.settings.rules;
			var amount = 0;

			// Loop through and find highest possible wage

			for(var a = 0, l = rules.length; a < l; a ++){
				if(data.p >= parseInt(rules[a].posts)){
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
				if(rules[a].groups){
					for(var g = 0, gl = user_groups.length; g < gl; g ++){
						if($.inArrayLoose(user_groups[g], rules[a].groups) > -1){
							amount = parseFloat(rules[a].amount);
						}
					}
				}
			}

			return amount;
		},

		get_wage_bonus: function(){
			var data = money.data(yootil.user.id()).get.wages();

			if(this.settings.bonuses_enabled){
				return ((data.p * parseInt(this.settings.bonus_amount) / 100));
			}

			return 0;
		}

	};

})().register();