//say hello to all ^_^
console.debug('Loading ::', chrome.i18n.getMessage('extName'));


/**
 * global variables
 */
var
	config = store.namespace('config')
	, _cache = store.namespace('_cache')
	, tmd
	, ea = {} //Event Attached

	/**
	 * Alias for console object
	 * If logLevel isn't specified than nothing happens
	 * ---
	 * localStorage['extLogLevel'] = 'log|debug|trace|dir|...'
	 */
	, l = function()
	{
		var logLevel = localStorage['extLogLevel'];
		if(!logLevel || !console[logLevel]) return;

		console[logLevel].apply(console, [].concat('>', Array.prototype.slice.call(arguments)));
	}

	/**
	 * string __(string messageName, any substitutions)
	 * Gets the localized string for the specified message, if no `messageName` found than return `messageName`
	 * Alias for https://developer.chrome.com/extensions/i18n#method-getMessage
	 */
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

/**
 * Async wait function
 * @param milliseconds
 * @returns {Deferred}
 */
$.wait = function(milliseconds)
{
	return jQuery.Deferred(function(dfd)
	{
		setTimeout(dfd.resolve, milliseconds);
	});
};

//run all
(tmd = new TMD()).run(function()
{
	(new Forum()).run();
	(new Browse()).run();
});
