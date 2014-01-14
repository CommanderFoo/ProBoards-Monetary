money.donation = (function(){

	return {

		data: {

		},

		settings: {

			enabled: true,
			show_profile_button: true,

			minimum_donation: 0.01,
			maximum_donation: 0,

			text: {


			}

		},

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

				if(this.settings.show_profile_button && yootil.location.check.profile_home() && yootil.page.member.id() != yootil.user.id()){
					this.create_donation_button();
				} else if(yootil.location.check.conversation_new_user()){

					// Prevent draft dialog from popping up

					proboards.autosave.options.noDialog = true;

					yootil.create.page("?monetarydonation", "Send Donation");

					this.correct_doc_title();
					this.replace_nav_branch();

					var what = this;

					$("#user-search-0").ready(function(){
						if(what.fetch_donation_to()){
							what.build_donation_html();
						} else {
							money.show_default();
						}
					});
				}
			}
		},

		correct_doc_title: function(){
			document.title = document.title.replace(/^.+?\| /, "");
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

		// Here we handle getting the details from the micro profile.
		// If there is no micro profiles, then we show the form as normal.
		// If there is multiple micro profiles, show the form as normal.

		fetch_donation_to: function(){
			var search_wrapper = $("#user-search-0");
			var micros = search_wrapper.find(".user-search-selection div.micro-profile");

			if(micros.length == 1){
				var name = micros.find("div.info span.name a.user-link");
				var avatar = micros.find("div.avatar div.avatar-wrapper img");

				this.donation_to = {

					name: name.text(),
					url: name.attr("href"),
					groups: name.attr("class"),
					avatar: avatar.attr("src"),
					user_at: name.attr("title")

				};

				if(this.donation_to.name.length && this.donation_to.url.length){
					return true;
				}
			}

			return false;
		},

		create_donation_button: function(){

			// Let's see if the send message button exists, if so, clone it, and insert
			// donation button

			var send_button = $(".controls a.button[href^='/conversation/new/']");

			if(send_button.length){
				var clone = send_button.clone();

				clone.attr("href", clone.attr("href") + "/?monetarydonation").text("Send Donation");
				clone.insertAfter(send_button);
			}
		},

		// Move to Yootil at some point

		replace_nav_branch: function(){
			var branch = $(".nav-tree-wrapper a[href='/conversation/new'] span");

			if(branch.length){
				branch.text("Send Donation");
			}
		},

		build_donation_html: function(){
			var html = "";

			var title = "<div class='monetary-donation'>";

			var donation_to_user = "<a href='" + yootil.html_encode(this.donation_to_url) + "' title='" + yootil.html_encode(this.donation_to.user_at) + "' class='" + yootil.html_encode(this.donation_to.groups) + "'>" + yootil.html_encode(this.donation_to.name) + "</a>";

            title += "<div class='monetary-donation-sending-to-title'>Sending Donation To: " + yootil.html_encode(this.donation_to.name) + "</div>";
            title += "<div class='monetary-donation-sending-amount-title' id='pd_money_wallet'>" + money.settings.text.wallet + ': ' + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + money.get(true) + "</span></div>";

			html += "<div class='monetary-donation-form'>";
			//html += "<div class='monetary-donation-gift-img'><img src='" + money.images.giftmoney + "'></div>";
			html += "<div class='monetary-donation-avatar-img'><img title='" + yootil.html_encode(this.donation_to.user_at) + "' src='" + yootil.html_encode(this.donation_to.avatar) + "'></div>";
			html += "<div class='monetary-donation-fields'>";

			html += "<dl>";

			html += "<dt><strong>Donation To:</strong></dt>";
			html += "<dd>" + donation_to_user + "</dd>";

			html += "<dt><strong>Donation Amount:</strong></dt>";
			html += "<dd><input id='pd_donation_amount' type='text' value='0.00' /><span id='pd_donation_amount_error'></span></dd>";

			html += "<dt><strong>Message:</strong></dt>";
			html += "<dd><textarea name='pd_donation_message'></textarea></dd>";

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

			container.appendTo("#content").ready(function(){
                //console.log(1);
            });
		},

		send_donation_handler: function(){
			var donation_amount = $("input#pd_donation_amount").val();
			var current_amount = money.get(false);

			if(donation_amount > current_amount){
				this.donation_error("Not enough money to cover donation.");
			} else {
				if(donation_amount < this.settings.minimum_donation){
					this.donation_error("Minimum donation amount is " + money.format(this.settings.minimum_donation, true) + ".");
				} else {
					if(this.settings.maximum_donation && donation_amount > this.settings.maximum_donation){
						this.donation_error("Maximum donation amount is " + money.format(this.settings.maximum_donation, true) + ".");
					} else {
						console.log(donation_amount);
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