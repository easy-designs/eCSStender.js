$(document).ready(function(){

  module( 'Browser Caching' );
  
  test( 'eCSStender::disableCache', function(){
    ok( typeof(eCSStender.disableCache)=='function', 'method exists' );
  });
  
  var
  UNDEFINED,
  storage_method,
  local = ( window.location.href.indexOf('http') !== 0 );
  test( 'Storage Type', function(){
    
    // determine the storage method
    if ( local )
    {
      ok( true, 'eCSStender cannot use the cache (script is being run locally)' );
    }
    else
    {
      storage_method = (function(){
        var method = false, cache;
        if ( window.localStorage )
        {
          method = 'localStorage';
        }
        else
        {
          cache = document.createElement('div');
          cache.style.behavior = 'url(#default#userData)';
          document.body.appendChild(cache);
          if ( cache.XMLDocument != UNDEFINED )
          {
            method = 'UserData Cache';
          }
        }
        return method;
      })();
      if ( storage_method !== false )
      {
        ok( true, 'Caching is Available: ' + storage_method );
      }
      else
      {
        ok( true, 'Caching is not supported' );
      }
    }
    
  });
  
  test( 'Storage Use', function(){
    
    // determine if we are (or should be) using a cache
    if ( local )
    {
      ok( true, 'eCSStender cannot use the cache (script is being run locally)' );
    }
    else if ( storage_method !== false && ! local && eCSStender.cache )
    {
      ok( true, 'eCSStender is using a cache' );
    }
    else if ( storage_method !== false && ! local && ! eCSStender.cache )
    {
      ok( true, 'eCSStender can use the cache, but hasn\'t yet (as this is probably its first run)' );
    }
    else
    {
      ok( true, 'Caching is not supported' );
    }
    
  });
  
});
