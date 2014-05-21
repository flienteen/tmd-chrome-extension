//

function Forum()
{
	this.conf = config('global').Forum;
	this.onTopicPage = window.location.search.match(/^\?action=viewtopic/)!=null;
}

Forum.prototype.run = function()
{
	this.uncensored();
};

Forum.prototype.uncensored = function()
{
	if(!this.onTopicPage || !this.conf.Action.activateUncensoreButton)
		return;

	var $trComment = $();


	$('.forumPostName').each(function()
	{
		var
			$table = $(this)
		;

		if($table.find('a').length==4)
		{
			var
				userID = $table.find('a[href*="userdetails.php?id="]').attr('href').replace(/.*id=/, "")
				, postID = $table.prev().attr('name')
				, $tdComment
				;

			if (postID==='last')
				postID = $table.prevAll(':eq(1)').attr('name');

			$tdComment = $table.next().find('.comment');

			//ensuring that this is a censored post
			if(!/Cenzurat||Зацензурено/.test($tdComment.text().trim()))
				return;

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



