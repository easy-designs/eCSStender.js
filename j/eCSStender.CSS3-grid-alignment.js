/*------------------------------------------------------------------------------
Function:		eCSStender.CSS3-grid-alignment.js
Author:			Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:	2011-06-23
Version:		0.3
Homepage:		http://github.com/easy-designs/eCSStender.CSS3-grid-alignment.js
License:		MIT License 
Note:			If you change or improve on this script, please let us know by
				emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(e){
	
	if ( typeof e == 'undefined' ) { return; }
	
	var
	UNDEFINED,
	TRUE		= true,
	PROPERTY	= 'property',
	MOZ			= '-moz-',
	MS			= '-ms-',
	OPERA		= '-o-',
	WEBKIT		= '-webkit-',
	STAR		= '*',
	COLON		= ':',
	SEMICOL		= ';',
	OPEN_CURLY  = '{',
	CLOSE_CURLY = '}',
	EMPTY		= '',
	DISPLAY		= 'display',
	GRID		= 'grid',
	cache		= [],
	completed	= false,
	isSupported	= e.isSupported,
	onComplete	= e.onComplete,
	native_support, prefixed_support, folder;
	
	if ( native_support = isSupported( PROPERTY, DISPLAY + COLON + GRID ) )
	{
		// we don't need the extension
		return;
	}
	
	onComplete(function(){
		completed = TRUE;
	});
	
	prefixed_support = ( isSupported( PROPERTY, DISPLAY + COLON + MS + GRID ) ||
						 // moz thinks it's ready in FF 5, but it's not
	 					 // isSupported( PROPERTY, DISPLAY + COLON + MOZ + GRID ) ||
						 isSupported( PROPERTY, DISPLAY + COLON + OPERA + GRID ) ||
						 isSupported( PROPERTY, DISPLAY + COLON + WEBKIT + GRID ) );

	function holdGridAlignment( el, selector, properties, media, grid_items )
	{
		cache.push({
			e: el,
			s: selector,
			p: properties,
			m: media,
			g: grid_items	
		});
	}
	function processGrids()
	{
		var i = cache.length, item;
		while ( i-- )
		{
			item = cache[i];
			new CSSGridAlignment( item.e, item.s, item.p, item.m, item.g );
		}
	}
	function defined( test )
	{
		return test != UNDEFINED;
	}
	function select( selector, context )
	{
		if ( defined( document.querySelectorAll ) )
		{
			select = function( selector, context )
			{
				return (context||document).querySelectorAll(selector);
			};
		}
		// jQuery fallback
		else
		{
			if ( ! defined( window.jQuery ) )
			{
				e.loadScript(
					'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js',
					function(){
						select( selector, context );
					});
			}
			select = function( selector, context )
			{
				return window.jQuery(selector, context).get();
			};
		}
		return select( selector, context );
	}
	
	// load the polyfill library
	if ( ! prefixed_support )
	{
		folder = e.getPathTo( 'eCSStender.CSS3-grid-alignment.js' );
		e.loadScript(
			folder + 'eCSStender.CSS3-grid-alignment.polyfill.js',
			function(){
				if ( completed )
				{
					processGrids();
				}
				else
				{
					onComplete(processGrids);
				}
			}
		);
	}

	// build the extension
	e.register(
		{
			property:		DISPLAY,
			filter:			{ value: /(inline-)?grid/ },
			// test is unnecessary as we moved it outside of the extension
			fingerprint:	'net.easy-designs.' + GRID
		},
		STAR,
		function( selector, properties, media, specificity )
		{
			var processed = {}, prefix, collection;
			if ( prefixed_support )
			{
				switch ( TRUE )
				{
					case isSupported( PROPERTY, DISPLAY + COLON + MS + GRID ):
						prefix = MS;
						break;
					case isSupported( PROPERTY, DISPLAY + COLON + MOZ + GRID ):
						prefix = MOZ;
						break;
					case isSupported( PROPERTY, DISPLAY + COLON + OPERA + GRID ):
						prefix = OPERA;
						break;
					case isSupported( PROPERTY, DISPLAY + COLON + WEBKIT + GRID ):
						prefix = WEBKIT;
						break;
				}
				function prefixify( selector, properties, medium )
				{
					var
					styles = EMPTY,
					style  = EMPTY,
					c, item, properties, prop;
					
					// already run for this medium?
					if ( medium in processed ) { return; }
					// don't run this medium again
					processed[medium] = TRUE;

					// collect this medium's rule sets
					collection	= e.lookup( { fragment: GRID, media: medium }, STAR );
					c			= collection.length;
					
					// convert everything grid-like
					while ( c-- )
					{
						item		= collection[c];
						properties	= item.properties;
						style		= item.selector + OPEN_CURLY;
						for ( prop in properties )
						{
							if ( ! e.isInheritedProperty( properties, prop ) )
							{
								if ( prop.indexOf( GRID ) > -1 )
								{
									style += prefix + prop + COLON + properties[prop] + SEMICOL;
								}
								else if ( properties[prop].indexOf(GRID) > -1 )
								{
									style += prop + COLON + prefix + properties[prop] + SEMICOL;
								}
							}
						}
						styles = style + CLOSE_CURLY + styles;
					}
					// embed the new styles
					e.embedCSS( styles, medium );
				}
				// trigger the actual function and re-define the callback
				prefixify( selector, properties, media );
				return prefixify;
			}
			else
			{
				collection = e.lookup( { fragment: GRID }, STAR );
				function polyfill( selector, properties, media, specificity )
				{
					var
					els		= select( selector ),
					eLen	= els.length,
					children, grid_items, c, b, found, f,
					gridObject;

					// loop
					// TODO: Don't forget non-layed out children
					while ( eLen-- )
					{
						children	= els[eLen].children;
						grid_items	= [];

						// determine which elements in the bullpen are 
						// actual children of this element
						c = children.length;
						while ( c-- )
						{
							b = collection.length;
							while ( b-- )
							{
								found	= select( collection[b].selector );
								f		= found.length;
								while ( f-- )
								{
									if ( found[f] == children[c] )
									{
										grid_items.push({
											element: children[c],
											details: collection[b]
										});
										break;
									}
								}
							}
						}
						holdGridAlignment( els[eLen], selector, properties, media, grid_items );
					}
				}

				// trigger the actual function and re-define the callback
				polyfill( selector, properties, media, specificity );
				return polyfill;
			}
		}
	);
	
})(eCSStender);