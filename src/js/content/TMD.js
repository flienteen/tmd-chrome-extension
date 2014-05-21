//

function TMD()
{
	this.user = {};
}

TMD.prototype.run = function(cb)
{
	this.updateConfig(cb);
	this.fixSpoilers2();
	//this.contextMenus();
	this.floatingIcon();
	this.getUser();
};

/**
 * Reload configs then call each callback
 * @param {[function]||function} cbs
 */
TMD.prototype.updateConfig = function updateConfig(cbs)
{
	var version = config('version');

	chrome.storage.local.get('ConfigSettings', function(conf)
	{
		//forcing to view option page
		if(!conf.ConfigSettings)
		{
			return location.replace(chrome.extension.getURL('options.html'));
		}

		conf = conf.ConfigSettings;
		config('global', conf.settings);

		if(version != conf.version)
		{
			config('version', conf.version);

			//TODO: poate ceva mai putin trival in cazul dat ^_^
			location.reload();
		}

		[].concat(cbs).forEach(function(cb)
		{
			typeof cb === "function" && cb();
		});
	});
};


TMD.prototype.contextMenus = function contextMenus()
{

};



TMD.prototype.floatingIcon = function floatingIcon()
{
	var
		$icon = $('<a></a>',{'class':'floatingIcon', html:'&nbsp;<span></span> <img />'}).appendTo(document.body)
		, $span = $icon.find('span')
		, $img = $icon.find('img')
	;

	$icon.attr('href', chrome.extension.getURL('options.html'));
	$span.text(__('extName'));
	$img.attr('src', chrome.extension.getURL('icons/icon19.png'));
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