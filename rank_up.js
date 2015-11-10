/**
 * @class monetary.rank_up
 * @static
 *
 * Awards members money when they rank up.
 */

money.rank_up = (function(){

	return {

		/**
		 * @property {Object} settings Default settings which can be overwritten from setup.
		 * @property {Boolean} settings.enabled Module enabled or not.
		 * @property {Number} settings.paid_into Where the money is going to be paid into.
		 * @property {Number} amount Amount to be paid.
		 */

		settings: {

			enabled: true,
			paid_into: 0,
			amount: 500

		},

		/**
		 * This is called from the main class.  Each module gets registered and a loop goes through and calls this.
		 */

		init: function(){
			var rank = money.data(yootil.user.id()).get.rank();

			money.data(yootil.user.id()).set.rank(rank || yootil.user.rank().id, true);

			// Basic checking so we don't need to run setup on each page

			if(yootil.user.logged_in() && money.can_earn_money && (yootil.location.posting() || yootil.location.thread())){
				this.setup();
			}
		},

		/**
		 * Handles overwriting default values.  These come from the plugin settings.
		 */

		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;

				this.settings.enabled = (!! ~~ settings.rank_up_enabled)? true : false;
				this.settings.amount = (settings.rank_up_how_much && parseInt(settings.rank_up_how_much) > 0)? parseInt(settings.rank_up_how_much) : this.settings.amount;
				this.settings.paid_into = (!! ~~ settings.rank_up_paid_into)? 1 : 0;

				if(!money.bank.settings.enabled){
					this.settings.paid_into = 0;
				}
			}
		},

		/**
		 * Registers this module to the money class.
		 * @returns {Object}
		 */

		register: function(){
			money.modules.push(this);
			return this;
		},

		/**
		 * This is called when we bind the methods (from main monetary class) when key hooking when posting.
		 * @returns {Boolean}
		 */

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

		/**
		 * Here we workout the pay the user should be getting and increase either the bank or wallet values.
		 * If the bank is the option to be paid into, we also create a transaction.
		 */

		workout_pay: function(){
			var into_bank = false;

			if(this.settings.paid_into == 1){
				into_bank = true;
			}

			money.data(yootil.user.id()).increase[((into_bank)? "bank" : "money")](parseFloat(this.settings.amount), true);

			if(into_bank){
				money.bank.create_transaction(6, parseFloat(this.settings.amount), 0, true);
			}
		},

		/**
		 * Checks if the user has a rank recorded.
		 *
		 * @returns {Boolean}
		 */

		no_rank: function(){
			if(!money.data(yootil.user.id()).get.rank()){
				return true;
			}

			return false;
		},

		/**
		 * Compares the recorded rank with the users current rank to see if they have ranked up.
		 *
		 * @returns {Boolean}
		 */

		has_ranked_up: function(){
			var current_rank = yootil.user.rank().id;

			if(money.data(yootil.user.id()).get.rank() < current_rank){
				return true;
			}

			return false;
		},

		/**
		 * Updates the users rank in the data object which is stored in the key.
		 */

		update_rank: function(){
			money.data(yootil.user.id()).set.rank(yootil.user.rank().id, true);
		}

	};

})().register();