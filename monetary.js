if(typeof pixeldepth == "undefined"){
	pixeldepth = {};
}

if(typeof yootil != "undefined"){
	if(!yootil.convert_versions && yootil.compare_version){
		yootil.convert_versions = function(current, required){
			var result = yootil.compare_version(current, required);

			if(result > 0){
				return [1, 0];
			} else if(result < 0){
				return [0, 1];
			}

			return [1, 1];
		};
	}

	if(typeof yootil.version != "function"){
		(function(){
			var yootil_version = yootil.version;

			try {
				Object.defineProperty(yootil, "version", {
					configurable: true,
					value: function(){
						return yootil_version;
					}
				});
			} catch(e){
				yootil.version_value = yootil_version;
				yootil.version = function(){
					return yootil.version_value;
				};
			}
		})();
	}

	if(yootil.key && !yootil.key.set_on && yootil.key.on){
		yootil.key.set_on = function(key, value, object_id, event){
			return yootil.key.on(key, event, value, object_id);
		};
	}

	if(yootil.bar && yootil.bar.add && yootil.bar.add.length < 2 && !yootil.bar._monetary_old_add){
		yootil.bar._monetary_old_add = yootil.bar.add;

		yootil.bar.add = function(url, img, alt, key, func, context){
			if(typeof url == "object"){
				return yootil.bar._monetary_old_add.apply(yootil.bar, arguments);
			}

			return yootil.bar._monetary_old_add.call(yootil.bar, {
				url: url,
				img: img,
				alt: alt,
				key: key,
				func: func,
				context: context
			});
		};
	}

	if(yootil.create){
		if(yootil.create.page && yootil.create.page.length < 2 && !yootil.create._monetary_old_page){
			yootil.create._monetary_old_page = yootil.create.page;

			yootil.create.page = function(pattern, title, hide_content){
				if(typeof pattern == "object" && pattern.constructor != RegExp){
					return yootil.create._monetary_old_page.apply(yootil.create, arguments);
				}

				return yootil.create._monetary_old_page.call(yootil.create, {
					pattern: pattern,
					title: title,
					hide_content: hide_content
				});
			};
		}

		if(yootil.create.nav_branch && yootil.create.nav_branch.length < 2 && !yootil.create._monetary_old_nav_branch){
			yootil.create._monetary_old_nav_branch = yootil.create.nav_branch;

			yootil.create.nav_branch = function(url, text){
				if(typeof url == "object"){
					return yootil.create._monetary_old_nav_branch.apply(yootil.create, arguments);
				}

				return yootil.create._monetary_old_nav_branch.call(yootil.create, {
					url: url,
					text: text
				});
			};
		}

		if(yootil.create.container && yootil.create.container.length < 2 && !yootil.create._monetary_old_container){
			yootil.create._monetary_old_container = yootil.create.container;

			yootil.create.container = function(title, content){
				if(typeof title == "object"){
					return yootil.create._monetary_old_container.apply(yootil.create, arguments);
				}

				return yootil.create._monetary_old_container.call(yootil.create, {
					title: title,
					content: content
				});
			};
		}
	}

	if(!yootil.ajax && yootil.event){
		yootil.ajax = {};
	}

	if(yootil.ajax && !yootil.ajax.after_search && yootil.event && yootil.event.after_search){
		yootil.ajax.after_search = function(func, context){
			return yootil.event.after_search(func, context);
		};
	}

	if(yootil.form){
		if(!yootil.form.post && yootil.form.posting){
			yootil.form.post = yootil.form.posting;
		}

		if(!yootil.form.post_quick_reply && yootil.form.quick_reply){
			yootil.form.post_quick_reply = yootil.form.quick_reply;
		}
	}
}

pixeldepth.monetary = monetary = (function(){
	{PLUGIN}
	return money;

})();

$(function(){
	monetary.init();
});
