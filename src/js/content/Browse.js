//

function Browse()
{
	this.conf = config('global').Browse;
	this.onBrowsePage = /^\/(browse|search|mytorrents|bookmarks)\.php$/.test(window.location.pathname);
}

Browse.prototype.run = function()
{
	this.torrentTablePlus();
	this.expandableTorrents();
	this.massAddSearchButton();
	this.downloadButton();
	this.thanksButton();
};


Browse.prototype.expandableTorrents = function expandableTorrents()
{
	if(!this.onBrowsePage || !this.conf.Show.expandableTorrents)
		return;

	//cache object
	window.__expandableTorrentsCache = window.__expandableTorrentsCache || {};

	//Expand button
	$('<input>',{type:'button',value:'+','class':'expandableTorrents'}).appendTo(this.$trPlus.not(':eq(0)'));

	//on expand button is clicked
	ea['click.expandableTorrents'] || $(document.body).on('click','.torrentTablePlus .torrentTablePlusTr .expandableTorrents', function(e)
	{
		var
			$button = $(this)
			, $parent = $button.parent()
			, $tr = $parent.data('$tr')
			, torrentId = $parent.attr('torrentId')
		;

		if(!$tr || !$tr.length)
		{
			$tr = $parent.closest('tr');
		}

		if($tr.next().is('.expanded'))
		{
			$button.val('+');
			$tr.next().remove();

			//update view location with previous one
			$(window).scrollTop($tr.data('scrollTop'));
		} else {
			var
				link = '/details.php?id='+torrentId
				, __cache = window.__expandableTorrentsCache
				, $trExpanded = $('<tr>',{'class':'expanded'}).insertAfter($tr)
			;

			//save current view location
			$tr.data('scrollTop', $(window).scrollTop());

			if(!__cache[link])
			{
				__cache[link] = torrentId ? '<pic src="/pic/loading2.gif" />' : 'Error[no_ID]';

				if(!torrentId)
				{
					return _done();
				}

				var $_ = $('<div>').load(link+' .pageContainer > table[width="880"][border="1"][cellspacing="0"][cellpadding="5"]', function()
				{
					__cache[link] = $_.html();
					_done();
				});
			}

			_done();
			function _done()
			{
				$trExpanded.html('<td colspan="'+ $tr.find('td').length +'">'+__cache[link]+'</td>')
					.find('>td>table').css('width','867px')
					.find('tbody>tr>td:first-child').css({'background-color': 'rgb(216, 211, 180)', cursor: 'pointer'}).click(function()
					{
						$button.click();
					});

				$button.val('-');
			}
		}
	});
	ea['click.expandableTorrents']=1;

	//thanks button
	ea['click.input[name="thank"]'] || $(document.body).on('click', '.expanded form input[name="thank"]', function(e)
	{
		e.preventDefault();
		e.stopPropagation();

		$(this).hide();

		var tid = $(this).siblings('[name="id"]').val();
		$.post('./details.php', {id:tid, thank:1, async:1});

		$(this).closest('tr')
			.find('#thanks_count').each(function(){this.innerHTML = parseInt(this.innerHTML,10)+1;}).end()
			.find('div.sp-body').each(function()
			{
				var
					$last_a = $(this).find('a:last')
					, a = '<a href="./userdetails.php">' + tmd.user.name + '</a>'
				;

				if ($last_a.length == 0)
				{
					$(this).html(a);
				} else {
					$last_a.after($('<span>, </span>'+a));
				}

				$('div.sp-head:first',$(this).parent()).not('.unfolded').click();
			})
		;
	});
	ea['click.input[name="thank"]']=1;
};


Browse.prototype.massAddSearchButton = function massAddSearchButton()
{
	if(!this.onBrowsePage || !this.conf.Show.massAddSearchButton)
		return;

	var
		$massAddSearchButton = $('<div></div>',{'class':'massAddSearchButton'})
	;

	$('<input>',{type: 'button', value: 'S'}).appendTo($massAddSearchButton);
	$('<input>',{type: 'checkbox'}).appendTo($massAddSearchButton);

	$massAddSearchButton.appendTo(this.$trPlus.not(':eq(0)'));

	ea['massAddSearchButton click [type="button"]'] || $(document.body).on('click', '.torrentTablePlus .massAddSearchButton [type="button"]', function()
	{
		var
			$parent = $(this).closest('.torrentTablePlusTr').data('$tr')
			, $td = $parent.find('td[align="left"]:eq(0)')
			, text = getSelectionText() || $td.find('a').text()
			, win = window.open(window.location.origin + '/search.php?search_str='+encodeURIComponent(text), '_blank');

		win.focus();
	});
	ea['massAddSearchButton click [type="button"]'] = 1;

	ea['massAddSearchButton change [type="checkbox"]'] || $(document.body).on('change', '.torrentTablePlus .massAddSearchButton [type="checkbox"]', function()
	{
		var
			$parent = $(this).closest('.torrentTablePlusTr').data('$tr')
			, $td = $parent.find('td[align="left"]:eq(0)')
			, $link = $td.find('a')
			, $titleSpan = $td.find('span.titleSpan').length ? $td.find('span.titleSpan') : $('<span>',{'class':'titleSpan'}).text($link.text()).insertAfter($link).hide()
		;

		$link.toggle();
		$titleSpan.toggle();
	});
	ea['massAddSearchButton change [type="checkbox"]'] = 1;

	function getSelectionText()
	{
		return window.getSelection().toString();
	}



};


/**
 * Create a fixed table on left side of `torrents table`
 * ---
 * this.$trPlus - reference for its rows, each row has .data('$tr') = reference for real $tr from `torrents table`
 */
Browse.prototype.torrentTablePlus = function torrentTablePlus()
{
	if(!this.onBrowsePage || !(this.conf.Show.massAddSearchButton || this.conf.Show.expandableTorrents || this.conf.Show.thanksButton || this.conf.Show.downloadButton))
		return;

	var
		$torrentTable = $('table.tableTorrents').length ? $('table.tableTorrents') : $('.pageContainer table td img[src*="arrowdown.gif"]').closest('table')
		, $tablePlus = $('<div></div>',{'class':'torrentTablePlus'})
		, $trPlus = $('<div></div>',{'class':'torrentTablePlusTr'})
		, _$trPlus = $()
		, _$tablePlus = $()
		, self = this
	;

	//prevent from multiple bindings
	if($torrentTable.hasClass('torrentTablePlusED'))
		return;


	//fill _$trPlus array
	$torrentTable.find('tr').each(function(i,tr)
	{
		var
			$a = $(this).find('a[href*="details.php?id="]').eq(0)
			, tdSelector = i ? 'td.torrentCategImg' : 'td:eq(0)'
			, id = $a.length ? parseInt($a.attr('href').replace(/.+php\?id=(\d+).*/,'$1'),10) : 0
			, $_tr = $trPlus.clone().data({'$tr': $(this)}).attr('torrentId',id)
		;
		_$tablePlus = _$tablePlus.add($tablePlus.clone().append($_tr).appendTo($(this).find(tdSelector)));

		_$trPlus = _$trPlus.add($_tr);
	});


	self.conf.Show.inlineTablePlus && makeTablePlusInline();
	self.conf.Show.inlineTablePlus || _$trPlus.one('DOMSubtreeModified', function()
	{
		var
			$trPlus = $(this)
			, $tablePlus = $(this).parent()
		;

		$.wait(100).then(function()
		{
			var
				width = $tablePlus.width()
				, height = $trPlus.data('$tr').height()
				, plusDiff = $trPlus.data('$tr').is(':last-child') ? -6 : 2.5
			;

			$tablePlus.css({left:-1*(width+1), top: -1*(height+0.5)});
			$trPlus.css({ height: height+plusDiff });

			checkIfTableIsVisible($trPlus);
		});
	});

	//cache
	this.$trPlus = _$trPlus;

	//prevent from multiple bindings
	$torrentTable.addClass('torrentTablePlusED');

	//auto watch for new torrents table
	if(self.documentBodyOnTorrentsUpdate)
		return;

	self.documentBodyOnTorrentsUpdate = true;
	var lastTimeTorrentsUpdated = 0;
	$(document.body).on("DOMNodeInserted", "#torrents", function()
	{
		if(new Date() - lastTimeTorrentsUpdated < 300 )
			return;

		lastTimeTorrentsUpdated = new Date();
		$.wait(100).then(function()
		{
			if($('.pageContainer table td img[src*="arrowdown.gif"]').closest('table').hasClass('torrentTablePlusED'))
				return;

			var b = new Browse();
			b.$trPlus = $();
			b.run();
		});
	});

	var _checkIfTableIsVisible;
	function checkIfTableIsVisible($tr)
	{
		if(_checkIfTableIsVisible || localStorage.checkIfTableIsVisibleConfirmed)
			return;

		_checkIfTableIsVisible = true;
		if($tr.offset().left>0)
			return;

		var confirmed = confirm("Seems like the TorrentTablePlus is out of visible content, would you like to move it to torrent table?\n\n*Note: you can also disable/enable this features from the extensions settings.");
		localStorage.checkIfTableIsVisibleConfirmed = true;

		self.conf.Show.inlineTablePlus = confirmed;
		chrome.storage.local.get('ConfigSettings', function(conf)
		{
			conf.ConfigSettings.settings.Browse.Show.inlineTablePlus=confirmed;
			chrome.storage.local.set(conf)
		});


		confirmed && makeTablePlusInline();
	}

	function makeTablePlusInline()
	{
		$torrentTable.addClass('inlinePlusTr');
	}
};


/**
 * add download button on TorrentTablePlus
 */
Browse.prototype.downloadButton = function downloadButton()
{
	if(!this.onBrowsePage || !this.conf.Show.downloadButton)
		return;

	//Download button
	var $a = $('<a></a>',{type:'button',text:'D','class':'downloadButton'});
	this.$trPlus.not(':eq(0)').each(function()
	{
		$a.clone().attr('href', '/download.php?id='+$(this).attr('torrentId')).appendTo($(this));
	});
};


/**
 * add thanks button on TorrentTablePlus
 */
Browse.prototype.thanksButton = function thanksButton()
{
	if(!this.onBrowsePage || !this.conf.Show.thanksButton)
		return;

	//thanks button
	$('<input>',{type:'button',value:'T','class':'thanksButton'}).appendTo(this.$trPlus.not(':eq(0)'));

	//on thanks button is clicked
	ea['thanksButton click .thanksButton'] || $(document.body).on('click','.torrentTablePlus .torrentTablePlusTr .thanksButton', function()
	{
		var
			$button = $(this)
			, $parent = $button.parent()
			, torrentId = $parent.attr('torrentId')
		;

		//disable button once it was clicked
		$button.prop('disabled', true);

		//send thanks request
		$.post('./details.php', {id:torrentId, thank:1, async:1});
	});
	ea['thanksButton click .thanksButton'] = 1;
};