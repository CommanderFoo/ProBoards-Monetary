money.Data = (function(){

	function Data(user_id, data){
		this.user_id = user_id;
		this.data = data || {

			// General money (aka wallet)

			m: 0,

			// Bank

			b: 0,

			// Last transactions

			lt: [],

			// Last interest date

			li: "",

			// Stock market

			s: {},

			// Wages

			w: {

				// Posts

				p: 0,

				// Timestamp expiry

				e: 0,

				// When do they get paid

				w: 0,

				// Staff expiry

				s: 0

			},

			// Gift codes

			g: [],

			// Old rank

			or: 0,

			// Donations

			d: []

		};

		this.error = "";

		// Basic validation of data

		this.data.m = (typeof this.data.m == "number")? this.data.m : 0;
		this.data.b = (typeof this.data.b == "number")? this.data.b : 0;
		this.data.lt = (typeof this.data.lt == "object" && this.data.lt.constructor == Array)? this.data.lt : [];
		this.data.li = (typeof this.data.li == "string")? this.data.li : "";
		this.data.s = (typeof this.data.s == "object" && this.data.s.constructor == Object)? this.data.s : {};
		this.data.w = (typeof this.data.w == "object" && this.data.w.constructor == Object)? this.data.w : {};
		this.data.g = (typeof this.data.g == "object" && this.data.lt.constructor == Array)? this.data.g : [];
		this.data.or = (typeof this.data.or == "number")? this.data.or : 0;
		this.data.d = (typeof this.data.d == "object" && this.data.d.constructor == Array)? this.data.d : [];

		this.update = function(skip_update){
			if(!skip_update){

				// Lets put in a length check on the data so we can get a reason why
				// the data was not updated.

				if(JSON.stringify(this.data).length > proboards.data("plugin_max_key_length")){
					this.error = "Data length has gone over it's limit of " + proboards.data("plugin_max_key_length");
				}

				// No need to stop update if limit has been reached, ProBoards should handle this
				// for us and stop the update of the key.

				yootil.key.set(money.KEY, this.data, this.user_id);
			}
		};

		var self = this;

		this.get = {

			error: function(){
				return this.error;
			},

			data: function(){
				return self.data;
			},

			pushed: function(){
				return self.pushed_data;
			},

			money: function(format){
				var amount = money.format(self.data.m, format || false);

				if(format){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			bank: function(format){
				var amount = money.format(self.data.b, format || false);

				if(format){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			transactions: function(){
				return self.data.lt;
			},

			investments: function(){
				return self.data.s;
			},

			interest: function(){
				return self.data.li;
			},

			wages: function(){
				return self.data.w;
			},

			gifts: function(){
				return self.data.g;
			},

			rank: function(){
				return self.data.or;
			},

			donations: function(){
				return self.data.d;
			}

		};

		this.decrease = {

			money: function(amount, skip_update){
				self.data.m -= money.format(amount);
				self.update(skip_update);
			},

			bank: function(amount, skip_update){
				self.data.b -= money.format(amount);
				self.update(skip_update);
			}

		};

		this.increase = {

			money: function(amount, skip_update){
				self.data.m += money.format(amount);
				self.update(skip_update);
			},

			bank: function(amount, skip_update){
				self.data.b += money.format(amount);
				self.update(skip_update);
			}

		};

		this.set = {

			money: function(amount, skip_update){
				self.data.m = money.format(amount);
				self.update(skip_update);
			},

			bank: function(amount, skip_update){
				self.data.b = money.format(amount);
				self.update(skip_update);
			},

			transactions: function(transactions, skip_update){
				self.data.lt = transactions;
				self.update(skip_update);
			},

			gifts: function(gifts, skip_update){
				self.data.g = gifts;
				self.update(skip_update);
			},

			rank: function(rank, skip_update){
				self.data.or = rank;
				self.update(skip_update);
			},

			investments: function(investments, skip_update){
				self.data.s = investments;
				self.update(skip_update);
			},

			interest: function(interest, skip_update){
				self.data.li = interest;
				self.update(skip_update);
			},

			wages: function(wages, skip_update){
				self.data.w = wages;
				self.update(skip_update);
			},

			data: function(data, skip_update){
				self.data = data;
				self.update(skip_update);
			},

			donations: function(donations, skip_update){
				self.data.d = donations;
				self.update(skip_update);
			}

		};

		this.clear = {

			gifts: function(skip_update){
				self.data.g = [];
				self.update(skip_update);
			},

			investmemts: function(skip_update){
				self.data.s = {};
				self.update(skip_update);
			},

			wages: function(skip_update){
				self.data.w = {};
				self.update(skip_update);
			},

			bank: function(skip_update){
				self.data.b = 0;
				self.update(skip_update);
			},

			money: function(skip_update){
				self.data.m = 0;
				self.update(skip_update);
			},

			transactions: function(skip_update){
				self.data.lt = [];
				self.update(skip_update);
			},

			interest: function(skip_update){
				self.data.li = "";
				self.update(skip_update);
			},

			rank: function(skip_update){
				self.data.or = 0;
				self.update(skip_update);
			},

			data: function(skip_update){
				self.data = {};
				self.update(skip_update);
			},

			donations: function(skip_update){
				self.data.d = [];
			}

		};

		this.push = {

			gift: function(code, skip_update){
				self.data.g.push(code);
				self.update(skip_update);
			}

		};

		this.donation = {

			/*
			* opts {
			* 	to: (Data object),
			* 	amount: (Integer / Float),
			* 	message: {
			* 		text: (String),
			* 		len: (Integer)
			* 	},
			* 	from: {
			* 		id: (Integer),
			* 		name: (String)
			*	}
			* }
			*/

			send: function(opts, skip_update){
				if(opts){
					if(opts.to && opts.amount && parseFloat(opts.amount) > 0 && opts.from && opts.from.id && parseInt(opts.from.id) > 0 && opts.from.name && opts.from.name.length){
						var the_donation = {

							t: (+ new Date() / 1000),
							a: money.format(opts.amount),
							f: [opts.from.id, opts.from.name]

						};

						if(opts.message && opts.message.text && opts.message.text.length){
							the_donation.m = opts.message.text.substr(0, ((opts.message.len)? opts.message.len : 50)).replace(/\n|\r/g, "[br]");
						}

						// Push donation to the array (note:  this is on the receivers object)

						opts.to.donation.push(the_donation);
						opts.to.update();

						// Remove donation amount

						self.decrease.money(opts.amount, skip_update);

						return true;
					}
				}

				return false;
			},

			push: function(donation){
				self.data.d.push(donation);
			}

		};

		return this;
	}

	return Data;

})();