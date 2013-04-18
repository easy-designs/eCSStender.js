/*------------------------------------------------------------------------------
Function:       eCSStender.CSS3-media-queries.js
Author:         Daniel Ryan (daniel at easy-designs dot net)
Creation Date:  2011-07-14
Version:        0.1
Homepage:       http://github.com/easy-designs/eCSStender.CSS3-media-queries.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/

(function(e) {
  
  if( typeof e.matchMedia == 'undefined' ) { return; }

  e.onComplete(function() {
    var 
    nativeSupport,
    // strings
    STYLESHEET  = 'stylesheet',
    ALTERNATE   = 'alternate',
    SCREEN      = 'screen',
    ALL         = 'all',
    UNDEFINED   = 'undefined',
    ONRESIZE    = 'onresize',
    // other constants
    WINDOW      = window,
    DOCUMENT    = document,
    TRUE        = true,
    FALSE       = false;

    if ( typeof WINDOW.matchMedia != UNDEFINED &&
         WINDOW.matchMedia('(min-width:1px)').matches )
    {
      nativeSupport = TRUE;
    }
    else
    {
      // from respond.js <https://github.com/scottjehl/Respond/>
  		var 
  		bool,
  		doc			  = DOCUMENT,
  		docElem		= doc.documentElement,
  		refNode		= docElem.firstElementChild || docElem.firstChild,
  		// fakeBody required for <FF4 when executed in <head>
  		fakeUsed	= !doc.body,
  		fakeBody	= doc.body || doc.createElement( "body" ),
  		div			  = doc.createElement( "div" ),
  		q			    = "only all";

  		div.id = "mq-test-1";
  		div.style.cssText = "position:absolute;top:-99em";
  		fakeBody.appendChild( div );

  		div.innerHTML = '_<style media="'+q+'"> #mq-test-1 { width: 9px; }</style>';
  		if ( fakeUsed )
  		{
  			docElem.insertBefore( fakeBody, refNode );
  		}	
  		div.removeChild( div.firstChild );
  		bool = div.offsetWidth == 9;  
  		if ( fakeUsed )
  		{
  			docElem.removeChild( fakeBody );
  		}	
  		else
  		{
  			fakeBody.removeChild( div );
  		}
  		nativeSupport = bool;
    }
    if ( nativeSupport )
    {
      return;
    } // we're done

    var
    sizeBasedStyles = [],
    query, css, normalizedQuery, key, rules, prop, sheet, queryMedia;
    for ( query in e.mediaQueryStyles )
    {
      if ( e.isInheritedProperty( e.mediaQueryStyles, query ) ){ continue; }
      css             = [];
      normalizedQuery = query.toUpperCase();
      for ( key in e.mediaQueryStyles[ query ] )
      {
        if ( e.isInheritedProperty( e.mediaQueryStyles[ query ], key ) ){ continue; }
        rules = [];
        for ( prop in e.mediaQueryStyles[ query ][ key ] )
        {
          if ( e.isInheritedProperty( e.mediaQueryStyles[ query ][ key ], prop ) ){ continue; }
          rules.push( prop + ':' + e.mediaQueryStyles[ query ][ key ][ prop ] );
        }
        css.push( key + '{' + rules.join(';') + '}' );
      }
      sheet           = e.embedCSS( css.join(','), query );
      sheet.disabled  = TRUE; // this disables the stylesheet
      sheet.media     = SCREEN; // we have to change this or it won't apply
      // see if the original media type is not all or screen
      queryMedia  = query.split(' ');
      if ( queryMedia.length )
      {
        queryMedia    = queryMedia[0].replace(/,$/, '').toLowerCase();
        if ( queryMedia != 'all' &&
             queryMedia != 'screen' )
        {
          sheet.media = query;
        }
      }
      //  if the media type wasn't changed to just 'screen' or was originally just 'screen', we don't manage them
      if ( sheet.media != query &&
           ( normalizedQuery.indexOf('WIDTH') > -1 ||
             normalizedQuery.indexOf('HEIGHT') > -1 ||
             normalizedQuery.indexOf('ORIENTATION') > -1 ) )
      {
        sizeBasedStyles.push({
          'query': query,
          'sheet': sheet
        });
      }
    }

    activateSheets  = function() {
      var i = sizeBasedStyles.length;
      while( i-- )
      {
        var sbs = sizeBasedStyles[i];
        sbs.sheet.disabled = !e.matchMedia( sbs.query );
      }
    };

    // for Mozilla/Safari/Opera9
    if ( WINDOW.addEventListener )
    {
      WINDOW.addEventListener( ONRESIZE, activateSheets, FALSE );
    }
    // If IE event model is used
    else if ( WINDOW.attachEvent )
    {
      // ensure firing before onload, maybe late but safe also for iframes
      WINDOW.attachEvent( ONRESIZE, activateSheets );
    }

    activateSheets(); // call it now so the initially applicaple styles get activated
  });
})(eCSStender);