money.donation = (function(){

	return {

		settings: {

			enabled: true,
			show_profile_button: true,

			minimum_donation: 0.01,
			maximum_donation: 0,

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

		init: function(){
			if(yootil.user.logged_in()){
				this.setup();

				if(!this.settings.enabled){
					money.show_default();
					return;
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
									this.monitor_time_on_page();
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
								if(yootil.page.member.id() != yootil.user.id()){
									yootil.create.page(new RegExp("\\/user\\/" + id + "\\?monetarydonation&view=3"), "Viewing Donation");
									yootil.create.nav_branch(yootil.html_encode(location.href), "Viewing Donation");

									this.collect_donation_from_details();
									this.build_view_donation_html();
									this.monitor_time_on_page();
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

					proboards.alert("Page Expired", "This page has expired, please refresh if you want to send this member a donation.", {
						modal: true,
						height: 180,
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

		collect_donation_to_details: function(){
			var member_avatar = $(".avatar-wrapper.avatar-2:first img:first").attr("src");
			var member_name = yootil.page.member.name();
			var member_url = yootil.page.member.url();
			var member_id = yootil.page.member.id();
			var member_money = money.data(member_id).get.money(true);

			this.donation_to = {

				name: member_name,
				url: member_url,
				avatar: member_avatar,
				user_id: member_id,
				money: member_money

			};
		},

		// This is the same method as above, just renamed to prevent confusion

		collect_donation_from_details: function(){
			this.collect_donation_to_details();
		},

		show_error: function(msg){
			var html = "";

			html += "<div class='monetary-donation-notice-icon'><img src='" + money.images.giftmoney + "' /></div>";
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
            title += "<div class='monetary-donation-sending-amount-title' id='pd_money_wallet'>" + money.settings.text.wallet + ': ' + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + money.data(yootil.user.id()).get.money(true) + "</span></div>";

			html += "<div class='monetary-donation-form'>";
			html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_to.name) + "' src='" + yootil.html_encode(this.donation_to.avatar) + "'><p class='monetary-donation-to-current-amount'>" + money.settings.money_symbol + yootil.html_encode(this.donation_to.money) + "</p></div>";
			html += "<div class='monetary-donation-fields'>";

			html += "<dl>";

			html += "<dt><strong>Donation To:</strong></dt>";
			html += "<dd>" + donation_to_user + "</dd>";

			html += "<dt><strong>Donation Amount:</strong></dt>";
			html += "<dd><input id='pd_donation_amount' type='text' value='0.00' /><span id='pd_donation_amount_error'></span></dd>";

			html += "<dt><strong>Message:</strong></dt>";
			html += "<dd><textarea name='pd_donation_message' id='pd_donation_message'></textarea></dd>";

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

			container.find(".monetary-donation-button button").click($.proxy(this.send_donation_handler, this));
			container.appendTo("#content");
		},

		build_received_donations_html: function(){
			var container = yootil.create.container("Donation List", "Hi").show();

			container.appendTo("#content");
		},

		build_view_donation_html: function(){
			var container = yootil.create.container("View Donation", "Hi").show();

			container.appendTo("#content");
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
						console.log("yo");
					}
				}
			}
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