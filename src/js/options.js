
var manifest = {
	name: $getMessage('extName')+ ' ' + $getMessage('Settings'),
	icon: 'icons/icon32.png',
	version: 0.1,
	initialTab: 'About',
	settings:
	[
		{
			"Forum": [{
				"Action": [
					{
						type: 'checkbox',
						name: 'activateUncensoreButton',
						label: $getMessage('View censored posts'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'likeMyPosts',
						label: $getMessage('Like on your own posts'),
						initial: true
					}
				]
			}]
		}

		,{
			"Browse": [{
				"Show": [
					{
						type: 'checkbox',
						name: 'expandableTorrents',
						label: $getMessage('Expandable Torrents'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'massAddSearchButton',
						label: $getMessage('Search button on left side of Torrent'),
						initial: false
					}
				]
			}]
		}

		,{
			"About": '#about-page'
		}
	]
};



window.addEventListener("DOMContentLoaded", function()
{
	var
		settingsObj = {}
		, settings = new Settings(manifest, 'chrome', 'ConfigSettings')
	;


	$find('#about-page > h2').innerHTML = manifest.name;
});