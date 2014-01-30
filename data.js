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

			or: 0

		};

		// Basic validation of data

		this.data.m = (typeof this.data.m == "number")? this.data.m : 0;
		this.data.b = (typeof this.data.b == "number")? this.data.b : 0;
		this.data.lt = (typeof this.data.lt == "object" && this.data.lt.constructor == Array)? this.data.lt : [];
		this.data.li = (typeof this.data.li == "string")? this.data.li : "";
		this.data.s = (typeof this.data.s == "object" && this.data.s.constructor == Object)? this.data.s : {};
		this.data.w = (typeof this.data.w == "object" && this.data.w.constructor == Object)? this.data.w : {};
		this.data.g = (typeof this.data.g == "object" && this.data.lt.constructor == Array)? this.data.g : [];
		this.data.or = (typeof this.data.or == "number")? this.data.or : 0;

		this.update = function(skip_update){
			if(!skip_update){
				yootil.key.set(money.KEY, this.data, this.user_id);
			}
		};

		var self = this;

		this.get = {

			data: function(){
				return self.data;
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
			}

		};

		this.push = {

			gift: function(code, skip_update){
				self.data.g.push(code);
				self.update(skip_update);
			}

		};

		return this;
	}

	return Data;

})();