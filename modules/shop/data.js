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
					return self.data.i[id].q | 0;
				}

				return 0;
			},
			
			trades: {
			
				sent: function(){
					var sent = [];
					
					if(self.data.t && self.data.t.length && self.data.t){						
						for(var k in self.data.t){
							if(self.data.t[k].s && self.data.t[k].s.u && self.data.t[k].s.u[0] == self.user_id){
								sent.push(self.data.t[k]);
							}
						}
					}
				
					return sent;	
				}	
				
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
			}

		};

		this.add = {

			item: function(item, skip_update, opts){
				if(item && item.id){
					if(self.data.i[item.id]){
						self.data.i[item.id].q = parseInt(self.data.i[item.id].q) + parseInt(item.quantity);
						self.data.i[item.id].t = item.time;

						// Use lowest price and update when buying additional

						if(parseFloat(self.data.i[item.id].p) > parseFloat(item.price)){
							self.data.i[item.id].p = self.fixed(item.price);
						}
					} else {
						self.data.i[item.id] = {

							q: item.quantity,
							p: self.fixed(item.price),
							t: item.time

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
						
						s: {
							
							u: sending_details,
							i: sending	
						
						},						
					
						r: {	
							
							u: receiving_details
							
						}
						
					};
					
					if(receiving){
						request.r.i = receiving;	
					}
					
					request.d = (+ new Date()) / 1000;
					self.data.t.push(request);
					
					return true;
					
				}
				
				return false;
			}
			
		};

		return this;
	}

	return Data;

})();