money.rank_up = (function(){

	return {

		data: {

			or: 0

		},

		settings: {

			enabled: true,
			paid_into: 0,
			amount: 500

		},

		init: function(){

			// Basic checking so we don't need to run setup on each page

			if(yootil.user.logged_in() && money.can_earn_money && (yootil.location.check.posting() || yootil.location.check.thread())){
				this.setup();
			}
		},

		setup: function(){
			if(money.plugin){
				this.data.or = money.data.or || yootil.user.rank().id;

				var settings = money.plugin.settings;

				this.settings.enabled = (settings.rank_up_enabled && settings.rank_up_enabled == "0")? false : this.settings.enabled;
				this.settings.amount = (settings.rank_up_how_much && parseInt(settings.rank_up_how_much) > 0)? parseInt(settings.rank_up_how_much) : this.settings.amount;
				this.settings.paid_into = (settings.rank_up_paid_into && settings.rank_up_paid_into == "1")? 1 : this.settings.paid_into;

				if(!money.bank.settings.enabled){
					this.settings.paid_into = 1;
				}
			}
		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		pay: function(){
			if(this.has_ranked_up()){
				this.update_rank();
				this.update_data();
				this.workout_pay();

				return true;
			} else if(this.no_rank()){
				this.update_data();

				return true;
			}

			return false;
		},

		workout_pay: function(){
			var into_bank = false;

			if(this.settings.paid_into == 1){
				into_bank = true;
			}

			money.add(this.settings.amount, into_bank, true);

			if(into_bank){
				money.bank.create_transaction(6, this.settings.amount, 0, true);
			}
		},

		no_rank: function(){
			if(!money.data.or){
				return true;
			}

			return false;
		},

		has_ranked_up: function(){
			var current_rank = yootil.user.rank().id;

			if(this.data.or < current_rank){
				return true;
			}

			return false;
		},

		update_rank: function(){
			this.data.or = yootil.user.rank().id;
		},

		update_data: function(){
			money.data.or = this.data.or;
		},

		clear_rank: function(){
			this.data = {};
			delete money.data.or;
			yootil.key.set("pixeldepth_money", money.data);
		}

	};

})().register();