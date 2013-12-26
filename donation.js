money.donation = (function(){

	return {
		 
		data: {
							
		},
		
		settings: {
		
			enabled: true,
			show_profile_donation_button: true
			
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
				
				// Remove later
				
				//money.show_default();
				
				if(this.settings.show_profile_donation_button && yootil.location.check.profile_home() && yootil.page.member.id() != yootil.user.id()){
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
							if(money.get() > 0){
								what.build_donation_html();
							} else {
								what.show_error("<p>You do not have enough money in your " + money.settings.text.wallet + " to send a donation to <a href='" + yootil.html_encode(what.donation_to.url) + "' title='" + yootil.html_encode(what.donation_to.user_at) + "' class='" + yootil.html_encode(what.donation_to.groups) + "'>" + yootil.html_encode(what.donation_to.name) + "</a>.");
							}
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
			
			html += "<div>";
			html += "<div style='float: left; margin-left: 10px; margin-right: 20px;'><img src='" + money.images.giftmoney + "'></div>";
			html += "<div style='float: left; margin-top: 2px;'><p>Donation....</p></div><br style='clear: both' />";
			html += "</div>";
			
			var container = yootil.create.container("Sending Donation To: " + yootil.html_encode(this.donation_to.name), html).show();
			
			container.appendTo("#content");
		}
		
	};
	
})().register();