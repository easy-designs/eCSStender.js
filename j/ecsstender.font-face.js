/*------------------------------------------------------------------------------
Function:       eCSStender.font-face.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2009-10-09
Version:        0.2
Homepage:       http://github.com/easy-designs/eCSStender.font-face.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){
  
  var
  
  // keywords
  FALSE = false,
  TRUE  = true,
  NULL  = null,
  UNDEFINED,
  
  // aliases
  e;
  
  if ( typeof eCSStender == UNDEFINED ){ return; }
  e = eCSStender;
  
  e.onComplete(function(){
    var 
    
    // strings
    EMPTY = '',
    SPACE = ' ',
    SEMIC = '; ',
    PRCNT = '%',

    // patterns
    regexp_pattern =  /url\(\s*['"]?([^'"\s)]*)['"]?\s*\)/,
    font_pattern   = '@font-face { % } ',
    url_pattern    = "url('%')",
    format_pattern = "format('%')",
    
    // supported formats
    formats = {
      eot: FALSE,
      ttf: 'truetype',
      otf: 'opentype',
      svg: 'svg'
    },
    svg_id = e.methods.svg_id || FALSE,
    
    // font parsing vars
    fonts  = e.fonts,
    count  = fonts.length,
    files  = [],
    exist  = [],
    i, j,
    
    // XMLHttpRequest
    checking = FALSE,
    __xhr    = new XHR();
    __xhr.onreadystatechange = checkFiles;
    
    init();
        
    function init()
    {
      var font, src, format;
      for ( i=j=0; i<count; i++ )
      {
        font = fonts[i];
        src  = font.src.replace( regexp_pattern, '$1' );
        // now test each version
        for ( format in formats )
        {
          if ( e.isInheritedProperty( formats, format ) ){ continue; }
          files[j++] = src + '.' + format;
        }
      }
      i=0;
      checkFiles();
    }
    function checkFiles()
    {
      var file, status;
      if ( ! checking )
      {
        if ( file = files[--j] )
        {
          checking = TRUE;
          __xhr.open( 'HEAD', file, FALSE );
          __xhr.send( NULL );
        }
        else
        {
          files = exist.join(' ');
          writeCSS();
        }
      }
      else
      {
        if ( __xhr.readyState == 4 )
        {
          checking = FALSE;
          status = __xhr.status;
          if ( status >= 200 && 
               ( status < 300 || status == 304 ) )
          {
            exist[i++] = files[j];
          }
          checkFiles();
        }
      }
    }
    function writeCSS()
    {
      var 
      contents, prop,
      font, src,
      file,
      format,
      styles = EMPTY;

      // go through the fonts in the system
      for ( i=0; i<count; i++ )
      {
        contents = [];
        font     = fonts[i];
        src      = font.src.replace( regexp_pattern, '$1' );
        // add the local block
        font.src = [ "local('" + font['font-family'] + "')" ];
        // now test each version
        for ( format in formats )
        {
          if ( e.isInheritedProperty( formats, format ) ){ continue; }
          file = src + '.' + format;
          if ( files.indexOf( file ) > -1 )
          {
            if ( format == 'eot' )
            {
              contents.push('src: ' + url_pattern.replace( PRCNT, file ) + SEMIC);
            }
            else
            {
              if ( format == 'svg' &&
                   svg_id != EMPTY )
              {
                file += '#' + svg_id;
              }
              font.src.push( url_pattern.replace( PRCNT, file ) +
                             ( formats[format] != FALSE ? SPACE + format_pattern.replace( PRCNT, formats[format] )
                                                        : EMPTY ) );
            }
          }
        }
        font.src = font.src.join(', ');
        // write in the properties
        for ( prop in font )
        {
          if ( e.isInheritedProperty( font, prop ) ){ continue; }
          contents.push( prop + ': ' + font[prop] + SEMIC );
        }
        styles += font_pattern.replace( PRCNT, contents.join('') );
      }
      e.embedCSS( styles );
    }
    function XHR()
    {
      var connection;
      try { connection = new XMLHttpRequest(); }
      catch( e ){
        try { connection = new ActiveXObject('Msxml2.XMLHTTP'); }
        catch( e ){
          try { connection = new ActiveXObject('Microsoft.XMLHTTP'); }
          catch( e ){
            connection = FALSE;
          }
        }
      }
      return ( ! connection ) ? NULL : connection;
    }
    
  });
  
})();