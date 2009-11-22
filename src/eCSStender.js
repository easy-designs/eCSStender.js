/*------------------------------------------------------------------------------
Function:       eCSStender()
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2006-12-03
Version:        1.0.1
Homepage:       http://eCSStender.org
License:        MIT License (see homepage)
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/

(function(){
  
  var

  // common references
  UNDEFINED,
  TRUE     = true,
  FALSE    = false,
  NULL     = null,
  STRING   = 'string',
  NUMBER   = 'number',
  ARRAY    = Array,
  FUNCTION = Function,
  REGEXP   = RegExp,
  LOCATION = window.location.href,
  
  // Common Strings
  ECSSTENDER  = 'eCSStender',
  EXTENSION   = 'extension',
  SELECTOR    = 'selector',
  PROPERTY    = 'property',
  SPECIFICITY = 'specificity',
  ALL         = 'all',
  MEDIA       = 'media',
  FIND_BY     = 'find_by',
  TEST        = 'test',
  LOOKUP      = 'lookup',
  FRAGMENT    = 'fragment',
  PREFIX      = 'prefix',
  PROPERTIES  = 'properties',
  CALLBACK    = 'callback',
  FILTER      = 'filter',
  PROCESSED   = 'processed',
  FINGERPRINT = 'fingerprint',
  PIPES       = '||||',
  
  // placeholders
  PH_ATMEDIA = '!' + ECSSTENDER + '-media-placeholder!',
  
  // internals
  __eCSStensions  = {}, // eCSStensions for parsing
  __e_count       = 0,  // count of registered extensions
  __t_count       = 0,  // count of triggered extensions
  __stylesheets   = [], // stylesheets to parse
  __style_objects = {}, // style rules to track
  __media_groups  = {},
  __xhr           = NULL,
  __initialized   = FALSE,
  __ignored_css   = [],
  __ignored_props = [ SELECTOR, SPECIFICITY ],
  __location      = LOCATION.replace( /^\w+:\/\/\/?(.*?)\/.*/, '$1' ),
  __local         = ( LOCATION.indexOf('http') !== 0 ),
  __delayed       = {}, // delayed stylesheets to write
  __on_complete   = [],
  
  // for embedding stylesheets
  __head         = FALSE,
  __style        = document.createElement( 'style' ),
  __embedded_css = [],
  
  // caching
  __modified    = {},
  __no_cache    = FALSE,
  __cached_out  = FALSE,
  __local_cache = {
    xhr:       {},
    extension: {},
    selector:  {},
    property:  {}
  },
  __headers = {},
  __cache_object,
  readFromBrowserCache = function(){},
  writeToBrowserCache = function(){},
  clearBrowserCache = function(){},
  
  // useful RegExps
  __re = {
    // for breaking on commas
    c: /\s*,\s*/,
    // for getting file names
    f: /.*\/(.*?\..*?)(?:\?.*)?$/,
    // for determining if it's a fully-executed path
    u: /\w+?\:\/\//,
    // for finding @font-face, @page & @media
    t: /@font-face\s*?{(.*?)\s*?}/ig,
    p: /@page\s*?(:\w*?){0,1}{\s*?(.*?)\s*?}/ig,
    m: /@media\s*(.*?)\s*{(.*?})}/ig,
    // extended @ rules
    a: /@([\w-]+)(.*?){([^}]*)}/ig,
    // for splitting properties from values
    s: /:(?!\/\/)/,
    // for generating safe keys from selectors
    k: /[:()]/g
  },
  
  // eCSStender Object
  eCSStender = {
    name:      ECSSTENDER,
    version:   '1.0.2',
    fonts:     [],
    pages:     {},
    at:        {},
    methods:   {},
    cache:     FALSE,
    exec_time: 0
  };
  
  // window object
  window.eCSStender = eCSStender;

  /*------------------------------------*
   * Private Methods                    *
   *------------------------------------*/
  function initialize()
  {
    if ( __initialized == TRUE ){ return; }
    __initialized = TRUE;
    // performance logging
    var started = now();
    // need the head
    __head = document.getElementsByTagName( 'head' )[0];
    // innards
    readBrowserCache();
    getActiveStylesheets();
    parseStyles();
    validateCache();
    runTests();
    eCSStend();
    triggerCallbacks();
    writeBrowserCache();
    // performance logging
    eCSStender.exec_time = ( now() - started ) * .001;
    triggerOnCompletes();
  }
  function getActiveStylesheets()
  {
    var stylesheets = document.styleSheets, s, sLen;
    for ( s=0, sLen=stylesheets.length; s<sLen; s++ )
    {
      // add the stylesheet
      addStyleSheet( stylesheets[s] );
    }
  }
  function parseStyles()
  {
    var s, sLen, media, m, mLen, path, css;
    for ( s=0, sLen=__stylesheets.length; s<sLen; s++ )
    {
      // determine the media type
      media = determineMedia( __stylesheets[s] );
      media = media.split(__re.c);
      createMediaContainers( media );
      // get the stylesheet contents via XHR as we can't safely procure them from cssRules
      path = determinePath( __stylesheets[s] );
      css  = clean( path !== NULL ? get( path ) : extract( __stylesheets[s] ) );
      css  = extractAtBlocks( css );
      // handle remaining rules
      extractStyleBlocks( media, css );
    }
  }
  function validateCache()
  {
    if ( __local ){ return; }
    // check the xhr headers against what we read from the cache
    var key, cached = __local_cache.xhr, i=j=0;
    eCSStender.cache = TRUE;
    for ( key in __modified )
    {
      i++;
      if ( isInheritedProperty( __modified, key ) ||
           __modified[key] == NULL ){ continue; }
      j++;
      if ( cached[key] == UNDEFINED ||
           cached[key] != __modified[key] )
      {
        eCSStender.cache = FALSE;
      }
      // update the cache
      __local_cache.xhr[key] = __modified[key];
    }
    if ( i>j ){ eCSStender.cache = FALSE; }
  }
  function runTests()
  {
    if ( eCSStender.cache ){ return; }
    var temp = {}, e, count=0, test;
    for ( e in __eCSStensions )
    {
      if ( isInheritedProperty( __eCSStensions, e ) ) { continue; }
      extension_test = __eCSStensions[e][TEST];
      // verify test (if any)
      if ( extension_test == UNDEFINED ||
           ( is( extension_test, FUNCTION ) &&
             extension_test() == TRUE ) )
      {
        // if no test or test is passed, push to the temp array
        temp[e] = __eCSStensions[e];
        count++;
      }
    }
    // reset the __eCSStensions array
    __eCSStensions = temp;
    __e_count = count;
  }
  function eCSStend()
  {
    // see if there's anything to do
    if ( __e_count < 1 ){ return; }
    var
    medium, styles, sorted_styles, s, sLen, selector,
    eLoop, e, e_media, e_lookup, e_find_by,
    lookups, l, lLen, temp, t, lookup,
    property;
    // no cache
    if ( ! eCSStender.cache )
    {
      // parse by medium
      for ( medium in __style_objects )
      {
        // safety for users who are using Prototype or any code that extends Object
        if ( isInheritedProperty( __style_objects, medium ) ) { continue; }
        // start the processing in earnest      
        styles = __style_objects[medium];
        sorted_styles = getSortedArray( styles );
        for ( s=0, sLen=sorted_styles.length; s<sLen; s++ )
        {
          selector = sorted_styles[s][SELECTOR];
          // loop the extensions
          eLoop:
          for ( e in __eCSStensions )
          {
            // safety for users who are using Prototype or any code that extends Object
            if ( isInheritedProperty( __eCSStensions, e ) ) { continue; }
            e_media = __eCSStensions[e][MEDIA];
            // verify any media restrictions
            if ( e_media != UNDEFINED &&
                 e_media != ALL )
            {
              e_media = e_media.split(__re.c);
              if ( medium != ALL &&
                   ! in_object( medium, e_media ) ){
                continue;
              }
            }
            e_find_by = __eCSStensions[e][FIND_BY];
            e_lookup  = __eCSStensions[e][LOOKUP];
            lLen = e_lookup.length;
            // eCSStension is triggered by a selector 
            if ( e_find_by == SELECTOR )
            {
              for ( l=0; l<lLen; l++ )
              {
                if ( selectorMatches( selector, e_lookup[l] ) )
                {
                  trackCallback( e, medium, selector );
                  continue eLoop;
                }
              }
            }
            // eCSStension uses a property
            else if ( e_find_by == PROPERTY )
            {
              for ( l=0; l<lLen; l++ )
              {
                if ( styles[selector][e_lookup[l]] != UNDEFINED )
                {
                  trackCallback( e, medium, selector );
                  continue eLoop;
                }
              }
            }
            // eCSStension uses a fragment or prefix
            else if ( e_find_by == FRAGMENT ||
                      e_find_by == PREFIX )
            {
              lookup = ( e_find_by == FRAGMENT ) ? '.*?' + e_lookup + '.*?'
                                                   : '-' + e_lookup + '-.*';
              lookup = new RegExp( lookup );
              for ( property in styles[selector] )
              {
                if ( ! isInheritedProperty( styles, selector ) && // fix for tainted Object
                     ! in_object( property, __ignored_props ) &&
                     property.match( lookup ) )
                {
                  trackCallback( e, medium, selector );
                  continue eLoop;
                }
              }
            } // end if eCSStension uses a fragment or prefix
          } // end eCSStensions loop
        } // end styles loop
      } // end medium loop
    }
  }
  // log callbacks
  function trackCallback( fingerprint, medium, selector )
  {
    var selector_id = medium + PIPES + selector;
    writeToLocalCache( EXTENSION, EXTENSION + ( __t_count++ ), fingerprint + PIPES + selector_id, FALSE );
  }
  // callback functionality
  function triggerCallbacks()
  {
    var s, e, extension, style_rule, selector_id, properties, specificity, oLen;
    for ( s=0; s<__t_count; s++ )
    {
      e = __local_cache[EXTENSION][EXTENSION+s].split(PIPES);
      extension   = __eCSStensions[e[0]];
      style_rule  = __style_objects[e[1]][e[2]];
      selector_id = e[1] + PIPES + e[2];
      if ( extension == UNDEFINED ||
           in_object( selector_id, extension[PROCESSED] ) ) { continue; }
      // apply any filters
      if ( extension[FILTER] != UNDEFINED )
      {
        if ( ! filtersMatched( style_rule, extension[FILTER] ) ){
          continue;
        }
      }
      specificity = ( ! eCSStender.cache ) ? style_rule[SPECIFICITY]
                                           : getSpecificity( e[2] );
      properties = extractProperties( e[1], e[2], extension[PROPERTIES] );
      extension[CALLBACK]( e[2], properties, e[1], specificity );
      extension[PROCESSED].push( selector_id );
    }
  }
  function triggerOnCompletes()
  {
    for ( var o = __on_complete.length-1; o >= 0; o-- )
    {
      __on_complete[o]();
    }
  }

  /*------------------------------------*
   * Private Utils                      *
   *------------------------------------*/
  function findImportedStylesheets( stylesheet )
  {
    var blocks, imports, i, iLen;
    // IE
    if ( stylesheet.imports != UNDEFINED )
    {
      imports = stylesheet.imports;
      for ( i=0, iLen=imports.length; i<iLen; i++ )
      {
        // add the stylesheet
        addStyleSheet( imports[i] );
      }
    }
    // W3C
    else
    {
      blocks = stylesheet.cssRules || stylesheet.rules;
      for ( i=0, iLen=blocks.length; i<iLen; i++ )
      {
        // imports must come first, so when we don't find one, return
        if ( blocks[i].type != '3' ){ return; }
  
        // add the stylesheet
        addStyleSheet( blocks[i].styleSheet );
      }
      // no need to XHR stylesheets that only import other stylesheets
      if ( i === iLen )
      {
        __ignored_css.push( stylesheet.href.replace( __re.f, '$1' ) );
      }
    }
  }
  function addStyleSheet( stylesheet )
  {
    var href = stylesheet.href;
    // skip if disabled
    if ( stylesheet.disabled ||
         ( href !== NULL &&
             // or foreign
           ( determinePath( stylesheet ).indexOf( __location ) == -1 ||
             // or ignored
             in_object( href.replace( __re.f, '$1' ), __ignored_css ) ) ) ){ return; }
    // does it have imports?
    findImportedStylesheets( stylesheet );
    // push the current stylesheet to the collection
    __stylesheets.push( stylesheet );
  }
  function getSortedArray( styles )
  {
    var arr = [], temp, selector;
    for ( selector in styles )
    {
      // fix for tainated Object
      if ( isInheritedProperty( styles, selector ) ) { continue; }
      // continue
      temp = styles[selector];
      temp[SELECTOR]    = selector;
      temp[SPECIFICITY] = getSpecificity( selector );
      arr.push( temp );
    }
    arr.sort( sortBySpecificity );
    return arr;
  }
  function sortBySpecificity( a, b )
  {
    var x = a[SPECIFICITY], y = b[SPECIFICITY];
    return ( ( x < y ) ? -1 : ( ( x > y ) ? 1 : 0 ) );
  }
  function getSpecificity( selector )
  {
    var s = 0, matches;
    // replace all child and adjascent sibling selectors
    selector = selector.replace( /\s*\+\s*|\s*\>\s*/, ' ' );
    // adjust :not() to simplify calculations (since it counts toward specificity, as do its contents)
    selector = selector.replace( /(:not)\((.*)\)/, '$1 $2' );
    // match id selectors (weight: 100)
    matches = selector.match( /#/ );
    if ( matches != NULL ) s += ( matches.length * 100 );
    selector = selector.replace( /#[\w-_]+/, '' ); // remove (to keep the regexs simple)
    // match class, pseudo-class, and attribute selectors (weight: 10)
    matches = selector.match( /::|:|\.|\[.*?\]/ );
    if ( matches != NULL ) s += ( matches.length * 10 );
    selector = selector.replace( /(?:::|:|\.)[\w-_()]+|\[.*?\]/, '' ); // remove
    // match element selectors (weight: 1) - they should be all that's left
    matches = trim( selector ) != '' ? selector.split(' ') : [];
    s += matches.length;
    return s;
  }
  function determinePath( stylesheet )
  {
    var
    css_path = stylesheet.href, curr_path, file_name, parent = NULL, parent_path = prefix = '';
    // we only want paths that
    if ( css_path != NULL &&                         // are not NULL
         css_path.indexOf('/') != 0 &&               // don't start with a slash
         ( css_path.match(__re.u) == NULL || // that are not fully-qualified files
           css_path.match(__re.u) < 1 ) )
    {
      curr_path = LOCATION.substring( 0, LOCATION.lastIndexOf('/') );
      file_name = css_path.substring( css_path.lastIndexOf('/') + 1 );
      // check for an owner
      if ( stylesheet.parentStyleSheet == NULL )
      {
        if ( stylesheet.ownerNode != UNDEFINED &&
             CSSImportRule != UNDEFINED &&
             is( stylesheet.ownerRule, CSSImportRule ) )
        {
          parent = stylesheet.ownerRule.parentStyleSheet;
        }
      }
      else
      {
        parent = stylesheet.parentStyleSheet;
      }
      // no parent, use the css path itself
      if ( parent == NULL )
      {
        prefix = curr_path + '/' + css_path.substring( 0, css_path.lastIndexOf('/') );
      }
      // get the owner's path
      else
      {
        parent_path = determinePath( parent );
        prefix      = parent_path.substring( 0, parent_path.lastIndexOf('/') );
      }
      css_path = prefix + '/' + file_name;
    }
    return css_path;
  }
  function determineMedia( stylesheet )
  {
    var
    media = stylesheet.media,
    owner = stylesheet.ownerRule;
    // W3C compliant
    if ( ! is( media, STRING ) )
    {
      // imported
      if ( owner != NULL )
      {
        // media assignment in the import
        if ( owner.media.mediaText != '' )
        {
          return owner.media.mediaText;
        }
        // no media assignment... inherit
        else
        {
          return determineMedia( owner.parentStyleSheet );
        }
      }
      // media is defined
      if ( media.mediaText != '' )
      {
        return media.mediaText;
      }
    }
    // old school
    else if ( is( media, STRING ) &&
              media != '')
    {
      return media;
    }
    // default = all
    return ALL;
  }
  function extractAtBlocks( css )
  {
    // extract @font-face
    css = extractFonts( css );
    // extract @page
    css = extractPages( css );
    // handle @media
    css = handleMediaGroups( css );
    // extract other @ rules
    css = extractOtherAtRules( css );
    // return the string
    return css;
  }
  function extractFonts( css )
  {
    var match;
    while ( ( match = __re.t.exec( css ) ) != NULL )
    {
      eCSStender.fonts.push( gatherProperties( match[1] ) );
    }
    return css.replace( __re.t, '' );
  }
  function extractPages( css )
  {
    var match, page, props;
    while ( ( match = __re.p.exec( css ) ) != NULL )
    {
      page = ( match[1] != UNDEFINED &&
               match[1] != '' ) ? match[1].replace(':','')
                                : ALL;
      props = gatherProperties( match[2] );
      if ( eCSStender.pages[page] == UNDEFINED )
      {
        eCSStender.pages[page] = props;
      }
      else
      {
        for ( prop in props )
        {
          if ( isInheritedProperty( props, prop ) ) { continue; }
          eCSStender.pages[page][prop] = props[prop];
        }
      }
      
    }
    return css.replace( __re.p, '' );
  }
  function handleMediaGroups( css )
  {
    var match, media, m, mLen, styles, id = 0;
    while ( ( match = __re.m.exec( css ) ) != NULL )
    {
      css = collapseAtMedia( css, match, id );
      id++;
    }
    return css;
  }
  function extractOtherAtRules( css )
  {
    var match, group, keys, k, props, prop;
    while ( ( match = __re.a.exec( css ) ) != NULL )
    {
      group = match[1];
      keys  = trim( match[2] );
      keys  = ( keys == '' ) ? FALSE : keys.split(__re.c);
      props = gatherProperties( match[3] );
      if ( eCSStender.at[group] == UNDEFINED )
      {
        eCSStender.at[group] = ! keys ? addPush( [] ) : {};
      }
      if ( ! keys )
      {
        eCSStender.at[group].push( props );
      }
      else
      {
        k = keys.length-1;
        while ( k > -1 )
        {
          if ( eCSStender.at[group][keys[k]] == UNDEFINED )
          {
            eCSStender.at[group][keys[k]] = props;
          }
          else
          {
            for ( prop in props )
            {
              if ( isInheritedProperty( props, prop ) ) { continue; }
              eCSStender.at[group][keys[k]][prop] = props[prop];
            }
          }
          k--;
        }
      }
    }
    return css.replace( __re.a, '' );
  }
  function collapseAtMedia( css, match, id )
  {
    media  = match[1].split(__re.c);
    styles = match[2];
    createMediaContainers( media );
    __media_groups[id] = {
      media: media,
      styles: styles
    };
    return css.replace( match[0], PH_ATMEDIA + '{id:' + id + '}' );
  }
  function expandAtMedia( id )
  {
    var media_group = __media_groups[id];
    extractStyleBlocks( media_group.media, media_group.styles );
    __media_groups[id] = NULL;
  }
  function extractStyleBlocks( media, css )
  {
    // parse it into blocks & remove the last item (which is empty)
    var blocks = css.split('}'), b, bLen, props, prop, selector, m, medium, arr, a, aLen;
    blocks.pop();
    // loop
    for ( b=0, bLen=blocks.length; b<bLen; b++ )
    {
      // separate the selector and the properties
      blocks[b] = blocks[b].split('{');
      // gather the properties
      props = gatherProperties( blocks[b][1] );
      // build the selectors (which are part of the master object)
      selector = blocks[b][0];
      
      // single selector
      if ( selector.indexOf( PH_ATMEDIA ) != -1 )
      {
        expandAtMedia( props.id );
      }
      else
      {
        arr = selector.split(__re.c);
        for ( a=0, aLen=arr.length; a<aLen; a++ )
        {
          selector = trim( arr[a] );
          for ( m in media )
          {
            if ( isInheritedProperty( media, m ) ) { continue; }
            medium = media[m];
            if ( __style_objects[medium][selector] == UNDEFINED )
            {
              __style_objects[medium][selector] = {};
            }
            for ( prop in props )
            {
              if ( isInheritedProperty( props, prop ) ) { continue; }
              __style_objects[medium][selector][prop] = props[prop];
            }
          }
        }
      }
    }
  }
  function gatherProperties( properties )
  {
    if ( ! is( properties, STRING ) ){ return {}; }
    properties = properties.split(';');
    var props = {}, p, pLen, arr, property;
    for ( p=0, pLen=properties.length; p<pLen; p++ )
    {
      property = trim( properties[p] );
      // skip empties
      if ( property == '' ){ continue; }
      arr = property.split(__re.s);
      props[trim(arr[0])] = trim( arr[1] );
    }
    return props;
  }
  function determineProperties( lookup, requested_properties )
  {
    var properties = [], property, fragment, prefix, i, iLen;
    // properties is set
    if ( requested_properties !== FALSE )
    {
      // user doesn't want everything
      if ( requested_properties != '*' )
      {
        // gather requested properties
        if ( is( requested_properties, STRING ) )
        {
          properties.push( requested_properties );
        }
        else if ( is( requested_properties, ARRAY ) )
        {
          for ( i=0, iLen=requested_properties.length; i<iLen; i++ )
          {
            properties.push( requested_properties[i] );
          }
        }
      }
      else
      {
        properties = requested_properties;
      }
    }
    // now for the remainder
    if ( requested_properties != '*' )
    {
      // retrieve properties that were explicitly looked up
      property = lookup[PROPERTY];
      fragment = lookup[FRAGMENT];
      prefix   = lookup[PREFIX];
      if ( property != UNDEFINED )
      {
        if ( is( property, STRING ) )
        {
          properties.push( property );
        }
        else if ( is( property, ARRAY ) )
        {
          for ( i=0, iLen=property.length; i<iLen; i++ )
          {
            properties.push( property[i] );
          }
        }
      }
      // retrieve fragment matches
      else if ( fragment != UNDEFINED )
      {
        properties.push( new RegExp( '.*?' + fragment + '.*?' ) );
      }
      // retrieve prefix matches
      else if ( prefix != UNDEFINED )
      {
        properties.push( new RegExp( '-' + prefix + '-.*' ) );
      }
    }
    return properties;
  }
  function extractProperties( medium, selector, requested_properties )
  {
    var requested_property, property, properties = {}, p, pLen,
    style_rule = __style_objects[medium][selector];
    // grab the requested properties
    if ( is( requested_properties, ARRAY ) )
    {
      for ( p=0, pLen=requested_properties.length; p<pLen; p++ )
      {
        requested_property = requested_properties[p];
        if ( is( requested_property, REGEXP ) )
        {
          for ( property in style_rule )
          {
            if ( ! isInheritedProperty( style_rule, property ) && // fix for tainted Object
                 ! in_object( property, __ignored_props ) &&
                 property.match( requested_property ) != NULL )
            {
              properties[property] = style_rule[property];
            }
          }
        }
        else if ( is( requested_property, STRING ) &&
                  style_rule[requested_property] != UNDEFINED )
        {
          properties[requested_property] = style_rule[requested_property];
        }
      }
    }
    // all properties (*)
    else
    {
      for ( property in style_rule )
      {
        if ( ! isInheritedProperty( style_rule, property ) &&
             ! in_object( property, __ignored_props ) )
        {
          properties[property] = style_rule[property];
        }
      }
    }
    return properties;
  }
  function arrayify( something )
  {
    var arr=[], i, iLen, temp, t, tLen;
    if ( ! is( something, ARRAY ) )
    {
      if ( is( something, STRING ) &&
           something.indexOf(',') != -1 )
      {
        temp = something.split( __re.c );
        for ( i=0, iLen=temp.length; i<iLen; i++ )
        {
          arr.push( temp[i] );
        }
      }
      else
      {
        arr = [ something ];
      }
    }
    else
    {
      for ( i=0, iLen=something.length; i<iLen; i++ )
      {
        if ( is( something[i], STRING ) &&
            something[i].indexOf(',') != -1 )
        {
          temp = something[i].split( __re.c );
          for ( t=0, tLen=temp.length; t<tLen; t++ )
          {
            arr.push( temp[t] );
          }
        }
        else
        {
          arr.push( something[i] );
        }
      }
    }
    return arr;
  }
  function createMediaContainers( media )
  {
    if ( ! is( media, ARRAY ) )
    {
      media = ( media + '' ).split(__re.c);
    }
    for ( var m=0, mLen=media.length; m<mLen; m++ )
    {
      if ( __style_objects[media[m]] == UNDEFINED )
      {
        __style_objects[media[m]] = {};
      }
    }
  }
  function selectorMatches( selector, test )
  {
    var useless = /\*(?!\s|>|\+)/g;
    return ( ( is( test, REGEXP ) &&
               selector.match( test ) != NULL ) ||
             ( is( test, FUNCTION ) &&
               test.call( selector ) === TRUE ) ||
             ( is( test, STRING ) &&
               selector.indexOf( trim( test.replace( useless, '' ) ) ) != -1 ) );
  }
  function filtersMatched( properties, filters )
  {
    var count, required_count, prop, filter;
    for ( prop in properties )
    {
      if ( isInheritedProperty( properties, prop ) ||
           in_object( prop, __ignored_props ) ){ continue; }
      count = required_count = 0;
      for ( filter in filters )
      {
        if ( isInheritedProperty( filters, filter ) ){ continue; }
        required_count++;
        if ( filter == PROPERTY )
        {
          if ( prop.match( filters[filter] ) ){ count++; }
        }
        else if ( filter == 'value' )
        {
          if ( properties[prop].match( filters[filter] ) ){ count++; }
        }
      }
      if ( count == required_count ){ return TRUE; }
    }
    return FALSE;
  }
  function clean( css )
  {
    css = css.replace( /\s*(?:\<\!--|--\>)\s*/g, '' ) // strip HTML comments
             .replace( /\/\*(?:.|\s)*?\*\//g, '' )    // strip CSS comments
             .replace( /\s*([,{}:;])\s*/g, '$1' )     // remove returns and indenting whitespace
             .replace( /@import.*?;/g, '' );          // axe imports
    return css;
  }
  function in_object( needle, haystack )
  {
    for ( var key in haystack )
    {
      if ( haystack[key] == needle ){ return TRUE; }
    }
    return FALSE;
  }
  function now()
  {
    return new Date().getTime();
  }
  function is( obj, test )
  {
    var r = FALSE;
    try
    {
      r = obj instanceof test;
    }
    catch( e )
    {
      r = ( typeof( test ) == STRING &&
            typeof( obj ) == test );
    }
    return r;
  }
  function charAt( str )
  {
    return String.fromCharCode( str );
  }
  function get( uri )
  {
    if ( uri == NULL ||
         in_object( uri.replace( __re.f, '$1' ), __ignored_css ) ){ return ''; }
    if ( __xhr == NULL ){ __xhr = new XHR(); }
    __xhr.open( 'GET', uri, FALSE );
    __xhr.send( NULL );
    __modified[fingerprint(uri)] = __xhr.getResponseHeader('Last-Modified');
    return __xhr.responseText;
  }
  function extract( stylesheet )
  {
    return stylesheet.ownerNode.innerHTML;
  }
  function camelize( str ){
    var
    bits = str.split('-'), len  = bits.length, new_str, i = 1;
    if ( len == 1 ) { return bits[0]; } 
    if ( str.charAt(0) == '-' ) {
      new_str = bits[0].charAt(0).toUpperCase() + bits[0].substring(1);
    } else {
      new_str = bits[0];
    }
    while ( i < len ) {
      new_str += bits[i].charAt(0).toUpperCase() + bits[i].substring(1);
      i++;
    }
    return new_str;
  }
  function zero_out( str )
  {
    if ( is( str, STRING ) )
    {
      str = str.replace( /(\s0)px/g, '$1' );
    }
    return str;
  }
  function addInlineStyle( el, property, value )
  {
    try {
      el.style[property] = value;
      el.style[camelize( property )] = value;
    } catch( e ){
      return FALSE;
    }
    return TRUE;
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
  // push handling
  function addPush( arr )
  {
    return arr;
  }
  if ( Array.prototype.push == NULL )
  {
    var push = function( obj )
    {
      this[this.length] = obj;
      return this.length;
    };
    eCSStender.fonts.push = __eCSStensions.push = __stylesheets.push = __embedded_css.push = __on_complete.push = push;
    addPush = function( arr )
    {
      if ( typeof( arr ) == ARRAY )
      {
        arr.push = push;
      }
      return arr;
    }
  }
  
  /*-------------------------------------*
   * Delayed Writing
   *-------------------------------------*/
  function writeStyleSheets()
  {
    var id, style;
    for ( id in __delayed )
    {
      if ( isInheritedProperty( __delayed, id ) ){ continue; }
      style = document.getElementById( id );
      addRules( style, __delayed[id] );
      // style.disabled = FALSE;
    }
  }
  __on_complete.push( writeStyleSheets );
  
  /*-------------------------------------*
   * Caching
   *-------------------------------------*/
  function enableCache()
  {
    // HTML5 and/or Mozilla
    if ( window.localStorage != UNDEFINED )
    {
      __cache_object = window.localStorage;
      clearBrowserCache = function()
      {
        __cache_object.clear();
      };
      readFromBrowserCache = function( cache, key )
      {
        return __cache_object.getItem( cache + '-' + key );
      };
      writeToBrowserCache = function( cache, key, value )
      {
        __cache_object.setItem( cache + '-' + key, value );
      };
    }
    // IE (old school)
    else
    {
      var div = document.createElement('div');
      div.style.behavior = 'url(#default#userData)';
      document.body.appendChild(div);
      if ( div.XMLDocument != UNDEFINED )
      {
        __cache_object = div;
        readFromBrowserCache = function( group, key )
        {
          __cache_object.load( ECSSTENDER );
          return __cache_object.getAttribute( group + '-' + key );
        };
        writeToBrowserCache = function( group, key, value )
        {
          __cache_object.load(ECSSTENDER);
          __cache_object.setAttribute( group + '-' + key, value );
          __cache_object.save(ECSSTENDER);
        };
      }
    }
  }
  function readBrowserCache()
  {
    if ( __no_cache || __local ){ return; }
    enableCache();
    var cache_group, item, count;
    for ( cache_group in __local_cache )
    {
      if ( isInheritedProperty( __local_cache, cache_group ) ||
           cache_group == UNDEFINED ){ continue; }
      count = readFromBrowserCache( ECSSTENDER, cache_group + '-count' );
      if ( count != UNDEFINED )
      {
        if ( cache_group == EXTENSION )
        {
          __t_count = count;
          if ( count < 1 ){ eCSStender.cache = FALSE; }
        }
        while ( count >= 0 )
        {
          item = readFromBrowserCache( cache_group, count );
          if ( item != NULL )
          {
            if ( cache_group == EXTENSION )
            {
              __local_cache[cache_group][EXTENSION+count] = item;
            }
            else
            {
              item = item.split(PIPES);
              __local_cache[cache_group][item[0]] = item[1];
            }
          }
          count--;
        }
      }
    }
  }
  function writeBrowserCache()
  {
    if ( __no_cache || __local ){ return; }
    var cache_group, key, count, extension;
    for ( cache_group in __local_cache )
    {
      if ( isInheritedProperty( __local_cache, cache_group ) ||
           cache_group == UNDEFINED ){ continue; }
      count = 0;
      for ( key in __local_cache[cache_group] )
      {
        if ( isInheritedProperty( __local_cache[cache_group], key ) ||
             cache_group == UNDEFINED ){ continue; }
        if ( cache_group == EXTENSION )
        {
          extension = __local_cache[cache_group][key];
          extension[PROCESSED] = [];
          writeToBrowserCache( cache_group, count, extension );
        }
        else 
        {
          writeToBrowserCache( cache_group, count, key + PIPES + __local_cache[cache_group][key] );
        }
        count++;
      }
      writeToBrowserCache( ECSSTENDER, cache_group + '-count', count );
    }
    __cached_out = TRUE;
  }
  function styleObjToString( obj )
  {
    var str = '', key;
    for ( key in obj )
    {
      if ( isInheritedProperty( obj, key ) ){ continue; }
      str += key + ':' + obj[key] + ';'
    }
    return str;
  }
  function stringToStyleObj( str )
  {
    var matches, obj = FALSE;
    if ( ( matches = str.exec( /^{(.*?)}$/ ) ) != NULL )
    {
      obj = gatherProperties( matches[1] );
    }
    return obj;
  }
  function fingerprint( str )
  {
    // UTF8 encode
    str = str.replace(/\r\n/g,'\n');
    var 
    keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    i, iLen = str.length, newstr = '', c1, c2, c3, e1, e2, e3, e4;
    for ( i=0; i<iLen; i++ )
    {
      c1 = str.charCodeAt(i);
      if ( c1 < 128 )
      {
    		newstr += charAt( c1 );
    	}
    	else if ( (c1 > 127) && (c1 < 2048) )
    	{
    		newstr += charAt( (c1 >> 6) | 192 );
    		newstr += charAt( (c1 & 63) | 128 );
    	}
    	else
    	{
    		newstr += charAt( (c1 >> 12) | 224 );
    		newstr += charAt( ((c1 >> 6) & 63) | 128 );
    		newstr += charAt( (c1 & 63) | 128 );
    	}
		}
		str = newstr;
		newstr = '';
		// base64
		i = 0;
		iLen = str.length;
    while ( i < iLen )
    {
      c1 = str.charCodeAt(i++);
      c2 = str.charCodeAt(i++);
      c3 = str.charCodeAt(i++);
       
      e1 = c1 >> 2;
      e2 = ((c1 & 3) << 4) | (c2 >> 4);
      e3 = ((c2 & 15) << 2) | (c3 >> 6);
      e4 = c3 & 63;

      if ( isNaN(c2) )
      {
      	e3 = e4 = 64;
      }
      else if ( isNaN(c3) )
      {
      	e4 = 64;
      }
      newstr += keystr.charAt(e1) + keystr.charAt(e2) +
                keystr.charAt(e3) + keystr.charAt(e4);
    }
    return newstr;
  }
  function writeToLocalCache( group, key, value, encode )
  {
    encode = ( encode == UNDEFINED ) ? TRUE : encode;
    if ( encode !== FALSE ){
      key = fingerprint(key);
    }
    __local_cache[group][key] = value;
    if ( __cached_out )
    {
      writeToBrowserCache( group, key, value );
    }
  }
  function readFromLocalCache( group, key, encode )
  {
    encode = ( encode == UNDEFINED ) ? TRUE : encode;
    if ( encode !== FALSE ){
      key = fingerprint(key);
    }
    var value = __local_cache[group][key];
    return ( value != UNDEFINED ) ? value : UNDEFINED;
  }

  /*-------------------------------------*
   * Public Methods                      *
   *-------------------------------------*/
  /**
   * eCSStender::register()
   * registers an extension
   *
   * @param obj keys - define the lookup; supports the following properties:
   *  * Mutually exclusive lookup methods:
   *    * 'fragment' (str) - a portion of the property to look up
   *    * 'prefix' (str) - to lookup by vendor-specific prefix
   *    * 'property' (mixed)
   *      * to lookup by property, use a string
   *      * to lookup by multiple, use an array of strings
   *    * 'selector' (mixed) - to find by selector; accepts
   *      * compound selectors in a string, separated by commas
   *      * a RegExp to match
   *      * an array of selector strings or RegExp objects to match
   *  * 'filter' (obj) - allows you to filter the lookup results by property name or value
   *    * 'property' (mixed) - string or regex to match for the extension to apply
   *    * 'value' (mixed) - string or regex to match for the extension to apply
   *  * 'media' (str) - restricts the media to which you want to
   *    restrict the extension
   *  * 'test' (fn) - a test function to run that will determine 
   *     whether or not the extension should run; should return 
   *     TRUE if the extension SHOULD run, FALSE if it SHOULD NOT.
   *  * 'fingerprint' (str) - a unique ID for the extension (not required)
   * @param mixed properties - the properties you want back; supports for:
   *  * FALSE - returns only the looked-up property or properties with 
   *    the given fragment or prefix
   *  * '*' (str) - returns all properties of the selected elements
   *  * single property (str) - returns the supplied property
   *  * multiple properties (arr) - returns the requested properties
   * @param fn callback - the function to be called when the extension 
   *                      finds a subject
   */
  eCSStender.register = function( keys, properties, callback )
  {
    var eCSStension = {}, lookups, l, temp, t, props=[], key, id='';
    // set the lookup type
    if ( keys[SELECTOR] != UNDEFINED )
    {
      eCSStension[FIND_BY] = SELECTOR;
      eCSStension[LOOKUP]  = keys[SELECTOR];
    }
    else if ( keys[PROPERTY] != UNDEFINED )
    {
      eCSStension[FIND_BY] = PROPERTY;
      eCSStension[LOOKUP]  = keys[PROPERTY];
    }
    else if ( keys[FRAGMENT] != UNDEFINED )
    {
      eCSStension[FIND_BY] = FRAGMENT;
      eCSStension[LOOKUP]  = keys[FRAGMENT];
    }
    else if ( keys[PREFIX] != UNDEFINED )
    {
      eCSStension[FIND_BY] = PREFIX;
      eCSStension[LOOKUP]  = keys[PREFIX];
    }
  
    // convert some lookups to arrays to simplify things later on
    if ( eCSStension[FIND_BY] == SELECTOR ||
         eCSStension[FIND_BY] == PROPERTY )
    {
      eCSStension[LOOKUP] = arrayify( eCSStension[LOOKUP] );
    }

    // filter?
    if ( keys[FILTER] != UNDEFINED )
    {
      eCSStension[FILTER] = keys[FILTER];
    }
  
    // media restriction?
    if ( keys[MEDIA] != UNDEFINED )
    {
      eCSStension[MEDIA] = keys[MEDIA];
    }
  
    // test first?
    if ( keys[TEST] != UNDEFINED )
    {
      eCSStension[TEST] = keys[TEST];
    }
  
    // set the properties to capture
    eCSStension[PROPERTIES] = determineProperties( keys, properties );
    
    // create the fingerprint
    if ( keys[FINGERPRINT] == UNDEFINED )
    {
      for ( key in eCSStension )
      {
        if ( isInheritedProperty( eCSStension, key ) ){ continue; }
        id += key + ':' + eCSStension[key].toString() + ';';
      }
      id = fingerprint(id+'::'+__e_count);
    }
    else
    {
      id = keys[FINGERPRINT];
    }

    // set the callback
    eCSStension[CALLBACK] = callback;
    // create the processed array
    eCSStension[PROCESSED] = [];
    // save the extension
    __eCSStensions[id] = eCSStension;
    __e_count++;
  }

  /**
   * eCSStender::lookup()
   * looks up and returns styles based on the supplied info
   *
   * @param obj lookup - define the lookup; supports the following properties:
   *  * Mutually exclusive lookup methods:
   *    * FRAGMENT (str) - a portion of the property to look up
   *    * PREFIX (str) - to lookup by vendor-specific prefix
   *    * PROPERTY (mixed)
   *      * to lookup by property, use a string
   *      * to lookup by multiple, use an array of strings
   *    * SELECTOR (mixed) - to find by selector; accepts
   *      * compound selectors in a string, separated by commas
   *      * a RegExp to match
   *      * an array of selector strings or RegExp objects to match
   *      * a function that returns TRUE for a positive match
   *  * MEDIA (str) - restricts the media within which you want to search
   *  * SPECIFICITY (mixed) - the desired specificity parameters
   *    * if an integer, implies maximum specificity
   *    * if an object, use keys to set the thresholds:
   *      * 'max' (int) - maximum specificity to match
   *      * 'min' (int) - minimum specificity to match
   * @param mixed properties - the properties you want back; support for:
   *  * FALSE - returns only the looked-up property or properties with 
   *    the given fragment or prefix
   *  * '*' (str) - returns all properties of the selected elements
   *  * single property (str) - returns the supplied property
   *  * multiple properties (arr) - returns the requested properties
   * 
   * @return arr of style objects, each with the following keys:
   *  * 'medium'      - the medium of the match
   *  * PROPERTIES  - the properties requested
   *  * SELECTOR    - the selector matched
   *  * SPECIFICITY - the specificity of the selector
   */
  eCSStender.lookup = function( lookup, properties )
  {
    var
    l_specificity = lookup[SPECIFICITY],
    l_selector    = lookup[SELECTOR],
    l_property    = lookup[PROPERTY],
    l_fragment    = lookup[FRAGMENT],
    l_prefix      = lookup[PREFIX],
    l_media       = lookup[MEDIA],
    min, max,
    medium, e_media,
    sLoop, styles, sorted_styles,
    s, sLen, selector, found,
    i, iLen, test, matches = [];
    // figure out specificity params
    if ( l_specificity != UNDEFINED )
    {
      if ( is( l_specificity, NUMBER ) )
      {
        max = l_specificity;
        min = 0;
      }
      else if ( is( l_specificity, 'object' ) )
      {
        max = l_specificity['max'];
        min = l_specificity['min'];
      }
    }
    // make the selector setup consistent
    if ( l_selector != UNDEFINED )
    {
      l_selector = arrayify( l_selector );
    }
    else if ( l_property != UNDEFINED )
    {
      l_property = arrayify( l_property );
    }
    // figure out properties to return
    props = determineProperties( lookup, properties );
    // loop
    for ( medium in __style_objects )
    {
      // safety for users who are using Prototype or any code that extends Object
      if ( isInheritedProperty( __style_objects, medium ) ){ continue; }
      
      // verify any media restrictions
      if ( l_media != UNDEFINED &&
           l_media != ALL )
      {
        e_media = l_media.split(__re.c);
        if ( medium != ALL &&
             ! in_object( medium, e_media ) )
        {
          continue;
        }
      }
      // start the processing in earnest      
      styles        = __style_objects[medium];
      sorted_styles = getSortedArray( styles );
      sLoop:
      for ( s=0, sLen=sorted_styles.length; s<sLen; s++ )
      {
        // check the selector
        selector = sorted_styles[s][SELECTOR];
        block    = styles[selector];
        if ( l_selector != UNDEFINED )
        {
          found = FALSE;
          for ( i=0, iLen=l_selector.length; i<iLen; i++ )
          {
            if ( selectorMatches( selector, l_selector[i] ) )
            {
              found = TRUE;
              break;
            }
          }
          if ( found === FALSE )
          {
            continue;
          }
        }
        // check properties
        else if ( l_property != UNDEFINED )
        {
          found = FALSE;
          for ( i=0, iLen=l_property.length; i<iLen; i++ )
          {
            if ( block[l_property[i]] != UNDEFINED )
            {
              found = TRUE;
              break;
            }
          }
          if ( found === FALSE )
          {
            continue;
          }
        }
        // check fragments, and/or prefixes
        else if ( l_fragment != UNDEFINED ||
                  l_prefix != UNDEFINED )
        {
          found = FALSE;
          test = ( l_fragment != UNDEFINED ) ? '.*?' + l_fragment + '.*?'
                                             : '-' + l_prefix + '-.*';
          test = new RegExp( test );
          for ( property in block )
          {
            if ( ! isInheritedProperty( styles, selector ) && // fix for tainted Object
                 ! in_object( property, __ignored_props ) &&
                 property.match( test ) )
            {
              found = TRUE;
              break;
            }
          }
          if ( found === FALSE )
          {
            continue;
          }
        }
        // check the specificity
        if ( l_specificity != UNDEFINED )
        {
          if ( block[SPECIFICITY] < min ||
               block[SPECIFICITY] > max )
          {
            continue;
          }
        }
        // if you made it this far, you passed the tests
        matches.push({
          medium:      medium,
          properties:  extractProperties( medium, selector, props ),
          selector:    selector,
          specificity: block[SPECIFICITY]
        });
      } // end styles loop
    } // end medium loop
    
    // back what we found
    return matches;
    
  }

  /**
   * eCSStender::addMethod()
   * sets a custom JavaScript method in eCSStender's methods object
   *
   * @param str name - a name for the method
   * @param func the_function - the function to store
   */
  eCSStender.addMethod = function( name, the_function )
  {
    if ( eCSStender.methods[name] == UNDEFINED )
    {
      eCSStender.methods[name] = the_function;
    }
  }

  /**
   * eCSStender::onComplete()
   * adds a function to be called on completion of eCSStender's run
   *
   * @param func the_function - the function to store
   */
  eCSStender.onComplete = function( the_function )
  {
    __on_complete.push( the_function );
  }

  /**
   * eCSStender::embedCSS()
   * embeds styles to the appropriate media
   *
   * @param str styles - the styles to embed
   * @param str media  - the media to apply the stylesheet to (optional)
   * @param bool delay - whether or not to delay the writing of the stylesheet (default = true)
   * 
   * @return obj - the STYLE element
   */
  eCSStender.embedCSS = function( styles, media, delay )
  {
    // determine the medium
    media = media || ALL;
    // determine whether to delay the write or not
    delay = ( delay != UNDEFINED ) ? delay : TRUE;
    // determine the id
    var id = 'eCSStension-' + media, style;
    // find or create the embedded stylesheet
    if ( ! in_object( media, __embedded_css ) )
    {
      // make the new style element
      style = newStyleElement( media, id, delay );
      // store the medium
      __embedded_css.push( media );
    }
    else
    {
      style = document.getElementById( id );
    }
    // add the rules to the sheet
    if ( style != NULL )
    {
      if ( ! delay )
      {
        addRules( style, styles );
      }
      else
      {
        __delayed[id] += styles;
      }
    }
    // return the style element
    return style;
  }

  /**
   * eCSStender::newStyleElement()
   * adds a new stylesheet to the document
   *
   * @param str media  - the media to apply the stylesheet to
   * @param str id     - the id to give the stylesheet (optional)
   * @param bool delay - whether or not to delay the writing of the stylesheet (default = true)
   * 
   * @return obj - the STYLE element
   */
  function newStyleElement( media, id, delay )
  {
    // clone the model style element
    var style = __style.cloneNode( TRUE );
    // set the media type & id
    media = media || ALL;
    style.setAttribute( MEDIA, media );
    id = id || 'temp-' + Math.round( Math.random() * 2 + 1 );
    style.setAttribute( 'id', id );
    // determine whether to delay the write or not
    delay = ( delay != UNDEFINED ) ? delay : TRUE;
    if ( delay )
    {
      __delayed[id] = '';
      //style.disabled = TRUE;
    }
    __head.appendChild( style );
    // return the element reference
    return style;
  }
  eCSStender.newStyleElement = newStyleElement;

  /**
   * eCSStender::addRules()
   * adds rules to a specific stylesheet
   *
   * @param obj el     - the stylesheet
   * @param str styles - the style rules to add
   */
  __style.setAttribute( 'type', 'text/css' );
  if ( __style.sheet != UNDEFINED &&
       CSSStyleSheet != UNDEFINED &&
       __style.sheet instanceof CSSStyleSheet )
  {
    if ( __style.sheet.insertRule instanceof FUNCTION )
    {
      addRules = function( el, styles )
      {
        el.sheet.insertRule( styles, el.sheet.cssRules.length );
      }
    }
    else
    {
      addRules = function( el, styles )
      {
        var blocks = styles.split('}'), b, bLen;
        blocks.pop();
        for ( b=0, bLen=blocks.length; b<bLen; b++ )
        {
          blocks[b] = blocks[b].split('{');
          el.sheet.addRule( trim( blocks[b][0] ), trim( blocks[b][1] ) );
        }
      }
    }
  }
  else if ( __style.styleSheet != UNDEFINED )
  { 
    addRules = function( el, styles )
    {
      el.styleSheet.cssText += styles;
    }
  }
  else
  {
    addRules = function( el, styles )
    { 
      el.appendChild( document.createTextNode( styles ) ); 
    }
  }
  eCSStender.addRules = addRules;

  /**
   * eCSStender::isSupported()
   * tests support for properties and selectors
   *
   * @param str type - PROPERTY or SELECTOR
   * @param str what - the property:value pair or the selector in question
   * @param obj html - the HTML to test against (used by selector test)
   * @param obj el   - the element the selector should select (used by selector test)
   * 
   * @return bool - TRUE for success, FALSE for failure
   */
  eCSStender.isSupported = function( type, what, html, el )
  {
    var result,
    body = document.body,
    expando = document.expando,
    // property test vars
    property, value, expando = TRUE, settable = TRUE,
    compute = window.getComputedStyle,
    // selector test vars
    style;
    if ( ( result = readFromLocalCache( type, what ) ) != UNDEFINED )
    {
      return result;
    }
    else
    {
      result = FALSE;
      if ( type == PROPERTY )
      {
        // test element
        el = document.createElement('div');
        body.appendChild( el );
        what = what.split(__re.s);
        property  = what[0];
        value     = trim( what[1] );
        what = what.join(':');
        if ( expando != UNDEFINED )
        {
          document.expando = FALSE;
        }
        if ( ! addInlineStyle( el, property, value ) )
        {
          settable = FALSE;
        }
        if ( expando != UNDEFINED )
        {
          document.expando = expando;
        }
        if ( settable == TRUE &&
             ( el.currentStyle &&
               zero_out( el.currentStyle[camelize( property )] ) == value ) ||
             ( compute &&
               zero_out( compute( el, NULL ).getPropertyValue( property ) ) == value ) )
        {
          result = TRUE;
        }
        // cleanup
        body.removeChild( el );
        el = NULL;
      }
      else if ( type == SELECTOR )
      {
        // append the test markup and the test style element
        body.appendChild( html );
        style = newStyleElement( 'screen', false, false );
        // if the browser doesn't support the selector, it should error out
        try {
          addRules( style, what + " { visibility: hidden; }" );
          // if it succeeds, we don't want to run the eCSStension
          if ( ( el.currentStyle &&
                 el.currentStyle['visibility'] == 'hidden' ) ||
               ( compute &&
                 compute( el, NULL ).getPropertyValue( 'visibility' ) == 'hidden' ) )
          {
            result = TRUE;
          }
        } catch( e ){}
        // cleanup
        body.removeChild( html );
        style.parentNode.removeChild( style );
        style = NULL;
      }
      writeToLocalCache( type, what, result );
      return result;
    }
  }

  /**
   * eCSStender::applyWeightedStyle()
   * apply a weighted inline style (based on specificity)
   *
   * @param obj el - the element to apply the property to
   * @param obj properties - a hash of the properties to assign
   * @param int specificity - the specificity of the selector
   */
  eCSStender.applyWeightedStyle = function( el, properties, specificity )
  {
    if ( el.inlineStyles == UNDEFINED )
    {
      el.inlineStyles = {};
    }
    var prop, styles = el.inlineStyles;
    for ( prop in properties )
    {
      if ( ! isInheritedProperty( properties, prop ) &&
           ( styles[prop] == UNDEFINED ||
             styles[prop] <= specificity ) )
      {
        addInlineStyle( el, prop, properties[prop] );
        el.inlineStyles[prop] = specificity;
      }
    }
  }

  /**
   * eCSStender::ignore()
   * tells eCSStendet to ignore a file or files
   *
   * @param mixed sheets - a string or array of stylesheet paths to ignore
   */
  eCSStender.ignore = function( sheets )
  {
    if ( is( sheets, STRING ) )
    {
      sheets = [ sheets ];
    }
    else if ( ! is( sheets, ARRAY ) )
    {
      return;
    }
    for ( var i=0, iLen=sheets.length; i<iLen; i++ )
    {
      __ignored_css.push( sheets[i] );
    }
  }

  /**
   * eCSStender::disableCache()
   * tells eCSStender not to cache or work from the cache
   */
  eCSStender.disableCache = function()
  {
    __no_cache = TRUE;
  }

  /**
   * eCSStender::trim()
   * trims a string
   *
   * @param str str - the string to trim
   * 
   * @return str - the trimmed string
   */
  function trim( str )
  {
    if ( is( str, STRING ) )
    {
      return str.replace( /^\s+|\s+$/g, '' );
    }
    return str;
  }
  eCSStender.trim = trim;

  /**
   * eCSStender::isInheritedProperty()
   * tests whether the given property is inherited
   *
   * @param obj obj - the object to test
   * @param str prop - the property to look for
   * 
   * @return bool - TRUE is property is inherited, FALSE is it isn't
   */
  function isInheritedProperty( obj, prop )
  {
    var c = obj.constructor;
    if ( c &&
         c.prototype )
    { 
      return obj[prop] === c.prototype[prop];
    } 
    return TRUE;
  }
  eCSStender.isInheritedProperty = isInheritedProperty;


  /*-------------------------------------*
   * DOM Loaded Trigger                  *
   * Based on jQuery's                   *
   *-------------------------------------*/
  (function(){
    var
    d = document,
    DCL = 'DOMContentLoaded',
    ORC = 'onreadystatechange',
    __old_onload = window.onload;
    
    // for Mozilla/Safari/Opera9
  	if ( document.addEventListener )
    {
      document.addEventListener( DCL, function(){
        document.removeEventListener( DCL, arguments.callee, FALSE );
        initialize();
      }, FALSE );
    }
    // If IE event model is used
  	else if ( document.attachEvent )
  	{
  		// ensure firing before onload, maybe late but safe also for iframes
  		document.attachEvent( ORC, function(){
  			if ( document.readyState === "complete" ) {
  				document.detachEvent( ORC, arguments.callee );
  				initialize();
  			}
  		});

  		// If IE and not an iframe, continually check to see if the document is ready
  		if ( document.documentElement.doScroll &&
  		     window == window.top )
  		{
  		  (function(){
  			  try {
      			// If IE is used, use the trick by Diego Perini
      			// http://javascript.nwbox.com/IEContentLoaded/
      			document.documentElement.doScroll("left");
      		}
      		catch( error )
      		{
      			setTimeout( arguments.callee, 0 );
      			return;
      		}
          // and execute any waiting functions
  			  initialize();
  		  })();
  	  }
  	}
  })();
  
})();