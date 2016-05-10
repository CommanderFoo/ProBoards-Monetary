monetary.settings = class {

	static init(){
		this._amounts = {

			thread: 50,
			poll: 10,
			post: 25

		};
	}

	static setup(){
		this.init();

		let plugin = pb.plugin.get(monetary.PLUGIN_ID);

		if(plugin){
			monetary.PLUGIN = plugin;

			if(plugin.settings){
				let settings = plugin.settings;

				// Do settings setup here
			}

			if(plugin.images){
				this._images = images;
			}
		}
	}

	static get images(){
		return this._images;
	}

	static get amounts(){
		return this._amounts;
	}

	static get thread_amount(){
		return this._amounts.thread;
	}

	static get poll_amount(){
		return this._amounts.poll;
	}

	static get post_amount(){
		return this._amounts.post;
	}

};