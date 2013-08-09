money.rank_up = (function(){

	return {
	
		data: {
					
			r: 0
		
		},
		
		settings: {
		
			enabled: true,
			paid_into: 0,
			amount: 500
			
		},
				
		init: function(){
		
			// Basic checking so we don't need to run setup on each page
			
			if(yootil.user.logged_in() && money.can_earn && (yootil.location.check.posting() || yootil.location.check.thread())){
				this.setup();
			}
		},
		
		setup: function(){
			if(money.plugin){
				this.data = money.data.cr || yootil.user.rank().id;
							
				var settings = money.plugin.settings;
			
				this.settings.enabled = (settings.rank_up_enabled && settings.rank_up_enabled == "0")? false : this.settings.enabled;
				this.settings.amount = (settings.rank_up_how_much && parseInt(settings.rank_up_how_much) > 0)? parseInt(settings.rank_up_how_much) : this.settings.amount;
				this.settings.paid_into = (settings.rank_up_paid_into && settings.rank_up_paid_into == "1")? 1 : this.settings.paid_into;
			}
		},
		
		register: function(){
			money.modules.push(this);
			return this;
		}
		
	};
	
})().register();