money.donation = (function(){

	return {

		settings: {

			enabled: true,
			show_profile_button: true,

			minimum_donation: 0.01,
			maximum_donation: 0,

			page_timer_enabled: true,

			message_max_len: 50,

			text: {


			}

		},

		page_timer: 0,
		PAGE_TIME_EXPIRY: 45,

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
			if(yootil.user.logged_in()){
				this.setup();

				if(!this.settings.enabled){
					money.show_default();
					return;
				}

				var self = this;
				var total_donations = self.get_total_donations();

				if(total_donations){
					yootil.bar.add("/user/" + yootil.user.id() + "?monetarydonation&view=2", money.images.donate, "Donations", "pdmsdonate");

					$("#yootil-bar").ready(function(){
						var bar_link = $("#yootil-bar a[href*=monetarydonation\\&view\\=2]");

						var tip = '<div class="monetary-donation-tip-holder"><div class="monetary-donation-tip-number">' + total_donations + '</div><span class="monetary-donation-tip"></span></div>';

						bar_link.append($(tip));
					});
				}

				if(yootil.location.check.profile_home()){
					if(location.href.match(/\?monetarydonation&view=(\d+)/i) && RegExp.$1 && parseInt(RegExp.$1) >= 1 && parseInt(RegExp.$1) <= 3){
						var id = parseInt(yootil.page.member.id());
						var view = parseInt(RegExp.$1);

						switch(view){

							// Sending

							case 1:
								if(yootil.page.member.id() != yootil.user.id()){
									yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetarydonation&view=1"), "Send Donation");
									yootil.create.nav_branch(yootil.html_encode(location.href), "Send Donation");

									this.collect_donation_to_details();
									this.build_send_donation_html();

									if(this.settings.page_timer_enabled){
										this.monitor_time_on_page();
									}
								} else {
									money.show_default();
								}

								break;

							// View received donation list

							case 2:
								yootil.create.page(new RegExp("\\/user\\/" + yootil.user.id() + "\\?monetarydonation&view=2"), "Received Donations");
								yootil.create.nav_branch(yootil.html_encode(location.href), "Received Donations");

								this.build_received_donations_html();

								break;

							// Viewing a donation
							// All donations have to be accepted

							case 3:
								var don_id = (location.href.match(/view=3&id=(\d+)/))? RegExp.$1 : -1;

								if(don_id){
									yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetarydonation&view=3&id=\\d+"), "Viewing Donation");

									this.build_view_donation_html(don_id);
								} else {
									money.show_default();
								}

								break;

						}
					} else if(yootil.page.member.id() != yootil.user.id() && this.settings.show_profile_button){
						this.create_donation_button();
					}
				}
			}
		},

		get_total_donations: function(){
			var donations = money.data(yootil.user.id()).get.donations();

			return donations.length;
		},

		monitor_time_on_page: function(){
			var self = this;
			var interval;

			interval = setInterval(function(){
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

					clearInterval(interval);

					return;
				}

				self.page_timer ++;

				var time_left = self.PAGE_TIME_EXPIRY - self.page_timer;

				time_left = (time_left < 0)? 0 : time_left;

				$("#monetary-donation-page-expiry").html("Page Expires In: " + time_left + " second" + ((time_left == 1)? "" : "s"));
			}, 1000);
		},

		collect_donation_to_details: function(from){
			var member_avatar = $(".avatar-wrapper.avatar-2:first img:first").attr("src");
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
				this.settings.minimum_donation = money.format(settings.minimum_donation);
				this.settings.maximum_donation = money.format(settings.maximum_donation);

				if(this.settings.minimum_donation < 1){
					if(!money.settings.decimal_money){
						this.settings.minimum_donation = 1;
					} else if(this.settings.minimum_donation <= 0){
						this.settings.minimum_donation = 0.01;
					}
				}

			}
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

				clone.attr("href", "/user/" + id + "?monetarydonation&view=1").text("Send Donation");
				clone.insertAfter(send_button);
			}
		},


		build_send_donation_html: function(){
			var html = "";

			var title = "<div class='monetary-donation'>";

			var donation_to_user = "<a href='" + yootil.html_encode(this.donation_to.url) + "'>" + yootil.html_encode(this.donation_to.name) + "</a>";

            title += "<div class='monetary-donation-sending-to-title'>Sending Donation - <span id='monetary-donation-page-expiry'>Page Expires In: " + this.PAGE_TIME_EXPIRY + " seconds</span></div>";
            title += "<div class='monetary-donation-sending-amount-title' id='pd_money_wallet'>" + money.settings.text.wallet + ': ' + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + "</span></div>";

			html += "<div class='monetary-donation-form'>";
			html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_to.name) + "' src='" + yootil.html_encode(this.donation_to.avatar) + "'><p class='monetary-donation-to-current-amount'>" + money.settings.money_symbol + yootil.html_encode(this.donation_to.money) + "</p></div>";
			html += "<div class='monetary-donation-fields'>";

			html += "<dl>";

			html += "<dt><strong>Donation To:</strong></dt>";
			html += "<dd>" + donation_to_user + "</dd>";

			html += "<dt><strong>Donation Amount:</strong></dt>";
			html += "<dd><input id='pd_donation_amount' type='text' value='0.00' /><span id='pd_donation_amount_error'></span></dd>";

			html += "<dt><strong>Message:</strong></dt>";
			html += "<dd><textarea name='pd_donation_message' id='pd_donation_message'></textarea>";
			html += "<span style='display: none' class='monetary-donation-message-chars-remain'>Characters Remaining: <span id='monatary-donation-chars-remain'>" + this.settings.message_max_len + "</span></dd>";

			html += "<dt class='monetary-donation-button'> </dt>";
			html += "<dd class='monetary-donation-button'><button>Send Donation</button></dd>";

			html += "</dl>";

			html += "</div><br style='clear: both' />";
			html += "</div>";

			var container = yootil.create.container(title, html).show();

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

		build_received_donations_html: function(){
			var donations = money.data(yootil.user.id()).get.donations();
			var html = "";

			html = "<table class='monetary-donation-received-list list'>";
			html += "<thead><tr class='head'>";
			html += "<th class='monetary-donation-icon'> </th>";
			html += "<th class='main monetary-donation-amount'>Donation Amount</th>";
			html += "<th class='monetary-donation-from'>Donation From</th>";
			html += "<th class='monetary-donation-date'>Date Sent</th>";
			html += "<th></th></tr></thead>";
			html += "<tbody class='list-content'>";

			var counter = 0;
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
			var days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
			var time_24 = (yootil.user.time_format() == "12hr")? false : true;

			for(var d = 0, l = donations.length; d < l; d ++){
				var amount = money.format(donations[d].a, true);
				var date = new Date(donations[d].t * 1000);
				var day = date.getDate() || 1;
				var month = months[date.getMonth()];
				var year = date.getFullYear();
				var hours = date.getHours();
				var mins = date.getMinutes();
				var date_str = days[date.getDay()] + " " + day + "<sup>" + this.get_suffix(day) + "</sup> of " + month + ", " + year + " at ";
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
				html += "<td><img src='" + money.images.donate_big + "' alt='Donation' title='Donation' /></td>";
				html += "<td>" + money.settings.money_symbol + yootil.html_encode(amount) + "</td>";
				html += "<td><a href='/user/" + yootil.html_encode(donations[d].f[0]) + "'>" + yootil.html_encode(donations[d].f[1]) + "</a></td>";
				html += "<td>" + date_str + "</td>";
				html += "<td class='monetary-donation-button'><button id='monetary-donation-" + d + "'>View Donation</button></td>";
				html += "</tr>";

				counter ++;
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
				var id = $(this).attr("id");
				var from = $(this).parent().parent().attr("data-donation-from");

				if(id.match(/(\d+)$/)){
					location.href = "/user/" + from + "?monetarydonation&view=3&id=" + RegExp.$1;
				}
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

		build_view_donation_html: function(donation_id){
			var donations = money.data(yootil.user.id()).get.donations();
			var the_donation = donations[donation_id];

			if(donation_id && donations.length && the_donation && yootil.page.member.id() == the_donation.f[0]){
				the_donation.id = donation_id;

				yootil.create.nav_branch("/user/" + yootil.html_encode(the_donation.f[0]) + "?monetarydonation&view=3&id=" + yootil.html_encode(donation_id), "Viewing Donation");

				this.collect_donation_from_details();

				var donation_from_user = "<a href='" + yootil.html_encode(this.donation_from.url) + "'>" + yootil.html_encode(this.donation_from.name) + "</a>";

				var html = "";

				html += "<div class='monetary-donation-form'>";
				html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_from.name) + "' src='" + yootil.html_encode(this.donation_from.avatar) + "'><p class='monetary-donation-to-current-amount'>" + money.settings.money_symbol + yootil.html_encode(this.donation_from.money) + "</p></div>";
				html += "<div class='monetary-donation-fields'>";

				html += "<dl>";

				html += "<dt><strong>Donation From:</strong></dt>";
				html += "<dd>" + donation_from_user + "</dd>";

				html += "<dt><strong>Donation Amount:</strong></dt>";
				html += "<dd>" + money.settings.money_symbol + yootil.html_encode(money.format(the_donation.a, true)) + "</dd>";

				html += "<dt><strong>Message:</strong></dt>";
				html += "<dd style='float: left'>" + this.parse_donation_message(the_donation.m) + "</dd>";

				html += "<dt style='clear: both'> </dt>";
				html += "<dd style='clear: both'> </dd>";

				html += "<dt class='monetary-donation-button'> </dt>";
				html += "<dd class='monetary-donation-button'><button id='monetary-donation-accept'>Accept Donation</button> <button id='monetary-donation-reject'>Reject Donation</button></dd>";

				html += "</dl>";

				html += "</div><br style='clear: both' />";
				html += "</div>";

				var title = "Viewing Donation - <span id='monetary-donation-page-expiry'>Page Expires In: " + this.PAGE_TIME_EXPIRY + " seconds</span>";

				var container = yootil.create.container(title, html).show();

				container.appendTo("#content");

				container.find("button#monetary-donation-accept").click($.proxy(this.accept_donation, this, the_donation));
				container.find("button#monetary-donation-reject").click($.proxy(this.reject_donation, this, the_donation));

				if(this.settings.page_timer_enabled){
					this.monitor_time_on_page();
				}
			} else {
				this.show_error("Donation could not be found.<br /><br />If you continue to experience this error, please contact a member of staff.");
			}
		},

		accept_donation: function(donation){
			money.data(yootil.user.id()).donation.accept(donation.id, donation.a, false, {
				complete: function(){
					location.href = "/user/" + yootil.user.id() + "?monetarydonation&view=2";
				}
			});
		},

		reject_donation: function(donation){
			var reject_donation = {
				a: donation.a,
				t: [yootil.user.id(), yootil.user.name()],
				f: donation.f[0]
			};

			money.data(yootil.user.id()).donation.reject(donation.id, reject_donation, false, {
				complete: function(){
					location.href = "/user/" + yootil.user.id() + "?monetarydonation&view=2";
				}
			});
		},

		send_donation_handler: function(){
			var donation_amount = $("input#pd_donation_amount").val();
			var message = $("textarea#pd_donation_message").val();
			var current_amount = money.data(yootil.user.id()).get.money();

			if(donation_amount > current_amount){
				this.donation_error("Not enough money to cover donation.");
			} else {
				if(donation_amount < this.settings.minimum_donation){
					this.donation_error("Minimum donation amount is " + money.format(this.settings.minimum_donation, true) + ".");
				} else {
					if(this.settings.maximum_donation && donation_amount > this.settings.maximum_donation){
						this.donation_error("Maximum donation amount is " + money.format(this.settings.maximum_donation, true) + ".");
					} else {
						$(".monetary-donation-button button").attr("disabled", true);

						var the_donation = {

							to: money.data(yootil.page.member.id()),
							amount: donation_amount,

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
							this.update_wallet();
							money.sync.trigger();

							$("#monetary-donation-page-expiry").html("Sent");

							var donation_to_user = "<a href='" + yootil.html_encode(this.donation_to.url) + "'>" + yootil.html_encode(this.donation_to.name) + "</a>";

							$(".monetary-donation-avatar-img").html("<img src='" + money.images.info + "' />");
							$(".monetary-donation-fields").html("<div style='margin-left: 5px; margin-top: 10px'>Donation successfully sent.<br /><br />If the recipient does not accept your donation, you will be notified and refunded.</div>");
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