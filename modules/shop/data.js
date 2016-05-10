/**
 * @class monetary.shop.Data
 * @constructor
 * Wrapper class around the users data that gets instantiated for each users data on the page for the shop.
 *
 *     var data = new monetary.shop.Data(yootil.user.id())
 *
 * Note:  You need to create an instance for each user.  The shop already does this for you. See the {@link monetary.shop#data data method}.
 *
 * @param {Number} user_id
 * @param {Object} data This is the data that comes from the shop key for the user.
 */

monetary.shop.Data = (function(){

	function Data(user_id, data_obj){

		/**
		 * @property {Number} user_id The user id for this user.
		 */

		this.user_id = user_id;

		/**
		 * @property {Object} data Data object for the user.
		 * @property {Object} data.i The items the user owns.
		 * @property {Array} data.g Gift codes the user has claimed (auto pruned).
		 * @property {Array} data.t Trade gifts and requests.
		 */

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

		/**
		 * Updates the key data, however you can avoid an actual AJAX request if needed.  Usually this is called internally.
		 *
		 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
		 * @param {Object} callbacks Yootil key options that get passed on to the set method.
		 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
		 */

		this.update = function(skip_update, callbacks){
			if(!skip_update){
				if(!yootil.key.has_space(monetary.shop.KEY)){
					this.error = "Data length has gone over it's limit of " + yootil.forum.plugin_max_key_length();

					pb.window.dialog("data_limit", {

						title: "Key Data Limit Reached",
						modal: true,
						height: 200,
						width: 350,
						resizable: false,
						draggable: false,
						html: "Unfortunately we can not save anymore data in the key.<br /><br />Plugin: Monetary Shop",

						buttons: {

							Close: function () {
								$(this).dialog("close");
							}

						}

					});

					return;
				}

				yootil.key.set(monetary.shop.KEY, this.data, this.user_id, callbacks);
			}
		};

		var self = this;

		this.fixed = function(val){
			return parseFloat(parseFloat(val).toFixed(2));		
		};

		/**
		 * @class monetary.shop.Data.get
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */
		
		this.get = {

			/**
			 * Gets the users items.
			 *
			 * @returns {Object}
			 */

			items: function(){
				return self.data.i;
			},

			/**
			 * Gets the users data object.
			 *
			 * @returns {Object}
			 */

			data: function(){
				return self.data;
			},

			/**
			 * Gets a specific item.
			 *
			 * @param {String} id The id for the item.
			 * @returns {Object}
			 */

			item: function(id){
				return self.data.i[id] || null;
			},

			/**
			 * Gets the users gift codes they have claimed.
			 *
			 * @returns {Array}
			 */

			gifts: function(){
				return self.data.g;
			},

			/**
			 * Gets the quantity for an item the user owns.
			 *
			 * @param {String} id The item id.
			 * @returns {Number}
			 */

			quantity: function(id){
				if(self.data.i[id]){
					return self.data.i[id].q || 0;
				}

				return 0;
			},

			/**
			 * @class monetary.shop.Data.get.trades
			 * @static
			 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
			 *
			 *     var data = new monetary.shop.Data(yootil.user.id());
			 */

			trades: {

				/**
				 * Gets the users trade or gift requests they have sent to other users.
				 *
				 * @returns {Array}
				 */

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

				/**
				 * Gets the users trade or gift requests they have received from other users.
				 *
				 * @returns {Array}
				 */

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

			/**
			 * Gets a specific trade request.
			 *
			 * @param {Number} trade_id The trade ID to get.
			 * @returns {Object}
			 */
			
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

		/**
		 * @class monetary.shop.Data.set
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.set = {

			/**
			 * Sets the users items.
			 *
			 * @param {Object} items The items.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			items: function(items, skip_update, opts){
				self.data.i = items;
				self.update(skip_update, opts);
			},

			/**
			 * Sets the users gifts.
			 *
			 * @param {Object} gifts The gifts.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			gifts: function(gifts, skip_update, opts){
				self.data.g = gifts;
				self.update(skip_update, opts);
			},

			/**
			 * Sets the quantity of an item the user owns.
			 *
			 * @param {String} id The item ID.
			 * @param {Number} qty The quantity to set it too.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			quantity: function(id, qty, skip_update, opts){
				if(self.data.i[id]){
					self.data.i[id].q = qty;
					self.update(skip_update, opts);	
				}
			},

			/**
			 * Sets an item.
			 *
			 * @param {String} id The item ID.
			 * @param {Number} qty The quantity to set it too.
			 * @param {Number} price The price paid for the item.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			item: function(id, qty, price, skip_update, opts){
				self.data.i[id] = {
					
					p: price,
					q: qty
					
				};
				
				self.update(skip_update, opts);
			}

		};

		/**
		 * @class monetary.shop.Data.add
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.add = {

			/**
			 * Adds an item to the item object.
			 *
			 * @param {Object} item The item to be added.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

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

		/**
		 * @class monetary.shop.Data.remove
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.remove = {

			/**
			 * Removes an item to the item object.
			 *
			 * @param {String} item_id The item to be removed.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			item: function(item_id, skip_update, opts){
				if(item_id && self.data.i[item_id]){
					delete self.data.i[item_id];
					self.update(skip_update, opts);

					return true;
				}

				return false;
			}

		};

		/**
		 * @class monetary.shop.Data.reduce
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.reduce = {

			/**
			 * Reduces the quantity owned of an item.
			 *
			 * @param {String} item_id The item to be reduced.
			 * @param {Number} quantity Quantity to be reduced by.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

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

		/**
		 * @class monetary.shop.Data.refund
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.refund = {

			/**
			 * Refunds an item.
			 *
			 * @param {String} item_id The item to be refunded.
			 * @param {Number} quantity Quantity to be refunded.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

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

		/**
		 * @class monetary.shop.Data.clear
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.clear = {

			/**
			 * Clears all items from the data object.
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			items: function(skip_update, opts){
				self.data.i = {};
				self.update(skip_update, opts);
			},

			/**
			 * Clears all gifts from the data object.
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			gifts: function(skip_update, opts){
				self.data.g = [];
				self.update(skip_update, opts);
			},

			/**
			 * Clears all trades from the data object.
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			trades: function(skip_update, opts){
				self.data.t = [];
				self.update(skip_update, opts);
			}

		};

		/**
		 * @class monetary.shop.Data.push
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.push = {

			/**
			 * Pushes a gift code to the gift array on the data object.
			 *
			 * @param {String} code The gift code being pushed.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			gift: function(code, skip_update, opts){
				self.data.g.push(code);
				self.update(skip_update, opts);
			}

		};

		/**
		 * @class monetary.shop.Data.trade
		 * @static
		 * Note:  You need to create an instance.  The shop already does this for you. See the {@link monetary.shop#data data method}.
		 *
		 *     var data = new monetary.shop.Data(yootil.user.id());
		 */

		this.trade = {

			/**
			 * Sends a trade / gift request to a user.
			 *
			 * @param {Object} sending The items being sent.
			 * @param {Array} sending_details The details for the user sending the request (i.e name).
			 * @param {Object} receiving The items being received (aka requested in the trade).
			 * @param {Array} receiving_details The details for the user receiving the request (i.e name).
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

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
					
					monetary.shop.data(receiving_details[0]).trade.receive(request);
				}
				
				return false;
			},

			/**
			 * Pushes a new trade request that is being received from a user.
			 *
			 * @param {Object} request The trade request data.
			 */

			receive: function(request){
				self.data.t.push(request);
			},

			/**
			 * Accepts a gift / trade request
			 *
			 * @param {Object} the_trade The trade data.
			 * @param {Boolean} gift If it is a gift or not.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			accept: function(the_trade, gift, skip_update, opts){
				var receive_user_id = the_trade.f.u[0];
				var receive_items = the_trade.f.i;
				var return_obj = {
					
					can_accept: true,
					error: "",
					
				};
														
				for(var item_id in receive_items){
					var shop_item = monetary.shop.lookup[item_id];
					
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
						var receiver_data = monetary.shop.data(the_trade.f.u[0]).data;
						
						for(var item_id in send_items){
							var shop_item = monetary.shop.lookup[item_id];
						
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
									var shop_item = monetary.shop.lookup[item_id];
									
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
								var shop_item = monetary.shop.lookup[item_id];
								
								self.data.i[item_id] = {
								
									q: receive_items[item_id].q,
									p: ~~ shop_item.item_price
									
								};
							}
						}
					}
					
					if(return_obj.can_accept && can_swap){
						self.trade.remove(the_trade);
						monetary.shop.data(the_trade.f.u[0]).trade.remove(the_trade);
					}
				}
				
				return return_obj;
			},

			/**
			 * Removes a trade request.
			 *
			 * @param {Object} the_trade The trade data.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			remove: function(the_trade, skip_update, opts){
				for(var i = 0, l = self.data.t.length; i < l; i ++){
					if(self.data.t[i].d == the_trade.d){
						self.data.t.splice(i, 1);
						break;						
					}	
				}
				
				self.update(skip_update, opts);
			},

			/**
			 * Cancels a trade request.
			 *
			 * @param {Object} the_trade The trade data.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */
			
			cancel: function(the_trade, skip_update, opts){
				var from = the_trade.f;
				
				if(!from){
					pb.window.alert("An Error Has Occurred", "Could not cancel request, no from data.");
				} else {
					var from_user_id = yootil.user.id();
					var from_items = from.i;
										
					for(var item_id in from_items){
						var shop_item = monetary.shop.lookup[item_id];
						 
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
					
					monetary.shop.data(to_user).trade.remove(the_trade, true);
					self.trade.remove(the_trade, true);
					
					monetary.shop.data(to_user).update(false);
					self.update(false, opts);	
				}				
			},

			/**
			 * Declines a trade request.
			 *
			 * @param {Object} the_trade The trade data.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 */

			decline: function(the_trade, skip_update, opts){
				
				// We need add the item / quantity back to the
				// user who sent the request
				
				var from = the_trade.f;
				
				// There must always be from data, otherwise the request is invalid
				
				if(!from){
					pb.window.alert("An Error Has Occurred", "Could not decline request, no from data.");
				} else {
					var from_user_id = from.u[0];
					var from_items = from.i;
					var refund_total = 0;
										
					for(var item_id in from_items){
						var shop_item = monetary.shop.lookup[item_id];
						 
						if(shop_item){
							
							// Ok, so item does exist in the shop, we now
							// need to see if the user has a key for it, if so
							// we update the quantity, otherwise we insert a new
							// entry for the item
							
							var item_qty = monetary.shop.data(from_user_id).get.quantity(item_id);
							
							if(item_qty){
								
								// Has item, so we now need to up the quantity
								
								monetary.shop.data(from_user_id).set.quantity(item_id, item_qty + from_items[item_id].q, true);
							} else {
								
								// No item, so insert new item with correct data
								
								monetary.shop.data(from_user_id).set.item(item_id, from_items[item_id].q, shop_item.item_price, true);
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
						monetary.data(from_user_id).increase.money(refund_total, true, null, false);
					}
										
					// Finally we need to remove the trade request from both sets of data
					
					monetary.shop.data(from_user_id).trade.remove(the_trade, true);
					self.trade.remove(the_trade, true);
					
					// Update "from" data
					
					monetary.shop.data(from_user_id).update(false);
					
					// Update the users data now
					
					self.update(false, opts);					
				}
					
			},

			/**
			 * Checks to see if a trade request exists.
			 *
			 * @param {Number} trade_id
			 * @returns {Boolean}
			 */

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