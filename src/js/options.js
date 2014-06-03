
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
						name: 'likeMyPosts',
						label: $getMessage('Like on your own posts'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'imgFit',
						label: $getMessage('(click to zoom) Fit images'),
						initial: false
					}
					,{
						type: 'checkbox',
						name: 'imgFitSpoilers',
						label: $getMessage('(click to zoom) Fit images in Spoilers'),
						initial: false
					}
					,{
						type: 'checkbox',
						name: 'linkImagePreview',
						label: $getMessage('(hover to view) Preview images under links'),
						initial: true
					}
				]
			}, {
				"Censored Post": [
					{
						type: 'checkbox',
						name: 'showUncensoreButton',
						label: $getMessage('Show `uncensore` button'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'showUncensoreAllButton',
						label: $getMessage('Show `uncensore all` button'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'autoResolveAllCensoredPost',
						label: $getMessage('(may freeze your browser) Auto resolve all censored posts'),
						initial: false
					}
					,{
						type: 'checkbox',
						name: 'showLog',
						label: $getMessage('Show log'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'mofHideCensored',
						label: $getMessage('(MOF+) Hide text from censored posts'),
						initial: false
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
					,{
						type: 'checkbox',
						name: 'downloadButton',
						label: $getMessage('Show download button'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'thanksButton',
						label: $getMessage('Show thanks button'),
						initial: true
					}
				]
			}]
		}

		,{
			"About": '#about-page'
		}

		,{
			"Change Log": '#change-log'
		}
	]
};



window.addEventListener("DOMContentLoaded", function()
{
	if(location.hash==='#log')
		manifest.initialTab = 'Change Log';


	new Settings(manifest, 'chrome', 'ConfigSettings');


	$find('#about-page > h2').innerHTML = manifest.name;

	//fill content
	document.getElementById('changeLog').onload = function()
	{
		document.getElementById('changeLogContent').innerHTML = this.contentWindow.document.body.innerText
	};

});