money.shop = (function(){

	return {

		settings: {

			enabled: true,

		},

		init: function(){
			if(yootil.user.logged_in()){
				this.setup();

				if(!this.settings.enabled){
					money.show_default();
					return;
				}

				if(location.href.match(/\?monetaryshop(&view=(\d+))?/i)){
					if(RegExp.$2 && parseInt(RegExp.$2) > 1 && yootil.location.check.profile_home()){
						console.log("Viewing bought items");
					} else {
						yootil.create.nav_branch(yootil.html_encode(location.href), "Monetary Shop");
						yootil.create.page("?monetaryshop", "Monetary Shop");
						this.build_shop_html();
					}
				}
			}
		},

		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;

				this.settings.enabled = (settings.shop_enabled && settings.shop_enabled == "0")? false : this.settings.enabled;
			}
		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		build_shop_html: function(){
			var title = '<div>';

			title += '<div style="float: left">Monetary Shop</div>';
			title += '<div style="float: right" id="pd_money_wallet">' + money.settings.text.wallet + ': ' + money.settings.money_symbol + '<span id="pd_money_wallet_amount">' + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + '</span></div>';

			title += '</div><br style="clear: both" />';

			var html = "";

			html += this.create_shop_tabs();

			// Dummy data

			var items = [
				{i: 1, p: 3.99, im: "abbasid_ribs.png", n: "Abbasid Ribs", d: "Tasty ribs, yum yum"},
				{i: 2, p: 9.99, im: "apple.png", n: "Apple", d: "An apple a day keeps someone away?"},
				{i: 3, p: 0.99, im: "applejack.png", n: "Applpe Jack", d: "What is it?"},
				{i: 4, p: 2.99, im: "awesome_stew.png", n: "Awesome_Stew", d: "It's really that awesome"},
				{i: 5, p: 53.19, im: "bacon.png", n: "Bacon", d: "Baaaacon"},
				{i: 5, p: 32.99, im: "basic_omelet.png", n: "Basic Omelet", d: "Best omelet in town"},
				{i: 6, p: 10.00, im: "bean_dip.png", n: "Been Dip", d: "Dip it.  Dip it real good"},
				{i: 7, p: 5.00, im: "berry_bowl.png", n: "Berry Bowl", d: "hmmmmm"},
				{i: 8, p: 22.69, im: "big_salad.png", n: "Big Salad", d: "Watch those calories"},
				{i: 9, p: 69.69, im: "birch_syrup.png", n: "Birch Syrup", d: "I have no idea..."},
				{i: 10, p: 105.00, im: "broccoli.png", n: "Broccoli", d: "Eat It"},
				{i: 11, p: 13.99, im: "abbasid_ribs.png", n: "Abbasid Ribs", d: "Something something"},
				{i: 12, p: 3.99, im: "abbasid_ribs.png", n: "Abbasid Ribs", d: "What is it?"},
				{i: 13, p: 3.99, im: "abbasid_ribs.png", n: "Abbasid Ribs", d: "What is it?"},
				{i: 14, p: 8.99, im: "broccoli.png", n: "Abbasid Ribs", d: "What is it?"},
				{i: 15, p: 43.99, im: "abbasid_ribs.png", n: "Abbasid Ribs", d: "What is it?"}
			];

			html += '<table class="list"><thead><tr class="head"><th style="width: 120px;">&nbsp;</th><th style="width: 25%">Item Name</th><th style="width: 55%" class="main">Description</th><th style="width: 120px">Price</th><th style="width: 150px;">&nbsp;</th></tr></thead><tbody class="list-content">';

			var counter = 0;

			for(var d = 0; d < items.length; d ++){
				klass = (counter == 0)? " first" : ((counter == (items.length - 1))? " last" : "");

				html += '<tr class="item' + klass + '">';
				html += '<td style="text-align: center;"><img src="http://pixeldepth.net/proboards/plugins/monetary_system/shop/icons/' + items[d].im + '" /></td>';
				html += '<td>' + items[d].n + '</td>';
				html += '<td>' + items[d].d + '</td>';
				html += '<td>£' + money.format(items[d].p, true) + '</td>';
				html += '<td style="text-align: center;"><button>Add To Cart</button></td>';

				counter ++;
			}

			html += '</tbody></table>';


			var container = yootil.create.container(title, html).show();

			container.find("div.pad-all").removeClass("pad-all").addClass("cap-bottom");
			container.appendTo("#content");
		},

		create_shop_tabs: function(){
			var tabs = ["Forum Enhancements", "RPG Icons", "Food Icons", "Misc Icons", "Gummy Bears", "Potatoes"];
			var html = '<div class="ui-tabMenu"><ul class="ui-helper-clearfix">';

			for(var t = 0, l = tabs.length; t < l; t ++){
				var klass = (t == 2)? ' class="ui-active"' : "";

				html += '<li' + klass + '><a href="#">' + tabs[t] + '</a></li>';
			}

			html += '<li style="float: right"><div class="ui-search" style="padding: 3px 10px 0px 4px;"><input width="90px" style="height: 17px" type="text" class="search-input" maxlength="50" placeholder="Search Shop..." role="search" accesskey="w"><span style="height: 16px" class="search-filters-button"><span class="icon"><img src="//images.proboards.com/v5/images/icon-search-filters.png"></span></span></div></li>';

			html += '<li style="float: right; margin-right: 10px"><a href="#">Basket(3)</a></li>';

			html += "</ul></div>";

			return html;
		}

	};

})().register();