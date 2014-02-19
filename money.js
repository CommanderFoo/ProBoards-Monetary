// TODO: Gift money icon shown by default

var money = {

	VERSION: "{VER}",

	KEY: "pixeldepth_money",

	// Force for latest released version

	required_yootil_version: "0.9.3",

	plugin: null,
	route: null,
	params: null,
	images: null,

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

	is_new_thread: false,
	is_editing: false,
	processed: false,
	using_quick_reply: false,
	can_earn_money: true,

	can_show_default: true,

	modules: [],

	user_data_table: {},

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

			if(this.modules.length){
				for(var m = 0, ml = this.modules.length; m < ml; m ++){
					if(this.modules[m].init){
						this.modules[m].init();
					}
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

	setup_user_data_table: function(){
		var all_data = proboards.plugin.keys.data[this.KEY];

		for(var key in all_data){
			var data = this.check_data(all_data[key]);

			this.user_data_table[key] = new this.Data(key, data);
		}
	},

	version: function(){
		return this.VERSION;
	},

	// Seems ProBoards now uses the JSON class (not sure how long), so we
	// need to test old data to see if it's a string, as this will be double stringified

	check_data: function(data){
		if(typeof data == "string" && yootil.is_json(data)){
			data = JSON.parse(data);
		}

		return data;
	},

	look_for_wallet: function(){
		var wallet = $(".money_wallet_amount");

		if(wallet.length){
			wallet.html(yootil.html_encode(this.settings.text.wallet + this.settings.money_separator + this.settings.money_symbol + this.data(yootil.user.id()).get.money(true)));
		}
	},

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

				msg += "<p>There is a new <strong>Monetary System</strong> version available to install / download for this forum.</p>";
				msg += "<p>This forum currently have version <strong>" + yootil.html_encode(this.VERSION) + "</strong> installed, the latest version available to install is <strong>" + data.v + "</strong>.</p>";

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

	show_default: function(){
		if(this.can_show_default){
			$("#content > *").show();
		}
	},

	format: function(str, string){
		var str = parseFloat(parseFloat(str).toFixed(2));

		if(money.settings.decimal_money){
			if(string){
				str = str.toFixed(2);
			}

			if(isNaN(str)){
				if(string){
					str = "0.00";
				} else {
					str = 0.00;
				}
			}
		} else {
			str = parseInt(Math.ceil(str));

			if(string){
				str = str.toString();
			}

			if(isNaN(str)){
				if(string){
					str = "0";
				} else {
					str = 0;
				}
			}
		}

		return str;
	},

	disable_earning: function(){
		this.can_earn_money = false;
	},

	enable_earning: function(){
		this.can_earn_money = true;
	},

	data: function(user_id){
		var user_data = this.user_data_table[((user_id)? user_id : yootil.user.id())];

		if(!user_data){
			user_data = new this.Data(user_id);
		}

		return user_data;
	},

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

	clean_money: function(money){
		return money.toString().replace(/[^\d\.]/g, "");
	},

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

	clear_auto_save: function(){
		proboards.autosave.clear();
	},

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

			// Bind validated event in case the form wasn't submitted (onsubmit is useless)

			the_form.bind("validated", function(event){
				if(!self.processed){
					if(self.is_new_thread || self.is_editing){
						var poll_input = $(this).find("input[name=has_poll]");

						self.is_poll = (poll_input && poll_input.val() == 1)? true : false;
					}

					if(hook){
						self.form_hook(hook, self.apply_posting_money);
						self.processed = false;
						self.clear_auto_save();
						this.submit();
					}

					return;
				}
			});
		}
	},

	form_hook: function(event, func){
		if(this.plugin){
			$.proxy(func, this)(event, func);
		}
	},

	apply_posting_money: function(event, hooking){
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

			// Only update if we have data changes.  This prevents a request if not hooking.

			var interest_applied = this.bank.apply_interest();
			var wages_paid = this.wages.pay();
			var rank_up_paid = this.rank_up.pay();

			if(money_to_add > 0 || interest_applied || wages_paid || rank_up_paid){
				if(hooking){
					this.data(yootil.user.id()).increase.money(money_to_add, true);
					yootil.key.get_key(this.KEY).set_on(event, null, this.data(yootil.user.id()).get.data());
				} else {
					this.data(yootil.user.id()).increase.money(money_to_add);
				}

				return true;
			}
		}

		return false;
	},

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
				this.settings.money_symbol = "<img class='money-symbol-image' src='" + settings.money_symbol_image + "' />";
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

	is_allowed_to_edit_money: function(){
		if(!this.settings.staff_edit_money || !yootil.user.logged_in() || !yootil.user.is_staff()){
			return false;
		}

		if(this.settings.who_can_edit_money.length){
			if($.inArrayLoose(yootil.user.id(), this.settings.who_can_edit_money) > -1 || yootil.user.id() == 1){
				return true;
			}

			return false;
		}

		return false;
	},

	bind_edit_dialog: function(element, user_id, bank, update_selector, edit_image){
		var self = this;
		var bank_edit = (bank)? true : false;
		var bank_str = (bank_edit)? "bank_" : "";
		var title = (bank_edit)? (this.bank.settings.text.bank + " Balance") : this.settings.money_text;

		element = $(element);

		if(self.settings.staff_edit_money && yootil.key.write(self.KEY, user_id) && yootil.user.is_staff() && (yootil.user.id() != user_id || yootil.user.id() == 1) && this.is_allowed_to_edit_money()){
			var edit_element = "<div title='Edit " + title + "'><p>" + this.settings.money_symbol + ": <input type='text' style='width: 100px' name='edit" + bank_str + "money' /></p></div>";

			element.click(function(event){
				event.stopPropagation();
				event.preventDefault();

				$(edit_element).dialog({
					modal: true,
					height: 140,
					width: 300,
					resizable: false,
					draggable: false,
					dialogClass: ("money_" + bank_str + "dialog"),
					open: function(){
						var key = (bank_edit)? "bank" : "money";
						var money = self.data(user_id).get[key](true);

						$(this).find("input[name=edit" + bank_str + "money]").val(yootil.html_encode(money));
					},

					buttons: {

						Cancel: function(){
							$(this).dialog("close");
						},

						Update: function(){
							var field = $(this).find("input[name=edit" + bank_str + "money]");
							var value = self.format(field.val());
							var value_in = value_out = 0.00;
							var key = (bank_edit)? "bank" : "money";
							var money = self.data(user_id).get[key]();

							if(value != money){
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

								$(update_element).html(yootil.html_encode(yootil.number_format(self.format(value, true))) + (edit_image || ""));

								// Don't bother performing a sync if the user
								// is editing someone else wallet or bank amounts

								if(yootil.user.id() == user_id){
									self.sync.trigger();
								}
							}

							$(this).dialog("close");
						}

					}

				}).attr("title", "Edit " + title);
			}).css("cursor", "pointer").attr("title", "Edit " + title);
		}

		return element;
	},

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
				var money_symbol = (self.settings.show_money_symbol_members)? self.settings.money_symbol : "";
				var td = $("<td class=\"pd_money_" + user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_money_amount_" + user_id + "\">" + yootil.html_encode(user_money) + "</span></td>");

				td.insertAfter($(this).find("td.posts"));

				if(self.bank.settings.enabled && self.settings.show_bank_balance_members && yootil.user.is_staff()){
					var user_bank_money = self.data(user_id).get.bank(true);
					var td = $("<td class=\"pd_bank_" + user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_bank_amount_" + user_id + "\">" + yootil.html_encode(user_bank_money) + "</span></td>");

					td.insertAfter($(this).find("td.pd_money_" + user_id));
				}
			}
		});
	},

	show_in_profile: function(){
		var user_money = this.data(this.params.user_id).get.money(true);
		var user_bank_money = this.data(this.params.user_id).get.bank(true);
		var edit_image = (this.settings.show_edit_money_image)? (" <img class='money-edit-image' src='" + this.images.edit_money + "' title='Edit' />") : "";

		if(!this.is_allowed_to_edit_money() || (this.params.user_id == yootil.user.id() && yootil.user.id() != 1)){
			edit_image = "";
		}

		var money_symbol = (this.settings.show_money_symbol_profile)? this.settings.money_symbol : "";
		var money_text = (this.settings.show_money_text_profile)? this.settings.money_text : "";

		var using_custom = false;

		var container = $("div.container.show-user");
		var money_text_custom = container.find(".money_text");
		var money_symbol_custom = container.find(".money_symbol");
		var money_amount_custom = container.find(".money_amount");

		if(money_text_custom.length || money_symbol_custom.length || money_amount_custom.length){
			using_custom = true;

			if(money_text_custom.length){
				money_text_custom.append(money_text + this.settings.money_separator).addClass("pd_money_text_" + this.params.user_id);
			}

			if(money_symbol_custom.length){
				money_symbol_custom.append(money_symbol).addClass("pd_money_symbol_" + this.params.user_id);
			}

			if(money_amount_custom.length){
				money_amount_custom.append(user_money + edit_image).addClass("pd_money_amount_" + this.params.user_id);

				this.bind_edit_dialog(money_amount_custom, this.params.user_id, false, ".pd_money_amount_" + this.params.user_id, edit_image);
			}
		}

		if(yootil.user.is_staff() && this.bank.settings.enabled){
			var bank_text_custom = container.find(".bank_text");
			var bank_symbol_custom = container.find(".bank_symbol");
			var bank_amount_custom = container.find(".bank_amount");

			if(money_text_custom.length || money_symbol_custom.length || money_amount_custom.length){
				using_custom = true;

				if(bank_text_custom.length){
					bank_text_custom.append(this.bank.settings.text.bank + " Balance" + this.settings.money_separator).addClass("pd_bank_text_" + this.params.user_id);
				}

				if(bank_symbol_custom.length){
					bank_symbol_custom.append(money_symbol).addClass("pd_bank_symbol_" + this.params.user_id);
				}

				if(bank_amount_custom.length){
					bank_amount_custom.append(user_bank_money + edit_image).addClass("pd_bank_amount_" + this.params.user_id);

					this.bind_edit_dialog(bank_amount_custom, this.params.user_id, true, ".pd_bank_amount_" + this.params.user_id, edit_image);
				}
			}
		}

		if(!using_custom){
			var post_heading = $("div.content-box.center-col td.headings:contains(Posts)");

			if(post_heading.length){
				var row = post_heading.parent();

				if(row){
					if(yootil.user.is_staff() && this.bank.settings.enabled){
						var bank_money_td = this.bind_edit_dialog("<td class=\"pd_bank_money_" + this.params.user_id + "\"><span class=\"pd_bank_money_symbol\">" + money_symbol + "</span><span class=\"pd_bank_amount_" + this.params.user_id + "\">" + yootil.html_encode(yootil.number_format(user_bank_money)) + "</span>" + edit_image + "</td>", this.params.user_id, true);

						$("<tr/>").html("<td>" + this.bank.settings.text.bank + " Balance" + this.settings.money_separator + "</td>").append(bank_money_td).insertAfter(row);
					}

					var money_td = this.bind_edit_dialog("<td class=\"pd_money_" + this.params.user_id + "\"><span class=\"pd_money_symbol\">" + money_symbol + "</span><span class=\"pd_money_amount_" + this.params.user_id + "\">" + yootil.html_encode(yootil.number_format(user_money)) + "</span>" + edit_image + "</td>", this.params.user_id, false);

					$("<tr/>").html("<td>" + money_text + this.settings.money_separator + "</td>").append(money_td).insertAfter(row);
				}
			}
		}
	},

	show_in_mini_profile: function(){
		var minis = $("div.mini-profile");

		if(minis && minis.length){
			if(minis.find("div.info span[class*=pd_money_]").length){
				return;
			}

			var self = this;

			minis.each(function(){
				var user_link = $(this).find("a.user-link[href*='user']:first");

				if(user_link && user_link.length){
					var user_id_match = user_link.attr("href").match(/\/user\/(\d+)\/?/i);

					if(user_id_match && user_id_match.length == 2){
						var user_id = user_id_match[1];
						var money = self.data(user_id).get.money(true);
						var money_text = (self.settings.show_money_text_mini)? self.settings.money_text : "";
						var money_symbol = (self.settings.show_money_symbol_mini)? self.settings.money_symbol : "";

						if(money_text.toString().length){
							money_text += self.settings.money_separator;
						}

						var money_text_custom = $(this).find(".money_text");
						var money_symbol_custom = $(this).find(".money_symbol");
						var money_amount_custom = $(this).find(".money_amount");

						if(money_text_custom.length || money_symbol_custom.length || money_amount_custom.length){
							if(money_text_custom.length){
								money_text_custom.append(money_text).addClass("pd_money_text_" + user_id);
							}

							if(money_symbol_custom.length){
								money_symbol_custom.append(money_symbol).addClass("pd_money_symbol_" + user_id);
							}

							if(money_amount_custom.length){
								money_amount_custom.append(money).addClass("pd_money_amount_" + user_id);
							}
						} else {
							var info = $(this).find("div.info");

							if(info && info.length){
								var info_div = info.get(0);
								var money_str_html = "";

								money_str_html += "<span class=\"pd_money_text_" + user_id + "\">" + money_text + "</span>";
								money_str_html += "<span class=\"pd_money_symbol_" + user_id + "\">" + money_symbol + "</span>";
								money_str_html += "<span class=\"pd_money_amount_" + user_id + "\">" + yootil.html_encode(money) + "</span><br />";

								$(info_div).prepend(money_str_html);
							}
						}
					}
				}
			});
		}
	}
};