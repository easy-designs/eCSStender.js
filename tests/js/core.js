// ignoring some stuff
eCSStender.ignore('testsuite.css');
eCSStender.ignore('ignored-1.css');
eCSStender.ignore(['ignored-2.css']);

$(document).ready(function(){

  module('');
  
  test( 'eCSStender', function(){
    ok( typeof(eCSStender)!='undefined', 'eCSStender object exists' );
  });
  
});

eCSStender.onComplete(function(){
  module('Core Methods');
  
  test( 'eCSStender.onComplete', function(){
    ok( typeof(eCSStender.onComplete)=='function', 'eCSStender::onComplete is the correct type' );
    ok( eCSStender.exec_time > 0, 'onComplete function ran after eCSStender was finished running' );
  });
});

eCSStender.onComplete(function(){
    module('Core Properties');

    test( 'eCSStender.fonts', function(){
      ok( typeof(eCSStender.fonts)=='object', 'property is the correct type' );
      ok( eCSStender.fonts.length==2, 'eCSStender.fonts contains 2 fonts, as expected' );
      ok( eCSStender.fonts[0]['font-weight']=='normal', 'eCSStender.fonts[0]["font-weight"] is the expected value' );
    });

    test( 'eCSStender.pages', function(){
      ok( typeof(eCSStender.pages)=='object', 'property is the correct type' );
      ok( typeof(eCSStender.pages['right'])=='object', 'eCSStender.pages["right"] is the correct type' );
      ok( eCSStender.pages['right']['margin']=='5cm', 'eCSStender.pages["right"]["margin"] is the expected value' );
    });

    test( 'eCSStender.methods', function(){
      ok( typeof(eCSStender.addMethod)=='function', 'eCSStender::setFilter is the correct type' );
      ok( typeof(eCSStender.methods)=='object', 'eCSStender.filters is the correct type' );
      eCSStender.addMethod('test',function(){return true;});
      ok( typeof(eCSStender.methods['test'])=='function', 'filter is of the correct type' );
      ok( eCSStender.methods['test'](), 'filter returns the expected result' );
    });
  });

eCSStender.onComplete(function(){
    module('Core Methods');

    test( 'eCSStender::register', function(){
      ok( typeof(eCSStender.register)=='function', 'method is the correct type' );
      // additional registration tests are run as extensions (below)
    });

    test( 'eCSStender::newStyleElement', function(){
      ok( typeof(eCSStender.newStyleElement)=='function', 'method exists' );
      var el = eCSStender.newStyleElement( 'print' );
      ok( typeof(el)!='undefined', 'new element exists' );
      ok( el.getAttribute('id').indexOf('temp')!=-1, 'auto-generated id created' );
      ok( typeof(document.getElementById(el.getAttribute('id')))=='object', 'el is in the document' );
    });

    test( 'eCSStender::embedCSS', function(){
      ok( typeof(eCSStender.embedCSS)=='function', 'method exists' );
      var el = eCSStender.embedCSS( 'p { font-weight: normal; }' );
      ok( typeof(el)!='undefined', 'new element exists when created with no medium' );
      equals( 'all', el.getAttribute('media'), 'media assignment is correct' );
      ok( typeof(document.getElementById(el.getAttribute('id')))=='object', 'el is in the document' );
      el = eCSStender.embedCSS( 'p { font-weight: normal; }', 'print' );
      ok( typeof(el)!='undefined', 'new element exists when created with a medium' );
      equals( 'print', el.getAttribute('media'), 'media assignment is correct' );
      ok( typeof(document.getElementById(el.getAttribute('id')))=='object', 'el is in the document' );
    });

    test( 'eCSStender::addRules', function(){
      ok( typeof(eCSStender.addRules)=='function', 'method exists' );
      var el = eCSStender.embedCSS( 'p { font-weight: normal; }', 'print' );
      var rule = 'b { visibility: hidden; }';
      eCSStender.addRules( el, rule );
      var result, test = /b[\s\S]*?\{[\s\S]*?visibility:[\s\S]*?hidden[\s\S]*?\}/i;
      if ( typeof( el.sheet ) != 'undefined' &&
           typeof( CSSStyleSheet ) != 'undefined' &&
           el.sheet instanceof CSSStyleSheet )
      {
        result = el.sheet.cssRules[el.sheet.cssRules.length-1].cssText.match( test );
      }
      else if ( typeof( el.styleSheet ) != 'undefined' )
      {
        result = el.styleSheet.cssText.match( test );
      }
      else
      {
        result = el.innerHTML.match( test );
      }
      ok( result, 'style added' );
    });

    test( 'eCSStender::isSupported', function(){
      ok( typeof(eCSStender.isSupported)=='function', 'method exists' );
      var el = document.createElement('b');
      var html = document.createElement('p');
      html.appendChild(el);
      ok( eCSStender.isSupported( 'selector', 'p b', html, el ), 'simple descendent selector is supported' );
      ok( !eCSStender.isSupported( 'selector', 'p ?? b', html, el ), 'unknown selector is not supported' );
      ok( eCSStender.isSupported( 'property', 'visibility: hidden' ), 'visibility: hidden is supported' );
      ok( !eCSStender.isSupported( 'property', 'foo: bar' ), 'unknown property is not supported' );
    });

    test( 'eCSStender::applyWeightedStyle', function(){
      ok( typeof(eCSStender.applyWeightedStyle)=='function', 'method exists' );
      var el = document.createElement('p');
      eCSStender.applyWeightedStyle( el, { 'visibility': 'hidden' }, 10 );
      ok( el.style.visibility=='hidden', 'inline style was set' );
      ok( typeof( el.inlineStyles )!='undefined', 'element is tracking its weighted properties' );
      ok( el.inlineStyles['visibility']==10, 'element is tracking the correct weight for visibility' );
      eCSStender.applyWeightedStyle( el, { 'visibility': 'visible' }, 1 );
      ok( el.style.visibility=='hidden', 'element remained hidden when specificity was not high enough' );
      eCSStender.applyWeightedStyle( el, { 'visibility': 'visible' }, 10 );
      ok( el.style.visibility=='visible', 'element was made visible when specificity was equal to existing one' );
      eCSStender.applyWeightedStyle( el, { 'visibility': 'hidden' }, 100 );
      ok( el.style.visibility=='hidden', 'element was hidden again when specificity was greater' );
    });
    
    test( 'eCSStender::ignore', function(){
      var matches;
      ok( typeof(eCSStender.ignore)=='function', 'method exists' );
      matches = eCSStender.lookup({'selector':'#foo'},'*');
      for ( var i=0, iLen=matches.length; i<iLen; i++ ){
        var
        str = matches[i].selector + '{ ';
        for ( var key in matches[i].properties )
        {
          str += key + ': ' + matches[i].properties[key] + '; ';
        }
        str += ' }';
        alert(str);
      }
      ok( matches.length===0, 'string css file ignored' );
      matches = eCSStender.lookup({'selector':'#bar'},'*');
      ok( matches.length===0, 'array of css files ignored' );
    });
    

  });