//

function TMD()
{
	this.user = {};
	this.version = '1.6.0';
	this.oldVersion = '';
	this.onWatherPage = /^\/watcher\.php$/.test(window.location.pathname);
}

TMD.prototype.run = function(cb)
{
	cb = [].concat(cb,
		this.addBbImageUploader,
		this.addBbImageUploaderStaticMd,
		this.addMarkAllAsReadButton
	);

	this.updateConfig(cb);
	this.fixSpoilers2();
	//this.contextMenus();
	this.floatingIcon();
	this.getUser();
	this.newVersionNotify();
};

/**
 * Reload configs then call each callback
 * @param {[function]||function} cbs
 */
TMD.prototype.updateConfig = function updateConfig(cbs)
{
	var
		$this = this
	;
	$this.oldVersion = config('version');

	chrome.storage.local.get('ConfigSettings', function(conf)
	{
		//forcing to view option page
		if(!conf.ConfigSettings)
		{
			return location.assign(chrome.extension.getURL('options.html'));
		}

		conf = conf.ConfigSettings;
		config('global', conf.settings);

		if($this.oldVersion != $this.version)
		{
			config('version', $this.version);

			//loading settings without changing page's url
			try
			{
				$('<iframe></iframe>',{src: chrome.extension.getURL('options.html')}).hide().appendTo(document.body).on('load', function()
				{
					$.wait(400).then(callback);
				});
			} catch(e){
				l('Error in loading new settings', e);
			}

			return;
		}

		callback();
	});

	function callback()
	{
		[].concat(cbs).forEach(function(cb)
		{
			typeof cb === "function" && cb.call($this);
		});
	}
};


TMD.prototype.contextMenus = function contextMenus()
{

};


/**
 * display this extension icon on each page
 */
TMD.prototype.floatingIcon = function floatingIcon()
{
	this.$floatingIcon = {};

	this.$floatingIcon.$div = $('<div></div>',{'class':'floatingDiv'}).appendTo(document.body);
	this.$floatingIcon.$a =  $('<a></a>',{'class':'floatingIcon', html:'<img /> <span></span>'}).appendTo(this.$floatingIcon.$div);
	this.$floatingIcon.$span =  this.$floatingIcon.$a.find('span');
	this.$floatingIcon.$img =  this.$floatingIcon.$a.find('img');


	this.$floatingIcon.$a.attr('href', chrome.extension.getURL('options.html#log'));
	this.$floatingIcon.$span.text(__('extName'));
	this.$floatingIcon.$img.attr('src', chrome.extension.getURL('icons/icon19.png'));
};

/**
 * animate floatingIcon on new version
 */
TMD.prototype.newVersionNotify = function newVersionNotify()
{
	if(this.oldVersion === this.version && config('extNewVersionClicked'))
		return;

	l('newVersionNotify', 'new version detected, animating floatingIcon');

	var
		self = this
		, extVersionClicked = {}
	;

	//updating extNewVersionClicked value
	config('extNewVersionClicked', false);

	//animate floatingIcon
	this.$floatingIcon.$div.addClass('tadaAnimation');

	this.$floatingIcon.$a.click(function()
	{
		//save this click using the Chrome extension storage API
		extVersionClicked[self.version] = true;
		chrome.storage.local.set({'extVersionClicked': extVersionClicked}, clicked);
	});


	//check if user hasn't already clicked on changeLog
	chrome.storage.local.get('extVersionClicked', function(_extVersionClicked)
	{
		//updating global version of _extVersionClicked
		extVersionClicked = _extVersionClicked.extVersionClicked || {};

		extVersionClicked[self.version] && clicked();
	});

	/**
	 * stop animation
	 */
	function clicked()
	{
		config('extNewVersionClicked', true);
		self.$floatingIcon.$div.removeClass('tadaAnimation');
	}
};


TMD.prototype.fixSpoilers2 = function()
{
	//TODO refactor this `shitty` code
	function fixSpoilers($)
	{
		function initPostImages(context)
		{
			var done_anything = false;
			var $in_spoilers = $('div.sp-body var.postImg', context);
			$('var.postImg', context).not($in_spoilers).each(function(){
				var $v = $(this);
				var src = $v.attr('title');
				var $img = $('<img class="'+ $v.attr('className') +'" alt="pic" />').attr('src',src);
				$v.before($img).remove();
				done_anything = true;
			});
			return done_anything;
		}

		function initSpoilers()
		{
			$(document.body).on('click', 'div.sp-head:not(.jsClickEvAttached)', function(e)
			{
				var $sp_body = $(this).closest('div.sp-wrap').find('div.sp-body:first');

				if (!$sp_body.hasClass('inited'))
				{
					var any_image = initPostImages($sp_body);

					$sp_body.addClass('inited');

					if ($sp_body.height()>300 || any_image || store.get('__SPOILERS_SHOW_FOOT')=='true')
						$sp_body.find('.sp-foot:last').show();
				}

				if (e.shiftKey)
				{
					e.stopPropagation();
					e.shiftKey = false;
					var fold = $(this).hasClass('unfolded');
					$sp_body.closest('td').find('div.sp-head').filter(function()
					{
						return $(this).hasClass('unfolded') ? fold : !fold
					}).click();
				} else {
					$(this).toggleClass('unfolded');
					$sp_body.slideToggle('fast');
				}
			});


			$(document.body).on('click', 'div.sp-foot:not(.jsClickEvAttached)', function()
			{
				var $sp_head = $(this).closest('div.sp-wrap');

				// Only if our viewpoint is below the top of the spoiler
				if ( $(window).scrollTop() > $sp_head.offset().top )
					$('html, body').animate({scrollTop:$sp_head.offset().top-1}, 80);
				$sp_head.find('div.sp-head:first').click();
			});
		}

		function initIurl()
		{
			$("a.lbimg").livequery(function()
			{
				if($(this).hasClass('initIurl')) return;

				$(this).lightBox().css("color","green").css("font-weight","bold").addClass('initIurl');
			});
		}


		initSpoilers();
	}

	$(document.body).append('<script>/* inserted by '+__('extName')+' */('+fixSpoilers.toLocaleString()+')(jQuery);</script>');
};

/**
 * put username and id in this.user || this.user.id=? this.user.name=?
 */
TMD.prototype.getUser = function(cb)
{
	var
		$user = $('#user_box a[href="/userdetails.php"]')
		, __cacheId = ''
		, $this = this
	;

	if(!$user.length)
	{
		return;
	}


	this.user.name = $user.text();
	__cacheId = 'u.'+this.user.name+'.id';
	this.user.id = _cache(__cacheId);

	if(!this.user.id)
	{
		var $c = $('<div></div>');
		$c.load('/users.php?search='+this.user.name+'&class=-  .mCenter tr a[href^="userdetails.php?id="]', function()
		{
			$c.find('a').each(function()
			{
				if($this.user.id)
					return;

				if(this.innerText === $this.user.name)
				{
					$this.user.id = this.href.replace(/.+id=(\d+)/,'$1');
					_cache(__cacheId, $this.user.id);
					cb && cb();
				}
			});
		});
	} else{
		cb && cb();
	}
};


/**
 * Scroll to hash/anchor
 * @param {String} hash
 */
TMD.prototype.updateLocationHash = function(hash)
{
	hash = (hash || location.hash).replace(/^#(.*)/,'$1');
	if(!hash)
		return;

	var pos = $$('a[name="'+hash+'"]').offset().top || 0;
	pos && $(window).scrollTop(pos);


	l('TMD.updateLocationHash =>', hash, pos);
};


/**
 * New BB Button, Image Uploader
 */
TMD.prototype.addBbImageUploader = function()
{
	try
	{
		if(!config('global').TMD.Features.imageUploaderBbButton)
			return;
	} catch (e) {
		return;
	}

	insert();

	function insert()
	{
		if(ea["addBbImageUploader"])
			return;

		var
			$container = $('.markItUpContainer')
			, $bar = $container.find('.markItUpHeader > ul')
			, $imgur = $('<li></li>',{'class':'markItUpButton imgur', html:'<input multiple type="file" />'})
		;
		ea["addBbImageUploader"] = $bar.length > 0;

		$bar.append('<li class="markItUpSeparator"></li>', $imgur);
	}

	//dynamically insert bb button
	$(document).on("DOMSubtreeModified", ".markItUpHeader", function()
	{
		if(ea["addBbImageUploader"])
			return;

		$.wait(100).then(insert);
	});

	//trigger file chooser dialog
	$(document.body).on('click', '.markItUpButton.imgur', function()
	{
		$(this).find('input').get(0).click();
	});

	//on file changed //TODO: more verbose
	$(document.body).on('change', '.markItUpButton.imgur input', function(e)
	{
		var
			files = e.target.files
			, file
			, i
			, len
			, fd
			, textArea = $(this).closest('.markItUpContainer').find('.markItUpEditor').get(0)
		;

		for (i = 0, len = files.length; i < len; i += 1)
		{
			file = files[i];
			if (!file.type.match(/image.*/))
				return;

			fd = new FormData();
			fd.append('image', file);

			//uploading image
			$.ajax(
			{
				url: 'https://api.imgur.com/3/image',
				headers: {'Authorization': 'Client-ID bbf2f7b872dbae8'},
				type: 'POST',
				processData: false,
				cache: false,
				contentType: false,
				data: fd,
				complete: function(response)
				{
					response = JSON.parse(response.responseText);

					if(response.success)
					{
						var
							pos = textArea.selectionStart
							, val = textArea.value
						;
						textArea.value = val.substr(0, pos) + response.data.link + val.substr(pos);

					} else {
						alert(response.data.error);
					}
				}
			});

		}
	});
};


/**
 * BB Button, Static.md Image Uploader
 */
TMD.prototype.addBbImageUploaderStaticMd = function()
{
	try {
		if (!config('global').TMD.Features.imageUploaderBbButtonStaticMd) {
			return;
		}
	} catch (e) {
		return;
	}

	var inst = {
		$button: null,
		pendingImages: [],
		/**
		 * Also used to check if uploader is busy
		 * @type {Blob|Boolean}
		 */
		currentlyUploadedImage: false,
		/*
		 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
		 * Digest Algorithm, as defined in RFC 1321.
		 * Copyright (C) Paul Johnston 1999 - 2000.
		 * Updated by Greg Holt 2000 - 2001.
		 * See http://pajhome.org.uk/site/legal.html for details.
		 */
		md5: function(){"use strict";function n(n){var r,t="";for(r=0;3>=r;r++)t+=h.charAt(n>>8*r+4&15)+h.charAt(n>>8*r&15);return t}function r(n){var r,t=(n.length+8>>6)+1,u=new Array(16*t);for(r=0;16*t>r;r++)u[r]=0;for(r=0;r<n.length;r++)u[r>>2]|=n.charCodeAt(r)<<r%4*8;return u[r>>2]|=128<<r%4*8,u[16*t-2]=8*n.length,u}function t(n,r){var t=(65535&n)+(65535&r),u=(n>>16)+(r>>16)+(t>>16);return u<<16|65535&t}function u(n,r){return n<<r|n>>>32-r}function e(n,r,e,c,f,o){return t(u(t(t(r,n),t(c,o)),f),e)}function c(n,r,t,u,c,f,o){return e(r&t|~r&u,n,r,c,f,o)}function f(n,r,t,u,c,f,o){return e(r&u|t&~u,n,r,c,f,o)}function o(n,r,t,u,c,f,o){return e(r^t^u,n,r,c,f,o)}function i(n,r,t,u,c,f,o){return e(t^(r|~u),n,r,c,f,o)}function a(u){var e,a,h,v,g,l=r(u),A=1732584193,d=-271733879,s=-1732584194,b=271733878;for(e=0;e<l.length;e+=16)a=A,h=d,v=s,g=b,A=c(A,d,s,b,l[e+0],7,-680876936),b=c(b,A,d,s,l[e+1],12,-389564586),s=c(s,b,A,d,l[e+2],17,606105819),d=c(d,s,b,A,l[e+3],22,-1044525330),A=c(A,d,s,b,l[e+4],7,-176418897),b=c(b,A,d,s,l[e+5],12,1200080426),s=c(s,b,A,d,l[e+6],17,-1473231341),d=c(d,s,b,A,l[e+7],22,-45705983),A=c(A,d,s,b,l[e+8],7,1770035416),b=c(b,A,d,s,l[e+9],12,-1958414417),s=c(s,b,A,d,l[e+10],17,-42063),d=c(d,s,b,A,l[e+11],22,-1990404162),A=c(A,d,s,b,l[e+12],7,1804603682),b=c(b,A,d,s,l[e+13],12,-40341101),s=c(s,b,A,d,l[e+14],17,-1502002290),d=c(d,s,b,A,l[e+15],22,1236535329),A=f(A,d,s,b,l[e+1],5,-165796510),b=f(b,A,d,s,l[e+6],9,-1069501632),s=f(s,b,A,d,l[e+11],14,643717713),d=f(d,s,b,A,l[e+0],20,-373897302),A=f(A,d,s,b,l[e+5],5,-701558691),b=f(b,A,d,s,l[e+10],9,38016083),s=f(s,b,A,d,l[e+15],14,-660478335),d=f(d,s,b,A,l[e+4],20,-405537848),A=f(A,d,s,b,l[e+9],5,568446438),b=f(b,A,d,s,l[e+14],9,-1019803690),s=f(s,b,A,d,l[e+3],14,-187363961),d=f(d,s,b,A,l[e+8],20,1163531501),A=f(A,d,s,b,l[e+13],5,-1444681467),b=f(b,A,d,s,l[e+2],9,-51403784),s=f(s,b,A,d,l[e+7],14,1735328473),d=f(d,s,b,A,l[e+12],20,-1926607734),A=o(A,d,s,b,l[e+5],4,-378558),b=o(b,A,d,s,l[e+8],11,-2022574463),s=o(s,b,A,d,l[e+11],16,1839030562),d=o(d,s,b,A,l[e+14],23,-35309556),A=o(A,d,s,b,l[e+1],4,-1530992060),b=o(b,A,d,s,l[e+4],11,1272893353),s=o(s,b,A,d,l[e+7],16,-155497632),d=o(d,s,b,A,l[e+10],23,-1094730640),A=o(A,d,s,b,l[e+13],4,681279174),b=o(b,A,d,s,l[e+0],11,-358537222),s=o(s,b,A,d,l[e+3],16,-722521979),d=o(d,s,b,A,l[e+6],23,76029189),A=o(A,d,s,b,l[e+9],4,-640364487),b=o(b,A,d,s,l[e+12],11,-421815835),s=o(s,b,A,d,l[e+15],16,530742520),d=o(d,s,b,A,l[e+2],23,-995338651),A=i(A,d,s,b,l[e+0],6,-198630844),b=i(b,A,d,s,l[e+7],10,1126891415),s=i(s,b,A,d,l[e+14],15,-1416354905),d=i(d,s,b,A,l[e+5],21,-57434055),A=i(A,d,s,b,l[e+12],6,1700485571),b=i(b,A,d,s,l[e+3],10,-1894986606),s=i(s,b,A,d,l[e+10],15,-1051523),d=i(d,s,b,A,l[e+1],21,-2054922799),A=i(A,d,s,b,l[e+8],6,1873313359),b=i(b,A,d,s,l[e+15],10,-30611744),s=i(s,b,A,d,l[e+6],15,-1560198380),d=i(d,s,b,A,l[e+13],21,1309151649),A=i(A,d,s,b,l[e+4],6,-145523070),b=i(b,A,d,s,l[e+11],10,-1120210379),s=i(s,b,A,d,l[e+2],15,718787259),d=i(d,s,b,A,l[e+9],21,-343485551),A=t(A,a),d=t(d,h),s=t(s,v),b=t(b,g);return n(A)+n(d)+n(s)+n(b)}var h="0123456789abcdef";return a}(),
		requestToken: (function(){
			var reader = new FileReader();

			reader.onload = function () {
				var md5 = inst.md5(reader.result);

				$.ajax({
					url: '//static.md/api/v2/get-token/',
					type: 'POST',
					processData: false,
					cache: false,
					contentType: false,
					data: (function(){
						var fd = new FormData;

						fd.append('md5', md5);

						return fd;
					})(),
					dataType: 'json',
					complete: function(response) {
						if (response.status != 200) {
							inst.currentlyUploadedImage = false;
							inst.uploadNext();

							alert('Response status: '+ response.status);
							return;
						}

						response = JSON.parse(response.responseText);

						if (response.error.length) {
							inst.currentlyUploadedImage = false;
							inst.uploadNext();

							alert(response.error);
							return;
						}

						var token = response.token;

						setTimeout(function(){
							inst.upload(token);
						}, response.token_valid_after_seconds * 1000);

						inst.log('Waiting '+ response.token_valid_after_seconds +' seconds...');
					}
				});
			};

			reader.onerror = function () {
				console.error('Failed to read the image contents');

				inst.currentlyUploadedImage = false;
				inst.uploadNext();
			};

			reader.onabort = function () {
				console.log('Image read aborted');
			};

			return function() {
				inst.log('Requesting token...');
				reader.readAsBinaryString(inst.currentlyUploadedImage);
			};
		})(),
		upload: function(token) {
			inst.log('Uploading...');

			$.ajax({
				url: '//static.md/api/v2/upload/',
				type: 'POST',
				processData: false,
				cache: false,
				contentType: false,
				data: (function(){
					var fd = new FormData();

					fd.append('token', token);
					fd.append('image', inst.currentlyUploadedImage);

					return fd;
				})(),
				dataType: 'json',
				complete: function(response) {
					if (response.status != 200) {
						inst.currentlyUploadedImage = false;
						inst.uploadNext();

						alert('Response status: '+ response.status);
						return;
					}

					response = JSON.parse(response.responseText);

					if (response.error.length) {
						inst.currentlyUploadedImage = false;
						inst.uploadNext();

						alert(response.error);
						return;
					}

					inst.log(response.image);

					var textArea = inst.$button.closest('.markItUp').find('textarea').get(0)
						, pos = textArea.selectionStart
						, val = textArea.value;
					textArea.value = val.substr(0, pos) + response.image + "\n" + val.substr(pos);

					{
						inst.currentlyUploadedImage = false;
						inst.uploadNext();
					}
				}
			});
		},
		updateLoading: function() {
			this.$button[ (this.currentlyUploadedImage || this.pendingImages.length) ? 'addClass' : 'removeClass' ]('loading');
		},
		log: function(text) {
			console.log('[Static.md]', text);
		},
		uploadNext: function() {
			this.updateLoading();

			console.log('');

			if (this.currentlyUploadedImage || !this.pendingImages.length) {
				this.log('No more images for upload.');
				return false;
			}

			this.log(this.pendingImages.length +' image'+ (this.pendingImages.length != 1 ? 's' : '') +' pending.');
			console.log('');

			this.currentlyUploadedImage = this.pendingImages.shift();
			this.updateLoading();

			this.requestToken();

			return true;
		}
	};

	insert();

	function insert() {
		if (ea["addBbImageUploaderStaticMd"]) {
			return;
		}

		inst.pendingImages = []; // reset all pending images

		var $bar = $('.markItUpContainer').find('.markItUpHeader > ul');

		ea["addBbImageUploaderStaticMd"] = $bar.length > 0;

		inst.$button = $('<li></li>', {'class': 'markItUpButton static-md', html: '<input multiple type="file" />'});

		$bar.append('<li class="markItUpSeparator"></li>', inst.$button);
	}

	// dynamically insert bb button
	$(document).on("DOMSubtreeModified", ".markItUpHeader", function() {
		if (ea["addBbImageUploaderStaticMd"]) {
			return;
		}

		$.wait(100).then(insert);
	});

	// trigger file chooser dialog
	$(document.body).on('click', '.markItUpButton.static-md', function() {
		$(this).find('input').get(0).click();
	});

	//on file changed
	$(document.body).on('change', '.markItUpButton.static-md input', function(e) {
		var
			files = e.target.files
			, i
			, len
			;

		for (i = 0, len = files.length; i < len; ++i) {
			if (!files[i].type.match(/image.*/)) {
				console.warn('Invalid image type', files[i].type);
				return;
			}

			inst.pendingImages.push(files[i]);
		}

		inst.uploadNext();
	});
};


/**
 * Add a new button on watcher.php to mark all
 *  topics and torrents as read
 */
TMD.prototype.addMarkAllAsReadButton = function()
{
	"use strict";
	const isFeatureEnabled = config('global') && config('global').TMD && config('global').TMD.Features && config('global').TMD.Features.showMarkAllAsRead;
	if(!this.onWatherPage || !isFeatureEnabled) {
		return;
	}

	l('addMarkAllAsReadButton');

	const $container = $('.pageContainer > .fullWidth td:eq(0)');
	const $markAllAsRead = $('<button></button>',{'class':'TMD_Features_showMarkAllAsRead', html:__('Mark all as read!')}).click(markAllAsRead);

	$markAllAsRead.appendTo($container);


	////
	function markAllAsRead()
	{
		const button = this;
		const $unreadPics = $('img[src*="unlockednew.gif"]');

		button.disabled = true;
		$unreadPics.closest('tr').find('a').each(triggerPageLoad);


		////
		function triggerPageLoad(index, aNode)
		{
			const url = aNode.href.replace(/page=.+/, 'page=last');
			loadPage(url, index);
		}

		function loadPage(url, picIndex)
		{
			$unreadPics[picIndex].src = '/pic/loading2.gif';
			$.get(url).complete(swapImgSrc);


			////
			function swapImgSrc(_, responseStatus)
			{
				const success = responseStatus === 'success';

				$unreadPics[picIndex].src = `/pic/forum/unlocked${success?'':'new'}.gif`;
				if(!success) button.disabled = false;
			}
		}
	}
};








