if(typeof PD_DEBUG === "undefined"){
	PD_DEBUG = true;
}

if(typeof pixeldepth == "undefined"){
	pixeldepth = {};
}

pixeldepth.monetary = (function(){
	{PLUGIN}
	return money;

})();

$(function(){
	pixeldepth.monetary.init();
});