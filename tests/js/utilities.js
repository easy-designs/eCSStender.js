$(document).ready(function(){

  module('Utility Methods');

  test( 'eCSStender::trim', function(){
    ok( typeof(eCSStender.trim)=='function', 'method exists' );
    ok( typeof(eCSStender.trim('  string  '))=='string', 'return is a string' );
    ok( eCSStender.trim('  string  ')=='string', 'method does what it is supposed to' );
  });
  
  test( 'eCSStender::isInheritedProperty', function(){
    ok( typeof(eCSStender.isInheritedProperty)=='function', 'method exists' );
    function MyObject(){
      this.foo = 'foo';
    };
    var test = new MyObject();
    ok( eCSStender.isInheritedProperty( test, 'toSource' ), 'inherited property is correctly identified' );
    ok( !eCSStender.isInheritedProperty( test, 'foo' ), 'custom property is correctly identified' );
  });

  test( 'eCSStender::loadScript', function(){
    ok( typeof(eCSStender.loadScript)=='function', 'method exists' );
  });

  eCSStender.loadScript('http://swfobject.googlecode.com/svn/tags/swfobject_2_2/swfobject.js',function(){
    test( 'eCSStender::loadScript callback', function(){
      ok( true, 'callback was called' );
      ok( typeof window.swfobject == 'object', 'script was loaded successfully' );
    });
  });

});