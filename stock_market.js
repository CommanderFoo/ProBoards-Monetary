/**
* Namespace: money.stock_market
*
* 	Allows members buy and sell stocks to try and make a nice profit.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.stock_market = (function(){

	return {

		fetching: false,

		data: {},

		symbols: {},

		html: "",

		current: 1,

		total: 0,

		settings: {
			enabled: true,
			show_chart: true,
			compact: false,

			text: {

				stock_market: "Stock Market",
				investments: "Investments"

			}
		},

		replacements: {},

		invest_data: {},

		init: function(){
			this.setup();

			if(this.settings.enabled){
				if(money.images.stock_market){
					yootil.bar.add("/?stockmarket", money.images.stock_market, "Stock Market", "pdmsstock");
				}
			} else {
				this.offer_full_refund();
			}

			if(yootil.location.check.forum() && location.href.match(/\/?stockmarket\/?/i)){
				if(this.settings.enabled){
					money.can_show_default = false;
					this.start();
				} else {
					money.show_default();
				}
			}
		},

		register: function(){
			money.modules.push(this);
			return this;
		},

		start: function(){
			this.html = "<div id='stock-wrapper'><img src='" + money.images.preloader + "' /></div>";
			this.fetch_stock_data();

			yootil.create.page("?stockmarket", this.settings.text.stock_market);
			yootil.create.nav_branch("/?stockmarket", this.settings.text.stock_market);

			yootil.create.container("<div style='display: inline;'>" + this.settings.text.stock_market + " Investments</div><div style='float: right'>" + money.settings.text.wallet + ": " + money.settings.money_symbol + "<span id='pd_money_wallet_amount'>" + yootil.html_encode(money.data(yootil.user.id()).get.money(true)) + "</span></div>", "<div id='stock-invest-content'><img src='" + money.images.invest_preloader + "' /></div>").show().appendTo("#content");

			yootil.create.container("<div style='display: inline;'>" + this.settings.text.stock_market + "<span id='stock-market-total'></span></div><div style='cursor: pointer; float: right'><span id='stock-left'>&laquo; Previous</span> &nbsp;&nbsp;&nbsp; <span id='stock-right'>Next &raquo;</span></div>", this.html).show().appendTo("#content");
		},

		setup: function(){
			if(money.plugin){
				var settings = money.plugin.settings;

				this.settings.enabled = (settings.stock_enabled == "0")? false : true;
				this.settings.show_chart = (settings.stock_show_chart == "0")? false : true;
				this.settings.compact = (settings.compact_layout && settings.compact_layout == 1)? true : false;
				this.settings.compact_width = (settings.stock_block_width && parseInt(settings.stock_block_width) > 0)? settings.stock_block_width : "600";

				if(parseInt(this.settings.compact_width) < 533){
					this.settings.compact_width = 533;
				}

				if(settings.stock_up_image && settings.stock_up_image.length){
					money.images.up = settings.stock_up_image;
				}

				if(settings.stock_down_image && settings.stock_down_image.length){
					money.images.down = settings.stock_down_image;
				}

				if(settings.stock_market_icon && settings.stock_market_icon.length){
					money.images.stock_market = settings.stock_market_icon;
				}

				if(settings.stock_replace && settings.stock_replace.length){
					for(var r = 0, l = settings.stock_replace.length; r < l; r ++){
						this.replacements[settings.stock_replace[r].current_symbol] = settings.stock_replace[r];
					}
				}

				this.settings.text.stock_market = (settings.stock_market_text && settings.stock_market_text.length)? settings.stock_market_text : this.settings.text.stock_market;
			}
		},

		escape_expression: function(expr){
			return expr.replace(".", "\\.");
		},

		get_stock_name: function(stock_id){
			if(this.replacements[stock_id] && this.replacements[stock_id].new_name.length){
				return this.replacements[stock_id].new_name;
			}

			if(this.symbols[stock_id]){
				return this.symbols[stock_id].Name;
			}

			return stock_id;
		},

		get_stock_symbol: function(stock_id){
			if(this.replacements[stock_id] && this.replacements[stock_id].new_symbol.length){
				return this.replacements[stock_id].new_symbol;
			}

			return stock_id;
		},

		fetch_stock_data: function(){
			this.fetching = true;

			$.ajax({
				url: "http://pixeldepth.net/proboards/plugins/monetary_system/stock/quotes.php",
				context: this,
				crossDomain: true,
				dataType: "json"
			}).done(function(data){
				this.fetching = false;

				if(data && data.results && data.results.length){
					this.data = data.results;
				}

				this.build_stock_table();
			});
		},

		has_invested: function(stock_symbol){
			var invest_data = money.data(yootil.user.id()).get.investments();

			if(invest_data[stock_symbol]){
				return true;
			}

			return false;
		},

		remove_from_data: function(stock_symbol){
			if(this.has_invested(stock_symbol)){
				var invest_data = money.data(yootil.user.id()).get.investments();

				delete invest_data[stock_symbol];
				money.data(yootil.user.id()).set.investments(invest_data, true);
			}
		},

		offer_full_refund: function(){
			var show = (yootil.storage.get("monetary_stock_ignore_refund") == 1)? false : true;

			if(!show){
				return;
			}

			var total_stocks = 0;
			var total_value = 0;
			var invest_data = money.data(yootil.user.id()).get.investments();

			for(var stock in invest_data){
				var amount = this.invest_amount(stock);
				var bid = invest_data[stock].b;
				var total_cost = (bid * amount);

				total_value += total_cost;
				total_stocks ++;
			}

			if(total_stocks && total_value){
				var info = "";
				var self = this;

				info += "Your investments can be refunded, as the";
				info += " Stock Market is currently disabled.<br /><br />";
				info += "Refund: " + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(total_value, true)));

				proboards.dialog("stock-refund-dialog", {
					modal: true,
					height: 220,
					width: 320,
					title: "Refunding All Stock",
					html: info,
					resizable: false,
					draggable: false,

					buttons: {

						"Ignore Refund": function(){
							var self = this;

							proboards.dialog("stock-ignore-refund-dialog", {
								modal: true,
								height: 220,
								width: 320,
								title: "Ignore Refund",
								html: "Are you sure you want to keep your current investments?<br /><br />You will no longer receive the refund message if you choose this option.",
								resizable: false,
								draggable: false,

								buttons: {

									"Ok": function(){
										yootil.storage.set("monetary_stock_ignore_refund", 1, false, true);
										$(this).dialog("close");
										$(self).dialog("close");
									},

									"Cancel": function(){
										$(this).dialog("close");
									}

								}

							});

						},

						"Accept Refund": function(){
							money.data(yootil.user.id()).increase.money(total_value, true);
							money.data(yootil.user.id()).clear.investments(true);

							self.save_investments();

							$(this).dialog("close");
						}
					}
				});
			}
		},

		refund_stock: function(stock_id){
			var self = this;
			var info = "";
			var invest_data = money.data(yootil.user.id()).get.investments();

			info += "Your investment in " + yootil.html_encode(this.get_stock_symbol(stock_id)) + " is being refunded, as the";
			info += " stock has been removed from the market.<br /><br />";
			info += "Refund: " + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(parseInt(invest_data[stock_id].a) * parseFloat(invest_data[stock_id].b), true)));

			proboards.dialog("stock-refund-dialog", {
				modal: true,
				height: 220,
				width: 320,
				title: "Refunding Stock",
				html: info,
				resizable: false,
				draggable: false,

				buttons: {

					"Accept Refund": function(){

						var amount = (self.has_invested(stock_id))? self.invest_amount(stock_id) : 0;

						if(amount){
							var bid = invest_data[stock_id].b;
							var total_cost = (bid * amount);

							money.data(yootil.user.id()).increase.money(total_cost, true);
							self.remove_from_data(stock_id);
							self.update_wallet();
							self.save_investments();
						}

						$(this).dialog("close");
					}
				}
			});
		},

		// How much stock?

		invest_amount: function(stock_symbol){
			var invest_data = money.data(yootil.user.id()).get.investments();

			if(this.has_invested(stock_symbol)){
				return invest_data[stock_symbol].a;
			}

			return 0;
		},

		save_investments: function(){
			money.data(yootil.user.id()).update();
			money.sync.trigger();
		},

		insert_invest_row: function(stock_id){
			var invest_data = money.data(yootil.user.id()).get.investments();

			var new_bid_total = (parseInt(invest_data[stock_id].a) * parseFloat(this.symbols[stock_id].BidRealtime));
			var old_bid_total = (parseInt(invest_data[stock_id].a) * parseFloat(invest_data[stock_id].b));
			var html = "<tr class='stock-invest-content-row' id='stock-invest-row-" + yootil.html_encode(stock_id) + "' style='display: none'>";

			html += "<td>" + this.get_stock_name(stock_id);

			if(!this.settings.compact){
				html += " (" + this.get_stock_symbol(stock_id) + ")";
			}

			html += "</td>";
			html += "<td>" + yootil.html_encode(yootil.number_format(invest_data[stock_id].b)) + "</td>";
			html += "<td>" + yootil.html_encode(yootil.number_format(this.symbols[stock_id].BidRealtime)) + "</td>";

			if(!this.settings.compact){
				html += "<td>" + yootil.html_encode(yootil.number_format(invest_data[stock_id].a)) + "</td>";
			}

			html += "<td>" + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(parseInt(invest_data[stock_id].a) * parseFloat(invest_data[stock_id].b), true))); + "</td>";
			html += "<td>" + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(new_bid_total - old_bid_total, true))) + "</td>";
			html += "<td><button class='stock-sell-button' data-stock-id='" + yootil.html_encode(stock_id) + "'>Sell</button></td>";

			html += "</tr>";

			var self = this;

			if(!$("#stock-investments-table").length){
				this.create_investment_headers();
			}

			if($("#stock-invest-row-" + this.escape_expression(stock_id)).length){
				$("#stock-invest-row-" + this.escape_expression(stock_id)).replaceWith($(html));
			} else {
				$("#stock-investments-table").append($(html).hide());
			}

			$("#stock-investments-table").find(".stock-sell-button[data-stock-id=" + this.escape_expression(stock_id) + "]").click(function(){
				$.proxy(self.bind_sell_event, self)(this);
			});

			$("#stock-invest-row-" + this.escape_expression(stock_id)).show("normal");
		},

		remove_invest_row: function(stock_id){
			$("#stock-invest-row-" + this.escape_expression(stock_id)).hide("normal", function(){
				$(this).remove();

				var invest_table = $("#stock-investments-table");

				if(invest_table.find("tr").length == 1){
					invest_table.remove();
					$("#stock-invest-content").html("<span>You currently have no investments.</span>");
				}
			});
		},

		update_wallet: function(){
			$("#pd_money_wallet_amount").html(yootil.html_encode(money.data(yootil.user.id()).get.money(true)));
		},

		buy_stock: function(stock_symbol, amount, insert_invest_row){
			if(stock_symbol && amount && this.stock_exists(stock_symbol)){
				var current_amount = (this.has_invested(stock_symbol))? this.invest_amount(stock_symbol) : 0;
				var updating = (current_amount)? false : true;
				var total_amount = (current_amount + amount);
				var bid = this.symbols[stock_symbol].BidRealtime;
				var total_cost = (bid * amount);

				if(money.data(yootil.user.id()).get.money() < total_cost){
					proboards.alert("Not Enough " + money.settings.money_text, "You do not have enough " + money.settings.money_text.toLowerCase() + " to make this purchase.", {
						modal: true,
						resizable: false,
						draggable: false
					});
				} else {
					money.data(yootil.user.id()).decrease.money(total_cost);

					var invest_data = money.data(yootil.user.id()).get.investments();

					invest_data[stock_symbol] = {
						a: total_amount,
						b: bid
					};

					money.data(yootil.user.id()).set.investments(invest_data, true);

					this.insert_invest_row(stock_symbol);
					this.update_wallet();
					this.save_investments();
				}
			} else {
				proboards.alert("An Error Occurred", "An error occurred, please try again.", {
					modal: true,
					resizable: false,
					draggable: false
				});
			}
		},

		stock_exists: function(stock_symbol){
			if(this.symbols[stock_symbol]){
				return true;
			}

			return false;
		},

		create_investment_headers: function(return_html){
			var html = "";

			html += "<table id='stock-investments-table'><tr class='stock-invest-content-headers'>";
			html += "<th style='width: 30%'>Stock Name</th>";
			html += "<th style='width: 12%'>Paid Bid</th>";
			html += "<th style='width: 12%'>Current Bid</th>";

			if(!this.settings.compact){
				html += "<th style='width: 12%'>Total Units</th>";
			}

			html += "<th style='width: 13%'>Total Cost</th>";
			html += "<th style='width: 15%'>Profit</th>";
			html += "<th style='width: 6%'></th>";
			html += "</tr>";

			if(return_html){
				return html;
			}

			html += "</table>";

			$("#stock-invest-content").empty().html(html);
		},

		current_investment_list: function(){
			var invest = $("#stock-invest-content");
			var html = "";

			html += this.create_investment_headers(true);

			var table = "";

			var invest_data = money.data(yootil.user.id()).get.investments();

			for(var key in invest_data){
				if(!this.symbols[key]){
					this.refund_stock(key);
					continue;
				}

				table += "<tr class='stock-invest-content-row' id='stock-invest-row-" + key + "'>";
				table += "<td>" + yootil.html_encode(this.get_stock_name(key));

				if(!this.settings.compact){
					table += " (" + yootil.html_encode(this.get_stock_symbol(key)) + ")";
				}

				table += "</td>";

				table += "<td>" + yootil.html_encode(yootil.number_format(invest_data[key].b)) + "</td>";
				table += "<td>" + yootil.html_encode(yootil.number_format(this.symbols[key].BidRealtime)) + "</td>";

				if(!this.settings.compact){
					table += "<td>" + yootil.html_encode(yootil.number_format(invest_data[key].a)) + "</td>";
				}

				table += "<td>" + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(parseInt(invest_data[key].a) * parseFloat(invest_data[key].b), true))); + "</td>";

				var profit_html = "";
				var new_bid_total = (parseInt(invest_data[key].a) * parseFloat(this.symbols[key].BidRealtime));
				var old_bid_total = (parseInt(invest_data[key].a) * parseFloat(invest_data[key].b));
				var formatted_total = money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(new_bid_total - old_bid_total, true)));

				if(new_bid_total < old_bid_total){
					profit_html += "<span class='stock-market-loss'>" + formatted_total + "</span> <img src='" + money.images.down + "' style='position: relative; top: 2px;' />";
				} else {
					if(new_bid_total > old_bid_total){
						profit_html += "<span class='stock-market-profit'>" + formatted_total + "</span> <img src='" + money.images.up + "' style='position: relative; top: 2px;' />";
					} else {
						profit_html += formatted_total;
					}
				}

				table += "<td>" + profit_html + "</td>";
				table += "<td><button class='stock-sell-button' data-stock-id='" + yootil.html_encode(key) + "'>Sell</button></td>";
				table += "</tr>";
			}

			if(!table.length){
				html = "<span>You currently have no investments.</span>";
			} else {
				table += "</table>";
				html += table;
			}

			var stock_invest_obj = $(html);
			var self = this;

			stock_invest_obj.find(".stock-sell-button").click(function(){
				$.proxy(self.bind_sell_event, self)(this);
			});

			invest.empty().append(stock_invest_obj);
		},

		bind_sell_event: function(button){
			var stock_id = $(button).attr("data-stock-id");
			var invest_data = money.data(yootil.user.id()).get.investments();
			var amount = parseInt(invest_data[stock_id].a);
			var bid = parseInt(this.symbols[stock_id].BidRealtime);
			var s = (amount == 1)? "" : "s";
			var info = "";

			info += "<strong>" + yootil.html_encode(this.get_stock_name(stock_id)) + " (" + yootil.html_encode(this.get_stock_symbol(stock_id)) + ")</strong><br /><br />";
			info += "Purchased Amount: " + yootil.html_encode(yootil.number_format(amount)) + " unit" + s + "<br />";
			info += "Paid Bid: " + yootil.html_encode(yootil.number_format(invest_data[stock_id].b)) + "<br />";
			info += "Current Bid: " + yootil.html_encode(yootil.number_format(this.symbols[stock_id].BidRealtime)) + "<br /><br />";
			info += "Total Return: " + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(amount * parseFloat(this.symbols[stock_id].BidRealtime), true)));

			var self = this;

			proboards.dialog("stock-sell-dialog", {
				modal: true,
				height: 220,
				width: 320,
				title: "Sell Stock",
				html: info,
				resizable: false,
				draggable: false,

				buttons: {

					Cancel: function(){
						$(this).dialog("close");
					},

					"Sell Stock": function(){
						proboards.dialog("stock-sell-confirm-dialog", {
							title: "Confirm Selling Stock",
							html: "Are you sure you want to sell this stock?",
							modal: true,
							resizable: false,
							draggable: false,

							buttons: {

								No: function(){
									$(this).dialog('close');
								},

								"Yes": function(){
									self.sell_stock(stock_id);
									$(this).dialog("close");
								}
							}
						});

						$(this).dialog("close");
					}
				}
			});
		},

		sell_stock: function(stock_id){
			var amount = (this.has_invested(stock_id))? this.invest_amount(stock_id) : 0;

			if(amount){
				var bid = this.symbols[stock_id].BidRealtime;
				var total_cost = (bid * amount);

				money.data(yootil.user.id()).increase.money(total_cost, true);

				this.remove_from_data(stock_id);
				this.update_wallet();
				this.remove_invest_row(stock_id);
				this.save_investments();
			}
		},

		// TODO: Tidy up inline CSS

		build_stock_table: function(){
			var stock_table = $("<div id='stock-content-strip'></div>");
			var self = this;
			var compact_width = col_left_styles = col_center_styles = "";
			var chart_size = "l";

			if(this.settings.compact){
				chart_size = "m";

				if(parseInt(this.settings.compact_width) >= 807){
					chart_size = "l";
				}
			}

			if(this.settings.compact){
				compact_width = " style='width: " + this.settings.compact_width + "px'";
				col_left_styles = " style='width: 48%;'";
				col_center_styles = " style='width: 48%; margin-right: 0px;'";
			}

			$("#stock-market-total").html(" (" + this.data.length + ")");

			for(var d = 0, dl = this.data.length; d < dl; d ++){
				var up_down = "";
				var stock_html = "";

				if(this.replacements[this.data[d].Symbol] && this.replacements[this.data[d].Symbol].disabled && this.replacements[this.data[d].Symbol].disabled == 1){
					delete this.replacements[this.data[d].Symbol];
					continue;
				}

				this.symbols[this.data[d].Symbol] = this.data[d];

				if(parseFloat(this.data[d].PreviousClose) < parseFloat(this.data[d].BidRealtime)){
					up_down = "<img src='" + money.images.up + "' style='position: relative; top: 2px;' /> ";
				} else if(parseFloat(this.data[d].PreviousClose) > parseFloat(this.data[d].BidRealtime)){
					up_down = "<img src='" + money.images.down + "' style='position: relative; top: 2px;' /> ";
				}

				if(this.data[d].ChangeAndPercent == 0){
					this.data[d].ChangeAndPercent = "0.00";
				}

				if(this.data[d].RealPercentChange == 0){
					this.data[d].RealPercentChange = "0.00";
				}

				stock_html += "<div class='stock-block'" + compact_width + ">";
				stock_html += "<div class='stock-block-header'>";
				stock_html += "<div style='float: left;'>" + yootil.html_encode(this.get_stock_name(this.data[d].Symbol)) + " (" + yootil.html_encode(this.get_stock_symbol(this.data[d].Symbol)) + ") <span style='position: relative; top: -2px;' id='stock-invest-buttons'><button class='stock-buy-button' data-stock-id='" + yootil.html_encode(this.data[d].Symbol) + "'>Buy</button></span></div>";
				stock_html += "<div style='float: right'>" + yootil.html_encode(this.data[d].BidRealtime) + " " + up_down + "<span style='font-size: 14px;'>" + yootil.html_encode(this.data[d].ChangeAndPercent) + " (" + yootil.html_encode(this.data[d].RealPercentChange) + "%)</span></div><br style='clear: both' /></div>";

				stock_html += "<table class='stock-block-table-left'" + col_left_styles + ">";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Previous Close:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].PreviousClose) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Bid:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].BidRealtime) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Volume:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].Volume) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>1 Year Target:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].YearTarget) + "</td>";
				stock_html += "</tr>";

				stock_html += "</table>";
				stock_html += "<table class='stock-block-table-center'" + col_center_styles + ">";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Open:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].Open) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Day's Low:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].DaysLow) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>Day's High:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].DaysHigh) + "</td>";
				stock_html += "</tr>";

				stock_html += "<tr>";
				stock_html += "<td class='stock-block-cell-left'>P/E:</td>";
				stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].PERatio) + "</td>";
				stock_html += "</tr>";

				stock_html += "</table>";

				if(!this.settings.compact){
					stock_html += "<table class='stock-block-table-right'>";

					stock_html += "<tr>";
					stock_html += "<td class='stock-block-cell-left'>Days Range:</td>";
					stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].DaysRange) + "</td>";
					stock_html += "</tr>";

					stock_html += "<tr>";
					stock_html += "<td class='stock-block-cell-left'>52 Week Range:</td>";
					stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].Week52Range) + "</td>";
					stock_html += "</tr>";

					stock_html += "<tr>";
					stock_html += "<td class='stock-block-cell-left'>Market Cap.:</td>";
					stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].MarketCapitalization) + "</td>";
					stock_html += "</tr>";

					stock_html += "<tr>";
					stock_html += "<td class='stock-block-cell-left'>EPS</td>";
					stock_html += "<td class='stock-block-cell-right'>" + yootil.html_encode(this.data[d].EPS) + "</td>";
					stock_html += "</tr>";

					stock_html += "</table>";
				}

				stock_html += "<br style='clear: both' />";

				if(this.settings.show_chart){
					stock_html += "<div class='stock-block-chart'>";
					stock_html += "<img src='http://chart.finance.yahoo.com/z?s=" + yootil.html_encode(this.data[d].Symbol) + "&t=2w&l=off&z=" + chart_size + "' />";
					stock_html += "</div>";
				}

				stock_html += "</div>";

				var stock_obj = $(stock_html);

				stock_obj.find(".stock-buy-button").click(function(){
					var stock_id = $(this).attr("data-stock-id");
					var buy_element = "<div title='Buy Stock (" + yootil.html_encode(self.get_stock_symbol(stock_id)) + ")'><p>Stock Units: <input type='text' style='width: 100px' name='stock-buy-" + yootil.html_encode(stock_id) + "' /></p></div>";

					var invest_data = money.data(yootil.user.id()).get.investments();

					if(self.has_invested(stock_id) && self.invest_amount(stock_id) > 0){
						if(invest_data[stock_id].b != self.symbols[stock_id].BidRealtime){
							proboards.alert("An Error Occurred", "You have already made an investment in " + yootil.html_encode(self.get_stock_name(stock_id)) + " (" + yootil.html_encode(self.get_stock_symbol(stock_id)) + ") at a different price.  You will need to sell your current units before investing into this company again.", {
								modal: true,
								resizable: false,
								draggable: false,
								width: 350,
								height: 200
							});

							return;
						}
					}

					$(buy_element).dialog({
						modal: true,
						height: 140,
						width: 300,
						resizable: false,
						draggable: false,
						open: function(){
							$(this).find("input[name=stock-buy-" + self.escape_expression(stock_id) + "]").val("");
						},

						buttons: {

							Cancel: function(){
								$(this).dialog("close");
							},

							"Buy Stock": function(){
								var amount = parseInt($(this).find("input[name=stock-buy-" + self.escape_expression(stock_id) + "]").val());

								if(amount > 0){
									var s = (amount == 1)? "" : "s";
									var info = "";

									info += "<strong>" + yootil.html_encode(self.get_stock_name(stock_id)) + " (" + yootil.html_encode(self.get_stock_symbol(stock_id)) + ")</strong><br /><br />";
									info += "Purchase Amount: " + yootil.html_encode(yootil.number_format(amount)) + " unit" + s + "<br />";
									info += "Cost Per Unit: " + money.settings.money_symbol + yootil.html_encode(yootil.number_format(self.symbols[stock_id].BidRealtime)) + "<br /><br />";
									info += "Total Purchase: " + money.settings.money_symbol + yootil.html_encode(yootil.number_format(money.format(amount * parseFloat(self.symbols[stock_id].BidRealtime), true)));

									proboards.dialog("stock-buy-confirm", {
										title: "Confirm Purchase",
										html: info,
										modal: true,
										resizable: false,
										draggable: false,

										buttons: {

											No: function(){
												$(this).dialog('close');
											},

											"Yes": function(){
												self.buy_stock(stock_id, amount, true);
												$(this).dialog("close");
											}
										}
									});
								} else {
									proboards.alert("Invalid Amount", "You need to enter an amount greater than 0.", {
										modal: true,
										resizable: false,
										draggable: false
									});
								}

								$(this).dialog("close");
							}

						}
					});
				});

				stock_table.append(stock_obj);

				this.total ++;
			}

			var stock_content = $("<div id='stock-content'" + compact_width + "></div>").append(stock_table);

			this.html = stock_content;
			this.current_investment_list();
			this.update();
		},

		update: function(){
			var self = this;
			var pixels = (self.settings.compact)? self.settings.compact_width : "908";

			$("#stock-wrapper").empty().append($(this.html));

			$("#stock-right").click(function(){
				if(self.current == self.total){
					return false;
				}

				self.current ++;

				var move_by = "-=" + pixels + "px";

				$("#stock-content-strip").animate({
					"left": move_by
				}, "slow");
			});

			$("#stock-left").click(function(){
				if(self.current <= 1){
					return false;
				}

				self.current --;

				var move_by = "+=" + pixels + "px";

				$("#stock-content-strip").animate({
					"left": move_by
				}, "slow");
			});

		}

	};

})().register();