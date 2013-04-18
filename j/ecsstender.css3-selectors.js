/*------------------------------------------------------------------------------
Function:       eCSStender.css3-selectors.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2009-09-17
Version:        0.3
Homepage:       http://github.com/easy-designs/eCSStender.css3-selectors.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(e){
  
  if ( typeof e == 'undefined' ){ return; }
  
  var
  // aliases
  $         = e.methods.findBySelector,
  supported = e.isSupported,
  embedCSS  = e.embedCSS,
  style     = e.applyWeightedStyle,
  embed     = function( selector, properties, medium )
  {
    var style_block = EMPTY, prop;
    for ( prop in properties )
    {
      if ( e.isInheritedProperty( properties, prop ) ) { continue; };
      style_block += prop + COLON + properties[prop] + SEMICOL;
    }
    if ( style_block != EMPTY )
    {
      embedCSS( selector + CURLY_O + style_block + CURLY_C, medium );
    }
  },
  inline    = function( selector, properties, medium, specificity )
  {
    if ( notScreen( medium ) ){ return; }
    try {
      var
      $els = $( selector ),
      i    = $els.length;
      while ( i-- )
      {
        style( $els[i], properties, specificity );
      }
    } catch(e) {
      // throw new Error( LIB_ERROR + selector );
    }
  },
  eFunc    = function(){},
  // methods
  notScreen = function( medium )
  {
    return medium != 'screen';
  },
  cleanNth  = function( selector )
  {
    return selector.replace( re_nth, '$1$2$3$4$5' );
  },
  // Event stuff
  // Based on John Resig's work
  addEvent    = function( el, evt, handler )
  {
    if ( el.addEventListener )
    {
      addEvent = function( el, evt, handler )
      {
        el.addEventListener( evt, handler, false );
      };
    }
    else
    {
      addEvent = function( el, evt, handler )
      {
        var E = 'e';
        el[E+evt+handler] = handler;
        el[evt+handler]   = function(){
          var e =  window.event;
          e.target = e.srcElement;
          e.preventDefault = function(){
            this.returnValue = false;
          };
          e.stopPropagation = function(){
            this.cancelBubble = true;
          };
          el[E+evt+handler]( e );
        };
        el.attachEvent( 'on'+evt, el[evt+handler] );
      };
    }
    addEvent( el, evt, handler );
  },
  // strings
  EASY        = 'net.easy-designs.',
  SELECTOR    = 'selector',
  PROPERTIES  = 'properties',
  SPECIFICITY = 'specificity',
  CLICK       = 'click',
  EVERYTHING  = '*',
  EMPTY       = '',
  CURLY_O     = '{',
  CURLY_C     = '}',
  PAREN_O     = '(',
  PAREN_C     = ')',
  COLON       = ':',
  SEMICOL     = ';',
  HYPHEN      = '-',
  DOT         = '.',
  LIB_ERROR   = 'Your chosen selector library does not support this selector: ',
  // Regular Expressions
  re_nth      = /(.*\()\s*(?:(\d+n?|odd|even)\s*(\+|-)?\s*(\d+)?)\s*(\).*)/g,
  // elements
  div   = document.createElement('div'),
  para  = document.createElement('p');
  
  // define our selector engine or die
  if ( ! ( $ instanceof Function ) )
  {
    throw new Error('eCSStender.methods.findBySelector is not defined. eCSStender.css3-selectors.js is quitting.');
  }
  
  // CLASSES
  // compound class selection (no other class selections seem to be an issue)
  e.register(
    { fingerprint: EASY + 'compound-class-selector',
      selector: /(?:\.\S+){2,}/,
      test:     function(){
        // the markup
        var
        d = div.cloneNode(true),
        p = para.cloneNode(true);
        p.className = 'foo';
        d.appendChild( p );
        // the test
        return ( supported( SELECTOR, 'div p.bar.foo', d, p ) );
      }
    },
    EVERYTHING,
    function( selector, properties, medium, specificity ){
      // we need to invert the selection and get anything without the first class
      var
      regex   = /((?:\.\S+){2,})/,
      classes = selector.replace( regex, '$1' ),
      false_positive, matches, j;
      // get the classes
      classes = classes.split('.');
      classes.shift();
      false_positive = classes.pop();
      // re-apply all affected styles
      matches = e.lookup( 
        {
          selector:    new RegExp( '\\.' + false_positive ),
          specificity: specificity,
          media:       medium
        },
        EVERYTHING
      );
      for ( j=0; j<matches.length; j++ )
      {
        inline( matches[j][SELECTOR], matches[j][PROPERTIES], medium, matches[j][SPECIFICITY] );
      }
    }
  );

  // PSEUDO CLASSES
  // attribute selectors
  (function(){
    var
    selectors = ['div p[title]',         // attribute
                 'div p[title="a b-c"]', // attribute value
                 'div p[title*=a]',      // substring
                 'div p[title~=a]',      // contains
                 'div p[title^=a]',      // starts with
                 'div p[title$=c]',      // ends with
                 'div p[title|=c]'],     // part of hyphen-separated list
    i = selectors.length,
    d = div.cloneNode(true),
    p = para.cloneNode(true);
    p.setAttribute('title','a b-c');
    d.appendChild( p );
    while ( i-- )
    {
      (function(selector){
        e.register(
          { fingerprint: EASY + 'attribute-selector-' + i,
            selector: /\[.*\]/,
            test:     function(){
              return ! supported( SELECTOR, selector, d, p );
            }
          },
          EVERYTHING,
          inline
        );
      })(selectors[i]);
    }    
  })();

  // :root
  (function(){
    var
    re_root = /^\s?(?:html)?:root/,
    HTML    = 'html';
    function normal( selector, properties, medium, specificity )
    {
      if ( notScreen(medium) ||
           ! selector.match( re_root ) ){ return; }
      inline( selector, properties, medium, specificity);
    }
    function modified( selector, properties, medium, specificity )
    {
      if ( notScreen(medium) ||
           ! selector.match( re_root ) ){ return; }
      selector = selector.replace( re_root, HTML );
      inline( selector, properties, medium, specificity);
    }
    e.register(
      { fingerprint: EASY + 'root',
        selector: /:root/,
        test:     function(){
          // the markup
          html = document.getElementsByTagName(HTML)[0];
          // the test
          return ( ! supported( SELECTOR, ':root', false, html ) );
        }
      },
      EVERYTHING,
      function( selector, properties, medium, specificity ){
        if ( notScreen(medium) ){ return; }
        var func = normal;
        try {
          $( selector );
        } catch(e) {
          func = modified;
        }
        func( selector, properties, medium, specificity );
        return func;
      }
    );
  })();

  // nth-child
  e.register(
    { fingerprint: EASY + 'nth-child',
      selector: /:nth-child\(\s*(?:even|odd|[+-]?\d+|[+-]?\d*?n(?:\s*[+-]\s*\d*)?)\s*\)/,
      test:     function(){
        // the markup
        var
        d = div.cloneNode(true),
        p = para.cloneNode(true);
        d.appendChild( p );
        // the test
        return ( ! supported( SELECTOR, 'div p:nth-child( 2n + 1 )', d, p ) );
      }
    },
    EVERYTHING,
    function( selector, properties, medium, specificity )
    {
      selector = cleanNth( selector );
      // secondary test to see if the browser just doesn't like spaces in the parentheses
      var
      calc = 'p:nth-child(2n+1)',
      d = div.cloneNode(true),
      p = para.cloneNode(true),
      func = inline;
      d.appendChild( p );
      // embedding is the way to go
      if ( ( supported( SELECTOR, 'p:nth-child(odd)', d, p ) &&
             ! supported( SELECTOR, calc, d, p ) &&
             selector.match( /:nth-child\(\s*(?:even|odd)\s*\)/ ) != null ) ||
           supported( SELECTOR, calc, d, p ) )
      {
        
        func = embed;
      }
      func( selector, properties, medium, specificity );
      return func;
    }
  );

  // :nth-last-child
  e.register(
    { fingerprint: EASY + 'nth-last-child',
      selector: /:nth-last-child\(\s*(?:even|odd|[+-]?\d*?|[+-]?\d*?n(?:\s*[+-]\s*\d*?)?)\s*\)/,
      test:     function(){
        // the markup
        var
        d = div.cloneNode(true),
        p = para.cloneNode(true);
        d.appendChild( p );
        // the test
        return ( ! supported( SELECTOR, 'div p:nth-last-child( 2n + 1 )', d, p ) );
      }
    },
    EVERYTHING,
    function( selector, properties, medium, specificity ){
      selector = cleanNth( selector );
      // secondary test to see if the browser just doesn't like spaces in the parentheses
      var
      calc = 'p:nth-last-child(2n+1)',
      d = div.cloneNode(true),
      p = para.cloneNode(true),
      func = inline;
      d.appendChild( p );
      // embedding is the way to go
      if ( ( supported( SELECTOR, 'p:nth-last-child(odd)', d, p ) &&
             ! supported( SELECTOR, calc, d, p ) &&
             selector.match( /:nth-last-child\(\s*(?:even|odd)\s*\)/ ) != null ) ||
           supported( SELECTOR, calc, d, p ) )
      {
        
        func = embed;
      }
      func( selector, properties, medium, specificity );
      return func;
    }
  );
  
  // :nth-of-type, :nth-last-of-type
  e.register(
    { fingerprint: EASY + 'nth-of-type',
      selector: /:nth-(?:last-)?of-type\(\s*(?:even|odd|[+-]?\d*?|[+-]?\d*?n(?:\s*[+-]\s*\d*?)?)\s*\)/,
      test:     function(){
        // the markup
        var
        d = div.cloneNode(true),
        p = para.cloneNode(true);
        d.appendChild( p );
        // the test
        return ( ! supported( SELECTOR, 'div p:nth-of-type( 2n + 1 )', d, p ) );
      }
    },
    EVERYTHING,
    inline
  );
  
  // :(first|last|only)-child
  (function(){
    var
    selectors = { 'div :first-child': /:first-child/,
                  'div :last-child':  /:last-child/,
                  'div :only-child':  /:only-child/ },
    selector,
    d = div.cloneNode(true),
    p = para.cloneNode(true);
    d.appendChild( p );
    for ( selector in selectors )
    {
      (function( selector, lookup ){
         e.register(
           { fingerprint: EASY + lookup.toString().replace(/[\/:]/g,''),
             selector: lookup,
             test:     function(){
               return ! supported( SELECTOR, selector, d, p );
             }
           },
           EVERYTHING,
           inline
         );
      })( selector, selectors[selector] );
    }
  })();
  
  // :(first|last|only)-of-type
  (function(){
    var
    selectors = { 'div p:first-of-type': /:first-of-type/,
                  'div p:last-of-type':  /:last-of-type/,
                  'div div:only-of-type':  /:only-of-type/ },
    selector,
    d  = div.cloneNode(true),
    d2 = div.cloneNode(true),
    p  = para.cloneNode(true),
    p2 = para.cloneNode(true);
    d.appendChild( p );
    d.appendChild( p2 );
    d.appendChild( d2 );
    for ( selector in selectors )
    {
      (function( selector, lookup ){
         e.register(
           { fingerprint: EASY + lookup.toString().replace(/[\/:]/g,''),
             selector: lookup,
             test:     function(){
               return ! supported( SELECTOR, selector, d, p );
             }
           },
           EVERYTHING,
           inline
         );
      })( selector, selectors[selector] );
    }
  })();
  
  // :empty/:enabled/:disabled
  (function(){
    var
    selectors = { 'div input:empty': /:empty/,
                  'div input:disabled': /:disabled/,
                  'div input:enabled': /:enabled/ },
    selector, inputs, i=0,
    d = div.cloneNode(true);
    d.innerHTML = '<input type="text" disabled="disabled"/><input type="text"/>';
    inputs = d.getElementsByTagName('input');
    for ( selector in selectors )
    {
      (function( selector, lookup ){
         var target = inputs[i];
         e.register(
           { fingerprint: EASY + lookup.toString().replace(/[\/:]/g,''),
             selector: lookup,
             test:     function(){
               return ! supported( SELECTOR, selector, d, target );
             }
           },
           EVERYTHING,
           inline
         );
      })( selector, selectors[selector] );
      i = i == 1 ? 1 : i + 1;
    }
  })();

  // :target
  //(function(){
  //  var
  //  last_tgt  = false,
  //  curr_tgt  = false,
  //  curr_el   = false,
  //  the_class = e.makeUniqueClass(),
  //  toggle    = e.toggleClass;
  //  function target()
  //  {
  //    if ( curr_tgt != last_tgt ){
  //      if ( curr_el )
  //      {
  //        toggle( curr_el, the_class );
  //      }
  //      last_tgt = curr_tgt;
  //      curr_el = document.getElementById( curr_tgt );
  //      if ( curr_el )
  //      {
  //        toggle( curr_el, the_class );
  //      }
  //    }
  //  }
  //  eCSStender.register(
  //    { fingerprint: EASY + 'target',
  //      selector: /:target/,
  //      test:     function(){
  //        // the markup
  //        var
  //        d = div.cloneNode(true),
  //        p = para.cloneNode(true);
  //        d.appendChild( p );
  //        document.expando = false;
  //        // the test
  //        return ( ! supported( SELECTOR, 'div p, div p:target', d, p ) );
  //      }
  //    },
  //    EVERYTHING,
  //    function(){
  //      curr_tgt = window.location.hash;
  //      target();
  //      addEvent( document.body, CLICK, function( event ){
  //        var
  //        el     = event.target,
  //        re     = /^#(\w+)$/;
  //        if ( el.nodeName.toLowerCase() == 'a' &&
  //             el.href &&
  //             el.href.match( re ) )
  //        {
  //          curr_tgt = el.href.replace( re, '$1' );
  //          target();
  //        }
  //      });
  //      function func( selector, properties, medium )
  //      {
  //        var re = /:target/;
  //        selector = selector.replace( re, the_class );
  //        embed( selector, properties, medium );
  //      };
  //      func( selector, properties, medium );
  //      return func;
  //    });
  //})();
  
  // :lang()
  e.register(
    { fingerprint: EASY + 'lang',
      selector: /:lang\(.*\)/,
      test:     function(){
        // the markup
        var
        d = div.cloneNode(true),
        p = para.cloneNode(true);
        p.setAttribute('lang','en');
        d.appendChild( p );
        // the test
        return ( ! supported( 'selector', 'div p:lang(en)', d, p ) );
      }
    },
    EVERYTHING,
    function( selector, properties, medium, specificity )
    {
      var func = inline, $els;
      // fix for selector engines that don't implement lang()
      try {
        $els = $(selector);
      } catch( e ) {
        func = function( selector, properties, medium, specificity )
        {
          selector = selector.replace( /:lang\(([^)]*)\)/, '[lang=$1]' );
          inline( selector, properties, medium, specificity );
        };
      }
      func( selector, properties, medium, specificity );
      return func;
    }
  );

  // :checked
  (function(){
    var
    the_class = e.makeUniqueClass(),
    the_regex = /:checked/,
    classify  = function()
    {
      var
      inputs = document.getElementsByTagName('input'),
      i      = inputs.length;
      while ( i-- )
      {
        if ( inputs[i].checked )
        {
          e.addClass( inputs[i], the_class );
        }
        else
        {
          e.removeClass( inputs[i], the_class );
        }
      }
    };
    e.register(
      { fingerprint: EASY + 'checked',
        selector: the_regex,
        test:     function(){
          var
          d = div.cloneNode(true),
          i;
          d.innerHTML = '<input type="checkbox" checked="checked" />';
          i = d.getElementsByTagName('input')[0];
          return ! supported( SELECTOR, 'div input:checked', d, i );
        }
      },
      EVERYTHING,
      function( selector, properties, medium, specificity ){
        // initialize
        classify();
        // only add the event once
        addEvent( document.body, CLICK, function( e ){
          var el = e.target;
          if ( el.nodeName.toLowerCase() == 'input' &&
               ( el.getAttribute('type') == 'radio' ||
                 el.getAttribute('type') == 'checkbox' ) )
          {
            classify();
          }
        });
        // then switch to embed a modified selector
        function modify( selector, properties, medium, specificity )
        {
          selector = selector.replace( the_regex, DOT + the_class );
          embed( selector, properties, medium );
        }
        modify( selector, properties, medium, specificity );
        return modify;
      });
  })();

  // :first-line/:first-letter/::first-line/::first-letter
  // how do we handle these?

  // :before/:after/::before/::after
  // need a clean element
  // use element height to determine support
  // var
  // d = document.createElement('div'),
  // p = document.createElement('p'),
  // s = document.createElement('style');
  // d.appendChild(p);
  // document.body.appendChild(d);
  // console.log(window.getComputedStyle(d,null).getPropertyValue('height'));
  // s.appendChild(document.createTextNode('p:after{display:block;content:".";height:10px;}'));
  // document.getElementsByTagName('head')[0].appendChild(s);
  // console.log(window.getComputedStyle(d,null).getPropertyValue('height'));

  // :not
  e.register(
    { selector: /:not\([^)]*\)/,
      test:     function(){
        // the markup
        var
        d  = div.cloneNode(true),
        p  = para.cloneNode(true),
        p2 = para.cloneNode(true);
        p.setAttribute('id','no');
        d.appendChild( p );
        d.appendChild( p2 );
        // the test
        return ( ! supported( SELECTOR, 'div p:not(#no)', d, p2 ) );
      }
    },
    EVERYTHING,
    inline
  );
  
  // adjacent siblings
  e.register(
    { selector: function(){
        return ( this.match(/\+/) &&
                 ! this.match( /:nth-(?:last-)?(?:child|of-type)\(\s*(?:even|odd|[+-]?\d*?|[+-]?\d*?n(?:\s*[+-]\s*\d*?)?)\s*\)/ ) );
      },
      test:     function(){
        // the markup
        var
        d  = div.cloneNode(true),
        p  = para.cloneNode(true),
        p2 = para.cloneNode(true);
        d.appendChild( p );
        d.appendChild( p2 );
        // the test
        return ( ! supported( SELECTOR, 'div p + p', d, p2 ) );
      }
    },
    EVERYTHING,
    inline
  );

  // general sibling
  e.register(
    { selector: /~[^=]/,
      test:     function(){
        // the markup
        var
        d  = div.cloneNode(true),
        p  = para.cloneNode(true),
        p2 = para.cloneNode(true),
        p3 = para.cloneNode(true);
        d.appendChild( p );
        d.appendChild( p2 );
        d.appendChild( p3 );
        // the test
        return ( ! supported( SELECTOR, 'div p ~ p', d, p3 ) );
      }
    },
    EVERYTHING,
    inline
  );
  
})(eCSStender);