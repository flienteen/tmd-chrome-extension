//

function Browse()
{
	this.conf = config('global').Browse;
	this.onBrowsePage = window.location.pathname === "/browse.php";
}

Browse.prototype.run = function()
{
	this.torrentTablePlus();
	this.expandableTorrents();
	this.massAddSearchButton();
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
	$(document.body).on('click','#torrentTablePlus .torrentTablePlusTr .expandableTorrents', function()
	{
		var
			$button = $(this)
			, $parent = $button.parent()
			, $tr = $parent.data('$tr')
			, torrentId = $parent.data('torrentId')
		;

		if($tr.next().is('.expanded'))
		{
			$button.val('+');
			$tr.next().remove();
		} else {
			var
				link = '/details.php?id='+torrentId
				, __cache = window.__expandableTorrentsCache
				, $trExpanded = $('<tr>',{'class':'expanded'}).insertAfter($tr)
			;

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

	//thanks button
	$(document.body).on('click', '.expanded form input[name="thank"]', function(e)
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
};


Browse.prototype.massAddSearchButton = function massAddSearchButton()
{
	if(!this.onBrowsePage || !this.conf.Show.massAddSearchButton)
		return;

	//TODO refactor this `shitty` code

	var d = 'table.tableTorrents';
	var e = $(d);
	if(e.length < 1) e = $('.pageContainer > table td img[src*="arrowdown.gif"]').closest('table');
	var f = e.find('tr:nth-child(1)');
	var g = $('<td>',
		{
			align: 'center',
			'class': 'colhead'
		}).prependTo(f);


	e.find('tr:not(:nth-child(1))').each(function ()
	{
		var tr = $(this),
			link = tr.find('a').eq(1),
			b = link.attr('href').replace(/.*id=/, ''),
			t = link.text(),
			titleSpan = $('<span>').text(t).insertAfter(link).hide();
		_td = $('<td>',
			{
				align: 'center',
				style:'white-space: nowrap'
			}).prependTo(tr);


		$('<input>',
			{
				type: 'button',
				value: 'S!'
			}).appendTo(_td).click(function()
			{
				var text = getSelectionText() || t;
				var win=window.open('http://www.torrentsmd.com/search.php?search_str='+encodeURIComponent(text), '_blank');
				win.focus();
			});


		$('<input>',
			{
				type: 'checkbox',
				name: 'bbt' + b,
				value: b,
				'data-title':t,
				'class': 'massAddSearchButton'
			}).appendTo(_td).change(function()
			{
				titleSpan.toggle();
				link.toggle();
			});
	});


	function getSelectionText()
	{
		var text = "";
		if (window.getSelection) {
			text = window.getSelection().toString();
		} else if (document.selection && document.selection.type != "Control") {
			text = document.selection.createRange().text;
		}
		return text;
	}



};


/**
 * Create a fixed table on left side of `torrents table`
 * ---
 * this.$tablePlus - reference for created table
 * this.$trPlus - reference for its rows, each row has .data('$tr') = reference for real $tr from `torrents table`
 */
Browse.prototype.torrentTablePlus = function torrentTablePlus()
{
	if(!this.onBrowsePage || !(this.conf.Show.massAddSearchButton || this.conf.Show.expandableTorrents))
		return;

	var
		$torrentTable = $$('table.tableTorrents').length ? $$('table.tableTorrents') : $('.pageContainer > table td img[src*="arrowdown.gif"]').closest('table')
		, $tablePlus = $('<div></div>',{id:'torrentTablePlus'}).hide()
		, $trPlus = $('<div></div>',{'class':'torrentTablePlusTr'})
		, _$trPlus = $()
		, tablePlusCss = {
			top: 0
			, right: $torrentTable.offset().left + $torrentTable.width()
		}
	;

	//fill _$trPlus array
	$torrentTable.find('tr').each(function()
	{
		var
			$a = $(this).find('a[href*="details.php?id="]').eq(0)
			, id = $a.length ? parseInt($a.attr('href').replace(/.+php\?id=(\d+).*/,'$1'),10) : 0
		;

		_$trPlus = _$trPlus.add($trPlus.clone().data({'$tr': $(this), torrentId:id}) );
	});

	//fill $tablePlus, apply styles and append it to DOM
	$tablePlus.append(_$trPlus).css(tablePlusCss).appendTo(document.body).show(200);

	//update before showing
	updateTrPlusPosition();

	//cache
	this.$tablePlus = $tablePlus;
	this.$trPlus = _$trPlus;

	//update $trPlus positions on $torrentTable DOMSubtreeModified
	$torrentTable.on('DOMSubtreeModified', function()
	{
		[10, 200, 400].forEach(function(time)
		{
			$.wait(time).then(updateTrPlusPosition);
		});
	});

	/**
	 * update $trPlus positions
	 */
	function updateTrPlusPosition()
	{
		_$trPlus.each(function()
		{
			var $tr = $(this).data('$tr');
			$(this).css({'height':$tr.height(), 'top':$tr.offset().top})
		});
	}
};


