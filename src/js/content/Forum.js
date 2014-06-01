//

function Forum()
{
	this.conf = config('global').Forum;
	this.onTopicPage = window.location.search.match(/^\?action=viewtopic/)!=null;
	this.topicId = location.search.replace(/.+topicid=(\d+).+/,'$1');
	this.forumId = ($('.pageContainer h1 a[href*="action=viewforum"]:eq(0)').attr('href') || '').replace(/.+forumid=(\d+).*/,'$1');
}

Forum.prototype.run = function()
{
	this.postsLog();
	this.uncensored();
	this.likeOwnPosts();
	this.imgFitOnComments();
};

Forum.prototype.uncensored = function()
{
	if(!this.onTopicPage || !(this.conf['Censored Post'].showUncensoreButton || this.conf['Censored Post'].showUncensoreAllButton || this.conf['Censored Post'].autoResolveAllCensoredPost || this.conf['Censored Post'].mofHideCensored))
		return;

	var
		$trComment = $()
		, $showPosts = $()
		, $showAllPosts = $()
		, self = this
	;


	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, $tdComment = $table.next().find('.comment[align="center"]')
			, $trMof = $table.next().find('tr[style="background-color:#FAEBE2"]')
			, isCensored = $tdComment.length && /(Cenzurat)|(Зацензурено)/.test($tdComment.text().trim())
			, isMOFCensored = self.conf['Censored Post'].mofHideCensored && $trMof.length
		;

		//ensuring that this is a censored post
		if(isCensored || isMOFCensored)
		{
			var
				userID = $table.find('a[href*="userdetails.php?id="]').attr('href').replace(/.*id=/, "")
				, postID = $table.prev().attr('name')==='last' ? $table.prevAll(':eq(1)').attr('name') : $table.prev().attr('name')
				, $showPost = $('<a></a>',{text:__('Show post'), 'postID':postID, 'userID':userID}).data('$tr', isMOFCensored ? $trMof : $tdComment.parent())
				, $showAllPost = $('<a></a>',{text:__('Show all posts')})
				, _append = []
			;

			if(self.conf['Censored Post'].showUncensoreButton)
			{
				_append.push('[',$showPost,']');
			}

			if(self.conf['Censored Post'].showUncensoreAllButton)
			{
				var _p = _append.length ? ' &nbsp;&nbsp; - &nbsp;&nbsp; [' : '[';
				_append.push(_p,$showAllPost,']');
			}

			if(isMOFCensored)
			{
				//clear avatar
				$trMof.find('td').eq(0).empty();
				$tdComment = $trMof.find('.comment');
			}

			$tdComment.empty().append.apply($tdComment, _append).parent().addClass('decenzureaza');
			$showPosts = $showPosts.add($showPost);
			$showAllPosts = $showAllPosts.add($showAllPost);
		}
	});


	$showPosts.one('click', function()
	{
		var
			$tr = $(this).data('$tr')
			, $td = $tr.find('.comment').html('<img src="/pic/loading2.gif" />')
			, userID = $(this).attr('userID')
			, postID = $(this).attr('postID')
			, pageNb=0
			, __cacheId = 'u.'+userID+'.posts'
			, _cacheUserPosts = _cache(__cacheId) || {}
			, $tmp = $('<div></div>')
		;

		loadNextPage();

		function loadNextPage()
		{
			if(_cacheUserPosts[postID])
			{
				$td.html(_cacheUserPosts[postID]).attr('align','left');
				$tr.removeClass('decenzureaza').addClass('decenzureazat');
				//$this.fixSpoilers();

				//update cache \1440*3days = 4320
				_cache.set(__cacheId, _cacheUserPosts, 4320);

				return;
			}

			//todo: check if user has permission to access `userhistory_posts.php`
			$tmp.load("userhistory_posts.php?action=viewposts&id="+userID+"&page="+(pageNb++)+"  .pageContainer table:eq(0) table:eq(0)", function (d)
			{
				$(this).find('a[href*="&page=p"]').each(function(i,v)
				{
					_cacheUserPosts[parseInt(v.innerText,10)] = $(v).closest('table').nextAll('table.main:eq(0)').find('td.comment').html();
				});

				loadNextPage();
			});
		}

	});


	$showAllPosts.one('click', showAllPosts);


	self.conf['Censored Post'].autoResolveAllCensoredPost && showAllPosts();


	function showAllPosts()
	{
		$showPosts.each(function(i,v)
		{
			//async
			setTimeout(function()
			{
				$(v).click();
			}, 50);
		});
	}
};



Forum.prototype.likeOwnPosts = function()
{
	if(!this.onTopicPage || !this.conf.Action.likeMyPosts || !tmd.user.id)
		return;

	var $this = this;
	//TODO more User friendly response
	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, postID = $table.prev().attr('name')
			, userId = $table.find('a[href^="userdetails.php"]').attr('href').replace(/.+id=(\d+)/,'$1')
		;

		if(userId.toString() === tmd.user.id.toString())
		{
			var
				$spanLike = $('<a></a>', {'class':'lnk postLike', text:__('Like'), 'data-postid':postID})
				, $spanUnLike = $('<a></a>', {'class':'lnk postLike', text:__('Unlike'), 'data-postid':postID})
			;

			$table.find('td[width="99%"]').append(' - [',$spanLike, ' - ',$spanUnLike, ']');
		}
	});


	$$('.forumPostName').on('click', 'a.postLike', function()
	{
		var action = $(this).text() === __('Like') ? 'like' : 'unlike';

		$.post('/forum.php', {ajax:1, postid:$(this).data('postid'), topicid:$this.topicId, action:action});
		$(this).hide();
	});
};


Forum.prototype.postsLog = function()
{
	if(!this.onTopicPage || !this.forumId || !this.conf['Censored Post'].showLog)
		return;

	var
		self = this
		, $tmp = $('<div></div>')
		, __cacheId = 'log.'+self.forumId+'.posts'
		, _cacheLogForum = _cache(__cacheId) || {}
		, _s = ':'
		, getLog
	;

	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, $tdComment = $table.next().find('.comment[align="center"]')
		;

		//ensuring that this is a censored post
		if($tdComment.length && /(Cenzurat)|(Зацензурено)/.test($tdComment.text().trim()))
		{
			var
				postID = parseInt($table.prev().attr('name')==='last' ? $table.prevAll(':eq(1)').attr('name') : $table.prev().attr('name'), 10)
				, $by = $('<a></a>',{'class':'_censoredBy',html:'<img src="/pic/loading2.gif" />'})
				, _log
			;

			$table.find('td[width="99%"]').append(' - <span class="_censoredBy">[censored by ',$by, ']</span>');

			loadLog(1);

			function loadLog(step)
			{
				if(_log = _cacheLogForum[postID])
				{
					_log = _log.split(_s);
					$by.attr('href','/userdetails.php?id='+_log[0]).text(_log[1]);

					return;
				}

				if(!step)
				{
					$by.html('?');
					return;
				}

				if(getLog)
				{
					getLog.then(loadLog);
					return;
				}

				getLog = $.Deferred(function(dfd)
				{
					$.get("/log_forums.php?forumid="+self.forumId, function(data)
					{
						$tmp.html(data).find('.forum_moderators tr td:nth-child(3)').each(function(i,v)
						{
							var $a = $(v).find('a');
							if(!/.+action=viewtopic&topicid=(\d+)&page=p(\d+)#(\d+).*/.test($a.eq(0).attr('href')))
								return;

							var
								_postId = $a.eq(0).attr('href').replace(/.+page=p(\d+).+/,'$1')
								,_uId = $a.eq(1).attr('href').replace(/.+id=(\d+).*/,'$1')
								,_uNick = $a.eq(1).text()
							;

							_cacheLogForum[parseInt(_postId,10)] = _uId+_s+_uNick;
						});

						//update cache \1440*7days = 10080
						_cache.set(__cacheId, _cacheLogForum, 10080);

						dfd.resolve();
					});
				});


				getLog.then(loadLog);
			}

		}
	});
};


Forum.prototype.imgFitOnComments = function()
{
	if(!this.onTopicPage || !(this.conf.Action.imgFit || this.conf.Action.imgFitSpoilers))
		return;

	var classes = '';

	classes += this.conf.Action.imgFit ? 'imgFit' : '';
	classes += this.conf.Action.imgFitSpoilers ? ' imgFitSpoilers' : '';

	$(document.body).addClass(classes);

	$(document).on('click', '.imgFitSpoilers .comment .sp-body img, .imgFit .comment img', function()
	{
		$(this).toggleClass('zoomedIn');
	});
};
