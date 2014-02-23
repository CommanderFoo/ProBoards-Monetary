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

			d: [],

			// Rejected donations

			rd: []

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
		this.data.rd = (typeof this.data.rd == "object" && this.data.rd.constructor == Array)? this.data.rd : [];

		this.update = function(skip_update, options){
			if(!skip_update){

				// Lets put in a length check on the data so we can get a reason why
				// the data was not updated.

				if(JSON.stringify(this.data).length > proboards.data("plugin_max_key_length")){
					this.error = "Data length has gone over it's limit of " + proboards.data("plugin_max_key_length");
				}

				// No need to stop update if limit has been reached, ProBoards should handle this
				// for us and stop the update of the key.

				// Yootil key needs updating to support options
				//yootil.key.set(money.KEY, this.data, this.user_id);

				var key_obj = proboards.plugin.key(money.KEY);

				if(key_obj){
					key_obj.set(this.user_id, this.data, options);
				}
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

			money: function(string){
				var amount = money.format(self.data.m, string || false);

				if(string){
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
			},

			rejected_donations: function(){
				return self.data.rd;
			}

		};

		this.decrease = {

			money: function(amount, skip_update, opts){
				self.data.m -= money.format(amount);
				self.update(skip_update, opts);
			},

			bank: function(amount, skip_update, opts){
				self.data.b -= money.format(amount);
				self.update(skip_update, opts);
			}

		};

		this.increase = {

			money: function(amount, skip_update, opts){
				self.data.m += money.format(amount);
				self.update(skip_update, opts);
			},

			bank: function(amount, skip_update, opts){
				self.data.b += money.format(amount);
				self.update(skip_update, opts);
			}

		};

		this.set = {

			money: function(amount, skip_update, opts){
				self.data.m = money.format(amount);
				self.update(skip_update, opts);
			},

			bank: function(amount, skip_update, opts){
				self.data.b = money.format(amount);
				self.update(skip_update, opts);
			},

			transactions: function(transactions, skip_update, opts){
				self.data.lt = transactions;
				self.update(skip_update, opts);
			},

			gifts: function(gifts, skip_update, opts){
				self.data.g = gifts;
				self.update(skip_update, opts);
			},

			rank: function(rank, skip_update, opts){
				self.data.or = rank;
				self.update(skip_update, opts);
			},

			investments: function(investments, skip_update, opts){
				self.data.s = investments;
				self.update(skip_update, opts);
			},

			interest: function(interest, skip_update, opts){
				self.data.li = interest;
				self.update(skip_update, opts);
			},

			wages: function(wages, skip_update, opts){
				self.data.w = wages;
				self.update(skip_update, opts);
			},

			data: function(data, skip_update, opts){
				self.data = data;
				self.update(skip_update, opts);
			},

			donations: function(donations, skip_update, opts){
				self.data.d = donations;
				self.update(skip_update, opts);
			}

		};

		this.clear = {

			gifts: function(skip_update, opts){
				self.data.g = [];
				self.update(skip_update, opts);
			},

			investmemts: function(skip_update, opts){
				self.data.s = {};
				self.update(skip_update, opts);
			},

			wages: function(skip_update, opts){
				self.data.w = {};
				self.update(skip_update, opts);
			},

			bank: function(skip_update, opts){
				self.data.b = 0;
				self.update(skip_update, opts);
			},

			money: function(skip_update, opts){
				self.data.m = 0;
				self.update(skip_update, opts);
			},

			transactions: function(skip_update, opts){
				self.data.lt = [];
				self.update(skip_update, opts);
			},

			interest: function(skip_update, opts){
				self.data.li = "";
				self.update(skip_update, opts);
			},

			rank: function(skip_update, opts){
				self.data.or = 0;
				self.update(skip_update, opts);
			},

			data: function(skip_update, opts){
				self.data = {};
				self.update(skip_update, opts);
			},

			donations: function(skip_update, opts){
				self.data.d = [];
				self.update(skip_update, opts);
			},

			rejected_donations: function(skip_update, opts){
				self.data.rd = [];
				self.update(skip_update, opts);
			}

		};

		this.push = {

			gift: function(code, skip_update, opts){
				self.data.g.push(code);
				self.update(skip_update, opts);
			}

		};

		this.donation = {

			/*
			* don {
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

			send: function(don, skip_update, opts){
				if(don){
					if(don.to && don.amount && parseFloat(don.amount) > 0 && don.from && don.from.id && parseInt(don.from.id) > 0 && don.from.name && don.from.name.length){
						var the_donation = {

							t: (+ new Date() / 1000),
							a: money.format(don.amount),
							f: [don.from.id, don.from.name]

						};

						if(don.message && don.message.text && don.message.text.length){
							the_donation.m = don.message.text.substr(0, ((don.message.len)? don.message.len : 50)).replace(/\n|\r/g, "[br]");
						}

						// Push donation to the array (note:  this is on the receivers object)

						don.to.donation.push(the_donation);
						don.to.update(skip_update);

						// Remove donation amount

						self.decrease.money(don.amount, skip_update, opts);

						return true;
					}
				}

				return false;
			},

			send_rejected: function(don, skip_update, opts){
				if(don.a && don.t && don.f){
					var reject = {

						a: don.a,
						t: don.t

					};

					// Push rejected donation to the array (note:  this is on the senders object)

					money.data(don.f).donation.push_reject(reject);
					money.data(don.f).update(skip_update);
					self.update(skip_update, opts);
				}
			},

			accept: function(donation_id, amount, skip_update, opts){
				if(self.data.d[donation_id]){
					self.data.d.splice(donation_id, 1);
				}

				self.increase.money(amount, skip_update, opts);
			},

			reject: function(donation_id, donation, skip_update, opts){
				if(self.data.d[donation_id]){
					//self.data.d.splice(donation_id, 1);
				}

				self.donation.send_rejected(donation, skip_update, opts);
			},

			push: function(donation){
				self.data.d.push(donation);
			},

			push_reject: function(reject){
				self.data.rd.push(reject);
			}

		};

		return this;
	}

	return Data;

})();