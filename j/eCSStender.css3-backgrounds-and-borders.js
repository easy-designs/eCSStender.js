/*------------------------------------------------------------------------------
Function:       eCSStender.CSS3-backgrounds-and-borders.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2010-04-24
Version:        0.3.5
Homepage:       http://github.com/easy-designs/eCSStender.CSS3-backgrounds-and-borders.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){
  
  if ( eCSStender === undefined ){ return; }
  
  var
  e = eCSStender,
  // Extensions
  Background = new Background( e ),
  BRObject = new BorderRadius( e ),
  BSObject = new BoxShadow( e );

  // Objects
  function Background( e )
  {
    //var
    //PROPERTY  = 'property',
    //MOZ       = '-moz-',
    //WEBKIT    = '-webkit-',
    //KHTML     = '-khtml-',
    //SPACE     = ' ',
    //COLON     = ': ',
    //SEMICOL   = '; ',
    //BG        = 'background',
    //BG_COLOR  = BG + '-color',
    //BG_IMG    = BG + '-image',
    //BG_RPT    = BG + '-repeat',
    //BG_ATTACH = BG + '-attachment',
    //BG_POSN   = BG + '-position',
    //BG_CLIP   = BG + '-clip',
    //BG_ORIGIN = BG + '-origin',
    //BG_SIZE   = BG + '-size',
    //// regex got background-image property
    //RE_IMG    = /^((none|url\([^)]+\)),?\s?)*(none|url\([^)]+\))$/,
    //// regex for background-repeat property
    //RE_RPT    = /^((((no-)?repeat|space|round|no-repeat)\s?){1,2})|repeat-[xy]$/,
    //// regex for background-attachment
    //RE_ATTACH = /^scroll|fixed|local$/,
    //// regex for background-position
    //// ^(((top|bottom|left|right)(\s-?\d+(%|\w+))?|center|-?\d+(%|\w+))(\s\2)?)(,\s?\1)*$
    //RE_POSN   = /^(((top|bottom|left|right)(\s-?\d+(%|\w+))?|center|-?\d+(%|\w+))(\s)?(,\s?\2)?)+$/,
    //// regex for background-clip
    //RE_CLIP   = ,
    //// regex for background-origin
    //BG_ORIGIN = ,
    //// regex for background-size
    //BG_SIZE   = ;
    
  }
  
  
  function BorderRadius( e )
  { 
    var
    UNDEFINED,
    PROPERTY = 'property',
    MOZ      = '-moz-',
    WEBKIT   = '-webkit-',
    KHTML    = '-khtml-',
    SPACE    = ' ',
    COLON    = ': ',
    SEMICOL  = '; ',
    BR       = 'border-radius',
    TL       = '-topleft',
    BTLR     = 'border-top-left-radius',
    BTRR     = 'border-top-right-radius',
    BBRR     = 'border-bottom-right-radius',
    BBLR     = 'border-bottom-left-radius',
    THREEPX  = COLON + '3px';
    
    e.register(
      { fragment: 'radius',
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, BTLR + THREEPX ) &&
                   ( e.isSupported( PROPERTY, MOZ + BR + TL + THREEPX ) ||
                     e.isSupported( PROPERTY, WEBKIT + BTLR + THREEPX ) ||
                     e.isSupported( PROPERTY, KHTML + BTLR + THREEPX ) ) );
        },
        fingerprint: 'net.easy-designs.' + BR
      },
      false,
      apply
    );  
    
    function apply( selector, properties, medium )
    {
      var
      style_block = selector + ' { ',
      corners;

      // handle shorthand
      if ( properties[BR] != UNDEFINED )
      {
        
        corners = findCorners( properties[BR] );
        
        if ( corners.length > 1 )
        {
          style_block += assignIndividualCorners( corners );
        }
        else
        {
          style_block += MOZ + BR + COLON + properties[BR] + SEMICOL +
                         WEBKIT + BR + COLON + properties[BR] + SEMICOL +
                         KHTML + BR + COLON + properties[BR] + SEMICOL;
        }
        
        properties[BR] = null;
        
      }

      for ( var prop in properties )
      {
        if ( e.isInheritedProperty( properties, prop ) ) { continue; };
        style_block += assignProperty( properties, prop );
      }

      style_block += '} ';

      e.embedCSS( style_block, medium );
    }

    // =========
    // UTILITIES
    // =========
    function findCorners( value )
    {
      var
      radii = value.split('/'),
      corners = [];
      if ( radii.length > 1 )
      {
        var horiz = e.trim( radii[0] ).split(SPACE);
        var vert  = e.trim( radii[1] ).split(SPACE);
        // handle mirroring
        horiz = handleMirroring( horiz );
        vert  = handleMirroring( vert );
        for ( var i=0; i<4; i++ )
        {
          corners[i] = horiz[i] + SPACE + vert[i];
        }
      }
      else
      {
        corners = handleMirroring( e.trim( radii[0] ).split(SPACE) );
      }
      return corners;
    }
    function handleMirroring( radii )
    {
      if ( radii.length < 4 )
      {
        if ( radii[1] == UNDEFINED ){ radii[1] = radii[0]; }
        if ( radii[2] == UNDEFINED ){ radii[2] = radii[0]; }
        if ( radii[3] == UNDEFINED ){ radii[3] = radii[1]; }
      }
      return radii;
    }
    function assignIndividualCorners( corners )
    {
      // webkit/konquerer is a little funky with multiple-assignment
      if ( e.isSupported( PROPERTY, WEBKIT + BTLR + THREEPX ) ||
           e.isSupported( PROPERTY, KHTML + BTLR + THREEPX ) )
      {
        assignIndividualCorners = function( corners )
        {
          return WEBKIT + BTLR + COLON + corners[0] + SEMICOL +
                 WEBKIT + BTRR + COLON + corners[1] + SEMICOL +
                 WEBKIT + BBRR + COLON + corners[2] + SEMICOL +
                 WEBKIT + BBLR + COLON + corners[3] + SEMICOL +
                 KHTML + BTLR + COLON + corners[0] + SEMICOL +
                 KHTML + BTRR + COLON + corners[1] + SEMICOL +
                 KHTML + BBRR + COLON + corners[2] + SEMICOL +
                 KHTML + BBLR + COLON + corners[3] + SEMICOL;
        };
      }
      else
      {
        assignIndividualCorners = function( corners )
        {
          return MOZ + BR + TL + COLON + corners[0] + SEMICOL +
                 MOZ + BR + '-topright: ' + corners[1] + SEMICOL +
                 MOZ + BR + '-bottomright: ' + corners[2] + SEMICOL +
                 MOZ + BR + '-bottomleft: ' + corners[3] + SEMICOL;
        };       
      }
      return assignIndividualCorners( corners );
    }
    function assignProperty( properties, prop )
    {
      if ( e.isSupported( PROPERTY, MOZ + BR + TL + THREEPX ) )
      {
        assignProperty = function( properties, prop )
        {
          return prop.replace( /border-(top|bottom)-(left|right)-radius/, MOZ + BR + '-$1$2' ) +
                 COLON + properties[prop] + SEMICOL;
        };
      }
      else
      {
        assignProperty = function( properties, prop )
        {
          return prop + COLON + properties[prop] + SEMICOL;
        };
      }
      return assignProperty( properties, prop );
    }
  }
  
  function BoxShadow( e )
  {
    var
    UNDEFINED,
    PROPERTY = 'property',
    MOZ      = '-moz-',
    WEBKIT   = '-webkit-',
    KHTML    = '-khtml-',
    SPACE    = ' ',
    COLON    = ': ',
    SEMICOL  = '; ',
    BS       = 'box-shadow',
    FILTER   = 'filter: ',
    SHADOW   = 'progid:DXImageTransform.Microsoft.Shadow',
    TWOPX    = '2px',
    BLACK    = 'black',
    COLOR    = 'rgb(0, 0, 0)',
    WKTEST   = COLON + COLOR + SPACE + TWOPX + SPACE + TWOPX + SPACE + TWOPX,
    TEST     = WKTEST + SPACE + TWOPX,
    IETEST   = FILTER + SHADOW + '(color=#000000,direction=135,strength=3)',
    
    // test
    spread_support = false;
    e.register(
      { property: BS,
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, BS + TEST ) &&
                   ( e.isSupported( PROPERTY, MOZ + BS + TEST ) ||
                     e.isSupported( PROPERTY, WEBKIT + BS + WKTEST ) ||
                     e.isSupported( PROPERTY, WEBKIT + BS + TEST ) ||
                     e.isSupported( PROPERTY, KHTML + BS + WKTEST ) ||
                     e.isSupported( PROPERTY, KHTML + BS + TEST ) ||
                     e.isSupported( PROPERTY, FILTER + IETEST ) ) );
        },
        fingerprint: 'net.easy-designs.' + BS
      },
      false,
      apply
    );  
    
    function apply( selector, properties, medium )
    {
      var
      style_block = selector + ' { ',
      shadow      = properties[BS],
      colors      = shadow.match( /((?:rgb|hsl)a?\([^\)]+\))/g ),
      i = count   = ( colors instanceof Array ? colors.length : 0 ),
      color       = '%MASKED_COLOR',
      percent     = '%';

      // mask RGB/HSL colors
      if ( i )
      {
        while ( i-- )
        {
          shadow = shadow.replace( colors[i], color+i+percent );
        }
      }

      style_block += convert( shadow );
      
      // unmask RGB/HSL colors
      i = count;
      if ( i )
      {
        while ( i-- )
        {
          style_block = style_block.replace( new RegExp( color+i+percent, 'g'), colors[i] );
        }
      }

      style_block += '} ';
      
      e.embedCSS( style_block, medium );
    }
    
    function convert( shadow )
    {
      if ( e.isSupported( PROPERTY, FILTER + IETEST ) )
      {
        convert = function( shadow )
        {
          var
          shadows    = shadow.split(','),
          rule       = 'zoom: 1; ' + FILTER,
          i          = shadows.length,
          abbr_color = /(#)([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
          pieces, direction, blur, spread, color;
          
          while ( i-- )
          {
            shadow = e.trim( shadows[i] ).split( SPACE );
            pieces = shadow.length;
            direction = findAngle( shadow[0], shadow[1] );
            blur = spread = null;
            
            // determine what's going on
            switch ( pieces )
            {
              case 5:
                blur   = e.trim( shadow[2] ).replace(/(\d+).*/,'$1');
                spread = e.trim( shadow[3] );
                color  = e.trim( shadow[4] );
                break;
              case 4:
                blur   = e.trim( shadow[2] ).replace(/(\d+).*/,'$1');
                color  = e.trim( shadow[3] );
                break;
              case 3:
                color  = e.trim( shadow[2] );
                break;
            }
            
            // expand colors
            if ( color.match( abbr_color ) )
            {
              color = color.replace( abbr_color, '$1$2$2$3$3$4$4' );
            }
            
            rule += SHADOW + '(color=' + color + ',direction=' + direction + ',strength=' + blur + ') ';
          }
          
          return rule + SEMICOL;
          
        };
      }
      else
      {
        // test spread support as Webkit previous to Safari 5 doesn't have it
        if ( e.isSupported( PROPERTY, WEBKIT + BS + TEST ) ||
             e.isSupported( PROPERTY, KHTML + BS + TEST ) )
        {
          spread_support = true;
        }
        
        convert = function( shadow )
        {
          var
          shadows = shadow.split(','),
          rules   = [],
          i       = shadows.length,
          NULL    = null,
          pieces, offset, blur, spread, color;
          
          while ( i-- )
          {
            shadow = e.trim( shadows[i] ).split(SPACE);
            pieces = shadow.length;
            offset = shadow[0] + ' ' + shadow[1];
            blur = spread = NULL;
            
            // determine what's going on
            switch ( pieces )
            {
              case 5:
                blur   = e.trim( shadow[2] );
                spread = e.trim( shadow[3] );
                color  = e.trim( shadow[4] );
                break;
              case 4:
                blur   = e.trim( shadow[2] );
                color  = e.trim( shadow[3] );
                break;
              case 3:
                color  = e.trim( shadow[2] );
                break;
            }
            
            rules[i] = offset + SPACE +
                       ( blur != NULL ? blur + SPACE : '' ) +
                       ( spread_support && spread != NULL ? spread + SPACE : '' ) +
                       color;
          }
          
          rules = rules.join(', ') + SEMICOL;
          
          return WEBKIT + BS + COLON + rules +
                 KHTML + BS + COLON + rules +
                 MOZ + BS + COLON + rules;
          
        };
      }
      return convert( shadow );
    }
    
    function findAngle ( x, y )
    {
      return 270 - ( Math.atan2( parseInt( y, 10 ), 0 - parseInt( x, 10 ) ) * 180 / Math.PI );
    }
    
  }
    
})();