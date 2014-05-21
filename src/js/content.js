//say hello to all ^_^
console.debug('Loading ::', chrome.i18n.getMessage('extName'));


/**
 * global variables
 */
var
	config = store.namespace('config')
	, _cache = store.namespace('_cache')
	, tmd
	, l = function()
	{
		console.debug.apply(console, arguments);
	}
	, __ = function()
	{
		return chrome.i18n.getMessage.apply(this, arguments) || Array.prototype.slice.call(arguments).join(',');
	}

	/**
	 * Simple jQuery selector caching
	 * @param select
	 * @returns {jQuery}
	 */
	, $$ = function(select)
	{
		this._c = this._c || {};
		return this._c[select] || (this._c[select] = $(select));
	}

;



//run all
(tmd = new TMD()).run(function()
{
	(new Forum()).run();
	(new Browse()).run();
});
