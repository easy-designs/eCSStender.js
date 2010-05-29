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

  eCSStender.loadScript('http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js',function(){
    test( 'eCSStender::loadScript', function(){
      ok( typeof(window.jQuery) == 'function', 'script was loaded successfully' );
    });
  });

});