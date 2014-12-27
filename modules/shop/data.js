pixeldepth.monetary.shop.Data = (function(){

	function Data(user_id, data_obj){
		this.user_id = user_id;
		this.data = data_obj || {

			// Items

			i: {},

			// Gifts

			g: [],
			
			// Trades / Gifts
			
			t: []

		};

		this.data.i = (typeof this.data.i == "object" && this.data.i.constructor == Object)? this.data.i : {};
		this.data.g = (typeof this.data.g == "object" && this.data.g.constructor == Array)? this.data.g : [];
		this.data.t = (typeof this.data.t == "object" && this.data.t.constructor == Array)? this.data.t : [];

		this.update = function(skip_update, options){
			if(!skip_update){
				if(JSON.stringify(this.data).length > proboards.data("plugin_max_key_length")){
					return;
				}

				var key_obj = proboards.plugin.key(pixeldepth.monetary.shop.KEY);
				if(key_obj){
					key_obj.set(this.user_id, this.data, options);
				}
			}
		};

		var self = this;

		this.fixed = function(val){
			return parseFloat(parseFloat(val).toFixed(2));		
		};
		
		this.get = {

			items: function(){
				return self.data.i;
			},

			data: function(){
				return self.data;
			},

			item: function(id){
				return self.data.i[id] || null;
			},

			gifts: function(){
				return self.data.g;
			},

			quantity: function(id){
				if(self.data.i[id]){
					return self.data.i[id].q || 0;
				}

				return 0;
			},
			
			trades: {
			
				sent: function(){
					var sent = [];
					
					if(self.data.t && self.data.t.length){				
						for(var k in self.data.t){
							if(self.data.t[k].f && self.data.t[k].f.u && self.data.t[k].f.u[0] == self.user_id){
								sent.push(self.data.t[k]);
							}
						}
					}
				
					return sent;	
				},
				
				received: function(){
					var received = [];
					
					if(self.data.t && self.data.t.length){						
						for(var k in self.data.t){
							if(self.data.t[k].t && self.data.t[k].t.u && self.data.t[k].t.u[0] == self.user_id){
								received.push(self.data.t[k]);
							}
						}
					}
				
					return received;	
				}
				
			},
			
			trade: function(trade_id){
				if(!trade_id){
					return;	
				}
				
				if(self.data.t && self.data.t.length){						
					for(var k in self.data.t){
						if(self.data.t[k].d == trade_id){
							return self.data.t[k];	
						}		
					}
				}
				
				return;		
			}

		};
		
		this.set = {

			items: function(items, skip_update, opts){
				self.data.i = items;
				self.update(skip_update, opts);
			},

			gifts: function(gifts, skip_update, opts){
				self.data.g = gifts;
				self.update(skip_update, opts);
			},
			
			quantity: function(id, qty, skip_update, opts){
				if(self.data.i[id]){
					self.data.i[id].q = qty;
					self.update(skip_update, opts);	
				}
			},
			
			item: function(id, qty, price, skip_update, opts){
				self.data.i[id] = {
					
					p: price,
					q: qty
					
				};
				
				self.update(skip_update, opts);
			}

		};

		this.add = {

			item: function(item, skip_update, opts){
				if(item && item.id){
					if(self.data.i[item.id]){
						self.data.i[item.id].q = parseInt(self.data.i[item.id].q) + parseInt(item.quantity);

						// Use lowest price and update when buying additional

						if(parseFloat(self.data.i[item.id].p) > parseFloat(item.price)){
							self.data.i[item.id].p = self.fixed(item.price);
						}
					} else {
						self.data.i[item.id] = {

							q: item.quantity,
							p: self.fixed(item.price)

						};
					}

					self.update(skip_update, opts);
				}
			}

		};

		this.remove = {

			item: function(item_id, skip_update, opts){
				if(item_id && self.data.i[item_id]){
					delete self.data.i[item_id];
					self.update(skip_update, opts);

					return true;
				}

				return false;
			}

		};
		
		this.reduce = {
			
			quantity: function(item_id, quantity, skip_update, opts){
				if(item_id && self.data.i[item_id]){
					self.data.i[item_id].q -= ~~ quantity;
					
					if(self.data.i[item_id].q <= 0){
						delete self.data.i[item_id];	
					}
					
					self.update(skip_update, opts);

					return true;
				}

				return false;
			}
			
		};

		this.refund = {

			item: function(item_id, quantity, skip_update, opts){
				var item = self.data.i[item_id];

				if(item && item.q >= quantity){
					item.q -= quantity;

					if(item.q <= 0){
						delete self.data.i[item_id];
					}

					self.update(skip_update, opts);
				}
			}

		};

		this.clear = {

			items: function(skip_update, opts){
				self.data.i = {};
				self.update(skip_update, opts);
			},

			gifts: function(skip_update, opts){
				self.data.g = [];
				self.update(skip_update, opts);
			},
			
			trades: function(skip_update, opts){
				self.data.t = [];
				self.update(skip_update, opts);
			}

		};

		this.push = {

			gift: function(code, skip_update, opts){
				self.data.g.push(code);
				self.update(skip_update, opts);
			}

		};
		
		this.trade = {
			
			send: function(sending, sending_details, receiving, receiving_details){
				if(sending && sending_details && receiving_details){
					var request = {
						
						// Sender
						
						f: {
							
							u: sending_details,
							i: sending
						
						},
						
						t: {
							
							u: receiving_details
							
						}
						
					};
					
					if(receiving){
						request.t.i = receiving;	
					}
					
					request.d = (+ new Date());
					self.data.t.push(request);
					
					for(var k in sending){
						self.reduce.quantity(k, sending[k].q, true);
					}
					
					pixeldepth.monetary.shop.data(receiving_details[0]).trade.receive(request);
				}
				
				return false;
			},
			
			receive: function(request){
				self.data.t.push(request);
			},
			
			accept: function(the_trade, gift, skip_update, opts){
				var receive_user_id = the_trade.f.u[0];
				var receive_items = the_trade.f.i;
				var return_obj = {
					
					can_accept: true,
					error: "",
					
				};
														
				for(var item_id in receive_items){
					var shop_item = pixeldepth.monetary.shop.lookup[item_id];
					
					if(!shop_item){
						return_obj.can_accept = false;
						return_obj.error = "An item being sent for this request no longer exists in the shop.";
						
						break;
					}
				}
				
				// If not a gift, we need to make sure the
				// user has the items, otherwise we can't
				// accept this request only decline it
				
				if(return_obj.can_accept){
					var can_swap = true;
					
					if(!gift){
						var to_user_id = yootil.user.id();
						var send_items = the_trade.t.i;
						var receiver_data = pixeldepth.monetary.shop.data(the_trade.f.u[0]).data;
						
						for(var item_id in send_items){
							var shop_item = pixeldepth.monetary.shop.lookup[item_id];
						
							if(!shop_item){
								return_obj.can_accept = can_swap = false;
								return_obj.error = "An item being requested from you no longer exists in the shop.";
								
								break;
							} else {
								if(!self.data.i[item_id]){
									return_obj.can_accept = can_swap = false;
									return_obj.error = "An item being requested no longer exists, you must have lost it.";
									
									break;
								} else if(self.data.i[item_id].q < send_items[item_id].q){
									return_obj.can_accept = can_swap = false;
									return_obj.error = "An item being requested from doesn't have enough quantity to meet the request.";
									
									break;
								} else {
									if(receiver_data.i[item_id]){
										receiver_data.i[item_id].q += send_items[item_id].q;
									} else {
										receiver_data.i[item_id] = {
										
											q: send_items[item_id].q,
											p: ~~ shop_item.item_price
											
										};
									}
									
									self.reduce.quantity(item_id, send_items[item_id].q, true);
								}
							}		
						}
						
						if(can_swap){
							for(var item_id in receive_items){
								if(self.data.i[item_id]){
									self.data.i[item_id].q += receive_items[item_id].q;	
								} else {
									var shop_item = pixeldepth.monetary.shop.lookup[item_id];
									
									self.data.i[item_id] = {
									
										q: receive_items[item_id].q,
										p: ~~ shop_item.item_price
										
									};
								}
								
								
							}						
						}
					} else {
						for(var item_id in receive_items){
							if(self.data.i[item_id]){
								self.data.i[item_id].q += receive_items[item_id].q;	
							} else {
								var shop_item = pixeldepth.monetary.shop.lookup[item_id];
								
								self.data.i[item_id] = {
								
									q: receive_items[item_id].q,
									p: ~~ shop_item.item_price
									
								};
							}
						}
					}
					
					if(return_obj.can_accept && can_swap){
						self.trade.remove(the_trade);
						pixeldepth.monetary.shop.data(the_trade.f.u[0]).trade.remove(the_trade);
					}
				}
				
				return return_obj;
			},
			
			remove: function(the_trade, skip_update, opts){
				for(var i = 0, l = self.data.t.length; i < l; i ++){
					if(self.data.t[i].d == the_trade.d){
						self.data.t.splice(i, 1);
						break;						
					}	
				}
				
				self.update(skip_update, opts);
			},
			
			cancel: function(the_trade, skip_update, opts){
				var from = the_trade.f;
				
				if(!from){
					proboards.alert("An Error Has Occurred", "Could not cancel request, no from data.");
				} else {
					var from_user_id = yootil.user.id();
					var from_items = from.i;
										
					for(var item_id in from_items){
						var shop_item = pixeldepth.monetary.shop.lookup[item_id];
						 
						if(shop_item){
							var item_qty = self.get.quantity(item_id);
							
							if(item_qty){
								self.set.quantity(item_id, item_qty + from_items[item_id].q, true);									
							} else {
								self.set.item(item_id, from_items[item_id].q, shop_item.item_price, true);								
							}					
						}
					}
					
					// Remove the trade request from both sets of data
					
					var to_user = the_trade.t.u[0];
					
					pixeldepth.monetary.shop.data(to_user).trade.remove(the_trade, true);
					self.trade.remove(the_trade, true);
					
					pixeldepth.monetary.shop.data(to_user).update(false);
					self.update(false, opts);	
				}				
			},
			
			decline: function(the_trade, skip_update, opts){
				
				// We need add the item / quantity back to the
				// user who sent the request
				
				var from = the_trade.f;
				
				// There must always be from data, otherwise the request is invalid
				
				if(!from){
					proboards.alert("An Error Has Occurred", "Could not decline request, no from data.");
				} else {
					var from_user_id = from.u[0];
					var from_items = from.i;
					var refund_total = 0;
										
					for(var item_id in from_items){
						var shop_item = pixeldepth.monetary.shop.lookup[item_id];
						 
						if(shop_item){
							
							// Ok, so item does exist in the shop, we now
							// need to see if the user has a key for it, if so
							// we update the quantity, otherwise we insert a new
							// entry for the item
							
							var item_qty = pixeldepth.monetary.shop.data(from_user_id).get.quantity(item_id);
							
							if(item_qty){
								
								// Has item, so we now need to up the quantity
								
								pixeldepth.monetary.shop.data(from_user_id).set.quantity(item_id, item_qty + from_items[item_id].q, true);									
							} else {
								
								// No item, so insert new item with correct data
								
								pixeldepth.monetary.shop.data(from_user_id).set.item(item_id, from_items[item_id].q, shop_item.item_price, true);								
							}							
						} else {
						
							// Not needed anymore, because if the item isn't in the shop, then how do we know the price?
							
							/*var amount = (parseFloat(shop_item.item_price) * (pixeldepth.monetary.shop.settings.refund_percent / 100)) * from_items[item_id].q;
							
							refund_total += amount;
							pixeldepth.monetary.shop.data(from_user_id).refund(item_id, from_items[item_id].q, true);*/ 
						}
					}
										
					// Update "from" money
					
					if(refund_total){
						pixeldepth.monetary.data(from_user_id).increase.money(refund_total, true, null, false);
					}
										
					// Finally we need to remove the trade request from both sets of data
					
					pixeldepth.monetary.shop.data(from_user_id).trade.remove(the_trade, true);
					self.trade.remove(the_trade, true);
					
					// Update "from" data
					
					pixeldepth.monetary.shop.data(from_user_id).update(false);
					
					// Update the users data now
					
					self.update(false, opts);					
				}
					
			},
			
			exists: function(trade_id){
				if(!trade_id){
					return false;	
				}
				
				if(self.data.t && self.data.t.length){						
					for(var k in self.data.t){
						if(self.data.t[k].d == trade_id){
							return true;	
						}		
					}
				}
				
				return false;	
			}
			
		};

		return this;
	}

	return Data;

})();