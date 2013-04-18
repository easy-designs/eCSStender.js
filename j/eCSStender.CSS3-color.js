/*------------------------------------------------------------------------------
Function:       eCSStender.CSS3-color.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2010-04-25
Version:        0.1
Homepage:       http://github.com/easy-designs/eCSStender.CSS3-color.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){
  
  if ( typeof eCSStender == 'undefined' ){ return; }
  
  var
  e = eCSStender,
  c = new ColorHandler(e),
  c = new Opacity(e),
  ColorUtils;
  
  function ColorHandler( e )
  { 
    var
    UNDEFINED,
    FALSE    = false,
    NULL     = null,
    COMMA    = ',',
    COLON    = ':',
    SEMICOL  = '; ',
    OPPAREN  = '(',
    CLPAREN  = ')',
    COLOR    = 'color',
    PROPERTY = 'property',
    HSL      = 'hsl',
    HSLA     = HSL + 'a',
    RGB      = 'rgb',
    RGBA     = RGB + 'a',
    HSLTEST  = COLOR + COLON + HSL + OPPAREN + '0, 0, 0' + CLPAREN,
    RGBATEST = COLOR + COLON + RGBA + OPPAREN + '0, 0, 0, 1' + CLPAREN,
    HSLATEST = COLOR + COLON + HSLA + OPPAREN + '0, 0, 0, 1' + CLPAREN,
    FILTER   = 'filter: progid:DXImageTransform.Microsoft.Gradient',
    PROPS    = [ 'background', 'background-' + COLOR, COLOR,
                 'border', 'border-left', 'border-right', 'border-top', 'border-bottom' ];
    
    e.register(
      { property: [ 'background', 'background-' + COLOR ],
        filter:   /(:?rgba|hsla)\([^\)]+\)/,
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, RGBATEST ) &&
                   e.isSupported( PROPERTY, FILTER + '(startColorstr=#99000050,endColorstr=#99000050)' ) );
        },
        fingerprint: 'net.easy-designs.alpha-backgrounds-in-IE'
      },
      FALSE,
      alphaBackgroundsInIE
    );  
    e.register(
      { property: PROPS,
        filter:   /hsla\([^\)]+\)/,
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, HSLATEST ) );
        },
        fingerprint: 'net.easy-designs.' + HSLA
      },
      FALSE,
      hslToRGB
    );
    e.register(
      { property: PROPS,
        filter:   /hsl\([^\)]+\)/,
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, HSLTEST ) );
        },
        fingerprint: 'net.easy-designs.' + HSL
      },
      FALSE,
      hslToRGB
    );  
    
    function hslToRGB( selector, properties, medium )
    {
      var
      style_block = '',
      prop, regex = /(.*)(hsla?)\(([^\)]+)\)(.*)/, match,
      hsl, rgb, color;

      // handle shorthand
      for ( prop in properties )
      {
        if ( e.isInheritedProperty( properties, prop ) ) { continue; };
        match = properties[prop].match( regex );
        if ( match != NULL )
        {
          color = RGB;
          hsl = match[3].split(COMMA);
          rgb = ColorUtils.hslToRGB( e.trim(hsl[0]), e.trim(hsl[1]), e.trim(hsl[2]) );
          // hsla includes the alpha channel
          if ( match[2] == HSLA )
          {
            color = RGBA;
            rgb[3] = e.trim(hsl[3]);
          }
          style_block += prop + COLON + match[1] + color + OPPAREN + rgb.join(COMMA) + CLPAREN + match[4] + SEMICOL;
        }
      }
      
      if ( style_block != '' )
      {
        e.embedCSS( selector + ' { ' + style_block + '} ', medium );
      }
      
    }
    
    function alphaBackgroundsInIE( selector, properties, medium )
    {
      var
      style_block = '',
      prop, regex = /(.*)(rgba|hsla)\(([^\)]+)\)(.*)/, match,
      hsl, rgb;

      // handle shorthand
      for ( prop in properties )
      {
        if ( e.isInheritedProperty( properties, prop ) ) { continue; };
        match = properties[prop].match( regex );
        if ( match != NULL )
        {
          value = match[3].split(COMMA);
          
          // handle the alpha channel
          alpha = ColorUtils.base16( e.trim(value[3]) * 255 );
          
          // convert HSLA to RGBA
          if ( match[2] == HSLA )
          {
            value = ColorUtils.hslToHex( e.trim(value[0]), e.trim(value[1]), e.trim(value[2]) );
          }
          else
          {
            value = ColorUtils.rgbToHex( e.trim(value[0]), e.trim(value[1]), e.trim(value[2]) );
          }
          
          style_block += prop + COLON + match[1] + match[4] + SEMICOL + 'zoom' + COLON + '1' + SEMICOL +
                         FILTER + OPPAREN + 'startColorstr=#' + alpha + value + ',endColorstr=#' + alpha + value + CLPAREN + SEMICOL;
          
        }
      }

      if ( style_block != '' )
      {
        e.embedCSS( selector + ' { ' + style_block + '} ', medium );
      }
      
    }

  }
  
  function Opacity( e )
  {
    var
    UNDEFINED,
    FALSE    = false,
    NULL     = null,
    COLON    = ': ',
    SEMICOL  = '; ',
    CLPAREN  = ')',
    PROPERTY = 'property',
    OPACITY  = 'opacity',
    FILTER   = 'filter' + COLON + 'progid:DXImageTransform.Microsoft.Alpha(' + OPACITY + '=',
    TEST     = OPACITY + COLON + 0,
    IETEST   = FILTER + 0 + CLPAREN;
    
    e.register(
      { property: OPACITY,
        test:     function()
        {
          return ( ! e.isSupported( PROPERTY, TEST ) &&
                   e.isSupported( PROPERTY, IETEST ) );
        },
        fingerprint: 'net.easy-designs.opacity'
      },
      FALSE,
      opacityInIE
    );
    
    function opacityInIE( selector, properties, medium )
    {
      var
      style_block = '',
      prop;

      // handle shorthand
      for ( prop in properties )
      {
        if ( e.isInheritedProperty( properties, prop ) ) { continue; };
        style_block += FILTER + ( properties[prop] * 100 ) + CLPAREN + SEMICOL +
                       'zoom' + COLON + '1' + SEMICOL;
      }
      
      if ( style_block != '' )
      {
        e.embedCSS( selector + ' { ' + style_block + '} ', medium );
      }
      
    }
  }
  
  // Utils
  ColorUtils = {
    rgbToHex: function( R, G, B )
    {
      return this.base16( R ) +
             this.base16( G ) +
             this.base16( B );
    },
    hexToRGB: function( hex )
    {
      return [ parseInt( hex.substr( 0, 2 ), 16 ),
               parseInt( hex.substr( 2, 2 ), 16 ),
               parseInt( hex.substr( 4, 2 ), 16 ) ];
    },
    rgbToHSL: function( R, G, B )
    {
      R /= 255; G /= 255; B /= 255;
      
      var
      max = Math.max( R, G, B ),
      min = Math.min( R, G, B ),
      hsl = [ 0, 0, ( max + min ) / 2 ],
      difference = max - min;

      if ( difference !== 0 )
      {
        hsl[1] = ( hsl[2] > 0.5 ) ? difference / ( 2 - difference )
                                  : difference / ( max + min );
        switch ( max )
        {
          case R:
            hsl[0] = ( G - B ) / difference + ( G < B ? 6 : 0 );
            break;
          case G:
            hsl[0] = ( B - R ) / difference + 2;
            break;
          case B:
            hsl[0] = ( R - G ) / difference + 4;
            break;
        }
        hsl[0] /= 6;
      }
          
      return hsl;
    },
    hslToRGB: function( H, S, L )
    {
      H = parseInt( H, 10 ) / 360;
      S = parseInt( S, 10 ) / 100;
      L = parseInt( L, 10 ) / 100;
      
      var
      rgb = [ 0, 0, 0 ],
      q, p, i = 3;
      
      if ( S === 0 )
      {
        rgb[0] = rgb[1] = rgb[2] = L;
      }
      else
      {
        q = ( L < 0.5 ) ? L * ( 1 + S )
                        : L + S - ( L * S );
        p = ( 2 * L ) - q;
        rgb[0] = this.hue( p, q, H + 1/3 );
        rgb[1] = this.hue( p, q, H );
        rgb[2] = this.hue( p, q, H - 1/3 );
      }
      
      while ( i-- )
      {
        rgb[i] = Math.round( rgb[i] * 255 );
      }
      
      return rgb;
    },
    hslToHex: function( H, S, L )
    {
      var rgb = this.hslToRGB( H, S, L );
      return this.rgbToHex( rgb[0], rgb[1], rgb[2] );
    },
    base16: function( value )
    {
      var
      base   = 16,
      digits = '0123456789ABCDEF',
      hex    = '';
      while( value > 0 )
      {
      	hex   = digits.charAt( value % base ) + hex;
      	value = Math.floor( value / base );
      }
      if ( hex == '' )
      {
        hex = '00';
      }
      return hex;
    },
    hue: function( p, q, t )
    {
      if ( t < 0 ) t += 1;
      if ( t > 1 ) t -= 1;
      if ( t*6 < 1 ) return p + ( q - p ) * 6 * t;
      if ( t*2 < 1 ) return q;
      if ( t*3 < 2 ) return p + ( q - p ) * ( 2/3 - t ) * 6;
      return p;
    }
  };
    
})();