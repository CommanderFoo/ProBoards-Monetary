pixeldepth.monetary.shop.Data = (function(){

	function Data(user_id, data_obj){
		this.user_id = user_id;
		this.data = data_obj || {

			// Items

			i: {}

		};

		this.data.i = (typeof this.data.i == "object" && this.data.i.constructor == Object)? this.data.i : {};

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

		this.get = {

			items: function(){
				return self.data.i;
			},

			data: function(){
				return self.data;
			}

		};

		this.set = {

			items: function(items, skip_update, opts){
				self.data.i = items;
				self.update(skip_update, opts);
			}

		};

		this.add = {

			item: function(item, skip_update, opts){
				if(item && item.id){
					if(self.data.i[item.id]){
						self.data.i[item.id].q += item.quantity;
						self.data.i[item.id].t = item.time;

						// Use lowest price and update when buying additional

						if(self.data.i[item.id].p > item.price){
							self.data.i[item.id].p = item.price;
						}
					} else {
						self.data.i[item.id] = {

							q: item.quantity,
							p: item.price,
							t: item.time

						};
					}

					self.update(skip_update, opts);
				}
			}

		};

		this.remove = {

			item: function(item, skip_update, opts){

			}

		};

		this.refund = {

			item: function(item, skip_update, opts){

			}

		};

		this.clear = {

			items: function(skip_update, opts){
				self.data.i = {};
				self.update(skip_update, opts);
			}

		};

		return this;
	}

	return Data;

})();