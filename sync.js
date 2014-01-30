money.sync = (function(){

	return {

		// Called every page load to make sure we are storing the most
		// up to date data value, or things get messed up

		init: function(){
			if(!Modernizr.localstorage){
				return;
			}

			yootil.storage.set("monetary_data_sync", money.data(yootil.user.id()).get.data(), true, true);

			var self = this;

			// Delay the binding, IE fires it too quickly, grrr.

			setTimeout(function(){
				$(window).bind("storage", $.proxy(self.handle_syncing, self));
			}, 100);
		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		// Checks for the original storage event and makes sure we are
		// using the correct key.

		// Should not need domain checking

		handle_syncing: function(evt){
			if(evt && evt.originalEvent && evt.originalEvent.key == "monetary_data_sync"){
				var self = this;

				// Again, IE causing us to add in extra steps.
				// We are trying to prevent the trigger caller from
				// getting synced, there is no need, as it acts as the
				// master of the data.

				var name = window.name || "";

				if(name == "trigger_caller"){
					return;
				}

				self.sync_data(evt.originalEvent);
			}
		},

		// Here we sync the data object with the new data.
		// We do a straight swap for now, I see no reason not too.
		// Remember, this only is called when an update to the data has happened.

		// We also handle visual stuff, we don't have too but it's nice.

		// Support has been added for multiple instances of the stock market,
		// bank, and gift money.

		sync_data: function(evt){
			var old_data = evt.oldValue;
			var new_data = evt.newValue;

			// Stop here if there is no changes, the data is stringified (2 strings)
			// This prevents changing the DOM for no reason

			if(old_data == new_data){
				return;
			}

			if(new_data && yootil.is_json(new_data)){
				new_data = JSON.parse(new_data);
			} else {
				return;
			}

			// Straight up swap of new data, we trust it.

			//money.data = new_data;
			money.data(yootil.user.id()).set.data(new_data);

			// Handle gifts

			if(location.href.match(/\?monetarygift=.+?$/i)){
				var code = money.gift_money.get_gift_code();
				var gift = money.gift_money.valid_code(code);

				if(!gift || money.gift_money.has_received(code) || !money.gift_money.allowed_gift(gift)){
					$(".monetary-gift-notice-content-top").css("opacity", .3);
					$(".monetary-gift-notice-content-accept").html("You have accepted this gift in another tab / window.");
				}
			}

			// Format new money changes

			var user_money = money.data(yootil.user.id()).get.money(true);
			var user_bank_money = money.data(yootil.user.id()).get.bank(true);

			// Now lets see where we are, and attempt to update visuals

			var location_check = (yootil.location.check.search_results() || yootil.location.check.message_thread() || yootil.location.check.thread() || yootil.location.check.recent_posts() || yootil.location.check.profile_home() || yootil.location.check.members());

			if(location_check){
				var user_id = yootil.user.id();

				$(".pd_money_amount_" + user_id).text(yootil.number_format(user_money));

				if(yootil.location.check.profile_home() || yootil.location.check.members()){
					$(".pd_bank_amount_" + user_id).text(yootil.number_format(user_bank_money));
				}
			}

			// See if there is a wallet about

			var wallet = $("#pd_money_wallet_amount");

			if(wallet.length){
				wallet.text(yootil.number_format(user_money));
			}

			var other_wallet = $(".money_wallet_amount");

			if(other_wallet.length){
				other_wallet.html(money.settings.text.wallet + money.settings.money_separator + money.settings.money_symbol + user_money);
			}

			// Lets see if it's the bank, if so update the balance.
			// Don't bother with transactions, it's in the data, but
			// no need to visually update it, for now.

			// TODO: Maybe add in transactions updating.

			if(yootil.location.check.forum() && location.href.match(/\/?bank\/?/i)){
				$("#pd_money_bank_balance").text(yootil.number_format(user_bank_money));
			}

			// Update stock list

			if(yootil.location.check.forum() && location.href.match(/\/?stockmarket\/?/i)){
				if(money.stock_market.settings.enabled){
					money.stock_market.check_for_data();
					money.stock_market.current_investment_list();
				}
			}
		},

		// Sometimes we need to trigger the sync (i.e edit money dialog)
		// Due to IE not following standards, we do some window.name setting
		// to prevent the trigger caller tab / window from triggering on its self.
		// Got to love IE, nothing but headaches and workarounds.

		trigger: function(){
			if(!Modernizr.localstorage){
				return;
			}

			var old_name = (window.name && window.name != "trigger_caller")? window.name : "";

			window.name = "trigger_caller";
			yootil.storage.set("monetary_data_sync", money.data(yootil.user.id()).get.data(), true, true);
			window.name = old_name;
		}

	};

})().register();