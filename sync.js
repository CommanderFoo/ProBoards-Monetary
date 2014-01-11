money.sync = (function(){

	return {

		// Called every page load to make sure we are storing the most
		// up to date data value, or things get messed up

		init: function(){
			yootil.storage.set("monetary_data_sync", money.data, true, true);
			$(window).bind("storage", $.proxy(this.handle_syncing, this));
		},

		register: function(){
			if(!Modernizr.localstorage){
				return;
			}

			money.modules.push(this);
			return this;
		},

		// Checks for the original storage event and makes sure we are
		// using he correct key.

		// Should not need domain checking

		handle_syncing: function(evt){
			if(evt && evt.originalEvent && evt.originalEvent.key == "monetary_data_sync"){
				this.sync_data(evt.originalEvent);
			}
		},

		// Here we sync the data object with the new data.
		// We do a straight swap for now, I see no reason not too.
		// Remember, this only is called when an update to the data has happened.

		// We also handle visual stuff, we don't have too but it's nice.

		// Support could be added in for multiple instances of the stock market,
		// bank, and gift money.

		sync_data: function(evt){
			var old_data = evt.oldValue;
			var new_data = evt.newValue;

			if(new_data && yootil.is_json(new_data)){
				new_data = JSON.parse(new_data);
			} else {
				return;
			}

			// Straight up swap of new data

			money.data = new_data;

			var user_money = money.format(money.data.m, true);
			var user_bank_money = money.format(money.data.b, true);

			// Now lets see where we are, and attempt to update visuals

			var location_check = (yootil.location.check.search_results() || yootil.location.check.message_thread() || yootil.location.check.thread() || yootil.location.check.recent_posts() || yootil.location.check.profile_home() || yootil.location.check.members());

			if(location_check){
				var user_id = yootil.user.id();

				$(".pd_money_amount_" + user_id).text(yootil.number_format(user_money));

				if(yootil.location.check.profile_home()){
					$(".pd_bank_money_amount_" + user_id).text(yootil.number_format(user_bank_money));
				}
			}
		},

		// Sometimes we need to trigger the sync (i.e edit money dialog)

		trigger: function(){
			yootil.storage.set("monetary_data_sync", money.data, true, true);

			//$(window).trigger("storage");
		}

	};

})().register();