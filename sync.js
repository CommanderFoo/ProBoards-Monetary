/**
* Namespace: money.sync
*
* 	Handles syncing the user data between tabs and windows.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.sync = (function(){

	return {

		/**
		* Method: init
		* 	Called every page load to make sure we are storing the most up to date data value, or things get messed up.
		*/

		init: function(){
			if(!Modernizr.localstorage){
				return;
			}

			yootil.storage.set("monetary_data_sync_" + yootil.user.id(), money.data(yootil.user.id()).get.data(), true, true);

			var self = this;

			// Delay the binding, IE fires it too quickly, grrr.

			setTimeout(function(){
				$(window).bind("storage", $.proxy(self.handle_syncing, self));
			}, 100);
		},

		/**
		* Method: register
		* 	Registers this module with the money object.
		* 	Registers this module with the money object.
		*/

		register: function(){
			money.modules.push(this);
			return this;
		},

		/**
		* Method: handle_syncing
		* 	Checks for the original storage event and makes sure we are using the correct key.
		*/

		handle_syncing: function(evt){
			if(evt && evt.originalEvent && evt.originalEvent.key == ("monetary_data_sync_" + yootil.user.id())){
				var self = this;

				// Again, IE causing us to add in extra steps.
				// We are trying to prevent the trigger caller from
				// getting synced, there is no need, as it acts as the
				// master of the data.

				if(money.trigger_caller){
					money.trigger_caller = false;
					return;
				}

				self.sync_data(evt.originalEvent);
			}
		},

		/**
		* Method: sync_data
		* 	Here we sync the data object with the new data, and we also handle visual stuff, we don't have too but it's nice.
		*
		* 	We do a straight swap for now, I see no reason not too.
		*
		*	This only is called when an update to the data has happened.
		*/

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
			money.data(yootil.user.id()).set.data(new_data, true);

			// Handle gifts

			if(location.href.match(/\?monetarygift=.+?$/i)){
				var code = money.gift.get_gift_code();
				var gift = money.gift.valid_code(code);

				if(!gift || money.gift.has_received(code) || !money.gift.allowed_gift(gift)){
					$(".monetary-gift-notice-content-top").css("opacity", .3);
					$(".monetary-gift-notice-content-accept").html("You have accepted this gift in another tab / window.");
				}
			}

			// Handle donations, make sure the user isn't trying to
			// accept the same donation multiple times

			if(location.href.match(/\?monetarydonation&view=3&id=([\d\.]+)/i)){
				var don_id = RegExp.$1;
				var the_donation = money.donation.fetch_donation(don_id);

				if(!the_donation){
					clearInterval(money.donation.interval);
					$(".monetary-donation-form").css("opacity", .3);
					$(".monetary-donation-button").hide();
					pb.window.alert("An Error Has Occurred", "This " + money.donation.settings.text.donation.toLowerCase() + " no longer exists.");
				}
			}

			// Format new money changes

			var user_money = money.data(yootil.user.id()).get.money(true);
			var user_bank_money = money.data(yootil.user.id()).get.bank(true);
			var user_donations_sent = money.data(yootil.user.id()).get.total_sent_donations(true);
			var user_donations_received = money.data(yootil.user.id()).get.total_received_donations(true);

			// Now lets see where we are, and attempt to update visuals

			var location_check = (yootil.location.search_results() || yootil.location.message_thread() || yootil.location.thread() || yootil.location.recent_posts() || yootil.location.profile_home() || yootil.location.members());

			if(location_check){
				var user_id = yootil.user.id();

				$(".pd_money_amount_" + user_id).text(yootil.number_format(user_money));
				$(".pd_bank_amount_" + user_id).text(yootil.number_format(user_bank_money));
				$(".pd_donations_sent_amount_" + user_id).text(yootil.number_format(user_donations_sent));
				$(".pd_donations_received_amount_" + user_id).text(yootil.number_format(user_donations_received));

			}

			// See if there is a wallet about

			var wallet = $("#pd_money_wallet_amount");

			if(wallet.length){
				wallet.text(yootil.number_format(user_money));
			}

			var other_wallet = $(".money_wallet_amount");

			if(other_wallet.length){
				other_wallet.html(money.settings.text.wallet + money.settings.money_separator + money.settings.money_symbol + yootil.html_encode(user_money));
			}

			// Lets see if it's the bank, if so update the balance.
			// Don't bother with transactions, it's in the data, but
			// no need to visually update it, for now.

			if(yootil.location.forum() && location.href.match(/\/?bank\/?/i)){
				$("#pd_money_bank_balance").text(yootil.number_format(user_bank_money));
			}

			// Update stock list

			if(yootil.location.forum() && location.href.match(/\/?stockmarket\/?/i)){
				if(money.stock_market.settings.enabled){
					money.stock_market.check_for_data();
					money.stock_market.current_investment_list();
				}
			}
		},

		/**
		* Method: trigger
		* 	Sometimes we need to trigger the sync (i.e edit money dialog) manually.
		*/

		trigger: function(){
			if(!Modernizr.localstorage){
				return;
			}

			money.trigger_caller = true;
			yootil.storage.set("monetary_data_sync_" + yootil.user.id(), money.data(yootil.user.id()).get.data(), true, true);
		}

	};

})().register();