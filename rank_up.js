/**
* Namespace: money.rank_up
*
* 	Awards members money when they rank up.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.rank_up = (function(){

	return {

		settings: {

			enabled: true,
			paid_into: 0,
			amount: 500

		},

		init: function(){
			var rank = money.data(yootil.user.id()).get.rank();

			money.data(yootil.user.id()).set.rank(rank || yootil.user.rank().id, true);

			// Basic checking so we don't need to run setup on each page

			if(yootil.user.logged_in() && money.can_earn_money && (yootil.location.check.posting() || yootil.location.check.thread())){
				this.setup();
			}
		},

		setup: function(){
			if(money.plugin){
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
			if(!this.settings.enabled){
				return;
			}

			if(this.has_ranked_up()){
				this.update_rank();
				this.workout_pay();

				return true;
			} else if(this.no_rank()){
				return true;
			}

			return false;
		},

		workout_pay: function(){
			var into_bank = false;

			if(this.settings.paid_into == 1){
				into_bank = true;
			}

			money.data(yootil.user.id()).increase[((into_bank)? "bank" : "money")](this.settings.amount, true);

			if(into_bank){
				money.bank.create_transaction(6, this.settings.amount, 0, true);
			}
		},

		no_rank: function(){
			if(!money.data(yootil.user.id()).get.rank()){
				return true;
			}

			return false;
		},

		has_ranked_up: function(){
			var current_rank = yootil.user.rank().id;

			if(money.data(yootil.user.id()).get.rank() < current_rank){
				return true;
			}

			return false;
		},

		update_rank: function(){
			money.data(yootil.user.id()).set.rank(yootil.user.rank().id, true);
		}

	};

})().register();