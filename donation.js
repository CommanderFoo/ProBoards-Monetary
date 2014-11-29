/**
* Namespace: money.donation
*
* 	Allows members to donate money to each other.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.donation = (function(){

	return {

		settings: {

			enabled: true,
			show_profile_button: true,

			minimum_donation: 0.01,
			maximum_donation: 0,

			page_timer_enabled: true,

			message_max_len: 50,

			show_total_sent_mini_profile: false,
			show_total_received_mini_profile: false,
			show_total_sent_profile: false,
			show_total_received_profile: false,

			text: {

				donation: "Donation",
				donations: "Donations"

			},

			excluded: []

		},

		page_timer: 0,
		PAGE_TIME_EXPIRY: 45,
		interval: 0,

		donation_to: {

			name: "",
			url: "",
			avatar: "",
			groups: ""

		},

		donation_from: {

			name: "",
			url: "",
			avatar: "",
			groups: ""

		},

		init: function(){
			this.setup();

			if(yootil.user.logged_in()){
				if(!this.settings.enabled){
					money.show_default();
					return;
				}

				var self = this;
				var total_donations = self.get_total_donations();

				if(/*total_donations &&*/ this.can_send_receive()){
					yootil.bar.add("/user/" + yootil.user.id() + "?monetarydonation&view=2", money.images.donate, this.settings.text.donations, "pdmsdonate");

					/*$("#yootil-bar").ready(function(){
						var bar_link = $("#yootil-bar a[href*=monetarydonation\\&view\\=2]");

						var tip = '<div class="monetary-donation-tip-holder"><div class="monetary-donation-tip-number">' + total_donations + '</div><span class="monetary-donation-tip"></span></div>';

						bar_link.append($(tip));
					});*/
				}

				this.check_rejected_donations();

				if(yootil.location.check.profile_home()){
					if(location.href.match(/\?monetarydonation&view=(\d+)/i) && RegExp.$1 && parseInt(RegExp.$1) >= 1 && parseInt(RegExp.$1) <= 3){
						var id = ~~ yootil.page.member.id();
						var view = ~~ RegExp.$1;

						switch(view){

							// Sending

							case 1:
								if(yootil.page.member.id() != yootil.user.id()){
									yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetarydonation&view=1"), "Send " + this.settings.text.donation);
									yootil.create.nav_branch("/user/" + id + "?monetarydonation&view=1", "Send " + this.settings.text.donation);

									if(this.can_send_receive()){
										this.collect_donation_to_details();
										this.build_send_donation_html();

										if(this.settings.page_timer_enabled){
											this.monitor_time_on_page();
										}
									} else {
										this.show_error("You do not have permission to send " + this.settings.text.donations.toLowerCase() + ".");
									}
								} else {
									money.show_default();
								}

								break;

							// View received donation list

							case 2:
								yootil.create.page(new RegExp("\\/user\\/" + yootil.user.id() + "\\?monetarydonation&view=2"), "Received " + this.settings.text.donations);
								yootil.create.nav_branch("/user/" + yootil.user.id() + "?monetarydonation&view=2", "Received " + this.settings.text.donations);

								if(this.can_send_receive()){
									this.build_received_donations_html();
								} else {
									this.show_error("You do not have permission to view this page.");
								}

								break;

							// Viewing a donation
							// All donations have to be accepted

							case 3:
								var don_id = (location.href.match(/view=3&id=([\d\.]+)/))? RegExp.$1 : -1;

								if(don_id){
									yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetarydonation&view=3&id=[\\d\\.]+"), "Viewing " + this.settings.text.donation);

									if(this.can_send_receive()){
										this.build_view_donation_html(don_id);
									} else {
										this.show_error("You do not have permission to receive " + this.settings.text.donations.toLowerCase() + ".");
									}
								} else {
									money.show_default();
								}

								break;

						}
					} else if(yootil.page.member.id() != yootil.user.id() && this.settings.show_profile_button){
						if(this.can_send_receive()){
							this.create_donation_button();
						}
					}
				}
			}
		},

		get_total_donations: function(){
			var donations = money.data(yootil.user.id()).get.donations();

			return donations.length;
		},

		// Do one notification per page load if there are multiple rejects

		check_rejected_donations: function(){
			var rejected = money.data(yootil.user.id()).get.rejected_donations();

			if(rejected.length){
				var reject = rejected[0];
				var donation_id = reject.t + "" + reject.r[0];
				var content = "Your " + this.settings.text.donation.toLowerCase() + " of " + money.settings.money_symbol + money.format(reject.a, true) + " to <a href='/user/" + yootil.html_encode(reject.r[0]) + "'>" + yootil.html_encode(reject.r[1]) + "</a> was rejected.";

				proboards.dialog("montary-donation-reject-" + r, {
					modal: true,
					height: 160,
					resizable: false,
					draggable: false,
					title: (this.settings.text.donation + " Rejected"),
					html: content,
					buttons: {
						"Place In Wallet": function(){
							var ok = money.data(yootil.user.id()).donation.accept_reject(reject);

							// Lets look for any wallets or amounts on the page and update

							if(ok){
								var user_money = money.data(yootil.user.id()).get.money(true);
								var user_money_display = $(".pd_money_amount_" + yootil.user.id());

								if(user_money_display.length){
									user_money_display.text(user_money);
								}

								// Now wallet

								var wallet = $("#pd_money_wallet_amount");

								if(wallet.length){
									wallet.text(user_money);
								}

								var other_wallet = $(".money_wallet_amount");

								if(other_wallet.length){
									other_wallet.html(money.settings.text.wallet + money.settings.money_separator + money.settings.money_symbol + yootil.html_encode(user_money));
								}

								// Donation sent

								var user_donations_sent = money.data(yootil.user.id()).get.total_sent_donations(true);
								var user_donations_sent_display = $(".pd_donations_sent_amount_" + yootil.user.id());

								if(user_donations_sent_display.length){
									user_donations_sent_display.text(user_donations_sent);
								}
							}

							$(this).dialog("close");
						}
					}
				});
			}
		},

		monitor_time_on_page: function(){
			var self = this;

			this.interval = setInterval(function(){
				if(self.page_timer >= self.PAGE_TIME_EXPIRY){
					$(".monetary-donation-form").css("opacity", .3);
					$(".monetary-donation-fields input").attr("disabled", true);
					$(".monetary-donation-fields textarea").attr("disabled", true);
					$("dd.monetary-donation-button button").css("visibility", "hidden");

					$("#monetary-donation-page-expiry").html("Page Expires In: expired");

					proboards.alert("Page Expired", "This page has expired, please refresh.", {
						modal: true,
						height: 160,
						resizable: false,
						draggable: false
					});

					clearInterval(self.interval);

					return;
				}

				self.page_timer ++;

				var time_left = self.PAGE_TIME_EXPIRY - self.page_timer;

				time_left = (time_left < 0)? 0 : time_left;

				$("#monetary-donation-page-expiry").html("Page Expires In: " + time_left + " second" + ((time_left == 1)? "" : "s"));
			}, 1000);
		},

		cancel_expiration: function(){
			$(".monetary-donation-sending-to-title").html(this.settings.text.donation + " Sent");
			clearInterval(this.interval);
		},

		collect_donation_to_details: function(from){
			var member_avatar = $(".avatar-wrapper:first img:first").attr("src");
			var member_name = yootil.page.member.name();
			var member_url = yootil.page.member.url();
			var member_id = yootil.page.member.id();
			var member_money = money.data(member_id).get.money(true);
			var key = (from)? "donation_from" : "donation_to";

			this[key] = {

				name: member_name,
				url: member_url,
				avatar: member_avatar,
				user_id: member_id,
				money: member_money

			};
		},

		// This is the same method as above, just renamed to prevent confusion

		collect_donation_from_details: function(){
			this.collect_donation_to_details(true);
		},

		show_error: function(msg){
			var html = "";

			html += "<div class='monetary-donation-notice-icon'><img src='" + money.images.info + "' /></div>";
			html += "<div class='monetary-donation-notice-content'>" + msg + "</div>";

			var container = yootil.create.container("An Error Has Occurred", html).show();

			container.appendTo("#content");
		},

		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;

				this.settings.enabled = (settings.donations_enabled == "0")? false : this.settings.enabled;
				this.settings.show_profile_button = (settings.show_profile_button == "0")? false : this.settings.show_profile_button;
				this.settings.minimum_donation = parseFloat(settings.minimum_donation);
				this.settings.maximum_donation = parseFloat(settings.maximum_donation);

				if(this.settings.minimum_donation < 1){
					if(!money.settings.decimal_money){
						this.settings.minimum_donation = 1;
					} else if(this.settings.minimum_donation <= 0){
						this.settings.minimum_donation = 0.01;
					}
				}

				this.settings.text.donation = (settings.donation_text && settings.donation_text.length)? settings.donation_text : this.settings.text.donation;
				this.settings.text.donations = this.settings.text.donation;

				if(!this.settings.text.donations.match(/s$/)){
					this.settings.text.donations += "s";
				}

				this.settings.show_total_sent_mini_profile = (settings.donations_sent_mp == "1")? true : this.settings.show_total_sent_mini_profile;
				this.settings.show_total_received_mini_profile = (settings.donations_received_mp == "1")? true : this.settings.show_total_received_mini_profile;
				this.settings.show_total_sent_profile = (settings.donations_sent_profile == "1")? true : this.settings.show_total_sent_profile;
				this.settings.show_total_received_profile = (settings.donations_received_profile == "1")? true : this.settings.show_total_received_profile;

				this.settings.excluded = (settings.exc_don_grps && settings.exc_don_grps.length)? settings.exc_don_grps : this.settings.excluded;
			}
		},

		can_send_receive: function(){
			if(this.settings.excluded && this.settings.excluded.length){
				var grps = yootil.user.group_ids();

				for(var g = 0; g < grps.length; g ++){
					if($.inArrayLoose(grps[g], this.settings.excluded) > -1){
						return false;
					}
				}
			}

			return true;
		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		create_donation_button: function(){

			// Let's see if the send message button exists, if so, clone it, and insert
			// donation button

			var send_button = $(".controls a.button[href^='/conversation/new/']");

			if(send_button.length){
				var clone = send_button.clone();
				var id = parseInt(yootil.page.member.id());

				clone.attr("href", "/user/" + id + "?monetarydonation&view=1").text("Send " + this.settings.text.donation);
				clone.insertAfter(send_button);
			}
		},

		build_send_donation_html: function(){
			var html = "";

			var title = "<div class='monetary-donation'>";

			var donation_to_user = "<a href='" + yootil.html_encode(this.donation_to.url) + "'>" + yootil.html_encode(this.donation_to.name) + "</a>";

            title += "<div class='monetary-donation-sending-to-title'>Sending " + this.settings.text.donation + " - <span id='monetary-donation-page-expiry'>Page Expires In: " + this.PAGE_TIME_EXPIRY + " seconds</span></div>";
            title += "<div class='monetary-donation-sending-amount-title' id='pd_money_wallet'>" + money.settings.text.wallet + ': ' + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + "</span></div>";

			html += "<div class='monetary-donation-form'>";
			html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_to.name) + "' src='" + yootil.html_encode(this.donation_to.avatar) + "'><p class='monetary-donation-to-current-amount'>" + money.settings.money_symbol + yootil.html_encode(this.donation_to.money) + "</p></div>";
			html += "<div class='monetary-donation-fields'>";

			html += "<dl>";

			html += "<dt><strong>" + this.settings.text.donation + " To:</strong></dt>";
			html += "<dd>" + donation_to_user + "</dd>";

			html += "<dt><strong>" + this.settings.text.donation + " Amount:</strong></dt>";
			html += "<dd><input id='pd_donation_amount' type='text' value='0.00' /><span id='pd_donation_amount_error'></span></dd>";

			html += "<dt><strong>Message:</strong></dt>";
			html += "<dd><textarea name='pd_donation_message' id='pd_donation_message'></textarea>";
			html += "<span style='display: none' class='monetary-donation-message-chars-remain'>Characters Remaining: <span id='monatary-donation-chars-remain'>" + this.settings.message_max_len + "</span></dd>";

			html += "<dt class='monetary-donation-button'> </dt>";
			html += "<dd class='monetary-donation-button'><button>Send " + this.settings.text.donation + "</button></dd>";

			html += "</dl>";

			html += "</div><br style='clear: both' />";
			html += "</div>";

			var container = yootil.create.container(title + "<br style='clear: both;' />", html).show();

			var self = this;

			container.find("input#pd_donation_amount").focus(function(){
				$(this).val("");
			});

			container.find("input#pd_donation_amount").blur(function(){
				if(!$(this).val().length){
					$(this).val(money.format(0, true));
				}
			});

			container.find(".monetary-donation-message-chars-remain").show();
			container.find(".monetary-donation-button button").click($.proxy(this.send_donation_handler, this));
			container.appendTo("#content");

			var msg_len_handler = function(){
			    var len = this.value.length;
			    var remain = (self.settings.message_max_len - this.value.length);

			    remain = (remain < 0)? 0 : remain;
			    $("#monatary-donation-chars-remain").html(remain);
			};

			$("#pd_donation_message").bind("keyup keydown",  msg_len_handler);
		},

		build_received_donations_html: function(){
			var donations = money.data(yootil.user.id()).get.donations();
			var html = "";

			html = "<table class='monetary-donation-received-list list'>";
			html += "<thead><tr class='head'>";
			html += "<th class='monetary-donation-icon'> </th>";
			html += "<th class='main monetary-donation-amount'>" + this.settings.text.donation + " Amount</th>";
			html += "<th class='monetary-donation-from'>" + this.settings.text.donation + " From</th>";
			html += "<th class='monetary-donation-date'>Date Sent</th>";
			html += "<th></th></tr></thead>";
			html += "<tbody class='list-content'>";

			var counter = 0;
			var time_24 = (yootil.user.time_format() == "12hr")? false : true;

			if(donations.length){
				for(var d = 0, l = donations.length; d < l; d ++){
					var amount = money.format(donations[d].a, true);
					var date = new Date(donations[d].t * 1000);
					var day = date.getDate() || 1;
					var month = money.months[date.getMonth()];
					var year = date.getFullYear();
					var hours = date.getHours();
					var mins = date.getMinutes();
					var date_str = money.days[date.getDay()] + " " + day + "<sup>" + money.get_suffix(day) + "</sup> of " + month + ", " + year + " at ";
					var am_pm = "";

					mins = (mins < 10)? "0" + mins : mins;

					if(!time_24){
						am_pm = (hours > 11)? "pm" : "am";
						hours = hours % 12;
						hours = (hours)? hours : 12;
					}

					date_str += hours + ":" + mins + am_pm;

					klass = (counter == 0)? " first" : ((counter == (l - 1))? " last" : "");

					html += "<tr class='item conversation" + klass + "' data-donation-from='" + yootil.html_encode(donations[d].f[0]) + "'>";
					html += "<td><img src='" + money.images.donate_big + "' alt='" + this.settings.text.donation + "' title='" + this.settings.text.donations + "' /></td>";
					html += "<td>" + money.settings.money_symbol + yootil.html_encode(amount) + "</td>";
					html += "<td><a href='/user/" + yootil.html_encode(donations[d].f[0]) + "'>" + yootil.html_encode(donations[d].f[1]) + "</a></td>";
					html += "<td>" + date_str + "</td>";
					html += "<td class='monetary-donation-button'><button data-donation-id='" + yootil.html_encode(donations[d].t) + "" + yootil.html_encode(donations[d].f[0]) + "'>View " + this.settings.text.donation + "</button></td>";
					html += "</tr>";

					counter ++;
				}
			} else {
				html += "<tr class='item conversation last'><td colspan='5'><em>You have not received any " + this.settings.text.donations.toLowerCase() + ".</em></td></tr>";
			}

			html += "</tbody></table>";

			var container = yootil.create.container("Donations Received (" + donations.length + ")", html).show();

			container.find("tr.item").mouseenter(function(){
				$(this).addClass("state-hover");
			}).mouseleave(function(){
				$(this).removeClass("state-hover");
			});

			container.find("div.pad-all").removeClass("pad-all").addClass("cap-bottom");
			container.find(".monetary-donation-button button").click(function(){
				var id = $(this).attr("data-donation-id");
				var from = ~~ $(this).parent().parent().attr("data-donation-from");

				location.href = "/user/" + from + "?monetarydonation&view=3&id=" + id;
			});

			container.appendTo("#content");
		},

		parse_donation_message: function(msg){
			if(msg && msg.length){
				msg = yootil.html_encode(msg);

				return msg.replace(/\[br\]/g, "<br />");
			}

			return "----";
		},

		fetch_donation: function(id){
			var donations = money.data(yootil.user.id()).get.donations();

			for(var d = 0, l = donations.length; d < l; d ++){
				var don_id = donations[d].t + "" + donations[d].f[0];

				if(don_id == id){
					return donations[d];
				}
			}

			return null;
		},

		build_view_donation_html: function(donation_id){
			var the_donation = this.fetch_donation(donation_id);
			var member_id = (yootil.page.member.id())? yootil.page.member.id() : location.href.match(/\/user\/(\d+)/i)[1];

			if(the_donation && member_id == the_donation.f[0]){
				the_donation.id = donation_id;

				yootil.create.nav_branch("/user/" + yootil.html_encode(the_donation.f[0]) + "?monetarydonation&view=3&id=" + yootil.html_encode(donation_id), "Viewing " + this.settings.text.donation);

				this.collect_donation_from_details();

				var donation_from_user = "<a href='" + yootil.html_encode(this.donation_from.url) + "'>" + yootil.html_encode(this.donation_from.name) + "</a>";

				var html = "";

				html += "<div class='monetary-donation-form'>";
				html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_from.name) + "' src='" + yootil.html_encode(this.donation_from.avatar) + "'><p class='monetary-donation-to-current-amount'>" + money.settings.money_symbol + yootil.html_encode(this.donation_from.money) + "</p></div>";
				html += "<div class='monetary-donation-fields'>";

				html += "<dl>";

				html += "<dt><strong>" + this.settings.text.donation + " From:</strong></dt>";
				html += "<dd>" + donation_from_user + "</dd>";

				html += "<dt><strong>" + this.settings.text.donation + " Amount:</strong></dt>";
				html += "<dd>" + money.settings.money_symbol + yootil.html_encode(money.format(the_donation.a, true)) + "</dd>";

				html += "<dt><strong>Message:</strong></dt>";
				html += "<dd style='float: left'>" + this.parse_donation_message(the_donation.m) + "</dd>";

				html += "<dt style='clear: both'> </dt>";
				html += "<dd style='clear: both'> </dd>";

				html += "<dt class='monetary-donation-button'> </dt>";
				html += "<dd class='monetary-donation-button'><button id='monetary-donation-accept'>Accept " + this.settings.text.donation + "</button> <button id='monetary-donation-reject'>Reject " + this.settings.text.donation + "</button></dd>";

				html += "</dl>";

				html += "</div><br style='clear: both' />";
				html += "</div>";

				var title = "<div class='monetary-donation-viewing-title'>Viewing Donation - <span id='monetary-donation-page-expiry'>Page Expires In: " + this.PAGE_TIME_EXPIRY + " seconds</span></div>";
				title += "<div class='monetary-donation-receiving-amount-title' id='pd_money_wallet'>" + money.settings.text.wallet + ': ' + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + "</span></div>";

				var container = yootil.create.container(title + "<br style='clear: both;' />", html).show();

				container.appendTo("#content");

				container.find("button#monetary-donation-accept").click($.proxy(this.accept_donation, this, the_donation));
				container.find("button#monetary-donation-reject").click($.proxy(this.reject_donation, this, the_donation));

				if(this.settings.page_timer_enabled){
					this.monitor_time_on_page();
				}
			} else {
				this.show_error(this.settings.text.donation + " could not be found.<br /><br />If you continue to experience this error, please contact a member of staff.");
			}
		},

		accept_donation: function(donation){
			money.data(yootil.user.id()).donation.accept(donation, false, {
				complete: function(){
					location.href = "/user/" + yootil.user.id() + "?monetarydonation&view=2";
					money.sync.trigger();
				}
			});
		},

		reject_donation: function(donation){
			var reject_donation = {
				amount: donation.a,
				receiver: [yootil.user.id(), yootil.user.name()],
				from: donation.f[0],
				time: donation.t
			};

			money.data(yootil.user.id()).donation.reject(reject_donation, false, {
				complete: function(){
					location.href = "/user/" + yootil.user.id() + "?monetarydonation&view=2";
					money.sync.trigger();
				}
			});
		},

		send_donation_handler: function(){
			var donation_amount = $("input#pd_donation_amount").val();
			var message = $("textarea#pd_donation_message").val();
			var current_amount = money.data(yootil.user.id()).get.money();

			if(!donation_amount.match(/^\d+(\.\d{1,2})?$/)){
				this.donation_error(this.settings.text.donation + " amount must be a number.");
			} else if(parseFloat(donation_amount) > current_amount){
				this.donation_error("Not enough money to cover " + this.settings.text.donation.toLowerCase() + ".");
			} else {
				if(parseFloat(donation_amount) < this.settings.minimum_donation){
					this.donation_error("Minimum " + this.settings.text.donation.toLowerCase() + " amount is " + money.format(this.settings.minimum_donation, true) + ".");
				} else {
					if(this.settings.maximum_donation && parseFloat(donation_amount) > this.settings.maximum_donation){
						this.donation_error("Maximum " + this.settings.text.donation.toLowerCase() + " amount is " + money.format(this.settings.maximum_donation, true) + ".");
					} else {
						$(".monetary-donation-button button").attr("disabled", true);

						var the_donation = {

							to: money.data(yootil.page.member.id()),
							amount: parseFloat(donation_amount),

							message: {
								text: message,
								len: this.settings.message_max_len
							},

							from: {
								id: yootil.user.id(),
								name: yootil.user.name()
							}

						};

						if(money.data(yootil.user.id()).donation.send(the_donation)){
							this.cancel_expiration();
							this.update_wallet();
							money.sync.trigger();

							$("#monetary-donation-page-expiry").html("Sent");

							var donation_to_user = "<a href='" + yootil.html_encode(this.donation_to.url) + "'>" + yootil.html_encode(this.donation_to.name) + "</a>";

							$(".monetary-donation-avatar-img").html("<img src='" + money.images.info + "' />");
							$(".monetary-donation-fields").html("<div style='margin-left: 5px; margin-top: 10px'>" + this.settings.text.donation + " successfully sent.<br /><br />If the recipient does not accept your " + this.settings.text.donation.toLowerCase() + ", you will be notified and refunded.</div>");
						} else {
							$("#monetary-donation-page-expiry").html("Error");
							$(".monetary-donation-avatar-img").html("<img src='" + money.images.info + "' />");
							$(".monetary-donation-fields").html("<div style='margin-left: 5px; margin-top: 10px'>An error has occurred.<br /><br />If you continue to get this message, please contact a member of staff.</div>");
						}
					}
				}
			}
		},

		update_wallet: function(){
			$("#pd_money_wallet_amount").html(yootil.html_encode(money.data(yootil.user.id()).get.money(true)));
		},

		donation_error: function(error){
			var elem = $("span#pd_donation_amount_error");

			if(elem.html() != error){
				elem.stop(true, false);
				elem.html(" " + error).fadeIn("slow").fadeTo(4000, 1).fadeOut("slow", function(){
					elem.html("");
				});
			}
		}

	};

})().register();