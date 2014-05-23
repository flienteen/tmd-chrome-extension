//

function Forum()
{
	this.conf = config('global').Forum;
	this.onTopicPage = window.location.search.match(/^\?action=viewtopic/)!=null;
	this.topicId = location.search.replace(/.+topicid=(\d+).+/,'$1');
}

Forum.prototype.run = function()
{
	this.uncensored();
	this.likeOwnPosts();
};

Forum.prototype.uncensored = function()
{
	if(!this.onTopicPage || !this.conf.Action.activateUncensoreButton)
		return;

	var $trComment = $();


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
				userID = $table.find('a[href*="userdetails.php?id="]').attr('href').replace(/.*id=/, "")
				, postID = $table.prev().attr('name')
			;

			if (postID==='last')
				postID = $table.prevAll(':eq(1)').attr('name');

			$tdComment.html(__('Show post'));
			$trComment = $trComment.add($tdComment.parent().attr({'postID':postID, 'userID':userID}).addClass('decenzureaza'));
		}
	});


	$trComment.one('click', function()
	{
		var
			$tr = $(this)
			, $td = $tr.find('.comment').html('<img src="/pic/loading2.gif" />')
			, userID = $tr.attr('userID')
			, postID = $tr.attr('postID')
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
