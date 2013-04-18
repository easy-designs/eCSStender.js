(function($){
  
  if ( typeof $ == 'undefined' ) { return; }
  
  // define EasyPhysics
  var EasyPhysics = {
    version: '1.0'
  };
  window.EasyPhysics = EasyPhysics;
  
	// Objects
	EasyPhysics.Balloon     = function( el ) { new PhysicalObject( el, 0, -0.5, -0.1 ); };
	EasyPhysics.RubberBall  = function( el ) { new PhysicalObject( el, 0, -0.8, 0.5 ); };
	EasyPhysics.BowlingBall = function( el ) { new PhysicalObject( el, 1, -0.4, 0.9 ); };
  
  // the base constructor
  PhysicalObject = function( el, vy, kEnergy, gravity )
	{
		var
		$el    = $(el),
		height = $el.height(),
		top,
    
    // stop browser scroll bars flickering on and off
		floor = $(window).height()-50,
		
		// physics
		vy      = parseFloat( vy, 10 ),
		kEnergy = parseFloat( kEnergy, 10 ),
		gravity = parseFloat( gravity, 10 ),
		
		// animation
		old_vy = 0,
		timer  = false;
		
		function init()
		{
		  if ( $el.css('position') != 'absolute' )
		  {
		    var position = $el.offset();
		    $el.css({
		      position: 'absolute',
		      top:      position.top + 'px',
		      left:     position.left + 'px'
		    });
		    if ( $el.offsetParent() != $('html') )
		    {
		      $el.remove().appendTo($('body'));
		    }
		  }
		  timer = setInterval( move, 10 );
		}
		
		function move()
		{
			// current Y position
			var y = $el.position().top;
      
      // has it gone past the bottom?
			if ( y + height > floor )
			{
				$el.css('top',floor-height+'px');
				vy *= kEnergy; //reverse it's velocity with a negative number
			}
			// gone past the top?
			else if ( y < 0 )
			{
				$el.css('top',0);
				vy *= kEnergy;
			}
			
			// gravity
			vy += gravity;
			
			// Now set the position based on our vy calculations
			$el.css( 'top', $el.position().top + parseInt( vy, 10 ) + 'px' );

		}
		
		function check_animation()
		{
		  // current velicoty
			var new_vy = Math.abs( vy );
		  
		  // find bigger number and subtract smaller. see if velocity change is < 0.1
			if ( ( gravity > 0 &&
			       Math.max( old_vy, new_vy ) - Math.min( old_vy, new_vy ) < 0.7 ) ||
			     ( gravity <= 0 &&
			       Math.max( old_vy, new_vy ) - Math.min( old_vy, new_vy ) < 0.1 ) )
			{
				clearInterval( timer );
				if ( gravity > 0 )
			  {
			    $el.css( 'top', floor - height + 'px' );
			  }
			  else
			  {
			    $el.css( 'top', 0 );
			  }
			}
			else
			{
			  old_vy = new_vy;
			  setTimeout( check_animation, 750 );
			}
		}
		
		init();
		setTimeout( check_animation, 1000 );
		
	};
	
})(jQuery);