//post_quick_reply

var money = {

	data: {
		
		// General money (aka wallet)
		
		m: 0,
		
		// Bank
		
		b: 0,
		
		// Last transactions
		
		lt: [],
		
		// Last interest date
		
		li: ""
		
	},
	
	plugin: null,
	route: null,
	params: null,
	images: null,
	
	settings: {
		
		money_text: "Money",
		money_symbol: "&pound;",
		
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
		
		staff_edit_money: true,
		
		posting: {
		
			earn_from_quick_reply: false,
			amounts: {
			
				per_thread: 10,
				per_poll: 5,
				per_reply: 5,
				per_quick_reply: 0
				
			}
		},
		
		no_earn_members: [],
		no_earn_categories: [],
		no_earn_boards: [],
		no_earn_threads: []
		
	},
	
	is_new_thread: false,
	is_editing: false,
	processed: false,
	using_quick_reply: false,
	can_earn: true,
	
	modules: [],
	
	init: function(){
		this.setup();
		
		PD_DEBUG && console.log("--- MONETARY SYSTEM 0.6.0 ---");
		PD_DEBUG && console.log("INIT");
		
		if(yootil.user.logged_in() && this.can_earn()){
			PD_DEBUG && console.log("USER LOGGED IN");
			PD_DEBUG && console.log("USER CAN EARN");
			
			if(yootil.location.check.posting() || (yootil.location.check.thread() && this.settings.posting.earn_from_quick_reply)){
				PD_DEBUG && console.log("POST / THREAD MATCH");
				
				if(this.can_earn_in_cat_board()){
					PD_DEBUG && console.log("CAN EARN IN CAT / BOARD");
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
			PD_DEBUG && console.log("SETTING: show in mini profile = true");
			this.show_in_mini_profile();
			yootil.ajax.after_search(this.show_in_mini_profile, this);
		}
					
		if(this.settings.show_in_profile && yootil.location.check.profile_home() && this.params && this.params.user_id != "undefined"){
			PD_DEBUG && console.log("SETTING: show in profile = true");
			this.show_in_profile();
		}
		
		if(this.settings.show_in_members_list && yootil.location.check.members()){
			PD_DEBUG && console.log("SETTING: show in members list = true");
			this.show_in_members_list();	
			yootil.ajax.after_search(this.show_in_members_list, this);
		}
	},
	
	show_default: function(){
		$("#content > *").show();
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
		this.can_earn = false;
	},
	
	enable_earning: function(){
		this.can_earn = true;
	},
	
	get: function(format, bank){
		var type = (bank)? this.data.b : this.data.m;
		var amount = this.format(type, format || false);
		
		if(format){
			amount = yootil.number_format(amount);
		}
		
		return amount;
	},
			
	subtract: function(value, bank){
		var type = (bank)? "b" : "m";
		
		this.data[type] -= this.format(value);
		yootil.key.set("pixeldepth_money", this.data, null, true);
	},
			
	add: function(value, bank){
		var type = (bank)? "b" : "m";
		
		this.data[type] += this.format(value);
		yootil.key.set("pixeldepth_money", this.data, null, true);
	},
	
	clear: function(bank){
		var type = (bank)? "b" : "m";

		this.data[type] = 0.00;
		yootil.key.set("pixeldepth_money", this.data, null, true);
	},
	
	clear_all: function(){
		yootil.key.set("pixeldepth_money", {}, null, true);
	},
	
	can_earn: function(){
		if(this.settings.no_earn_members && this.settings.no_earn_members.length){
			if($.inArray(yootil.user.id(), this.settings.no_earn_members) > -1){
				return false;
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
				if($.inArray(cat_id, this.settings.no_earn_categories) > -1){
					return false;
				} else if(this.settings.no_earn_boards && this.settings.no_earn_boards.length){
					var board_id = parseInt(yootil.page.board.id());
					
					if(board_id && $.inArray(board_id, this.settings.no_earn_boards) > -1){
						return false;
					}
				}
			}
		}
		
		return true;
	},
	
	clear_auto_save: function(){
		proboards.autosave.clear();
	},
	
	bind_events: function(){
		PD_DEBUG && console.log("BINDING EVENTS");
		
		// Check if in thread or posting, then check if thread is disabled
		// from earning
		
		if(yootil.location.check.thread() || yootil.location.check.posting()){
			var thread_id = parseInt(yootil.page.thread.id());
			
			if(thread_id){
				PD_DEBUG && console.log("THREAD ID: " + thread_id);
				
				if(thread_id && $.inArray(thread_id, this.settings.no_earn_threads) > -1){
					return false;
				}
			}
		}
		
		if(yootil.location.check.posting_thread()){
			PD_DEBUG && console.log("POSTING: Is a new thread");
			this.is_new_thread = true;
		}

		if(yootil.location.check.editing()){
			PD_DEBUG && console.log("POSTING: Is editing post");
			this.is_editing = true;
		}
		
		/*
		thread_new
		post_new
		message_new
		conversation_new
		
		proboards.plugin.key('super-user-key-name').set_on('thread_new',user_id,'Hello world');
		*/
		
		var self = this;
		var the_form;
		var hook;
		
		if(yootil.location.check.posting()){
			the_form = yootil.form.post_form();
			hook = (this.is_new_thread)? "thread" : "post";
		} else if(yootil.location.check.thread()){
			the_form = yootil.form.post_quick_reply_form();
			this.using_quick_reply = true;
		}
		
		PD_DEBUG && console.log("-- POST FORM --");
		PD_DEBUG && console.log(the_form);
		
		if(the_form.length){
		
			// Bind validated event in case the form wasn't submitted (onsubmit is useless)
			
			the_form.bind("validated", function(event){
				PD_DEBUG && console.log("VALIDATED");
				
				if(!self.processed){
					PD_DEBUG && console.log("NOT PROCESSED");
					
					if(self.is_new_thread || self.is_editing){
						var poll_input = $(this).find("input[name=has_poll]");
						
						self.is_poll = (poll_input && poll_input.val() == 1)? true : false;
					}
					
					if(hook){
						PD_DEBUG && console.log("HOOKING");
						PD_DEBUG && console.log("SUBMITTING");
						self.form_hook(hook, self.apply_posting_money);
						self.processed = false;
						self.clear_auto_save();
						this.submit();
					} else {
						PD_DEBUG && console.log("BINDING");
						
						yootil.ajax.bind("complete", this, function(){
							self.clear_auto_save();
							this.submit();
						}, "/plugin/key/set/", this);
					
						// We return true or false here, that way if it didn't complete
						// we can submit the form, otherwise the form never submits.
						// This is related to the quick reply as we can't hook into that yet.
						
						var completed = self.apply_posting_money();
						
						if(!completed){
							PD_DEBUG && console.log("COMPLETED");
							PD_DEBUG && console.log("SUBMITTING");
							self.clear_auto_save();
							this.submit();
						}
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
		if(!this.can_earn){
			return false;
		}
		
		PD_DEBUG && console.log("CAN EARN");
		
		var money_to_add = 0.00;

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

		PD_DEBUG && console.log("MONEY TO ADD: " + money_to_add);
		
		if(!this.processed){
			this.processed = true;
			
			// Only update if we have money to add.  This prevents a request if not hooking.
			
			if(money_to_add > 0){
				this.bank.apply_interest();
				
				if(hooking){
					this.data.m += this.format(money_to_add);
					yootil.key.get_key("pixeldepth_money").set_on(event + "_new", null, JSON.stringify(this.data));
				} else {
					this.add(money_to_add);
				}
				
				return true;
			}
		}
		
		return false;
	},
	
	setup: function(){
		if(yootil.key.has_value("pixeldepth_money")){
			var data = yootil.key.value("pixeldepth_money", null, true);
			
			if(data){
				this.data = (data && typeof data == "object")? data : this.data;
				this.current = this.format(this.data.m);
			}
		}			
			
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
			this.settings.member_list_text = (settings.member_list_text)? settings.member_list_text : ((settings.money_text.length)? settings.money_text : this.member_list_text);
			
			this.settings.staff_edit_money = (settings.staff_edit_money == "0")? false : this.settings.staff_edit_money;
			
			this.bank.settings.enabled = (settings.bank_enabled == "0")? false : this.bank.settings.enabled;
			
			this.settings.money_text = settings.money_text;
			this.settings.money_symbol = settings.money_symbol;
			
			this.settings.decimal_money = (settings.decimal_money == "0")? false : this.settings.decimal_money;
			
			this.settings.posting.earn_from_quick_reply = (parseInt(settings.earn_from_quick_reply) || this.settings.posting.earn_from_quick_reply);
			
			this.settings.posting.amounts.per_thread = this.format(settings.money_per_thread);
			this.settings.posting.amounts.per_poll = this.format(settings.money_per_poll);
			this.settings.posting.amounts.per_reply = this.format(settings.money_per_reply);
			this.settings.posting.amounts.per_quick_reply = this.format(settings.money_per_quick_reply);
			
			this.settings.no_earn_members = settings.no_earn_members;
	
			// Map over all 3 below and cast them to an int
			
			if(this.settings.no_earn_members && this.settings.no_earn_members.length){
				this.settings.no_earn_members = $.map(this.settings.no_earn_members, function(v){
					return parseInt(v);
				});
			}
			
			this.settings.no_earn_categories = settings.no_earn_categories;
			
			if(this.settings.no_earn_categories && this.settings.no_earn_categories.length){
				this.settings.no_earn_categories = $.map(this.settings.no_earn_categories, function(v){
					return parseInt(v);
				});
			}
			
			this.settings.no_earn_boards = settings.no_earn_boards;
			
			if(this.settings.no_earn_boards && this.settings.no_earn_boards.length){
				this.settings.no_earn_boards = $.map(this.settings.no_earn_boards, function(v){
					return parseInt(v);
				});
			}
			
			this.settings.no_earn_threads = settings.no_earn_threads;

			if(this.settings.no_earn_threads && this.settings.no_earn_threads.length){
				this.settings.no_earn_threads = $.map(this.settings.no_earn_threads, function(v){
					return parseInt(v.thread_id);
				});
			}
		}
	},
	
	bind_edit_dialog: function(element, user_id, bank){
		var self = this;
		var bank_edit = (bank)? true : false;
		var bank_str = (bank_edit)? "bank_" : "";
		
		element = $(element);
		
		if(self.settings.staff_edit_money && yootil.key.write("pixeldepth_money", user_id) && yootil.user.is_staff() && (yootil.user.id() != user_id || yootil.user.id() == 1)){
			var edit_element = "<div title='Edit " + ((bank_edit)? "Bank Balance" : "Money") + "'><p>" + this.settings.money_symbol + ": <input type='text' style='width: 100px' name='edit" + bank_str + "money' /></p></div>";
					
			element.click(function(event){
				event.stopPropagation();
				event.preventDefault();

				$(edit_element).dialog({
					modal: true,
					height: 140,
					width: 300,
					resizable: false,
					draggable: false,
					dialogClass: ("money_"+ bank_str + "dialog"),
					open: function(){
						var money_obj = yootil.key.value("pixeldepth_money", user_id, true);
						var money = 0.00;
						var key = (bank_edit)? "b" : "m";
						
						if(money_obj && money_obj[key]){
							money = money_obj[key];
						}
						
						$(this).find("input[name=edit" + bank_str + "money]").val(self.format(money, true));
					},
					
					buttons: {
					
						Cancel: function(){
							$(this).dialog("close");
						},
						
						Update: function(){
							var field = $(this).find("input[name=edit" + bank_str + "money]");
							var value = self.format(field.val());
							var money_obj = yootil.key.value("pixeldepth_money", user_id, true);
							var money = 0.00;
							var value_in = value_out = 0.00;
							var key = (bank_edit)? "b" : "m";
			
							if(money_obj){
								if(money_obj[key]){
									money = self.format(money_obj[key]);
								}
							} else {
								money_obj = {
									m: 0,
									b: 0,
									lt: [],
									li: ""
								};
							}
							
							if(value != money){
								money_obj[key] = value;
							
								if(bank_edit){
									if(value > money){
										value_in = (value - money);
									} else {										
										value_out = (money - value);
									}
									
									transactions = self.bank.create_transaction(4, value_in, value_out, true, value, money_obj);
									money_obj.lt = transactions;
								}
								
								yootil.key.set("pixeldepth_money", money_obj, user_id, true);
								$("span.pd_" + bank_str + "money_value_" + user_id).html(yootil.number_format(self.format(value, true)));
							}
							
							$(this).dialog("close");
						}
					
					}
					
				}).attr("title", "Edit " + ((bank_edit)? "Bank Balance" : "Money"));
			}).css("cursor", "pointer").attr("title", "Edit " + ((bank_edit)? "Bank Balance" : "Money"));
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
			$("<th class=\"pd_money_th\" style=\"width: 12%\">" + self.settings.member_list_text + "</th>").insertAfter(table.find("tr.head th.posts"));
		}
		
		table.find("tr.member[id=*member]").each(function(){
			
			if(this.id.match(/^member\-(\d+)/i)){
				var user_id = RegExp.$1;
				
				var user_data = yootil.key.value("pixeldepth_money", user_id, true);
				var user_money = 0;
				
				if(user_data && user_data.m && user_data.m.toString().length){
					user_money = self.format(user_data.m, true);
				}
				
				var money_symbol = (self.settings.show_money_symbol_members)? self.settings.money_symbol : "";
				var td = $("<td class=\"pd_money_" + user_id + "\">" + money_symbol + "<span class=\"pd_money_value_" + user_id + "\">" + yootil.number_format(user_money) + "</span></td>");
				
				td.insertAfter($(this).find("td.posts"));
			}
		});
	},
	
	show_in_profile: function(){
		var post_heading = $("div.content-box.center-col td.headings:contains(Posts:)");
		
		if(post_heading.length){
			var row = post_heading.parent();
			
			if(row){
				var user_data = yootil.key.value("pixeldepth_money", this.params.user_id, true);
				var user_money = 0.00;
				var user_bank_money = 0.00;
				
				if(user_data){
					if(user_data.m && user_data.m.toString().length){
						user_money = this.format(user_data.m, true);
					}
					
					if(user_data.b && user_data.b.toString().length){
						user_bank_money = this.format(user_data.b, true);
					}
				}
				
				var money_symbol = (this.settings.show_money_symbol_profile)? this.settings.money_symbol : "";
				var money_text = (this.settings.show_money_text_profile)? this.settings.money_text : "";
				
				if(yootil.user.is_staff()){
					var bank_money_td = this.bind_edit_dialog("<td class=\"pd_bank_money_" + this.params.user_id + "\">" + money_symbol + "<span class=\"pd_bank_money_value_" + this.params.user_id + "\">" + yootil.number_format(user_bank_money) + "</span></td>", this.params.user_id, true);
				
					$("<tr/>").html("<td>Bank Balance:</td>").append(bank_money_td).insertAfter(row);
				}
				
				var money_td = this.bind_edit_dialog("<td class=\"pd_money_" + this.params.user_id + "\">" + money_symbol + "<span class=\"pd_money_value_" + this.params.user_id + "\">" + yootil.number_format(user_money) + "</span></td>", this.params.user_id, false);
				
				$("<tr/>").html("<td>" + money_text + ":</td>").append(money_td).insertAfter(row);
			}
		}
	},
	
	show_in_mini_profile: function(){
		var minis = $("div.mini-profile");
					
		if(minis && minis.length){				
			if(minis.find("div.info span[class*=pd_money_]").length){
				return;
			}
			
			for(var m = 0, l = minis.length; m < l; m ++){
				var info = $(minis[m]).find("div.info");
				
				if(info && info.length){
					var info_div = info.get(0);
					var user_link = $(minis[m]).find("a.user-link[href*='user']:first");
					
					if(user_link && user_link.length){
						var user_id_match = user_link.attr("href").match(/\/user\/(\d+)\/?/i);
						
						if(user_id_match && user_id_match.length == 2){
							var user_id = user_id_match[1];
							var money = 0.00;
							var money_text = (this.settings.show_money_text_mini)? this.settings.money_text : "";
							var money_symbol = (this.settings.show_money_symbol_mini)? this.settings.money_symbol : "";
			
							if(yootil.key.has_value("pixeldepth_money", user_id)){
								var user_data = yootil.key.value("pixeldepth_money", user_id, true);
								
								if(user_data){
									money = this.format(user_data.m, true);
								}
							}
							
							//money = money.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
							
							money = yootil.number_format(money);
							
							if(money_text.toString().length){
								money_text += ": ";
							}
							
							//var money_edit = this.bind_edit_dialog("<span class=\"pd_money_" + user_id + "\">" + money_text + " " + this.settings.money_symbol + "<span class=\"pd_money_value_" + user_id + "\">" + money + "</span><br /></span>", user_id);
														
							// Check for class names if user has a custom mini profile layout
							// If one of these, then assume they are going the custom route
							
							var money_text_span = $(info_div).find("span.money_text");
							var money_symbol_span = $(info_div).find("span.money_symbol");
							var money_amount_span = $(info_div).find("span.money_amount");
							
							if(money_text_span.length || money_text_span.length || money_text_span.length){
								if(money_text_span.length){
									money_text_span.append(money_text).addClass("pd_money_text_" + user_id);
								}
								
								if(money_symbol_span.length){
									money_symbol_span.append(money_symbol).addClass("pd_money_symbol_" + user_id);
								}
								
								if(money_text_span.length){
									money_amount_span.append(money).addClass("pd_money_amount_" + user_id);
								}
							} else {					
								var money_str_html = "";
								
								money_str_html += "<span class=\"pd_money_text_" + user_id + "\">" + money_text + "</span> ";
								money_str_html += "<span class=\"pd_money_symbol_" + user_id + "\">" + money_symbol + "</span>";
								money_str_html += "<span class=\"pd_money_amount_" + user_id + "\">" + money + "</span><br />";
								
								$(info_div).prepend(money_str_html);
							}
						}
					}
				}
			}
		}
	}	
};