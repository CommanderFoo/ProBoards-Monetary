/**
* Namespace: money.Data
*
* 	Wrapper class around the users data that gets instantiated for each users data on the page.
*
*	Git - https://github.com/pixelDepth/monetarysystem/
*
*	Forum Topic - http://support.proboards.com/thread/429762/
*/

money.Data = (function(){

	/**
	* Method: Data
	* 	The constructor.
	*
	* Parameters:
	* 	user_id - *integer*
	* 	data - *object* This is the data that comes from the key for the user.
	*
	* Returns:
	*	*object*
	*/

	function Data(user_id, data_obj){
		this.user_id = user_id;
		this.data = data_obj || {

			/**
			* Property: data.m
			* 	General money (aka wallet)
			*/

			m: 0,

			/**
			* Property: data.b
			* 	Bank money
			*/

			b: 0,

			/**
			* Property: data.lt
			* 	Last bank transactions
			*/

			lt: [],

			/**
			* Property: data.li
			* 	Timestamp of last time interest was given
			*/

			li: "",

			/**
			* Property: data.s
			* 	Stock market data
			*/

			s: {},

			/**
			* Property: data.w
			* 	Wages
			*/

			w: {

				/**
				* Property: data.w.p
				* 	Posts
				*/

				p: 0,

				/**
				* Property: data.w.e
				* 	Timestamp expiry
				*/

				e: 0,

				/**
				* Property: data.w.w
				* 	When are they paid
				*/

				w: 0,

				/**
				* Property: data.w.s
				* 	Staff expiry timestamp
				*/

				s: 0

			},

			/**
			* Property: data.g
			* 	Gift codes
			*/

			g: [],

			/**
			* Property: data.or
			* 	Old rank
			*/

			or: 0,

			/**
			* Property: data.d
			* 	Donations received
			*/

			d: [],

			/**
			* Property: data.ds
			* 	Total amount for donations sent
			*/

			ds: 0,

			/**
			* Property: data.dr
			* 	Total amount for donations received
			*/

			dr: 0,

			/**
			* Property: data.rd
			* 	Rejected donations
			*/

			rd: [],

			n: []

		};

		/**
		* Property: error
		* 	Holds the last error.  This isn't used much.
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
		* Method: update
		* 	Updates the key data, however you can avoid an actual AJAX request if needed.  Usually this is called internally.
		*
		* Parameters:
		* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
		* 	options - *object* ProBoards key options that get passed on to the set method.
		*	sync - *boolean* To sync up data across tabs / windows, pass true.
		*/

		this.update = function(skip_update, options, sync){
			if(!skip_update){

				// Lets put in a length check on the data

				if(JSON.stringify(this.data).length > proboards.data("plugin_max_key_length")){
					this.error = "Data length has gone over it's limit of " + proboards.data("plugin_max_key_length");

					proboards.dialog("data_limit", {

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

				var key_obj = proboards.plugin.key(money.KEY);

				if(key_obj){
					key_obj.set(this.user_id, this.data, options);

					if(sync){
						money.sync.trigger();
					}
				}
			}
		};

		var self = this;

		this.fixed = function(val){
			return parseFloat(parseFloat(val).toFixed(2));		
		};
		
		this.get = {

			data_length_exceeded: function(){
				return JSON.stringify(self.data).length > proboards.data("plugin_max_key_length");
			},

			/**
			* Method: get.error
			* 	Gets the last error stored in the error property.
			*
			* Returns:
			* 	*string*
			*/

			error: function(){
				return this.error;
			},

			/**
			* Method: get.data
			* 	Gets the internal data object for this user.
			*
			* Returns:
			* 	*object*
			*/

			data: function(){
				return self.data;
			},

			pushed: function(){
				return self.pushed_data;
			},

			/**
			* Method: get.money
			* 	Gets the uses money from the data object
			*
			* Parameters:
			* 	string - *boolean* Pass true to have a string returned back
			*
			* Returns:
			* 	*integer* / *string*
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).get.money();
			*/

			money: function(string){
				var amount = money.format(self.data.m, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			* Method: get.bank
			* 	Gets the uses bank money from the data object
			*
			* Parameters:
			* 	string - *boolean* Pass true to have a string returned back
			*
			* Returns:
			* 	*integer* / *string*
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).get.bank();
			*/

			bank: function(string){
				var amount = money.format(self.data.b, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			* Method: get.transactions
			* 	Gets the uses bank transactions from the data object
			*
			* Returns:
			* 	*array*
			*/

			transactions: function(){
				return self.data.lt;
			},

			/**
			* Method: get.investments
			* 	Gets the uses stock investments from the data object
			*
			* Returns:
			* 	*object*
			*/

			investments: function(){
				return self.data.s;
			},

			/**
			* Method: get.interest
			* 	Gets the last interest timestamp
			*
			* Returns:
			* 	*string* / *integer*
			*/

			interest: function(){
				return self.data.li;
			},

			/**
			* Method: get.wages
			* 	Gets the wages object from the data object
			*
			* Returns:
			* 	*object*
			*/

			wages: function(){
				return self.data.w;
			},

			/**
			* Method: get.gifts
			* 	Gets the users gift codes they have accepted, these get deleted over time.
			*
			* Returns:
			* 	*array*
			*/

			gifts: function(){
				return self.data.g;
			},

			/**
			* Method: get.rank
			* 	Gets the last rank recorded
			*
			* Returns:
			* 	*integer*
			*/

			rank: function(){
				return self.data.or;
			},

			/**
			* Method: get.donations
			* 	Gets donations sent to this user
			*
			* Returns:
			* 	*array*
			*/

			donations: function(){
				return self.data.d;
			},

			/**
			* Method: get.rejected_donations
			* 	Gets the rejcted donations for this user
			*
			* Returns:
			* 	*array*
			*/

			rejected_donations: function(){
				return self.data.rd;
			},

			/**
			* Method: get.total_sent_donations
			* 	Gets the total value of donatins sent to people
			*
			* Returns:
			* 	*integer*
			*/

			total_sent_donations: function(string){
				var amount = money.format(self.data.ds, string || false);

				if(string){
					amount = yootil.number_format(amount);
				}

				return amount;
			},

			/**
			* Method: get.total_recevied_donations
			* 	Gets the total value of donatins received by people
			*
			* Returns:
			* 	*integer*
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

		this.decrease = {

			/**
			* Method: decrease.money
			* 	Decreases the uses money by the amount passed in.
			*
			* Parameters:
			* 	amount - *integer* The amount to be deducted
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).decrease.money(100);
			*/

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(self.data.m) - parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: decrease.bank
			* 	Decreases the uses money in the bank by the amount passed in.
			*
			* Parameters:
			* 	amount - *integer* The amount to be deducted
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).decrease.bank(100);
			*/

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(self.data.b) - parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: decrease.donations_sent
			* 	Decreases the total donations sent
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
			* Method: decrease.donations_received
			* 	Decreases the total donations received
			*
			* Parameters:
			* 	amount - *integer* The amount to be removed
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			donations_received: function(amount, skip_update, opts, sync){
				self.data.dr = parseFloat(self.data.dr) - parseFloat(amount);
				self.data.dr = self.fixed(self.data.dr);
				self.data.dr = (self.data.dr < 0)? 0 : self.data.dr;
				self.update(skip_update, opts, sync);
			}

		};

		this.increase = {

			/**
			* Method: increase.money
			* 	Increases the uses money by the amount passed in.
			*
			* Parameters:
			* 	amount - *integer* The amount to be added
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).increase.money(100);
			*/

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(self.data.m) + parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: increase.bank
			* 	Increases the uses bank money by the amount passed in.
			*
			* Parameters:
			* 	amount - *integer* The amount to be added
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			* 	pixeldepth.monetary.data(yootil.user.id()).increase.bank(100);
			*/

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(self.data.b) + parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: increase.donations_sent
			* 	Increases the total donations sent
			*
			* Parameters:
			* 	amount - *integer* The amount to be added
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			donations_sent: function(amount, skip_update, opts, sync){
				self.data.ds = parseFloat(self.data.ds) + parseFloat(amount);
				self.data.ds = self.fixed(self.data.ds);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: increase.donations_received
			* 	Increases the total donations received
			*
			* Parameters:
			* 	amount - *integer* The amount to be added
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			donations_received: function(amount, skip_update, opts, sync){
				self.data.dr = parseFloat(self.data.dr) + parseFloat(amount);
				self.data.dr = self.fixed(self.data.dr);
				self.update(skip_update, opts, sync);
			}

		};

		this.set = {

			/**
			* Method: set.money
			* 	Sets the users money to the amount passed in
			*
			* Parameters:
			* 	amount - *integer* The amount to set the money to.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			money: function(amount, skip_update, opts, sync){
				self.data.m = parseFloat(amount);
				self.data.m = self.fixed(self.data.m);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.bank
			* 	Sets the users bank money to the amount passed in
			*
			* Parameters:
			* 	amount - *integer* The amount to set the money to.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			bank: function(amount, skip_update, opts, sync){
				self.data.b = parseFloat(amount);
				self.data.b = self.fixed(self.data.b);
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.transactions
			* 	Sets the users bank transactions
			*
			* Parameters:
			* 	transactions - *array* The transactions to be set
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			transactions: function(transactions, skip_update, opts, sync){
				self.data.lt = transactions;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.gifts
			* 	Sets the users gifts
			*
			* Parameters:
			* 	gifts - *array* The gifts you want to set.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			gifts: function(gifts, skip_update, opts, sync){
				self.data.g = gifts;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.rank
			* 	Sets the users rank
			*
			* Parameters:
			* 	rank - *integer* The rank, usually the uses current rank.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			rank: function(rank, skip_update, opts, sync){
				self.data.or = rank;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.investments
			* 	Sets the users stock investments
			*
			* Parameters:
			* 	investments - *object* The sock investments
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			investments: function(investments, skip_update, opts, sync){
				self.data.s = investments;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.interest
			* 	Sets the users last interest timestamp
			*
			* Parameters:
			* 	interest - *integer* Must be Timestamp
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			interest: function(interest, skip_update, opts, sync){
				self.data.li = interest;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.wages
			* 	Sets the users wages
			*
			* Parameters:
			* 	wages - *object* The wage object
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			wages: function(wages, skip_update, opts, sync){
				self.data.w = wages;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.data
			* 	Sets the users data
			*
			* Parameters:
			* 	data - *object* The data for this user if you need to replace it completely.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			data: function(data, skip_update, opts, sync){
				self.data = data;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: set.donations
			* 	Sets the users data
			*
			* Parameters:
			* 	donations - *array* Donations for this user.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			donations: function(donations, skip_update, opts, sync){
				self.data.d = donations;
				self.update(skip_update, opts, sync);
			}

		};

		this.clear = {

			/**
			* Method: clear.gifts
			* 	Clear the users gifts array
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			gifts: function(skip_update, opts, sync){
				self.data.g = [];
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.investments
			* 	Clear the users investments object
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			investments: function(skip_update, opts, sync){
				self.data.s = {};
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.wages
			* 	Clear the users wages object
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			wages: function(skip_update, opts, sync){
				self.data.w = {};
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.bank
			* 	Clear the users bank amount
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			bank: function(skip_update, opts, sync){
				self.data.b = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.money
			* 	Clear the users money amount (aka wallet)
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			money: function(skip_update, opts, sync){
				self.data.m = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.transactions
			* 	Clear the users transactions array
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			transactions: function(skip_update, opts, sync){
				self.data.lt = [];
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.interest
			* 	Clear the users last interest timestamp
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			interest: function(skip_update, opts, sync){
				self.data.li = "";
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.rank
			* 	Clear the users old rank
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			rank: function(skip_update, opts, sync){
				self.data.or = 0;
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.data
			* 	Clear the users data object
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			data: function(skip_update, opts, sync){
				self.data = {};
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.donations
			* 	Clear the users donations array
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			donations: function(skip_update, opts, sync){
				self.data.d = [];
				self.update(skip_update, opts, sync);
			},

			/**
			* Method: clear.rejected_donations
			* 	Clear the users rejected_donations array
			*
			* Parameters:
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
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

		this.push = {

			/**
			* Method: push.gift
			* 	Pushes a gift code to the data object when it's been accepted.
			*
			* Parameters:
			* 	code - *string* The code to be pushed to the array.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
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

		this.donation = {

			/**
			* Method: donation.send
			* 	Easily send a user a donation
			*
			* Parameters:
			* 	don - *object* The donation object must be specific to the example below
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			*
			* don = {
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
			*
			*
			* pixeldepth.monetary.data(yootil.user.id()).donation.send(don, false, null, null);
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
			* Method: donation.send_rejected
			* 	Easily send a user a donation
			*
			* Parameters:
			* 	don - *object* The donation object must be specific to the example below
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*
			* Examples:
			*
			* reject_donation = {
			*	amount: donation.a,
			*	receiver: [yootil.user.id(), yootil.user.name()],
			*	from: donation.f[0],
			*	time: donation.t
			*}
			*
			* pixeldepth.monetary.data(yootil.user.id()).donation.send_rejected(reject_donation, false, null, null);
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
			* Method: donation.exists
			* 	Checks to see if a donation exists.
			*
			* Parameters:
			* 	id - *string* The id is the donation timestamp and the user id joined by string
			*	return_donation - *boolean* Pass true to return the donation object.
			*
			* Returns:
			* 	*object* / *integer* - Either the object, or an index is returned.  -1 is returned if not found.
			*/

			// Returns -1 if not exists

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
			* Method: donation.reject_exists
			* 	Checks to see if a rejected donation exists.
			*
			* Parameters:
			* 	id - *string* The id is the donation timestamp and the user id joined by string
			*	return_donation - *boolean* Pass true to return the donation object.
			*
			* Returns:
			* 	*object* / *integer* - Either the object, or an index is returned.  -1 is returned if not found.
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
			* Method: donation.accept
			* 	Accepts a donation and handles increasing the users money.
			*
			* Parameters:
			* 	donation - *object* The donation object.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
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
			* Method: donation.reject
			* 	Rejects a donation and handles sending the rejected donation to the sender.
			*
			* Parameters:
			* 	donation - *object* The donation object.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
			*/

			reject: function(donation, skip_update, opts, sync){
				var index = self.donation.exists(donation.time + "" + donation.from);

				if(index > -1){
					self.data.d.splice(index, 1);
					self.donation.send_rejected(donation, skip_update, opts, sync);
				}
			},

			/**
			* Method: donation.accept_reject
			* 	Accepts the rejected donation and handles increasing the users money.
			*
			* Parameters:
			* 	donation - *object* The donation object.
			* 	skip_update - *boolean* Pass true if you do not want to perform an actual AJAX update.
			* 	options - *object* ProBoards key options that get passed on to the set method.
			*	sync - *boolean* To sync up data across tabs / windows, pass true.
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
			* Method: donation.push
			* 	Pushes a donation to the array.
			*
			* Parameters:
			* 	donation - *object* The donation object
			*/

			push: function(donation){
				self.data.d.push(donation);
			},

			/**
			* Method: donation.push_reject
			* 	Pushes a rejected donation to the array.
			*
			* Parameters:
			* 	reject - *object* The donation object
			*/

			push_reject: function(reject){
				self.data.rd.push(reject);
			}

		};

		return this;
	}

	return Data;

})();