/**
* Namespace: money
*
* 	Main class that handles setup, init of sub modules, post event bindings and display of money across the forum.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

var money = {

	/**
	* Property: VERSION
	*	*string* - Holds the latest version of this plugin.
	*/

	VERSION: "{VER}",

	/**
	* Property: KEY
	*	*string* - This is the ProBoards plugin key.
	*/

	KEY: "pixeldepth_money",

	/**
	* Property: required_yootil_version
	*	*string* - This is the min required Yootil version that is needed
	*/

	required_yootil_version: "0.9.3",

	/**
	* Property: plugin
	*	*object* - This holds a reference to the plugin object returned by ProBoards
	*/

	plugin: null,

	/**
	* Property: route
	*	*string* - Route gets cached here, as it gets wrote over by some AJAX responses.
	*/

	route: null,

	/**
	* Property: params
	*	*object* - Reference to ProBoards page params.
	*/

	params: null,

	/**
	* Property: images
	*	*object* - Reference to the images object from ProBoards.
	*/

	images: null,

	/**
	* Property: trigger_caller
	*	*boolean* - Used in the sync class to prevent IE from syncing the master (caller).
	*/

	trigger_caller: false,

	/**
	* Property: settings
	*	*object* - Holds all settings for this class, these update overwritten by setup.
	*/

	settings: {

		check_for_update: true,
		check_how_often: 2,

		money_text: "Money",
		money_symbol: "&pound;",
		money_separator: ":",

		decimal_money: true,

		show_in_mini_profile: true,
		show_money_text_mini: true,
		show_money_symbol_mini: true,

		show_in_profile: true,
		show_money_text_profile: true,
		show_money_symbol_profile: true,

		show_in_members_list: true,
		show_money_symbol_members: true,
		member_list_text: "Money",
		show_bank_balance_members: false,

		staff_edit_money: true,
		show_edit_money_image: true,
		who_can_edit_money: [],

		posting: {

			earn_from_quick_reply: false,
			amounts: {

				per_thread: 10,
				per_poll: 5,
				per_reply: 5,
				per_quick_reply: 5,

				categories: {},
				boards: {}

			}
		},

		no_earn_members: [],
		no_earn_groups: [],
		no_earn_categories: [],
		no_earn_boards: [],
		no_earn_threads: [],

		text: {

			wallet: "Wallet",
			money_column: "Money",
			bank_column: "Bank Balance"

		}

	},

	/**
	* Property: is_new_thread
	*	*boolean* - Updated when posting to see if it's a new thread to work out money amount.
	*/

	is_new_thread: false,

	/**
	* Property: is_editing
	*	*boolean* - Are we editing a post?  We don't want to update money if editing, so we check.
	*/

	is_editing: false,

	/**
	* Property: processed
	*	*boolean* - If money has been processed, we update here so we don't process again (this is old).
	*/

	processed: false,

	/**
	* Property: using_quick_reply
	*	*boolean* - We update this if quick reply is being used, this was before key events were added.
	*/

	using_quick_reply: false,

	/**
	* Property: can_earn_money
	*	*boolean* - This can be used to prevent money being earnt on the page.
	*/

	can_earn_money: true,

	/**
	* Property: can_show_default
	*	*boolean* - Used to show the default display of the forum.
	*/

	can_show_default: true,

	/**
	* Property: modules
	*	*array* - Modules are registered and placed in here and init later.
	*/

	modules: [],

	/**
	* Property: user_data_table
	*	*object* - A lookup table for user data objects on the page, always check here first before making a new Data instance.
	*/

	user_data_table: {},

	/**
	* Method: init
	* 	Starts the magic.
	*/

	init: function(){
		$.support.cors = true;

		if(!this.check_yootil()){
			return;
		}

		this.setup_user_data_table();
		this.setup();
		this.check_version();

		if(yootil.user.logged_in()){
			this.look_for_wallet();
			this.can_earn_money = this.can_earn();

			if(yootil.location.check.posting() || (yootil.location.check.thread() && this.settings.posting.earn_from_quick_reply)){
				if(this.can_earn_money && this.can_earn_in_cat_board()){
					this.bind_events();
				}
			}
		}

		if(this.modules.length){
			for(var m = 0, ml = this.modules.length; m < ml; m ++){
				if(this.modules[m].init){
					this.modules[m].init();
				}
			}
		}

		var location_check = (yootil.location.check.search_results() || yootil.location.check.message_thread() || yootil.location.check.thread() || yootil.location.check.recent_posts());

		if(this.settings.show_in_mini_profile && location_check){
			this.show_in_mini_profile();
			yootil.ajax.after_search(this.show_in_mini_profile, this);
		}

		if(this.settings.show_in_profile && yootil.location.check.profile_home() && this.params && this.params.user_id != "undefined"){
			this.show_in_profile();
		}

		if(this.settings.show_in_members_list && yootil.location.check.members()){
			this.show_in_members_list();
			yootil.ajax.after_search(this.show_in_members_list, this);
		}
	},

	/**
	* Method: setup_user_data_table
	* 	This sets up the lookup table for all users on the current page.  Each entry is an instance of Data.  Always
	*	look here before creating your own instance, as multiple instances would not be good.
	*
	*
	* 	It is recommended that if you do create an instance of Data to update the lookup table (key being user id).
	*/

	setup_user_data_table: function(){
		var all_data = proboards.plugin.keys.data[this.KEY];

		for(var key in all_data){
			var data = this.check_data(all_data[key]);

			this.user_data_table[key] = new this.Data(key, data);
		}
	},

	months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"],
	days: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],

	get_suffix: function(n){
		var j = (n % 10);

		if(j == 1 && n != 11){
			return "st";
		}

		if(j == 2 && n != 12){
		    return "nd";
		}

		if(j == 3 && n != 13) {
			return "rd";
		}

		return "th";
	},

	/**
	* Method: version
	* 	Gets current version of the plugin.
	*
	* Returns:
	*	*string*
	*/

	version: function(){
		return this.VERSION;
	},

	/**
	* Method: check_data
	* 	Checks the data type to make sure it's correct.  The reason for this is because ProBoards
	* 	never used to JSON stringify values, so we check to make sure it's not double stringified.
	*
	* Parameters:
	* 	data - *string* The key data.
	*
	* Returns:
	*	*object*
	*/

	check_data: function(data){
		if(typeof data == "string" && yootil.is_json(data)){
			data = JSON.parse(data);
		}

		return data;
	},

	/**
	* Method: look_for_wallet
	* 	Looks for any element with the wallet class and updates the html of it.
	*/

	look_for_wallet: function(){
		var wallet = $(".money_wallet_amount");

		if(wallet.length){
			wallet.html(this.settings.text.wallet + this.settings.money_separator + this.settings.money_symbol + yootil.html_encode(this.data(yootil.user.id()).get.money(true)));
		}
	},

	/**
	* Method: check_yootil
	* 	Yootil is needed, so we check for it, and also check that we are using the needed version.
	*
	* Returns:
	*	*boolean*
	*/

	check_yootil: function(){
		if(proboards.data && proboards.data("user") && proboards.data("user").id == 1){
			var body = "";
			var title = "";

			if(typeof yootil == "undefined"){
				title = "<div class=\"title-bar\"><h2>Monetary System - Yootil Library Not Found</h2></div>";
				body = "<p>You do not have the <a href='http://support.proboards.com/thread/429360/'>Yootil Library</a> plugin installed.</p>";
				body += "<p>Without the <a href='http://support.proboards.com/thread/429360/'>Yootil Library</a>, the <a href='http://support.proboards.com/thread/429762/'>Monetary System</a> will not work.</p>";
			} else {
				var versions = yootil.convert_versions(yootil.VERSION, this.required_yootil_version);

				if(versions[0] < versions[1]){
					title = "<div class=\"title-bar\"><h2>Monetary System - Yootil Library Needs Updating</h2></div>";
					body += "<p>The <a href='http://support.proboards.com/thread/429762/'>Monetary System</a> requires at least " + yootil.html_encode(this.required_yootil_version) + " of the <a href='http://support.proboards.com/thread/429360/'>Yootil Library</a>.</p>";
				}
			}

			if(title.length){
				var msg = "<div class='monetary-notification-content'>";

				msg += body;

				msg += "<p style='margin-top: 8px;'>For more information, please visit the <a href='http://support.proboards.com/thread/429762/#plugindownload'>Monetary System</a> forum topic on the <a href='http://support.proboards.com'>ProBoards forum</a>.</p>";

				msg += "</div>";

				var notification = "<div class=\"container monetary-yootil-notification\">";

				notification += title;
				notification += "<div class=\"content pad-all\">" + msg + "</div></div>";

				$("div#content").prepend(notification);

				return false;
			}
		}

		return true;
	},

	/**
	* Method: check_version
	* 	Checks the version of the plugin with the version on the pixelDepth.net server.  If there is a new
	* 	version, it displays a message for the main admin only.  This can be turned off in the settings.
	*/

	check_version: function(){
		if(this.settings.check_for_update && yootil.user.logged_in() && yootil.user.is_staff() && yootil.user.id() == 1){
			var data = yootil.storage.get("monetary_last_check", true);
			var first_data = false;
			var self = this;

			if(!data || !data.t){
				first_data = true;

				data = {
					t: (+ new Date()),
					v: this.VERSION
				};
			}

			var DAY = (86400 * 1000);
			var WEEK = (DAY * 7);
			var WEEK_2 = (WEEK * 2);
			var WEEK_3 = (WEEK * 3);
			var MONTH = (WEEK_2 * 2);

			var check_ts = 0;

			switch(parseInt(this.settings.check_how_often)){

				case 1 :
				case 2 :
				case 3 :
				case 4 :
				case 5 :
				case 6 :
				case 7 :
					check_ts = (DAY * parseInt(this.settings.check_how_often));
					break;

				case 8 :
					check_ts = WEEK_2;
					break;

				case 9 :
					check_ts = WEEK_3;
					break;

				case 10 :
					check_ts = MONTH;
					break;

			}

			var now = (+ new Date());

			if((data.t + check_ts) < now){
				var self = this;

				$.ajax({
					url: "http://pixeldepth.net/proboards/plugins/monetary_system/updates/update_check.php?t=" + (+ new Date),
					context: this,
					crossDomain: true,
					dataType: "json"
				}).done(function(latest){
					data.t = (+ new Date());

					var versions = yootil.convert_versions(self.VERSION, latest.v);

					if(versions[0] < versions[1]){
						data.v = latest.v;
					} else {
						data.v = self.VERSION;
					}

					yootil.storage.set("monetary_last_check", data, true, true);
				});
			}

			var versions = yootil.convert_versions(this.VERSION, data.v);

			if(versions[0] < versions[1]){
				var msg = "<div class='monetary-notification-content'>";

				msg += "<p>There is a new <strong>Monetary System</strong> version available to install for this forum.</p>";
				msg += "<p>This forum currently has version <strong>" + yootil.html_encode(this.VERSION) + "</strong> installed, the latest version available to install is <strong>" + data.v + "</strong>.</p>";

				msg += "<p style='margin-top: 8px;'>For more information, please visit the <a href='http://support.proboards.com/thread/429762/'>Monetary System</a> forum topic on the <a href='http://support.proboards.com'>ProBoards forum</a>.</p>";
				msg += "<p style='margin-top: 8px;'>This message can be disabled from the Monetary Systemy settings.</p>";
				msg += "<p style='margin-top: 8px;'><a href='http://proboards.com/library/plugins/item/90'>ProBoards Plugin Library Link</a> | <a href='http://support.proboards.com/thread/429762/'>ProBoards Monetary System Forum Link</a></p>";

				msg += "</div>";

				var notification = yootil.create.container("Staff Notification: Monetary System Update Notice", msg).show().addClass("monetary-notification");

				$("div#content").prepend(notification);
			}

			if(first_data){
				yootil.storage.set("monetary_last_check", data, true, true);
			}
		}
	},

	/**
	* Method: show_default
	* 	Shows the forum default display by showing the content div and all children.  This is generally used
	* 	in the modules where the setting for the module is disabled.
	*/

	show_default: function(){
		if(this.can_show_default){
			$("#content > *").show();
		}
	},

	/**
	* Method: format
	* 	Formats the money value into a whole or float number depending on settings.
	*
	* Parameters:
	* 	str - *str* Money value to be formatted
	* 	string - *boolean* If a string is needed back, pass in true
	*
	* Returns:
	*	*mixed*
	*
	* Examples:
	*	pixeldepth.monetary.format(33, true) // "33.00"
	*/

	format: function(str, string){
		var str = parseFloat(str);

		if(money.settings.decimal_money){
			str = str.toFixed(2);

			if(isNaN(str)){
				if(string){
					str = "0.00";
				} else {
					str = 0.00;
				}
			}
		} else {
			str = parseInt(Math.ceil(str));

			if(isNaN(str)){
				if(string){
					str = "0";
				} else {
					str = 0;
				}
			}
		}

		if(string){
			str = str.toString();
		}

		return str;
	},

	/**
	* Method: get
	* 	This is deprecated, please see the data method and Data class.
	*
	* Parameters:
	* 	format - *boolean* Money value to be formatted
	* 	bank - *boolean* Bank value or wallet value
	*
	* Returns:
	*	*integer / string*
	*
	* Examples:
	*	pixeldepth.monetary.get(true, true) // returns bank value formated i.e "33.00"
	*/

	get: function(format, bank){
		return this.data(yootil.user.id()).get[((bank)? "bank" : "money")](format);
	},

	/**
	* Method: subtract
	* 	This is deprecated, please see the data method and Data class.
	*
	* Parameters:
	* 	value - *integer* Money value to be subtracted
	* 	bank - *boolean* Substract from bank or wallet
	* 	no_update - *boolean* If true, no key update will be done
	*	opts - *object* ProBoards key options
	* 	sync - *boolean* Pass true to sync accross tabs / windows
	*/

	subtract: function(value, bank, no_update, opts, sync){
		this.data(yootil.user.id()).decrease[((bank)? "bank" : "money")](value, no_update, opts, sync);
	},

	/**
	* Method: add
	* 	This is deprecated, please see the data method and Data class.
	*
	* Parameters:
	* 	value - *integer* Money value to be added
	* 	bank - *boolean* Added to bank or wallet
	* 	no_update - *boolean* If true, no key update will be done
	*	opts - *object* ProBoards key options
	* 	sync - *boolean* Pass true to sync accross tabs / windows
	*/

	add: function(value, bank, no_update, opts, sync){
		this.data(yootil.user.id()).increase[((bank)? "bank" : "money")](value, no_update, opts, sync);
	},

	/**
	* Method: disable_earning
	* 	Display earning when posting.
	*/

	disable_earning: function(){
		this.can_earn_money = false;
	},

	/**
	* Method: enable_earning
	* 	Enable earning when posting (earning is enabled by default).
	*/

	enable_earning: function(){
		this.can_earn_money = true;
	},

	/**
	* Method: data
	* 	This is used to get the instance of the users Data class from the lookup table.  Please see the Data
	* 	class to see methods available.
	*
	* Parameters:
	* 	user_id - *integer* The user id of the users data you want.
	*
	* Returns:
	*	*object* - Data object is returned
	*
	* Examples:
	* 	pixeldepth.monetary.data(yootil.user.id()).get.money() // Returns users money
	*
	* 	pixeldepth.monetary.data(yootil.user.id()).increase.money(100) // Adds 100 to users money
	*/

	data: function(user_id){
		var user_data = this.user_data_table[((user_id)? user_id : yootil.user.id())];

		if(!user_data){
			user_data = new this.Data(user_id);
			this.user_data_table[user_id] = user_data;
		}

		return user_data;
	},

	/**
	* Method: can_earn
	* 	Checks to see if the user can earn money.
	*
	* Returns:
	* 	*boolean*
	*/

	can_earn: function(){
		if(this.settings.no_earn_members && this.settings.no_earn_members.length){
			if($.inArrayLoose(yootil.user.id(), this.settings.no_earn_members) > -1){
				return false;
			}
		}

		if(this.settings.no_earn_groups && this.settings.no_earn_groups.length){
			var user_groups = yootil.user.group_ids();

			for(var g = 0, l = user_groups.length; g < l; g ++){
				if($.inArrayLoose(user_groups[g], this.settings.no_earn_groups) > -1){
					return false;
				}
			}
		}

		return true;
	},

	/**
	* Method: clean_money
	* 	Cleans the money value to make sure it is safe and valid.
	*
	* Returns:
	* 	*string*
	*/

	clean_money: function(money){
		return money.toString().replace(/[^\d\.]/g, "");
	},

	/**
	* Method: can_earn_in_cat_board
	* 	Checks to see if money can be earned in categories and boards
	*
	* Returns:
	* 	*boolean*
	*/

	can_earn_in_cat_board: function(){
		if(this.settings.no_earn_categories && this.settings.no_earn_categories.length){
			var cat_id = parseInt(yootil.page.category.id());

			if(cat_id){
				if($.inArrayLoose(cat_id, this.settings.no_earn_categories) > -1){
					return false;
				}
			}
		}

		if(this.settings.no_earn_boards && this.settings.no_earn_boards.length){
			var board_id = parseInt(yootil.page.board.id());

			if(board_id && $.inArrayLoose(board_id, this.settings.no_earn_boards) > -1){
				return false;
			}
		}

		return true;
	},

	/**
	* Method: clear_auto_save
	* 	Clears the autosave for posts.  This was a bug reported, and this seems to fix it.
	*/

	clear_auto_save: function(){
		proboards.autosave.clear();
	},

	/**
	* Method: bind_events
	* 	Handles binding events to earn money when posting.
	*
	*
	* 	This needs cleaning up, as it contains old code before ProBoards included key events on forms.
	*/

	bind_events: function(){

		// Check if in thread or posting, then check if thread is disabled
		// from earning

		if((yootil.location.check.thread() || yootil.location.check.posting()) && this.settings.no_earn_threads.length){
			var thread_id = parseInt(yootil.page.thread.id());

			if(thread_id){
				for(var i = 0, l = this.settings.no_earn_threads.length; i < l; i ++){
					if(this.settings.no_earn_threads[i].thread_id == thread_id){
						return false;
					}
				}
			}
		}

		if(yootil.location.check.posting_thread()){
			this.is_new_thread = true;
		}

		if(yootil.location.check.editing()){
			this.is_editing = true;
		}

		var self = this;
		var the_form;
		var hook;

		if(yootil.location.check.posting()){
			the_form = yootil.form.post_form();
			hook = (this.is_new_thread)? "thread_new" : "post_new";
		} else if(yootil.location.check.thread()){
			the_form = yootil.form.post_quick_reply_form();
			this.using_quick_reply = true;
			hook = "post_quick_reply";
		}

		if(the_form.length){
			the_form.bind("submit", function(event){
				if(!self.processed){
					if(self.is_new_thread || self.is_editing){
						var poll_input = $(this).find("input[name=has_poll]");

						self.is_poll = (poll_input && poll_input.val() == 1)? true : false;
					}

					if(hook){
						self.apply_posting_money(hook);
						self.clear_auto_save();
					}
				}
			});
		}
	},

	/**
	* Method: apply_posting_money
	* 	Handles applying money for posting, wages, rank up etc.  Also overrides posting amounts if there are
	* 	category or board settings.
	*
	* Parameters:
	* 	event - *string* The key event we are hooking.
	*/

	apply_posting_money: function(event){
		if(!this.can_earn_money){
			return false;
		}

		var money_to_add = 0.00;
		var category_id = yootil.page.category.id();
		var board_id = yootil.page.board.id();

		if(board_id && this.settings.posting.amounts.boards[board_id]){
			var amounts = this.settings.posting.amounts.boards[board_id];

			this.settings.posting.amounts.per_quick_reply = amounts.per_quick_reply;
			this.settings.posting.amounts.per_reply = amounts.per_reply;
			this.settings.posting.amounts.per_poll = amounts.per_poll;
			this.settings.posting.amounts.per_thread = amounts.per_thread;
		} else if(category_id && this.settings.posting.amounts.categories[category_id]){
			var amounts = this.settings.posting.amounts.categories[category_id];

			this.settings.posting.amounts.per_quick_reply = amounts.per_quick_reply;
			this.settings.posting.amounts.per_reply = amounts.per_reply;
			this.settings.posting.amounts.per_poll = amounts.per_poll;
			this.settings.posting.amounts.per_thread = amounts.per_thread;
		}

		if(!this.is_editing && !this.is_new_thread){
			if(this.using_quick_reply){
				money_to_add += this.format(this.settings.posting.amounts.per_quick_reply);
			} else {
				money_to_add += this.format(this.settings.posting.amounts.per_reply);
			}
		}

		if(this.is_poll){
			money_to_add += this.format(this.settings.posting.amounts.per_poll);
		}

		if(this.is_new_thread){
			money_to_add += this.format(this.settings.posting.amounts.per_thread);
		}

		if(!this.processed){
			this.processed = true;

			var interest_applied = this.bank.apply_interest();
			var wages_paid = this.wages.pay();
			var rank_up_paid = this.rank_up.pay();

			if(money_to_add > 0 || interest_applied || wages_paid || rank_up_paid){
				this.data(yootil.user.id()).increase.money(money_to_add, true);
				yootil.key.get_key(this.KEY).set_on(event, null, this.data(yootil.user.id()).get.data());
			}
		}
	},

	/**
	* Method: setup
	* 	Handles basic setup for settings.
	*/

	setup: function(){
		this.route = (proboards.data("route") && proboards.data("route").name)? proboards.data("route").name.toLowerCase() : "";
		this.params = (this.route && proboards.data("route").params)? proboards.data("route").params : "";
		this.plugin = proboards.plugin.get("pixeldepth_monetary");

		if(this.plugin && this.plugin.settings){
			this.images = this.plugin.images;

			var settings = this.plugin.settings;

			this.settings.show_in_mini_profile = (settings.show_in_mini_profile == "0")? false : this.settings.show_in_mini_profile;
			this.settings.show_money_text_mini = (settings.show_money_text_mini == "0")? false : this.settings.show_money_text_mini;
			this.settings.show_money_symbol_mini = (settings.show_money_symbol_mini == "0")? false : this.settings.show_money_symbol_mini;

			this.settings.show_in_profile = (settings.show_in_profile == "0")? false : this.settings.show_in_profile;
			this.settings.show_money_text_profile = (settings.show_money_text_profile == "0")? false : this.settings.show_money_text_profile;
			this.settings.show_money_symbol_profile = (settings.show_money_symbol_profile == "0")? false : this.settings.show_money_symbol_profile;

			this.settings.show_in_members_list = (settings.show_in_members_list == "0")? false : this.settings.show_in_members_list;
			this.settings.show_money_symbol_members = (settings.show_money_symbol_members == "0")? false : this.settings.show_money_symbol_members;
			this.settings.show_bank_balance_members = (settings.show_bank_balance_members == "1")? true : this.settings.show_bank_balance_members;

			this.settings.text.money_column = (settings.member_list_text && settings.member_list_text.length)? settings.member_list_text : ((settings.money_text && settings.money_text.length)? settings.money_text : this.settings.text.money_column);
			this.settings.text.bank_column = (settings.bank_column_text && settings.bank_column_text.length)? settings.bank_column_text : this.settings.text.bank_column;

			this.settings.staff_edit_money = (settings.staff_edit_money == "0")? false : this.settings.staff_edit_money;
			this.settings.show_edit_money_image = (settings.show_edit_money_image == "0")? false : this.settings.show_edit_money_image;

			if(settings.edit_money_image && settings.edit_money_image.length){
				this.images.edit_money = settings.edit_money_image;
			}

			if(settings.who_can_edit_money && settings.who_can_edit_money.length){
				this.settings.who_can_edit_money = settings.who_can_edit_money;
			}

			this.settings.check_for_update = (settings.check_for_update && settings.check_for_update == "0")? false : true;
			this.settings.check_how_often = (settings.check_how_often && settings.check_how_often.length)? settings.check_how_often : 2;

			this.bank.settings.enabled = (settings.bank_enabled == "0")? false : this.bank.settings.enabled;

			this.settings.money_text = settings.money_text;
			this.settings.money_symbol = settings.money_symbol;
			this.settings.money_separator = (settings.separator && settings.separator.length)? settings.separator : this.settings.money_separator;

			this.settings.money_separator += (settings.separator_space && settings.separator_space == "0")? "" : " ";

			if(settings.money_symbol_image && settings.money_symbol_image.length){
				this.settings.money_symbol = "<img class='money-sym-img' src='" + settings.money_symbol_image + "' />";
			}

			this.settings.decimal_money = (settings.decimal_money == "0")? false : this.settings.decimal_money;

			this.settings.posting.earn_from_quick_reply = (parseInt(settings.earn_from_quick_reply) || this.settings.posting.earn_from_quick_reply);

			this.settings.posting.amounts.per_thread = this.format(settings.money_per_thread);
			this.settings.posting.amounts.per_poll = this.format(settings.money_per_poll);
			this.settings.posting.amounts.per_reply = this.format(settings.money_per_reply);
			this.settings.posting.amounts.per_quick_reply = this.format(settings.money_per_quick_reply);

			if(settings.categories_earn_amounts && settings.categories_earn_amounts.length){
				for(var c = 0, cl = settings.categories_earn_amounts.length; c < cl; c ++){
					var cat_earn_amounts = settings.categories_earn_amounts[c];

					var cat_amounts = {
						per_thread: this.format(cat_earn_amounts.money_per_thread),
						per_poll: this.format(cat_earn_amounts.money_per_poll),
						per_reply: this.format(cat_earn_amounts.money_per_reply),
						per_quick_reply: this.format(cat_earn_amounts.money_per_quick_reply)
					};

					for(var ci = 0, cil = cat_earn_amounts.category.length; ci < cil; ci ++){
						this.settings.posting.amounts.categories[cat_earn_amounts.category[ci]] = cat_amounts;
					}
				}
			}

			if(settings.boards_earn_amounts && settings.boards_earn_amounts.length){
				for(var b = 0, bl = settings.boards_earn_amounts.length; b < bl; b ++){
					var board_earn_amounts = settings.boards_earn_amounts[b];

					var board_amounts = {
						per_thread: this.format(board_earn_amounts.money_per_thread),
						per_poll: this.format(board_earn_amounts.money_per_poll),
						per_reply: this.format(board_earn_amounts.money_per_reply),
						per_quick_reply: this.format(board_earn_amounts.money_per_quick_reply)
					};

					for(var bi = 0, bil = board_earn_amounts.board.length; bi < bil; bi ++){
						this.settings.posting.amounts.boards[board_earn_amounts.board[bi]] = board_amounts;
					}
				}
			}

			this.settings.no_earn_members = settings.no_earn_members;
			this.settings.no_earn_groups = settings.no_earn_groups;
			this.settings.no_earn_categories = settings.no_earn_categories;
			this.settings.no_earn_boards = settings.no_earn_boards;
			this.settings.no_earn_threads = settings.no_earn_threads;

			this.settings.text.wallet = (settings.wallet_text && settings.wallet_text.length)? settings.wallet_text : this.settings.text.wallet;
		}
	},

	/**
	* Method: is_allowed_to_edit_money
	* 	Checks if the user is allowed to edit another users money.  If main admin, they can edit their own.
	*
	* Returns:
	* 	*boolean*
	*/

	is_allowed_to_edit_money: function(){
		if(!this.settings.staff_edit_money || !yootil.user.logged_in() || !yootil.user.is_staff()){
			return false;
		}

		if(this.settings.who_can_edit_money.length){
			if($.inArrayLoose(yootil.user.id(), this.settings.who_can_edit_money) > -1 || yootil.user.id() == 1){
				return true;
			}

			return false;
		} else if(yootil.user.id() == 1){
			return true;
		}

		return false;
	},

	/**
	* Method: bind_edit_dialog
	* 	Binds a dialog to the money and bank values on a users profile so staff with permissions can edit those values
	* 	easily.
	*
	* Parameters:
	* 	element - *string* HTML element we are binding too (not really needed though).
	* 	user_id - *integer* The users id we are binding to for editing.
	* 	bank - *boolean* Is this a bank bind or wallet?
	* 	update_selector - *string* Selector for the element we need to update after editing money.
	* 	edit_image - *string* The edit image next to the money value.
	*
	* Returns:
	* 	*object* - HTML elment jQuery wrapped
	*/

	bind_edit_dialog: function(element, user_id, bank, update_selector, edit_image){
		var self = this;
		var bank_edit = (bank)? true : false;
		var bank_str = (bank_edit)? "bank_" : "";
		var title = (bank_edit)? (this.bank.settings.text.bank + " Balance") : this.settings.money_text;

		element = $(element);

		if(self.settings.staff_edit_money && yootil.key.write(self.KEY, user_id) && yootil.user.is_staff() && (yootil.user.id() != user_id || yootil.user.id() == 1) && this.is_allowed_to_edit_money()){
			var edit_html = "";

			edit_html += "<p>" + this.settings.money_symbol + ": <input type='text' style='width: 100px' name='edit_" + bank_str + "money' /> <button id='set_" + bank_str + "money'>Set</button> <button id='reset_" + bank_str + "money'>Reset</button></p>";
			edit_html += "<p style='margin-top: 10px;'>" + this.settings.money_symbol + ": <input type='text' style='width: 100px' name='edit_specific_" + bank_str + "money' value='" + this.format(0, true) + "' /> <button id='add_specific_" + bank_str + "money'>Add</button> <button id='remove_specific_" + bank_str + "money'>Remove</button></p>";

			edit_html = $("<span />").html(edit_html);

			element.click(function(event){
				proboards.dialog("edit_money", {

					title: ("Edit " + title),
					modal: true,
					height: 180,
					width: 300,
					resizable: false,
					draggable: false,
					html: edit_html,

					open: function(){
						var key = (bank_edit)? "bank" : "money";
						var money = self.data(user_id).get[key]();

						$(this).find("input[name=edit_" + bank_str + "money]").val(yootil.html_encode(self.format(money)));
					},

					buttons: {

						Close: function(){
							$(this).dialog("close");
						}

					}

				});

				$(edit_html).find("button#set_" + bank_str + "money").click(function(){
					var field = $(this).parent().find("input[name=edit_" + bank_str + "money]");
					var value = parseFloat(field.val());
					var key = (bank_edit)? "bank" : "money";
					var money = parseFloat(self.data(user_id).get[key]());
					var value_in = value_out = 0.00;

					if(value != money){
						value = (value < 0)? 0 : value;
						self.data(user_id).set[key](value);

						if(bank_edit){
							if(value > money){
								value_in = (value - money);
							} else {
								value_out = (money - value);
							}

							transactions = self.bank.create_transaction(4, value_in, value_out, true, value, user_id);
							self.data(user_id).set.transactions(transactions, true);
						}

						self.data(user_id).update();

						var update_element = (update_selector)? update_selector : (".pd_" + ((bank)? "" : "money_") + bank_str + "amount_" + user_id);

						$(update_element).html(yootil.html_encode(self.data(user_id).get[key](true)) + (edit_image || ""));

						if(yootil.user.id() == user_id){
							self.sync.trigger();
						}
					}
				});

				$(edit_html).find("button#reset_" + bank_str + "money").click(function(){
					var value = 0;
					var key = (bank_edit)? "bank" : "money";
					var money = self.data(user_id).get[key]();
					var value_in = value_out = 0.00;

					if(money > 0){
						$(this).parent().find("input[name=edit_" + bank_str + "money]").val(self.format(0, true));

						self.data(user_id).set[key](value);

						if(bank_edit){
							value_in = 0;
							value_out = money;

							transactions = self.bank.create_transaction(4, value_in, value_out, true, value, user_id);
							self.data(user_id).set.transactions(transactions, true);
						}

						self.data(user_id).update();

						var update_element = (update_selector)? update_selector : (".pd_" + ((bank)? "" : "money_") + bank_str + "amount_" + user_id);

						$(update_element).html(yootil.html_encode(self.data(user_id).get[key](true)) + (edit_image || ""));

						if(yootil.user.id() == user_id){
							self.sync.trigger();
						}
					}
				});

				var add_remove_click = function(){
					var field = $(this).parent().find("input[name=edit_specific_" + bank_str + "money]");
					var value = parseFloat(field.val());
					var money_type_key = (bank_edit)? "bank" : "money";
					var value_in = value_out = 0.00;
					var action_key = ($(this).attr("id").match("remove"))? "decrease" : "increase";

					if(value){
						if(action_key == "decrease"){
							var current = self.data(user_id).get[money_type_key]();

							if(current == 0){
								return;
							}

							if(value > current){
								value = current;
							}
						}

						self.data(user_id)[action_key][money_type_key](value);

						if(bank_edit){
							if(action_key == "decrease"){
								value_out = value;
							} else {
								value_in = value;
							}

							transactions = self.bank.create_transaction(4, value_in, value_out, true, value, user_id);
							self.data(user_id).set.transactions(transactions, true);
						}

						self.data(user_id).update();

						var update_element = (update_selector)? update_selector : (".pd_" + ((bank)? "" : "money_") + bank_str + "amount_" + user_id);

						$(update_element).html(yootil.html_encode(self.data(user_id).get[money_type_key](true)) + (edit_image || ""));

						if(yootil.user.id() == user_id){
							self.sync.trigger();
						}
					}
				};

				var add = $(edit_html).find("button#add_specific_" + bank_str + "money");
				var remove = $(edit_html).find("button#remove_specific_" + bank_str + "money");

				add.click(add_remove_click);
				remove.click(add_remove_click);
			}).css("cursor", "pointer").attr("title", "Edit " + title);
		}

		return element;
	},

	/**
	* Method: show_in_members_list
	* 	Adds money and bank money to the members list.
	*/

	show_in_members_list: function(no_th){
		if($("td[class^=pd_money_]").length){
			return;
		}

		var self = this;
		var table = $("div.content.cap-bottom table.list");

		if(table.find("th.pd_money_th").length == 0){
			$("<th class=\"pd_money_th\" style=\"width: 12%\">" + this.settings.text.money_column + "</th>").insertAfter(table.find("tr.head th.posts"));
		}

		if(this.bank.settings.enabled && this.settings.show_bank_balance_members && yootil.user.is_staff()){
			if(table.find("th.pd_money_bank_th").length == 0){
				$("<th class=\"pd_money_bank_th\" style=\"width: 12%\">" + this.settings.text.bank_column + "</th>").insertAfter(table.find("tr.head th.pd_money_th"));
			}
		}

		table.find("tr.member[id=*member]").each(function(){
			if(this.id.match(/^member\-(\d+)/i)){
				var user_id = RegExp.$1;
				var user_money = self.data(user_id).get.money(true);
				var money_sym = (self.settings.show_money_symbol_members)? self.settings.money_symbol : "";
				var td = $("<td class=\"pd_money_" + user_id + "\"><span class=\"pd_money_symbol\">" + money_sym + "</span><span class=\"pd_money_amount_" + user_id + "\">" + yootil.html_encode(user_money) + "</span></td>");

				td.insertAfter($(this).find("td.posts"));

				if(self.bank.settings.enabled && self.settings.show_bank_balance_members && yootil.user.is_staff()){
					var user_bank = self.data(user_id).get.bank(true);
					var td = $("<td class=\"pd_bank_" + user_id + "\"><span class=\"pd_money_symbol\">" + money_sym + "</span><span class=\"pd_bank_amount_" + user_id + "\">" + yootil.html_encode(user_bank) + "</span></td>");

					td.insertAfter($(this).find("td.pd_money_" + user_id));
				}
			}
		});
	},

	custom_money_tpl: function(container, user_money, edit_image, money_text, money_symbol, user_id, context){
		var money_text_cust = container.find(".money_text");
		var money_symbol_cust = container.find(".money_symbol");
		var money_amount_cust = container.find(".money_amount");

		if(money_text_cust.length || money_symbol_cust.length || money_amount_cust.length){
			if(money_text_cust.length){
				money_text_cust.append(money_text).addClass("pd_money_text_" + user_id);
			}

			if(money_symbol_cust.length){
				money_symbol_cust.append(money_symbol).addClass("pd_money_symbol_" + user_id);
			}

			if(money_amount_cust.length){
				money_amount_cust.append(user_money + edit_image).addClass("pd_money_amount_" + user_id);

				if(edit_image){
					context.bind_edit_dialog(money_amount_cust, user_id, false, ".pd_money_amount_" + user_id, edit_image);
				}
			}

			return true;
		}

		return false;
	},

	custom_bank_tpl: function(container, user_bank_money, edit_image, bank_text, show_bank_balance, money_symbol, user_id, context){
		if(show_bank_balance){
			var bank_text_cust = container.find(".bank_text");
			var bank_symbol_cust = container.find(".bank_symbol");
			var bank_amount_cust = container.find(".bank_amount");

			if(bank_text_cust.length || bank_symbol_cust.length || bank_amount_cust.length){
				using_custom = true;

				if(bank_text_cust.length){
					bank_text_cust.append(bank_text).addClass("pd_bank_text_" + user_id);
				}

				if(bank_symbol_cust.length){
					bank_symbol_cust.append(money_symbol).addClass("pd_bank_symbol_" + user_id);
				}

				if(bank_amount_cust.length){
					bank_amount_cust.append(user_bank_money + edit_image).addClass("pd_bank_amount_" + user_id);

					if(edit_image){
						context.bind_edit_dialog(bank_amount_cust, user_id, true, ".pd_bank_amount_" + user_id, edit_image);
					}
				}

				return true;
			}
		}

		return false;
	},

	custom_donations_sent_tpl: function(container, user_donations_sent, sent_text, money_symbol, user_id, context){
		if(this.donation.settings.show_total_sent_profile){
			var donations_sent_cust = container.find(".donations_sent_text");
			var donations_sent_symbol_cust = container.find(".donations_sent_symbol");
			var donations_sent_amount_cust = container.find(".donations_sent_amount");

			if(donations_sent_cust.length || donations_sent_symbol_cust.length || donations_sent_amount_cust.length){
				using_custom = true;

				if(donations_sent_cust.length){
					donations_sent_cust.append(sent_text).addClass("pd_donations_sent_text_" + user_id);
				}

				if(donations_sent_symbol_cust.length){
					donations_sent_symbol_cust.append(money_symbol).addClass("pd_donations_sent_symbol_" + user_id);
				}

				if(donations_sent_amount_cust.length){
					donations_sent_amount_cust.append(user_donations_sent).addClass("pd_donations_sent_amount_" + user_id);
				}

				return true;
			}
		}

		return false;
	},

	custom_donations_received_tpl: function(container, user_donations_received, received_text, money_symbol, user_id, context){
		if(this.donation.settings.show_total_received_profile){
			var donations_received_cust = container.find(".donations_received_text");
			var donations_received_symbol_cust = container.find(".donations_received_symbol");
			var donations_received_amount_cust = container.find(".donations_received_amount");

			if(donations_received_cust.length || donations_received_symbol_cust.length || donations_received_amount_cust.length){
				using_custom = true;

				if(donations_received_cust.length){
					donations_received_cust.append(received_text).addClass("pd_donations_received_text_" + user_id);
				}

				if(donations_received_symbol_cust.length){
					donations_received_symbol_cust.append(money_symbol).addClass("pd_donations_received_symbol_" + user_id);
				}

				if(donations_received_amount_cust.length){
					donations_received_amount_cust.append(user_donations_received).addClass("pd_donations_received_amount_" + user_id);
				}

				return true;
			}
		}

		return false;
	},

	/**
	* Method: show_in_profile
	* 	Adds money and bank money to the members profile.
	*/

	show_in_profile: function(){
		var user_money = this.data(this.params.user_id).get.money(true);
		var user_bank_money = this.data(this.params.user_id).get.bank(true);
		var user_donations_sent = this.data(this.params.user_id).get.total_sent_donations(true);
		var user_donations_received = this.data(this.params.user_id).get.total_received_donations(true);

		var edit_image = (this.settings.show_edit_money_image)? (" <img class='money-edit-image' src='" + this.images.edit_money + "' title='Edit' />") : "";

		if(!this.is_allowed_to_edit_money() || (this.params.user_id == yootil.user.id() && yootil.user.id() != 1)){
			edit_image = "";
		}

		var money_symbol = (this.settings.show_money_symbol_profile)? this.settings.money_symbol : "";
		var money_text = (this.settings.show_money_text_profile)? this.settings.money_text : "";
		var bank_text = (this.bank.settings.text.bank)? this.bank.settings.text.bank : "";
		var donations_received_text = (this.donation.settings.text.donations)? this.donation.settings.text.donations : "";
		var donations_sent_text = (this.donation.settings.text.donations)? this.donation.settings.text.donations : "";
		var using_custom = false;
		var show_bank_balance = false;
		var container = $("div.container.show-user");

		if(money_text.toString().length){
			money_text += this.settings.money_separator;
		}

		if(bank_text.toString().length){
			bank_text += " Balance" + this.settings.money_separator;
		}

		if(donations_sent_text.toString().length){
			donations_sent_text += " Sent" + this.settings.money_separator;
		}

		if(donations_received_text.toString().length){
			donations_received_text += " Received" + this.settings.money_separator;
		}

		if(this.bank.settings.enabled && this.bank.settings.show_bank_profile){
			if((this.bank.settings.show_bank_staff_only && yootil.user.is_staff()) || !this.bank.settings.show_bank_staff_only){
				show_bank_balance = true;
			}
		}

		using_custom = (this.custom_money_tpl(container, user_money, edit_image, money_text, money_symbol, this.params.user_id, this))? true : using_custom;

		using_custom = (this.custom_bank_tpl(container, user_bank_money, edit_image, bank_text, show_bank_balance, money_symbol, this.params.user_id, this))? true : using_custom;

		using_custom = (this.custom_donations_sent_tpl(container, user_donations_sent, donations_sent_text, money_symbol, this.params.user_id, this))? true : using_custom;

		using_custom = (this.custom_donations_received_tpl(container, user_donations_received, donations_received_text, money_symbol, this.params.user_id, this))? true : using_custom;

		if(!using_custom){
			var post_head = $("div.content-box.center-col td.headings:contains(Posts)");

			if(post_head.length){
				var row = post_head.parent();

				if(row){
					if(this.donation.settings.enabled){
						if(this.donation.settings.show_total_received_profile){
							var donations_received_td = $("<td class=\"pd_donations_received_" + this.params.user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_donations_received_amount_" + this.params.user_id + "\">" + yootil.html_encode(user_donations_received) + "</span></td>");

							$("<tr/>").html("<td>" + donations_received_text + "</td>").append(donations_received_td).insertAfter(row);
						}

						if(this.donation.settings.show_total_sent_profile){
							var donations_sent_td = $("<td class=\"pd_donations_sent_" + this.params.user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_donations_sent_amount_" + this.params.user_id + "\">" + yootil.html_encode(user_donations_sent) + "</span></td>");

							$("<tr/>").html("<td>" + donations_sent_text + "</td>").append(donations_sent_td).insertAfter(row);
						}
					}

					if(show_bank_balance){
						var bank_td = this.bind_edit_dialog("<td class=\"pd_bank_money_" + this.params.user_id + "\"><span class=\"pd_bank_money_symbol\">" + money_symbol + "</span><span class=\"pd_bank_amount_" + this.params.user_id + "\">" + yootil.html_encode(user_bank_money) + "</span>" + edit_image + "</td>", this.params.user_id, true);

						$("<tr/>").html("<td>" + bank_text + "</td>").append(bank_td).insertAfter(row);
					}

					var money_td = this.bind_edit_dialog("<td class=\"pd_money_" + this.params.user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_money_amount_" + this.params.user_id + "\">" + yootil.html_encode(user_money) + "</span>" + edit_image + "</td>", this.params.user_id, false);

					$("<tr/>").html("<td>" + money_text + "</td>").append(money_td).insertAfter(row);
				}
			}
		}
	},

	/**
	* Method: show_in_mini_profile
	* 	Adds money members mini profile.
	*/

	show_in_mini_profile: function(){
		var minis = $("div.mini-profile");

		if(minis && minis.length){
			if(minis.find("div.info span[class*=pd_money_]").length){
				return;
			}

			var self = this;
			var money_text = (this.settings.show_money_text_mini)? this.settings.money_text : "";
			var money_symbol = (this.settings.show_money_symbol_mini)? this.settings.money_symbol : "";
			var bank_text = (this.bank.settings.text.bank)? this.bank.settings.text.bank : "";
			var donations_received_text = (this.donation.settings.text.donations)? this.donation.settings.text.donations : "";
			var donations_sent_text = (this.donation.settings.text.donations)? this.donation.settings.text.donations : "";

			if(money_text.toString().length){
				money_text += this.settings.money_separator;
			}

			if(bank_text.toString().length){
				bank_text += " Balance" + this.settings.money_separator;
			}

			if(donations_sent_text.toString().length){
				donations_sent_text += " Sent" + this.settings.money_separator;
			}

			if(donations_received_text.toString().length){
				donations_received_text += " Received" + this.settings.money_separator;
			}

			var show_bank_balance = false;

			if(self.bank.settings.enabled && self.bank.settings.show_bank_mini_profile){
				if((self.bank.settings.show_bank_staff_only && yootil.user.is_staff()) || !self.bank.settings.show_bank_staff_only){
					show_bank_balance = true;
				}
			}

			minis.each(function(){
				var user_link = $(this).find("a.user-link[href*='user']:first");

				if(user_link && user_link.length){
					var user_id_match = user_link.attr("href").match(/\/user\/(\d+)\/?/i);

					if(user_id_match && user_id_match.length == 2){
						var user_id = user_id_match[1];
						var money = self.data(user_id).get.money(true);
						var user_bank_money = self.data(user_id).get.bank(true);
						var user_donations_sent = self.data(user_id).get.total_sent_donations(true);
						var user_donations_received = self.data(user_id).get.total_received_donations(true);
						var using_custom = false;

						using_custom = (self.custom_money_tpl($(this), money, "", money_text, money_symbol, user_id, self))? true : using_custom;

						using_custom = (self.custom_bank_tpl($(this), user_bank_money, "", bank_text, show_bank_balance, money_symbol, user_id, self))? true : using_custom;

						using_custom = (self.custom_donations_sent_tpl($(this), user_donations_sent, donations_sent_text, money_symbol, user_id, self))? true : using_custom;

						using_custom = (self.custom_donations_received_tpl($(this), user_donations_received, donations_received_text, money_symbol, user_id, self))? true : using_custom;

						if(!using_custom){
							var info = $(this).find("div.info");

							if(info && info.length){
								var div = info.get(0);
								var str = "";

								str += "<span class=\"pd_money_text_" + user_id + "\">" + money_text + "</span>";
								str += "<span class=\"pd_money_symbol_" + user_id + "\">" + money_symbol + "</span>";
								str += "<span class=\"pd_money_amount_" + user_id + "\">" + yootil.html_encode(money) + "</span><br />";

								if(show_bank_balance){
									str += "<span class=\"pd_bank_text_" + user_id + "\">" + bank_text + "</span>";
									str += "<span class=\"pd_bank_symbol_" + user_id + "\">" + money_symbol + "</span>";
									str += "<span class=\"pd_bank_amount_" + user_id + "\">" + yootil.html_encode(user_bank_money) + "</span><br />";
								}

								if(self.donation.settings.enabled){
									if(self.donation.settings.show_total_sent_mini_profile){
										str += "<span class=\"pd_donations_sent_text_" + user_id + "\">" + donations_sent_text + "</span>";
										str += "<span class=\"pd_donations_sent_symbol_" + user_id + "\">" + money_symbol + "</span>";
										str += "<span class=\"pd_donations_sent_amount_" + user_id + "\">" + yootil.html_encode(user_donations_sent) + "</span><br />";
									}

									if(self.donation.settings.show_total_received_mini_profile){
										str += "<span class=\"pd_donations_received_text_" + user_id + "\">" + donations_received_text + "</span>";
										str += "<span class=\"pd_donations_received_symbol_" + user_id + "\">" + money_symbol + "</span>";
										str += "<span class=\"pd_donations_received_amount_" + user_id + "\">" + yootil.html_encode(user_donations_received) + "</span><br />";
									}
								}

								$(div).prepend(str);
							}
						}
					}
				}
			});
		}
	}
};