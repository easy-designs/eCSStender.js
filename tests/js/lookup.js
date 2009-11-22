eCSStender.onComplete(function(){

    module('Core Methods');

    test( 'eCSStender::lookup', function(){
      ok( typeof(eCSStender.lookup)=='function', 'method exists' );
      
      // lookup tests
      var matches;
      
      // string selector
      matches = eCSStender.lookup(
        {'selector':'h1'},
        '*'
      );
      ok( matches.length===1, 'match with a string selector is supported' );
      
      // string selector in array
      matches = eCSStender.lookup(
        {'selector':['h1']},
        '*'
      );
      ok( matches.length===1, 'match with a string selector in an array is supported' );
      
      // string compound selector
      matches = eCSStender.lookup(
        {'selector':'h1, p'},
        '*'
      );
      ok( matches.length===2, 'match with a compound string selector is supported' );
      
      // string selector in array
      matches = eCSStender.lookup(
        {'selector':['h1, p']},
        '*'
      );
      ok( matches.length===2, 'match with a compound string selector in an array is supported' );
      
      // RegExp selector
      matches = eCSStender.lookup(
        {'selector':/h1/},
        '*'
      );
      ok( matches.length===1, 'match with a RegExp selector is supported' );

      // RegExp selector in array
      matches = eCSStender.lookup(
        {'selector':[/h1/]},
        '*'
      );
      ok( matches.length===1, 'match with a RegExp selector in an array is supported' );
      
      // Function selector
      matches = eCSStender.lookup(
        {'selector':function(){return (this.match(/\s*?h1\s*?/)!==null);}},
        '*'
      );
      ok( matches.length===1, 'match with a Function selector is supported' );

      // Function selector in array
      matches = eCSStender.lookup(
        {'selector':[function(){return (this.match(/\s*?h1\s*?/)!==null);}]},
        '*'
      );
      ok( matches.length===1, 'match with a Function selector in an array is supported' );

      // property lookup
      matches = eCSStender.lookup(
        {'property':'border-radius'},
        '*'
      );
      ok( matches.length===1, 'match with a property lookup is supported' );

      // property lookup in array
      matches = eCSStender.lookup(
        {'property':['border-radius']},
        '*'
      );
      ok( matches.length===1, 'match with a property lookup in an array is supported' );

      // fragment lookup
      matches = eCSStender.lookup(
        {'fragment':'radius'},
        '*'
      );
      ok( matches.length===1, 'match with a fragment lookup is supported' );

      // prefix lookup
      matches = eCSStender.lookup(
        {'prefix':'easy'},
        '*'
      );
      ok( matches.length===1, 'match with a prefix lookup is supported' );
      
      // numeric specificity restriction
      matches = eCSStender.lookup(
        {
          'selector':'h1',
          'specificity':0
        },
        '*'
      );
      ok( matches.length===0, 'match with a numeric specificity restriction is supported' );
      
      // hashed specificity restriction
      matches = eCSStender.lookup(
        {
          'selector':'h1',
          'specificity': {
            'min': 0,
            'max': 2
          }
        },
        '*'
      );
      ok( matches.length===1, 'match with a hashed specificity restriction is supported' );
      
      // compound media restriction
      matches = eCSStender.lookup(
        {
          'selector':'h1',
          'media': 'print, projection'
        },
        '*'
      );
      ok( matches.length===0, 'match with a media restriction restriction is supported' );
      
      // all properties
      matches = eCSStender.lookup(
        {'selector':'body'},
        '*'
      );
      ok( ( matches[0]['properties']['background']!=null &&
            matches[0]['properties']['font-family']!=null &&
            matches[0]['properties']['padding']!=null ), 'properties argument set to * returns what it should' );

      // property lookup with properties = false
      matches = eCSStender.lookup(
        {'property':'border-radius'},
        false
      );
      ok( ( matches[0]['properties']['background']==null &&
            matches[0]['properties']['border-radius']!=null ), 'properties argument set to false returns what it should' );

      // property lookup with properties = false
      matches = eCSStender.lookup(
        {'property':'border-radius'},
        'background'
      );
      ok( ( matches[0]['properties']['background']!=null &&
            matches[0]['properties']['border-radius']!=null ), 'properties argument set to a string returns what it should' );

      // property lookup with properties = false
      matches = eCSStender.lookup(
        {'fragment':'radius'},
        ['background','margin']
      );
      ok( ( matches[0]['properties']['background']!=null &&
            matches[0]['properties']['margin']!=null &&
            matches[0]['properties']['border-radius']!=null ), 'properties argument set to an array of strings returns what it should' );

    });

  });