//

function TMD()
{
	this.user = {};
	this.version = '0.1.4';
	this.oldVersion = '';
}

TMD.prototype.run = function(cb)
{
	cb = [].concat(cb,
		this.addBbImageUploader, this.addBbImageUploaderStaticMd
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
			typeof cb === "function" && cb();
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
		pendingImages: [],
		$button: null,
		isBusy: false,
		updateLoading: function() {
			this.$button[ (this.isBusy || this.pendingImages.length) ? 'addClass' : 'removeClass' ]('loading');
		},
		log: function(text) {
			console.log('[Static.md]', text);
		},
		uploadNext: function() {
			this.updateLoading();

			console.log('');

			if (this.isBusy || !this.pendingImages.length) {
				this.log('No more images for upload.');
				return false;
			}

			this.log(this.pendingImages.length +' image'+ (this.pendingImages.length != 1 ? 's' : '') +' pending.');
			console.log('');

			var fd = new FormData();
			fd.append('image', this.pendingImages.shift());

			this.isBusy = true;
			this.updateLoading();

			this.log('Requesting token...');

			$.ajax({
				url: 'http://static.md/api/v2/get-token/',
				type: 'POST',
				processData: false,
				cache: false,
				contentType: false,
				data: fd,
				dataType: 'json',
				complete: function(response) {
					if (response.status != 200) {
						inst.isBusy = false;
						inst.uploadNext();
						delete fd;

						//todo: change `alerts` in something more user friendly
						alert('Response status: '+ response.status);
						return;
					}

					response = JSON.parse(response.responseText);

					if (response.error.length) {
						inst.isBusy = false;
						inst.uploadNext();
						delete fd;

						alert(response.error);
						return;
					}

					fd.append('token', response.token);

					setTimeout(function(){
						inst.log('Uploading...');

						$.ajax({
							url: 'http://static.md/api/v2/upload/',
							type: 'POST',
							processData: false,
							cache: false,
							contentType: false,
							data: fd,
							dataType: 'json',
							complete: function(response) {
								if (response.status != 200) {
									inst.isBusy = false;
									inst.uploadNext();
									delete fd;

									alert('Response status: '+ response.status);
									return;
								}

								response = JSON.parse(response.responseText);

								if (response.error.length) {
									inst.isBusy = false;
									inst.uploadNext();
									delete fd;

									alert(response.error);
									return;
								}

								inst.log(response.image);

								var textArea = inst.$button.closest('.markItUp').find('textarea').get(0)
									, pos = textArea.selectionStart
									, val = textArea.value;
								textArea.value = val.substr(0, pos) + response.image + "\n" + val.substr(pos);

								{
									inst.isBusy = false;
									inst.uploadNext();
									delete fd;
								}
							}
						});
					}, response.token_valid_after_seconds * 1000);

					inst.log('Waiting '+ response.token_valid_after_seconds +' seconds...');
				}
			});

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











