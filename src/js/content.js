//say hello to all ^_^
console.debug('Loading ::', chrome.i18n.getMessage('extName'));


/**
 * global variables
 */
var
	config = store.namespace('config')
	, _cache = store.namespace('_cache')
	, l = function()
	{
		console.debug.apply(console, arguments);
	}
	, __ = function()
	{
		return chrome.i18n.getMessage.apply(this, arguments) || Array.prototype.slice.call(arguments).join(',');
	}
;



//run all
(new TMD()).run(function()
{
	(new Forum()).run();
	(new Browse()).run();
});
