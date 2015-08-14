/**
 * @class monetary.Data
 * @constructor
 * Wrapper class around the users data that gets instantiated for each users data on the page.
 *
 *     var data = new monetary.Data(yootil.user.id())
 *
 * Note:  You need to create an instance for each user.  Monetary already does this for you. See the {@link monetary#data data method}.
 *
 * @param {Number} user_id
 * @param {Object} data This is the data that comes from the key for the user.
 */

money.Data = (function(){

	function Data(user_id, data_obj){

		/**
		 * @property {Number} user_id The user id for this user.
		 */

		this.user_id = user_id;

		/**
		 * @property {Object} data Data object for the user.
		 * @property {Number} data.m General money (aka wallet).
		 * @property {Number} data.b Bank money.
		 * @property {Array} data.lt Last bank transactions.
		 * @property {String} data.li Timestamp of last time interest was given.
		 * @property {Object} data.s Stock market data.
		 * @property {Object} data.w Wages.
		 * @property {Number} data.w.p Total posts made (gets reset).
		 * @property {Number} data.w.e Timestamp expiry.
		 * @property {Number} data.w.w When the user is paid.
		 * @property {Number} data.w.s Staff expiry timestamp.
		 * @property {Array} data.g Gift codes.
		 * @property {Number} data.or Old rank.
		 * @property {Array} data.d Donations received.
		 * @property {Number} data.ds Total amount for donations sent.
		 * @property {Number} data.dr Total amount for donations received.
		 * @property {Array} data.rd Rejected donations.
		 */

		this.data = data_obj || {

			m: 0,

			b: 0,

			lt: [],

			li: "",

			s: {},

			w: {

				p: 0,
				e: 0,
				w: 0,
				s: 0

			},

			g: [],

			or: 0,

			d: [],

			ds: 0,

			dr: 0,

			rd: [],

			n: []

		};

		/**
		 * @property {String} error Holds the last error.  This isn't used much.
		 */

		this.error = "";

		// Basic validation of data

		this.data.m = parseFloat(this.data.m);
		this.data.b = parseFloat(this.data.b);
		this.data.lt = (typeof this.data.lt == "object" && this.data.lt.constructor == Array)? this.data.lt : [];
		this.data.li = (typeof this.data.li == "string")? this.data.li : "";
		this.data.s = (typeof this.data.s == "object" && this.data.s.constructor == Object)? this.data.s : {};
		this.data.w = (typeof this.data.w == "object" && this.data.w.constructor == Object)? this.data.w : {};
		this.data.g = (typeof this.data.g == "object" && this.data.lt.constructor == Array)? this.data.g : [];
		this.data.or = (typeof this.data.or == "number")? this.data.or : 0;
		this.data.d = (typeof this.data.d == "object" && this.data.d.constructor == Array)? this.data.d : [];
		this.data.rd = (typeof this.data.rd == "object" && this.data.rd.constructor == Array)? this.data.rd : [];
		this.data.ds = (parseFloat(this.data.ds) > 0)? parseFloat(this.data.ds) : 0;
		this.data.dr = (parseFloat(this.data.dr) > 0)? parseFloat(this.data.dr) : 0;
		this.data.n = (typeof this.data.n == "object" && this.data.n.constructor == Array)? this.data.n : [];

		/**
		 * Updates the key data, however you can avoid an actual AJAX request if needed.  Usually this is called internally.
		 *
		 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
		 * @param {Object} callbacks Yootil key options that get passed on to the set method.
		 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
		 */

		this.update = function(skip_update, callbacks, sync){
			if(!skip_update){

				// Lets put in a length check on the data

				if(!yootil.key.has_space(money.KEY)){
					this.error = "Data length has gone over it's limit of " + yootil.forum.plugin_max_key_length();

					pb.window.dialog("data_limit", {

						title: "Key Data Limit Reached",
						modal: true,
						height: 200,
						width: 350,
						resizable: false,
						draggable: false,
						html: "Unfortunately we can not save anymore data in the key.<br /><br />Plugin: Monetary System",

						buttons: {

							Close: function () {
								$(this).dialog("close");
							}

						}

					});

					return;
				}

				yootil.key.set(money.KEY, this.data, this.user_id, callbacks);

				if(sync){
					money.sync.trigger();
				}
			}
		};

		var self = this;

		this.fixed = function(val){
			return parseFloat(parseFloat(val).toFixed(2));
		};

		/**
		 * @class monetary.Data.get
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.get.money();
		 *
		 */

		this.get = {

			/**
			 * Gets the last error stored in the error property.
			 *
			 * @returns {String}
			 */

			error: function(){
				return this.error;
			},

			/**
			 * Gets the internal data object for this user.
			 *
			 * @returns {Object}
			 */

			data: function(){
				return self.data;
			},

			pushed: function(){
				return self.pushed_data;
			},

			/**
			 * Gets the uses money from the data object.
			 *
			 *     monetary.data(yootil.user.id()).get.money();
			 *
			 * @param {Boolean} string Pass true to have a string returned back.
			 * @returns {Mixed}
			 */

			money: function(string){
				var amount = money.format(self.data.m, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			 * Gets the uses bank money from the data object.
			 *
			 *     monetary.data(yootil.user.id()).get.bank();
			 *
			 * @param {Boolean} string Pass true to have a string returned back.
			 * @returns {Mixed}
			 */

			bank: function(string){
				var amount = money.format(self.data.b, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			 * Gets the uses bank transactions from the data object.
			 *
			 * @returns {Array}
			 */

			transactions: function(){
				return self.data.lt;
			},

			/**
			 * Gets the uses stock investments from the data object.
			 *
			 * @returns {Object}
			 */

			investments: function(){
				return self.data.s;
			},

			/**
			 * Gets the last interest timestamp
			 *
			 * @returns {Mixed}
			 */

			interest: function(){
				return self.data.li;
			},

			/**
			 * Gets the wages object from the data object.
			 *
			 * @returns {Object}
			 */

			wages: function(){
				return self.data.w;
			},

			/**
			 * Gets the users gift codes they have accepted, these get deleted over time.
			 *
			 * @returns {Array}
			 */

			gifts: function(){
				return self.data.g;
			},

			/**
			 * Gets the last rank recorded.
			 *
			 * @returns {Number}
			 */

			rank: function(){
				return self.data.or;
			},

			/**
			 * Gets donations sent to this user.
			 *
			 * @returns {Number}
			 */

			donations: function(){
				return self.data.d;
			},

			/**
			 * Gets the rejected donations for this user.
			 *
			 * @returns {Array}
			 */

			rejected_donations: function(){
				return self.data.rd;
			},

			/**
			 * Gets the total value of donations sent to people.
			 *
			 * @param {Boolean} string Pass true to have a string returned back.
			 * @returns {Number}
			 */

			total_sent_donations: function(string){
				var amount = money.format(self.data.ds, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			 * Gets the total value of donations received by people.
			 *
			 * @param {Boolean} string Pass true to have a string returned back.
			 * @returns {Mixed}
			 */

			total_received_donations: function(string){
				var amount = money.format(self.data.dr, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			notifications: function(){
				return self.data.n;
			}

		};

		/**
		 * @class monetary.Data.decrease
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.decrease.money();
		 */

		this.decrease = {

			/**
			 * Decreases the uses money by the amount passed in.
			 *
			 *     monetary.data(yootil.user.id()).decrease.money(100);
			 *
			 * @param {Number} amount The amount to be deducted.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(self.data.m) - parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Decreases the uses money in the bank by the amount passed in.
			 *
			 *     monetary.data(yootil.user.id()).decrease.bank(100);
			 *
			 * @param {Number} amount The amount to be deducted.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(self.data.b) - parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Decreases the total donations sent.
			 *
			 * Parameters:
			 * 	amount - *integer* The amount to be removed
			 * 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			 * 	options - *object* ProBoards key options that get passed on to the set method.
			 *	sync - *boolean* To sync up data across tabs / windows, pass true.
			 */

			donations_sent: function(amount, skip_update, opts, sync){
				self.data.ds = parseFloat(self.data.ds) - parseFloat(amount);
				self.data.ds = self.fixed(self.data.ds);
				self.data.ds = (self.data.ds < 0)? 0 : self.data.ds;
				self.update(skip_update, opts, sync);
			},

			/**
			 * 	Decreases the total donations received
			 *
			 * @param {Number} amount The amount to be deducted.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			donations_received: function(amount, skip_update, opts, sync){
				self.data.dr = parseFloat(self.data.dr) - parseFloat(amount);
				self.data.dr = self.fixed(self.data.dr);
				self.data.dr = (self.data.dr < 0)? 0 : self.data.dr;
				self.update(skip_update, opts, sync);
			}

		};

		/**
		 * @class monetary.Data.increase
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.increase.money();
		 */

		this.increase = {

			/**
			 * Increases the uses money by the amount passed in.
			 *
			 *     monetary.data(yootil.user.id()).increase.money(100);
			 *
			 * @param {Number} amount The amount to be added.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(self.data.m) + parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Increases the uses bank money by the amount passed in.
			 *
			 *     monetary.data(yootil.user.id()).increase.bank(100);
			 *
			 * @param {Number} amount The amount to be added.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(self.data.b) + parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Increases the total donations sent.
			 *
			 * @param {Number} amount The amount to be added.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			donations_sent: function(amount, skip_update, opts, sync){
				self.data.ds = parseFloat(self.data.ds) + parseFloat(amount);
				self.data.ds = self.fixed(self.data.ds);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Increases the total donations received.
			 *
			 * @param {Number} amount The amount to be added.
			 * @param {Boolean}	skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			donations_received: function(amount, skip_update, opts, sync){
				self.data.dr = parseFloat(self.data.dr) + parseFloat(amount);
				self.data.dr = self.fixed(self.data.dr);
				self.update(skip_update, opts, sync);
			}

		};

		/**
		 * @class monetary.Data.set
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.set.money(1000);
		 */

		this.set = {

			/**
			 * Sets the users money to the amount passed in
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users bank money to the amount passed in
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users bank transactions
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			transactions: function(transactions, skip_update, opts, sync){
				self.data.lt = transactions;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users gifts
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			gifts: function(gifts, skip_update, opts, sync){
				self.data.g = gifts;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users rank
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			rank: function(rank, skip_update, opts, sync){
				self.data.or = rank;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users stock investments
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			investments: function(investments, skip_update, opts, sync){
				self.data.s = investments;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users last interest timestamp
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			interest: function(interest, skip_update, opts, sync){
				self.data.li = interest;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users wages
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			wages: function(wages, skip_update, opts, sync){
				self.data.w = wages;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users data
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			data: function(data, skip_update, opts, sync){
				self.data = data;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Sets the users data
			 *
			 * @param {Number} amount The amount to set the money to.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			donations: function(donations, skip_update, opts, sync){
				self.data.d = donations;
				self.update(skip_update, opts, sync);
			}

		};

		/**
		 * @class monetary.Data.clear
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.clear.money();
		 */

		this.clear = {

			/**
			 * Clear the users gifts array
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			gifts: function(skip_update, opts, sync){
				self.data.g = [];
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users investments object
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			investments: function(skip_update, opts, sync){
				self.data.s = {};
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users wages object
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			wages: function(skip_update, opts, sync){
				self.data.w = {};
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users bank amount
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			bank: function(skip_update, opts, sync){
				self.data.b = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users money amount (aka wallet)
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			money: function(skip_update, opts, sync){
				self.data.m = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users transactions array
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			transactions: function(skip_update, opts, sync){
				self.data.lt = [];
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users last interest timestamp
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			interest: function(skip_update, opts, sync){
				self.data.li = "";
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users old rank
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			rank: function(skip_update, opts, sync){
				self.data.or = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users data object
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			data: function(skip_update, opts, sync){
				self.data = {};
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users donations array
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			donations: function(skip_update, opts, sync){
				self.data.d = [];
				self.update(skip_update, opts, sync);
			},

			/**
			 * Clear the users rejected_donations array
			 *
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			rejected_donations: function(skip_update, opts, sync){
				self.data.rd = [];
				self.update(skip_update, opts, sync);
			},

			notifications: function(skip_update, opts, sync){
				self.data.n = [];
				self.update(skip_update, opts, sync);
			}

		};

		/**
		 * @class monetary.Data.push
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.push.gift("abc")
		 */

		this.push = {

			/**
			 * Pushes a gift code to the data object when it's been accepted.
			 *
			 * @param {String} code The code to be pushed to the array.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			gift: function(code, skip_update, opts, sync){
				self.data.g.push(code);
				self.update(skip_update, opts, sync);
			},

			// a 3rd element: 1 = set, 2 = reset, 3 = increase, 4 = descrease

			// type: 1 = money, 2 = bank

			notification: function(notification, skip_update, opts, sync){
				notification.amount = [parseFloat(notification.amount[0]), parseFloat(notification.amount[1]), notification.amount[2]];

				self.data.n.push({

					k: notification.type,
					a: notification.amount,
					t: notification.time,
					u: notification.user

				});

				self.update(skip_update, opts, sync);
			}

		};

		/**
		 * @class monetary.Data.donation
		 * @static
		 * Note:  You need to create an instance.  Monetary already does this for you. See the {@link monetary#data data method}.
		 *
		 *     var don = ...
		 *     var data = new monetary.Data(yootil.user.id());
		 *
		 *     data.donation.send(don, false, null, null)
		 */

		this.donation = {

			/**
			 * Easily send a user a donation
			 *
			 *     don = {
			 * 	   	to: (Data object),
			 *     	amount: (Number),
			 *     	message: {
			 *     		text: (String),
			 *     		len: (Number)
			 *     	},
			 *     	from: {
			 *     		id: (Number),
		 	 *     		name: (String)
			 *     	}
			 *     }
			 *
			 *     monetary.data(yootil.user.id()).donation.send(don, false, null, null);
			 *
			 * @param {Object} don The donation object must be specific to the example below
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			send: function(don, skip_update, opts, sync){
				if(don){
					if(don.to && don.amount && parseFloat(don.amount) > 0 && don.from && don.from.id && parseInt(don.from.id) > 0 && don.from.name && don.from.name.length){
						var the_donation = {

							t: (+ new Date()),
							a: parseFloat(don.amount),
							f: [don.from.id, don.from.name]

						};

						if(don.message && don.message.text && don.message.text.length){
							the_donation.m = don.message.text.substr(0, ((don.message.len)? don.message.len : 50)).replace(/\n|\r/g, "[br]");
						}

						// Push donation to the array (note:  this is on the receivers object)

						don.to.donation.push(the_donation);
						don.to.update(skip_update);


						self.increase.donations_sent(don.amount, true, null, false);

						// Remove donation amount

						self.decrease.money(don.amount, skip_update, opts, sync);

						return true;
					}
				}

				return false;
			},

			/**
			 * Easily send a user a donation
			 *
			 *     reject_donation = {
			 *     	amount: donation.a,
			 *     	receiver: [yootil.user.id(), yootil.user.name()],
			 *     	from: donation.f[0],
			 *     	time: donation.t
			 *     }
			 *
			 *     monetary.data(yootil.user.id()).donation.send_rejected(reject_donation, false, null, null);
			 *
			 * @param {Object} don The donation object must be specific to the example below
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			send_rejected: function(don, skip_update, opts, sync){
				if(don.amount && don.receiver && don.from && don.time){
					var reject = {

						a: don.amount,
						r: don.receiver,
						t: don.time

					};

					// Push rejected donation to the array (note:  this is on the senders object)

					money.data(don.from).donation.push_reject(reject);
					money.data(don.from).update(skip_update);
					self.update(skip_update, opts, sync);
				}
			},

			/**
			 * Checks to see if a donation exists.
			 *
			 * @param {String} id The id is the donation timestamp and the user id joined by string
			 * @param {Boolean} return_donation Pass true to return the donation object.
			 * @returns {Mixed} Either the object, or an index is returned.  -1 is returned if not found.
			 */

			exists: function(id, return_donation){
				if(id){
					for(var d = 0, l = self.data.d.length; d < l; d ++){
						var donation_id = self.data.d[d].t + "" + self.data.d[d].f[0];

						if(donation_id == id){
							return (return_donation)? self.data.d[d] : d;
						}
					}
				}

				return -1;
			},

			/**
			 * Checks to see if a rejected donation exists.
			 *
			 * @param {String} id The id is the donation timestamp and the user id joined by string
			 * @param {Boolean} return_donation Pass true to return the donation object.
			 * @returns {Mixed} Either the object, or an index is returned.  -1 is returned if not found.
			 */

			reject_exists: function(id, return_donation){
				if(id){
					for(var d = 0, l = self.data.rd.length; d < l; d ++){
						var donation_id = self.data.rd[d].t + "" + self.data.rd[d].r[0];

						if(donation_id == id){
							return (return_donation)? self.data.rd[d] : d;
						}
					}
				}

				return -1;
			},

			/**
			 * Accepts a donation and handles increasing the users money.
			 *
			 * @param {Object} donation The donation object.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			accept: function(donation, skip_update, opts, sync){
				var index = self.donation.exists(donation.t + "" + donation.f[0]);

				if(index > -1){
					self.data.d.splice(index, 1);
					self.increase.donations_received(donation.a, true, null, false);
					self.increase.money(donation.a, skip_update, opts, sync);
				}
			},

			/**
			 * Rejects a donation and handles sending the rejected donation to the sender.
			 *
			 * @param {Object} donation The donation object.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 */

			reject: function(donation, skip_update, opts, sync){
				var index = self.donation.exists(donation.time + "" + donation.from);

				if(index > -1){
					self.data.d.splice(index, 1);
					self.donation.send_rejected(donation, skip_update, opts, sync);
				}
			},

			/**
			 * Accepts the rejected donation and handles increasing the users money.
			 *
			 * @param {Object} donation The donation object.
			 * @param {Boolean} skip_update Pass true if you do not want to perform an actual AJAX update.
			 * @param {Object} options Yootil key options that get passed on to the set method.
			 * @param {Boolean} sync To sync up data across tabs / windows, pass true.
			 *
			 * Returns:
			 * 	*boolean*
			 */

			accept_reject: function(donation, skip_update, opts, sync){
				var index = self.donation.reject_exists(donation.t + "" + donation.r[0]);

				if(index> -1){
					self.data.rd.splice(index, 1);
					self.decrease.donations_sent(donation.a, true, null, false);
					self.increase.money(donation.a, skip_update, opts, sync);

					return true;
				}

				return false;
			},

			/**
			 * Pushes a donation to the array.
			 *
			 * @param {Object} donation The donation object
			 */

			push: function(donation){
				self.data.d.push(donation);
			},

			/**
			 * Pushes a rejected donation to the array.
			 *
			 * @param {Object} reject The donation object
			 */

			push_reject: function(reject){
				self.data.rd.push(reject);
			}

		};

		return this;
	}

	return Data;

})();