// ignoring some stuff
eCSStender.ignore('qunit.css');
eCSStender.ignore('ignored-1.css');
eCSStender.ignore(['ignored-2.css']);

$(document).ready(function(){

  module('');
  
  test( 'eCSStender', function(){
    ok( typeof(eCSStender)!='undefined', 'eCSStender object exists' );
    ok( true, 'eCSStender version being tested: ' + eCSStender.version );
  });
  
});

eCSStender.onComplete(function(){
  
  module('Core Properties');
  test( 'eCSStender.exec_time', function(){
    ok( typeof(eCSStender.exec_time)=='number', 'eCSStender.exec_time is the correct type' );
    ok( true, 'eCSStender execution time: ' + eCSStender.exec_time + ' seconds' );
  });
  test( 'eCSStender.fonts', function(){
    ok( eCSStender.fonts instanceof Array, 'eCSStender.fonts is the correct type' );
    ok( eCSStender.fonts.length==2, 'eCSStender.fonts contains 2 fonts, as expected' );
    ok( eCSStender.fonts[0]['font-weight']=='normal', 'eCSStender.fonts[0]["font-weight"] is the expected value' );
  });
  test( 'eCSStender.pages', function(){
    ok( typeof(eCSStender.pages)=='object', 'eCSStender.pages is the correct type' );
    ok( typeof(eCSStender.pages['right'])=='object', 'eCSStender.pages["right"] is the correct type' );
    ok( typeof(eCSStender.pages['right']['border'])!='undefined', 'eCSStender.pages["right"]["border"] is defined' );
    ok( eCSStender.pages['right']['margin']=='6cm', 'eCSStender.pages["right"]["margin"] is the expected value' );
    ok( typeof(eCSStender.pages['right']['@'])=='object', 'eCSStender.pages["right"] contains a margin boxes' );
    ok( typeof(eCSStender.pages['right']['@']['bottom-right'])=='object', 'eCSStender.pages["right"] contains a bottom-right margin box' );
    ok( eCSStender.pages['right']['@']['bottom-right']['vertical-align']=='top', 'eCSStender.pages["right"]["@"]["bottom-right"]["vertical-align"] is the correct value' );
  });
  test( 'eCSStender.at', function(){
    ok( typeof(eCSStender.at)=='object', 'at is the correct type' );
    ok( typeof(eCSStender.at['-hyphenated-extended-at-with-keys'])=='object',
        'eCSStender.pages["-hyphenated-extended-at-with-keys"] is the correct type' );
    var count = 0, key;
    for ( key in eCSStender.at['-hyphenated-extended-at-with-keys'] )
    {
      if ( eCSStender.isInheritedProperty( eCSStender.at['-hyphenated-extended-at-with-keys'], key ) ) { continue; }
      count++;
    }
    ok( count==3, 'eCSStender.pages["-hyphenated-extended-at-with-keys"] has the correct count' );
    ok( typeof(eCSStender.at['-hyphenated-extended-at-with-keys']['key-3']['property-4'])!='undefined',
        'CSStender.at["-hyphenated-extended-at-with-keys"]["key-3"]["property-4"] is defined' );
    ok( eCSStender.at['-hyphenated-extended-at-with-keys']['key-3']['property-3'] == 'value-5',
        'eCSStender.at["-hyphenated-extended-at-with-keys"]["key-3"]["property-3"] is the expected value' );
    ok( eCSStender.at['unhyphenated-extended-at'] instanceof Array,
        'eCSStender.pages["unhyphenated-extended-at"] is the correct type' );
  });
  test( 'eCSStender.methods', function(){
    ok( typeof(eCSStender.addMethod)=='function', 'eCSStender::setFilter is the correct type' );
    ok( typeof(eCSStender.methods)=='object', 'eCSStender.filters is the correct type' );
    eCSStender.addMethod('test',function(){return true;});
    ok( typeof(eCSStender.methods['test'])=='function', 'filter is of the correct type' );
    ok( eCSStender.methods['test'](), 'filter returns the expected result' );
  });

  module('Core Methods');
  test( 'eCSStender.onComplete', function(){
    ok( typeof(eCSStender.onComplete)=='function', 'eCSStender::onComplete is the correct type' );
    ok( eCSStender.exec_time > 0, 'onComplete function ran after eCSStender was finished running' );
  });
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
    ok( eCSStender.isSupported( 'property', 'visibility', 'hidden' ), 'visibility: hidden as separate arguments is supported' );
    ok( eCSStender.isSupported( 'property', 'visibility', ['visible','hidden'] ),
                                'visibility: hidden as separate arguments with the value options as an array is supported' );
    el = html = null;
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
  test( 'eCSStender::getCSSValue', function(){
    ok( typeof(eCSStender.getCSSValue)=='function', 'method exists' );
    var el    = document.createElement('b');
    eCSStender.embedCSS( 'b { visibility: visible; }', false, false );
    document.body.appendChild(el);
    ok( eCSStender.getCSSValue( el, 'visibility' ) == 'visible', 'correct value returned from embedded assignment' );
    el.style.visibility = 'hidden';
    ok( eCSStender.getCSSValue( el, 'visibility' ) == 'hidden', 'correct value returned from inline assignment' );
  });
  test( 'eCSStender::makeUniqueClass', function(){
    ok( typeof(eCSStender.makeUniqueClass)=='function', 'method exists' );
    var
    class1 = eCSStender.makeUniqueClass(),
    class2 = eCSStender.makeUniqueClass();
    ok( class1 != '', 'a value is returned: ' + class1 );
    ok( class1 != class2, class1 + ' != ' + class2 );
  });
  test( 'eCSStender Class Juggling', function(){
    ok( typeof(eCSStender.hasClass)=='function', 'eCSStender::hasClass() exists' );
    ok( typeof(eCSStender.addClass)=='function', 'eCSStender::addClass() exists' );
    ok( typeof(eCSStender.removeClass)=='function', 'eCSStender::removeClass() exists' );
    ok( typeof(eCSStender.toggleClass)=='function', 'eCSStender::toggleClass() exists' );
    var b = document.createElement('b');
    ok( !eCSStender.hasClass( b, 'foo' ), 'eCSStender::hasClass() works: the element does not have a class of "foo"' );
    eCSStender.addClass( b, 'foo' );
    ok( eCSStender.hasClass( b, 'foo' ), 'eCSStender::addClass() works: the element now has a class of "foo"' );
    eCSStender.removeClass( b, 'foo' );
    ok( !eCSStender.hasClass( b, 'foo' ), 'eCSStender::removeClass() works: the element no longer has a class of "foo"' );
    eCSStender.toggleClass( b, 'foo' );
    ok( eCSStender.hasClass( b, 'foo' ), 'eCSStender::toggleClass() works: the element has a class of "foo" again' );
  });
  test( 'eCSStender::ignore', function(){
    var matches;
    ok( typeof(eCSStender.ignore)=='function', 'method exists' );
    matches = eCSStender.lookup({'selector':'#foo'},'*');
    ok( matches.length===0, 'string css file ignored' );
    matches = eCSStender.lookup({'selector':'#bar'},'*');
    ok( matches.length===0, 'array of css files ignored' );
  });
  
});