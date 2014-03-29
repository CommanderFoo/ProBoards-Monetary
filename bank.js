/**
* Namespace: money.bank
*
* 	Allows members to store money in the bank, deposit, withdraw, and earn interest.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.bank = (function(){

	return {

		settings: {

			enabled: true,
			interest: 0.00,
			compact: false,
			minimum_deposit: 0.01,
			minimum_withdraw: 0.01,

			show_bank_mini_profile: false,
			show_bank_profile: true,
			show_bank_staff_only: true,

			text: {

				bank: "Bank",
				interest_rate: "Interest Rate",
				withdraw: "Withdraw",
				deposit: "Deposit",
				transactions: "Transactions",
				savings_account: "Savings Account",
				account_number: "Account Number",
				sort_code: "Sort Code",

				types: {

					DEPOSIT: "DEPOSIT",
					WITHDRAW: "WITHDRAW",
					INTEREST: "INTEREST",
					STAFFEDIT: "STAFFEDIT",
					WAGES: "WAGES",
					RANKUP: "RANKUP",
					STAFFWAGES: "STAFFWAGES",
					GIFTMONEY: "GIFTMONEY"

				}
			}

		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		init: function(){
			this.setup();

			if(!yootil.user.logged_in()){
				return;
			}

			if(this.settings.enabled){
				if(money.images.bank){
					yootil.bar.add("/?bank", money.images.bank, "Bank", "pdmsbank");
				}
			}

			if(yootil.location.check.forum() && location.href.match(/\/?bank\/?/i)){
				if(this.settings.enabled){
					this.start();
					money.can_show_default = false;
				} else {
					money.show_default();
				}
			}
		},

		start: function(){
			var self = this;

			yootil.create.page("?bank", this.settings.text.bank);
			yootil.create.nav_branch("/?bank", this.settings.text.bank);

			var account_number = this.get_account_number();
			var sort_code = this.get_sort_code();
			var html = "";

			html += '<div id="bank-overview-wrapper"><div id="bank-coin-image"><img src="' + money.images.coins + '"></div>';
			html += '<div id="bank-overview-inner">';

			html += '<div id="bank-overview-details">';
			html += '<strong>' + this.settings.text.savings_account + '</strong><br />';
			html += '<span id="bank-overview-details-account-number">' + this.settings.text.account_number + ': ' + account_number + '</span><br />';
			html += '<span id="bank-overview-details-sort-code">' + this.settings.text.sort_code + ': ' + sort_code + '</span><br /><br />';
			html += '<span id="bank-overview-details-money">' + money.settings.money_symbol + '<span id="pd_money_bank_balance">' + yootil.html_encode(money.data(yootil.user.id()).get.bank(true)) + '</span></span>';
			html += '</div>';

			html += '<div id="bank-controls">';
			html += '<div id="bank-error"><span id="pd_money_bank_error"></span></div>';
			html += '<div id="bank-controls-buttons-wrapper">';

			// I know, it's bad, but IE annoyed me.
			var _top = ($.browser.msie)? "0" : "-2";

			html += '<input type="text" value="' + money.format(0, true) + '" id="pd_money_withdraw">';
			html += ' <a id="pd_money_withdraw_button" class="button" href="#" role="button" style="top: ' + _top + 'px;">' + this.settings.text.withdraw + '</a>';
			html += '<input type="text" value="' + money.format(0, true) + '" id="pd_money_deposit">';
			html += ' <a id="pd_money_deposit_button" class="button" href="#" role="button" style="top: ' + _top + 'px;">' + this.settings.text.deposit + '</a>';
			html += '</div>';

			html += '</div>';

			html += '<br class="clear" />';

			html += '</div>';
			html += '</div>';

			var title = '<div>';

			title += '<div style="float: left">' + this.settings.text.bank + ' (' + this.settings.text.interest_rate + ': ' + this.settings.interest.toString() + '%)</div>';
			title += '<div style="float: right" id="pd_money_wallet">' + money.settings.text.wallet + ': ' + money.settings.money_symbol + '<span id="pd_money_wallet_amount">' + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + '</span></div>';

			title += '</div><br style="clear: both" />';

			var container = yootil.create.container(title, html);

			container.find("input#pd_money_deposit").focus(function(){
				$(this).val("");
			});

			container.find("input#pd_money_deposit").blur(function(){
				if(!$(this).val().length){
					$(this).val(money.format(0, true));
				}
			});

			container.find("input#pd_money_withdraw").focus(function(){
				$(this).val("");
			});

			container.find("input#pd_money_withdraw").blur(function(){
				if(!$(this).val().length){
					$(this).val(money.format(0, true));
				}
			});

			container.find("a#pd_money_deposit_button").click(function(){
				var input = container.find("input#pd_money_deposit");
				var value = input.val();

				if(!value.match(/^\d+(\.\d{1,2})?$/)){
					self.bank_error(self.settings.text.deposit + " value must be a number (i.e 56, or 56.22).");
				} else {
					if(parseFloat(value) >= parseFloat(self.settings.minimum_deposit)){
						var current_amount = money.data(yootil.user.id()).get.money();

						if(value > parseFloat(current_amount)){
							self.bank_error("You do not have enough to " + self.settings.text.deposit.toLowerCase() + " that amount.");
						} else {
							self.deposit(value);
							input.val(money.format(0, true));

							// Trigger syncing for other tabs

							money.sync.trigger();
						}
					} else {
						self.bank_error(self.settings.text.deposit + " value can't be less than " + money.format(self.settings.minimum_deposit, true) + ".");
					}
				}

				return false;
			});

			container.find("a#pd_money_withdraw_button").click(function(){
				var input = container.find("input#pd_money_withdraw");
				var value = input.val();

				if(!value.match(/^\d+(\.\d{1,2})?$/)){
					self.bank_error(self.settings.text.withdraw + " value must be a number (i.e 56, or 56.22).");
				} else {
					if(parseFloat(value) >= parseFloat(self.settings.minimum_withdraw)){
						var current_amount = money.data(yootil.user.id()).get.bank();

						if(value > parseFloat(current_amount)){
							self.bank_error("You do not have enough in the " + self.settings.text.bank.toLowerCase() + " to " + self.settings.text.withdraw.toLowerCase() + " that amount.");
						} else {
							self.withdraw(value);
							input.val(money.format(0, true));

							// Trigger syncing for other tabs

							money.sync.trigger();
						}
					} else {
						self.bank_error(self.settings.text.withdraw + " value can't be less than " + money.format(self.settings.minimum_withdraw, true) + ".");
					}
				}

				return false;
			});

			container.show().appendTo("#content").find("div.content");

			var trans_html = "";

			trans_html += '<table id="bank-transaction-list">';

			var transactions = this.get_transactions();

			if(!transactions.length){
				trans_html += '<tr class="bank-transaction-list-row"><td><em>There are no ' + this.settings.text.transactions.toLowerCase() + ' to view.</td></tr>';
			} else {
				trans_html += this.get_transaction_html_headers();

				var counter = 0;

				for(var t = 0, l = transactions.length; t < l; t ++){
					var type = "";
					var balance = transactions[t][4];

					switch(transactions[t][0]){

						case 1 :
							type = this.settings.text.types.DEPOSIT;
							break;

						case 2 :
							type = this.settings.text.types.WITHDRAW;
							break;

						case 3 :
							type = this.settings.text.types.INTEREST;
							break;

						case 4 :
							type = this.settings.text.types.STAFFEDIT;
							break;

						case 5 :
							type = this.settings.text.types.WAGES;
							break;

						case 6 :
							type = this.settings.text.types.RANKUP;
							break;

						case 7 :
							type = this.settings.text.types.STAFFWAGES;
							break;

						case 8 :
							type = this.settings.text.types.GIFTMONEY;
							break;

					}

					var in_amount = (transactions[t][1] > 0)? transactions[t][1] : "--";
					var out_amount = (transactions[t][2] > 0)? transactions[t][2] : "--";
					var date_str = this.format_transaction_date(transactions[t][3]);

					trans_html += '<tr class="bank-transaction-list-row">';
					trans_html += '<td>' + date_str + '</td>';
					trans_html += '<td>' + type + '</td>';
					trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(in_amount, true))) + '</td>';
					trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(out_amount, true))) + '</td>';
					trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(balance, true))) + '</td>';
					trans_html += '</tr>';

					counter ++;
				}
			}

			trans_html += '</table>';

			var self = this;
			var trans = yootil.create.container("Recent " + this.settings.text.transactions + " <span id='bank-clear-transactions'>(Clear)</span>", trans_html);

			trans.show().appendTo("#content");

			trans.find("#bank-clear-transactions").click(function(){
				var no_transactions = $('<tr class="bank-transaction-list-row"><td><em>There are no ' + self.settings.text.transactions.toLowerCase() + ' to view.</td></tr>');
				var list = $("#bank-transaction-list");

				list.find("tr").remove();
				list.append(no_transactions);
				self.clear_transactions();
			});
		},

		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;

				this.settings.enabled = (settings.bank_enabled == "0")? false : this.settings.enabled;
				this.settings.interest = (settings.interest_rate.toString().length)? settings.interest_rate : "1.00";
				this.settings.minimum_deposit = money.format(settings.minimum_deposit);
				this.settings.minimum_withdraw = money.format(settings.minimum_withdraw);

				if(settings.coin_image && settings.coin_image.length){
					money.images.coins = settings.coin_image;
				}

				if(settings.bank_icon && settings.bank_icon.length){
					money.images.bank = settings.bank_icon;
				}

				// Protection incase admin makes a mistake

				if(this.settings.minimum_deposit < 1){
					if(!money.settings.decimal_money){
						this.settings.minimum_deposit = 1;
					} else if(this.settings.minimum_deposit <= 0){
						this.settings.minimum_deposit = 0.01;
					}
				}

				if(this.settings.minimum_withdraw < 1){
					if(!money.settings.decimal_money){
						this.settings.minimum_withdraw = 1;
					} else if(this.settings.minimum_withdraw <= 0){
						this.settings.minimum_withdraw = 0.01;
					}
				}

				this.settings.text.bank = (settings.bank_text && settings.bank_text.length)? settings.bank_text : this.settings.text.bank;
				this.settings.text.interest_rate = (settings.interest_rate_text && settings.interest_rate_text.length)? settings.interest_rate_text : this.settings.text.interest_rate;
				this.settings.text.withdraw = (settings.withdraw_text && settings.withdraw_text.length)? settings.withdraw_text : this.settings.text.withdraw;
				this.settings.text.deposit = (settings.deposit_text && settings.deposit_text.length)? settings.deposit_text : this.settings.text.deposit;
				this.settings.text.transactions = (settings.transactions_text && settings.transactions_text.length)? settings.transactions_text : this.settings.text.transactions;
				this.settings.text.savings_account = (settings.savings_account_text && settings.savings_account_text.length)? settings.savings_account_text : this.settings.text.savings_account;
				this.settings.text.account_number = (settings.account_number_text && settings.account_number_text.length)? settings.account_number_text : this.settings.text.account_number;
				this.settings.text.sort_code = (settings.sort_code_text && settings.sort_code_text.length)? settings.sort_code_text : this.settings.text.sort_code;

				this.settings.text.types.WITHDRAW = (settings.type_withdraw_text && settings.type_withdraw_text.length)? settings.type_withdraw_text : this.settings.text.types.WITHDRAW;
				this.settings.text.types.DEPOSIT = (settings.type_deposit_text && settings.type_deposit_text.length)? settings.type_deposit_text : this.settings.text.types.DEPOSIT;
				this.settings.text.types.INTEREST = (settings.type_interest_text && settings.type_interest_text.length)? settings.type_interest_text : this.settings.text.types.INTEREST;
				this.settings.text.types.STAFFEDIT = (settings.type_staffedit_text && settings.type_staffedit_text.length)? settings.type_staffedit_text : this.settings.text.types.STAFFEDIT;
				this.settings.text.types.WAGES = (settings.type_wages_text && settings.type_wages_text.length)? settings.type_wages_text : this.settings.text.types.WAGES;
				this.settings.text.types.RANKUP = (settings.type_rankup_text && settings.type_rankup_text.length)? settings.type_rankup_text : this.settings.text.types.RANKUP;
				this.settings.text.types.STAFFWAGES = (settings.type_staff_wages_text && settings.type_staff_wages_text.length)? settings.type_staff_wages_text : this.settings.text.types.STAFFWAGES;
				this.settings.text.types.GIFTMONEY = (settings.type_gift_money_text && settings.type_gift_money_text.length)? settings.type_gift_money_text : this.settings.text.types.GIFTMONEY;

				this.settings.show_bank_mini_profile = (settings.bank_mini_profile == "1")? true : this.settings.show_bank_mini_profile;
				this.settings.show_bank_profile = (settings.bank_profile == "0")? false : this.settings.show_bank_profile;
				this.settings.show_bank_staff_only = (settings.bank_view_staff_only == "0")? false : this.settings.show_bank_staff_only;
			}
		},

		apply_interest: function(){
			if(!this.settings.enabled){
				return false;
			}

			var user_id = yootil.user.id();
			var balance = money.data(user_id).get.bank();
			var last_date = money.data(user_id).get.interest() || "";
			var now = new Date();
			var day = now.getDate();
			var month = (now.getMonth() + 1);
			var year = now.getFullYear();
			var today = (day + "/" + month + "/" + year);

			if(last_date != today){
				this.setup();

				var interest = ((parseFloat(balance) * parseFloat(this.settings.interest)) / 100);

				money.data(user_id).set.interest(today, true);

				if(balance > 0 && interest > 0){
					money.data(user_id).increase.bank(parseFloat(interest.toFixed(2)));
					this.create_transaction(3, interest, 0, true);

					return true;
				}
			}

			return false;
		},

		format_transaction_date: function(date, format){
			var date = new Date(date);
			var date_str = "";
			var date_obj = {

				d: yootil.pad(date.getDate(), 2),
				m: yootil.pad((date.getMonth() + 1), 2),
				y: date.getFullYear()

			};

			var format = yootil.user.date_format();

			if(format.length){
				var parts = format.split("/");
				var date_elems = [];

				for(var p = 0, pl = parts.length; p < pl; p ++){
					date_elems.push(date_obj[parts[p]]);
				}

				date_str = date_elems.join("/");
			} else {
				date_str = date_obj.d + "/" + date_obj.m + "/" + date_obj.y;
			}

			return date_str;
		},

		get_transaction_html_headers: function(){
			var html = "";

			html += '<tr id="bank-transaction-list-headers">';
			html += '<th>Date</th>';
			html += '<th>Type</th>';
			html += '<th>In</th>';
			html += '<th>Out</th>';
			html += '<th>Balance</th>';
			html += '</tr>';

			html += '<tr id="bank-transaction-list-headers-dotted"><td colspan="5"> </td></tr>';

			return html;
		},

		bank_error: function(error){
			var elem = $("span#pd_money_bank_error");

			if(elem.html() != error){
				elem.stop(true, false);
				elem.html(error).fadeIn("slow").fadeTo(4000, 1).fadeOut("slow", function(){
					elem.html("");
				});
			}
		},

		deposit: function(amount){
			var user_id = yootil.user.id();

			amount = parseFloat(amount);

			money.data(user_id).decrease.money(amount);
			money.data(user_id).increase.bank(amount);

			$("#pd_money_wallet_amount").html(yootil.html_encode(money.data(user_id).get.money(true)));
			$("#pd_money_bank_balance").html(yootil.html_encode(money.data(user_id).get.bank(true)));

			this.create_transaction(1, amount, 0);
		},

		withdraw: function(amount){
			var user_id = yootil.user.id();

			amount = parseFloat(amount);

			money.data(user_id).decrease.bank(amount);
			money.data(user_id).increase.money(amount);

			$("#pd_money_wallet_amount").html(yootil.html_encode(money.data(user_id).get.money(true)));
			$("#pd_money_bank_balance").html(yootil.html_encode(money.data(user_id).get.bank(true)));

			this.create_transaction(2, 0, amount);
		},

		get_account_number: function(){
			var id = yootil.user.id();

			return yootil.pad(id, 11, "0");
		},

		get_sort_code: function(){
			var str = location.hostname.split(".");
			var sort_code = "";
			var total = 0;

			for(var a = 0, l = str[0].length; a < l; a ++){
				total += str[0].charCodeAt(a);
			}

			total += str[0].length.toString();
			sort_code = yootil.pad(total, 6, "0");
			sort_code = sort_code.replace(/(\d)(?=(\d\d)+(?!\d))/g, "$1-");

			return sort_code;
		},

		get_transactions: function(user_id){
			return money.data(user_id).get.transactions();
		},

		create_transaction: function(type, in_amount, out_amount, skip_key_update, force_previous_balance, user_id){
			var current_transactions = this.get_transactions(user_id);
			var now = +new Date();

			in_amount = parseFloat(in_amount);
			out_amount = parseFloat(out_amount);

			var total_balance = 0;
			var previous_balance = 0;

			if(typeof force_previous_balance == "number"){
				previous_balance = force_previous_balance;
			} else if(current_transactions.length){
				previous_balance = current_transactions[0][4];
			}

			total_balance = previous_balance;

			if(typeof force_previous_balance != "number"){
				if(!previous_balance){
					total_balance = parseFloat(money.data(user_id).get.bank());
				} else {
					total_balance += (type == 2)? - out_amount : in_amount;
				}
			}

			current_transactions.unshift([type, in_amount, out_amount, now, total_balance]);

			this.add_new_transaction_row(type, in_amount, out_amount, now, total_balance);

			var new_transactions_list = current_transactions.slice(0, 5);

			if(type == 4){
				return new_transactions_list;
			}

			money.data(user_id).set.transactions(new_transactions_list, skip_key_update);
		},

		add_new_transaction_row: function(type, in_amount, out_amount, now, balance){
			if($("#bank-transaction-list-headers").length == 0){
				$("#bank-transaction-list").empty();
				$("#bank-transaction-list").append(this.get_transaction_html_headers());
			}

			var trans_html = "";
			var date_str = this.format_transaction_date(now);
			var trans_type = "";

			switch(type){

				// Deposit
				case 1 :
					trans_type = this.settings.text.types.DEPOSIT;
					break;

				// Withdraw
				case 2 :
					trans_type = this.settings.text.types.WITHDRAW;
					break;

				// Interest
				case 3 :
					trans_type = this.settings.text.types.INTEREST;
					break;

				// Staff edit
				case 4 :
					type = this.settings.text.types.STAFFEDIT;
					break;

				// Wages
				case 5 :
					type = this.settings.text.types.WAGES;
					break;

				// Rank Up
				case 6 :
					type = this.settings.text.types.RANKUP;
					break;

				case 7 :
					type = this.settings.text.types.STAFFWAGES;
					break;

				case 8 :
					type = this.settings.text.types.GIFTMONEY;
					break;

			}

			trans_html += '<tr class="bank-transaction-list-row">';
			trans_html += '<td>' + yootil.html_encode(date_str) + '</td>';
			trans_html += '<td>' + trans_type + '</td>';
			trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(in_amount, true))) + '</td>';
			trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(out_amount, true))) + '</td>';
			trans_html += '<td>' + yootil.html_encode(yootil.number_format(money.format(balance, true))) + '</td>';
			trans_html += '</tr>';

			$(trans_html).hide().insertAfter($("#bank-transaction-list-headers-dotted")).show("fast").fadeIn(3000).css("display", "");
		}

	};

})().register();