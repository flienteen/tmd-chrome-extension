//

function Browse()
{
	this.conf = config('global').Browse;
	this.onBrowsePage = window.location.pathname === "/browse.php";
}

Browse.prototype.run = function()
{
	this.expandableTorrents();
	this.massAddSearchButton();
};


Browse.prototype.expandableTorrents = function expandableTorrents()
{
	if(!this.onBrowsePage || !this.conf.Show.expandableTorrents)
		return;

	window.__addExpandToTorrentsCache = window.__addExpandToTorrentsCache || {};
	var d = 'table.tableTorrents',
		e = ($(d).length < 1) ? $('.pageContainer > table td img[src*="arrowdown.gif"]').closest('table') : $(d),
		f = e.find('tr:nth-child(1)'),
		__cache = window.__addExpandToTorrentsCache,
		g = $('<td>',
			{
				align: 'center',
				'class': 'colhead'
			}).prependTo(f).text('expand');


	e.find('tr:not(:nth-child(1))').each(function ()
	{
		var tr = $(this),
			link = tr.find('a[href*="details.php"]').eq(0),
			_td = $('<td>',
				{
					align: 'center',
					style:'white-space: nowrap'
				}).prependTo(tr);

		$('<input>',{type:'button',value:'+'}).data({link:link.attr('href'), text:link.text(), tr:tr}).appendTo(_td).click(expandTorrent);
	});

	function expandTorrent()
	{
		var
			$v = $(this),
			d = $v.data();
		console.log($v, d);
		if(d.tr.next().is('.expanded'))
		{
			$v.val('+');
			d.tr.next().remove();
		} else {
			var $tr = $('<tr>',{'class':'expanded'}).insertAfter(d.tr);

			d.link = getRealLink(d);

			if(!__cache[d.link])
			{
				__cache[d.link]='<pic src="/pic/loading2.gif" />';
				var $_ = $('<div>').load(d.link+' .pageContainer > table[width="880"][border="1"][cellspacing="0"][cellpadding="5"]', function()
				{
					__cache[d.link] = $_.html();
					_done();
				});
			}

			_done();
			function _done()
			{
				$tr.html('<td colspan="'+ d.tr.find('td').length +'">'+__cache[d.link]+'</td>').find('>td>table').css('width','867px').find('tbody>tr>td:first-child').css({'background-color': 'rgb(216, 211, 180)', cursor: 'pointer'}).click(function(){
					$v.click();
				});
				$v.val('-');
			}
		}
	}

	function getRealLink(obj)
	{
		var _l = obj.link.replace(/page=(\d*)/,'');

		if(!/\?imdb=/.test(_l))
			return _l;

		//getting id
		var $a = obj.tr.find('a[href*="details.php?id="]').eq(0)
			,id = $a.length ? $a.attr('href').replace(/.+php\?id=(\d+).+/,'$1') : ''
		;

		if(!id)
		{
			//todo load imbd page
			return console.error('TODO> no id');
		}

		return '/details.php?id='+id;

	/*	var $c = $('<div></div>');
		$c.load(link+' .tableTorrents tr a[href^="/details.php"]', function()
		{
			$c.find('a').each(function()
			{

			});
		});*/
	}

	//
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
					, a = '<a href="./userdetails.php">' + $('#user_box a[href="/userdetails.php"]').text() + '</a>'
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





