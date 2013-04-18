/*------------------------------------------------------------------------------
Function:       eCSStender.transitions.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2010-05-31
Version:        0.1
Homepage:       http://github.com/easy-designs/eCSStender.transitions.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){
  
  if ( typeof eCSStender == 'undefined' ){ return; }
  
  var
  e = eCSStender,
  // Extensions
  T = new Transition( e );

  // Objects
  function Transition( e )
  { 
    
    var
    PROPERTY   = 'property',
    MOZ        = '-moz-',
    WEBKIT     = '-webkit-',
    KHTML      = '-khtml-',
    OPERA      = '-o-',
    MSFT       = '-ms-',
    SPACE      = ' ',
    COLON      = ': ',
    SEMICOL    = '; ',
    TRANSITION = 'transition-duration',
    HALF_SEC   = COLON + '0.5s';
    
    e.register(
      { fragment: 'transition',
        test:     function()
        {
          var test = TRANSITION + HALF_SEC;
          return ( ! e.isSupported( PROPERTY, test ) /* &&
                   Removed because Opera doesn't actually expose the -o-transition stuff via
                   getComputedStyle, therefore isSupported always returns false
                   ( e.isSupported( PROPERTY, MOZ + test ) ||
                     e.isSupported( PROPERTY, WEBKIT + test ) ||
                     e.isSupported( PROPERTY, KHTML + test ) ||
                     e.isSupported( PROPERTY, OPERA + test ) ||
                     e.isSupported( PROPERTY, MSFT + test ) ) */ );
        },
        fingerprint: 'net.easy-designs.' + TRANSITION
      },
      false,
      apply
    );  
    
    function apply( selector, properties, medium )
    {
      var style_block = '', value;

      for ( var prop in properties )
      {
        if ( e.isInheritedProperty( properties, prop ) ) { continue; };
        value = prop + COLON + properties[prop] + SEMICOL;
        style_block += MOZ + value + WEBKIT + value + KHTML + value + OPERA + value + MSFT + value;
      }

      if ( style_block != '' )
      {
        e.embedCSS( selector + ' { ' + style_block + ' } ', medium );
      }

    }
    
  }
    
})();