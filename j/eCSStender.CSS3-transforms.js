/*------------------------------------------------------------------------------
Function:       eCSStender.CSS3-transforms.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2010-05-23
Version:        0.3
Homepage:       http://github.com/easy-designs/eCSStender.CSS3-transforms.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){
  
  if ( eCSStender === undefined ){ return; }
  
  var
  e = eCSStender,
  $ = false,
  // Extensions
  RotateObject = new Rotate( e ),
  Utils;

  // Objects
  function Rotate( e )
  { 
    
    var
    UNDEFINED,
    PROPERTY  = 'property',
    MOZ       = '-moz-',
    WEBKIT    = '-webkit-',
    KHTML     = '-khtml-',
    OPERA     = '-o-',
    SPACE     = ' ',
    COLON     = ': ',
    SEMICOL   = '; ',
    O_PAREN   = '(',
    C_PAREN   = ')',
    TRANSFORM = 'transform',
    ROTATE    = 'rotate',
    DEGREES   = 'deg',
    RADIANS   = 'rad',
    MATRIX    = 'matrix(0.7, 0.7, -0.7, 0.7, 0, 0)', // rotate(45deg)
    ROTATION  = ROTATE + O_PAREN + '0.79' + RADIANS + C_PAREN, // rotate(45deg)
    MS_MATRIX = 'filter: progid:DXImageTransform.Microsoft.Matrix',
    MS_TEST   = MS_MATRIX + "(sizingMethod='auto expand')";
    
    e.register(
      { fragment: TRANSFORM,
        filter: {
          value: /rotate\(-?\d+deg\)/
        },
        test: function()
        {
          var transform = TRANSFORM + COLON + MATRIX;
          return ( ! e.isSupported( PROPERTY, transform ) &&
                   ( e.isSupported( PROPERTY, MOZ + transform ) ||
                     e.isSupported( PROPERTY, WEBKIT + transform ) ||
                     e.isSupported( PROPERTY, KHTML + transform ) ||
                     // opera has 2 implementations now
                     e.isSupported( PROPERTY, OPERA + TRANSFORM + COLON + ROTATION ) ||
                     e.isSupported( PROPERTY, OPERA + transform ) ||
                     e.isSupported( PROPERTY, MS_TEST ) ) );
        },
        fingerprint: 'net.easy-designs.' + TRANSFORM + O_PAREN + ROTATE + C_PAREN
      },
      false,
      run
    );  
    
    function run( selector, properties, medium )
    {
      var
      UNDEFINED,
      EMPTY       = '',
      style_block = EMPTY,
      transform   = TRANSFORM + COLON + MATRIX,
      radians     = e.isSupported( PROPERTY, OPERA + TRANSFORM + COLON + ROTATION ),
      prefix      = ( e.isSupported( PROPERTY, MOZ + transform ) ||
                      e.isSupported( PROPERTY, WEBKIT + transform ) ||
                      e.isSupported( PROPERTY, KHTML + transform )||
                      e.isSupported( PROPERTY, OPERA + transform ) ),
      is_IE       = e.isSupported( PROPERTY, MS_TEST ),
      prop, degrees, str, rstr, $els;
      
      if ( is_IE &&
           e.methods['MSSetOrigin'] === UNDEFINED )
      {
        
        // should we load jQuery?
        if ( window.jQuery === UNDEFINED )
        {
          e.loadScript('http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js',function(){
            $ = window.jQuery;
            run( selector, properties, medium );
          });
          return;
        }
        
        e.addMethod( 'MSSetOrigin', function( el, x, y ){
          // set the filter
          Utils.addToMatrix( el, {
            'Dx': x,
            'Dy': y 
          });
        });
        
        // create the rotation function
        e.addMethod( 'MSRotate', function( el, degrees ){
          var
          $el    = $( el ),
          TOP    = 'top',
          LEFT   = 'left',
          PX     = 'px',
          AUTO   = 'auto',
          HEIGHT = 'height',
          POS    = 'position',
          REL    = 'relative',
          BC     = 'background-color',
          original_height = $el.height(),
          original_width  = $el.width(),
          radians         = Utils.degreesToRadians( degrees ),
          costheta        = Math.cos( radians ),
          sintheta        = Math.sin( radians ),
          vertical_offset, horizontal_offset, top, left;
          // give the element some layout
          el.contentEditable = true;
          // set the filter
          Utils.addToMatrix( el, {
            'M11': costheta,
            'M12': -sintheta,
            'M21': sintheta,
            'M22': costheta,
            'SizingMethod': 'auto expand'
          });
          vertical_offset   = original_height - $el.height();
          horizontal_offset = $el.width() - original_width;
          if ( $el.css(POS) == 'static' )
          {
            $el.css({
              position:     REL,
              top:          vertical_offset + PX,
              left:         horizontal_offset + PX
            });
          }
          else
          {
            top  = $el.css(TOP);
            left = $el.css(LEFT);
            $el.css({
              top:  ( vertical_offset + parseInt( top != AUTO ? top : 0, 10 ) ) + PX,
              left: ( horizontal_offset + parseInt( left != AUTO ? left : 0, 10 ) ) + PX
            });
          }
          if ( $el.css(POS) == REL )
          {
            $el.css('margin-bottom',$el.css(TOP));
          }
          // no background makes IE look odd
          if ( $el.css(BC) == 'transparent' )
          {
            $el.css(BC,$el.parent().css(BC));
          }
        });
        
      }
      
      if ( is_IE )
      {
        $els = $( selector );
      }
      
      // capture the value
      degrees = parseInt( properties[TRANSFORM].replace( /rotate\((-?\d+)deg\)/, '$1' ), 10 );
      for ( prop in properties )
      {
        if ( prefix || radians )
        {
          if ( prop == TRANSFORM )
          {
            str  = TRANSFORM + COLON + ROTATE + O_PAREN + degrees + DEGREES + C_PAREN + SEMICOL;
            rstr = str.replace( /-?\d+deg/, Utils.degreesToRadians( degrees ) + RADIANS );
          }
          else
          {
            str = rstr = prop + COLON + properties[prop] + SEMICOL;
          }
          style_block += MOZ + str + WEBKIT + str + KHTML + str + OPERA + rstr;
        }
        // Microsoft
        else if ( is_IE )
        {
          switch ( prop )
          {
            case TRANSFORM:
              $els.each(function(){
                e.methods.MSRotate( this, degrees );
              });
              break;
            case TRANSFORM + '-origin':
              $els.each(function(){
                var
                T      = 'top',
                B      = 'bottom',
                L      = 'left',
                R      = 'right',
                $this  = $( this ),
                height = $this.height(),
                width  = $this.width(),
                coords = properties[prop].split(' '),
                x, y;
                // by default 50% 50%
                // keywords
                if ( coords[0] == T ||
                     parseInt( coords[0], 10 ) == 0 ||
                     coords[1] == T )
                {
                  x = 0;
                }
                else if ( coords[0] == B ||
                          coords[1] == B )
                {
                  x = width;
                }
                // percentage
                else if ( coords[0].match(/\d+?%/) )
                {
                  x = width * ( 100 / parseInt( coords[0], 10 ) );
                }
                // pixels
                else if ( coords[0].match(/\d+?px/) )
                {
                  x = parseInt( coords[0], 10 );
                }
                // default (50%)
                else
                {
                  x = width / 2;
                }
                // keywords
                if ( coords[0] == L ||
                     coords[1] == L ||
                     parseInt( coords[1], 10 ) == 0 )
                {
                  y = 0;
                }
                else if ( coords[0] == R ||
                          coords[1] == R )
                {
                  y = height;
                }
                // percentage
                else if ( coords[1].match(/\d+?%/) )
                {
                  y = height * ( 100 / parseInt( coords[1], 10 ) );
                }
                // pixels
                else if ( coords[1].match(/\d+?px/) )
                {
                  y = parseInt( coords[1], 10 );
                }
                // default (50%)
                else
                {
                  y = height / 2;
                }
                e.methods.MSSetOrigin( this, x, y );
              });
              break;
          }
          
        }
      }

      if ( style_block != EMPTY )
      {
        e.embedCSS( selector + ' { ' + style_block + '} ', medium );
      }

    }
  }
  
  // Microsoft stuff
  Utils = {
    degreesToRadians: function( degrees )
    {
      return degrees * ( Math.PI * 2 / 360 );
    },
    addToMatrix: function( el, additions )
    {
      var
      FALSE = false,
      params = el.style.filter.replace( /.*?Microsoft\.Matrix\(([^\)]+)\)/, '$1' ).split(','),
      param, i,
      str = 'progid:DXImageTransform.Microsoft.Matrix(';
      if ( el.style.filter != '' )
      {
        i = params.length;
        while ( i-- )
        {
          param = params[i].split('=');
          if ( additions[param[0]] !== undefined &&
               additions[params[i][0]] != FALSE )
          {
            str += this.getParamString( param[0], additions[param[0]] );
            additions[param[0]] = FALSE;
          }
          else
          {
            str += this.getParamString( param[0], param[1] );
          }
        }
      }
      for ( param in additions )
      {
        if ( ! e.isInheritedProperty( additions, param ) )
        {
          str += this.getParamString( param, additions[param] );
        }
      }
      str = str.substring( 0, str.length-1 ) + ')';
      el.style.filter   = str;
      el.style.msfilter = str;
    },
    getParamString: function( property, value )
    {
      var
      type = typeof( value ),
      str  = property + '=';
      if ( type.toLowerCase() == 'number' )
      {
        str += value;
      }
      else
      {
        str += "'" + value + "'";
      }
      return str + ',';
    }
  };
      
})();