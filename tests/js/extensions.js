// single string selector
eCSStender.register(
  {'selector': 'h1'},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'single string selector lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// single string selector in array
eCSStender.register(
  {'selector': ['h1']},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'single string selector in array lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// compound string selector
eCSStender.register(
  {'selector': 'h1, abbr'},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'compound string selector lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// compound string selector in array
eCSStender.register(
  {'selector': ['h1', 'abbr']},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'compound string selector in array lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// RegExp selector
eCSStender.register(
  {'selector': /\s*?h1\s*?/},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'RegExp selector lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// RegExp selector in array
eCSStender.register(
  {'selector': [/\s*?h1\s*?/]},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'RegExp selector in array lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// Function selector
eCSStender.register(
  {'selector': new Function('return (this.match(/\s*?h1\s*?/)!==null);')},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'Function selector lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// Function selector in array
eCSStender.register(
  {'selector': [new Function('return (this.match(/\s*?h1\s*?/)!==null);')]},
  '*',
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'Function selector in array lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('h1')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity===1, 'specificity is correct' );
    });
  });

// property
eCSStender.register(
  {'property': 'border-radius'},
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'property lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['border-radius']=='10px 5px 20px 10px / 0.5', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// property in array
eCSStender.register(
  {'property':['border-radius']},
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'property in array lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['border-radius']=='10px 5px 20px 10px / 0.5', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// property fragment
eCSStender.register(
  {'fragment': 'radius'},
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'fragment lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['border-radius']=='10px 5px 20px 10px / 0.5', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// prefix
eCSStender.register(
  {'prefix': 'easy'},
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'prefix lookup', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['-easy-extended-property']=='foo', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// filter: property name
eCSStender.register(
  {
    'fragment': 'radius',
    'filter': {
      'property': /border-radius/
    }
  },
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'property lookup filtered by property', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['border-radius']=='10px 5px 20px 10px / 0.5', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// filter: property value
eCSStender.register(
  {
    'property': '-easy-extended-property',
    'filter': {
      'value': 'foo'
    }
  },
  false,
  function( selector, properties, media, specificity ){
    module('Extension Tests');

    test( 'property lookup filtered by value', function(){
      ok( typeof( selector )!='undefined', 'selector is passed' );
      ok( typeof( selector )=='string', 'selector is a string' );
      ok( selector.indexOf('#sidebar')!=-1, 'selector is correct' );
      ok( typeof( properties )!='undefined', 'properties are passed' );
      ok( typeof( properties )=='object', 'properties is an object' );
      var i=0;
      for ( var prop in properties )
      {
        if ( !eCSStender.isInheritedProperty( properties, prop ) ){ i++; }
      }
      equals( 1, i, 'only lookup property is returned' );
      ok( properties['-easy-extended-property']=='foo', 'property value is correct' );
      ok( typeof( media )!='undefined', 'media is passed' );
      ok( typeof( media )=='string', 'media is a string' );
      ok( media=='screen', 'media is correct' );
      ok( typeof( specificity )!='undefined', 'specificity is passed' );
      ok( typeof( specificity )=='number', 'specificity is a number' );
      ok( specificity==100, 'specificity is correct' );
    });
  });

// callback redefinition
(function(){
  var
  redefinition_count_1 = 0,
  redefinition_count_2 = 0;
  eCSStender.register(
    { selector: 'body,h1' },
    '*',
    function( selector, properties )
    {
      redefinition_count_1++;
      return function( selector, properties ){
        redefinition_count_2++;
      };
    });
  eCSStender.onComplete(function(){
    module('Extension Tests');
    test( 'Callback redefinition', function(){
      ok( redefinition_count_1===1, 'original extension callback ran only once' );
      ok( redefinition_count_2===redefinition_count_1, 'callback successfully redefined itself' );
    });
  });
})();

// this should never trigger
eCSStender.register(
  {'selector': 'h1 h2'},
  '*',
  function( selector, properties, media ){
    module('Extension Tests');

    test( 'never trigger', function(){
      ok( false, 'it was triggered' );
    });
  });
