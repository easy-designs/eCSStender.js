/*------------------------------------------------------------------------------
Function:       FunctionHandler()
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2009-04-02
Version:        0.2
Homepage:       http://github.com/easy-designs/FunctionHandler.js
License:        MIT License (see homepage)
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){var FunctionHandler={version:"0.2"},pages={};function initialize(){var body_id=$("body").attr("id");if(body_id!=false&&typeof(pages[body_id])!="undefined"){run(pages[body_id])}if(typeof(pages["*"])!="undefined"){run(pages["*"])}}$(document).ready(initialize);FunctionHandler.register=function(id,callback){if((typeof(id)!="string"&&!(id instanceof Array))||typeof(callback)!="function"){return false}if(typeof(id)=="string"&&id.indexOf(", ")!=-1){id=id.split(", ")}if(id instanceof Array){for(var i=id.length-1;i>=0;i--){add(id[i],callback)}}else{add(id,callback)}return true};function add(id,callback){if(typeof(pages[id])=="undefined"){pages[id]=[]}pages[id].push(callback)}function run(arr){if(!(arr instanceof Array)){return}for(var i=arr.length-1;i>=0;i--){arr[i]()}}window.FunctionHandler=FunctionHandler})();

// eCSStender configuration
eCSStender.addMethod('findBySelector',jQuery);

(function(win,doc){
	var
	$window		= $(win),
	$document	= $(doc),
	$content	= $('#content');

	window.maxContentHeight = function(){
		$content.css('min-height','0');
		var
		c_height	= $content.height(),
		d_height	= $document.height(),
		w_height	= $window.height(),
		p_height	= ( d_height > w_height ? d_height : w_height ) - 
								$('body > header').outerHeight(true) -
								$('#nav-main > li').outerHeight(true) -
                                $('body > footer').outerHeight(true);
		if ( p_height > c_height )
		{$content.css('min-height',p_height+'px');}
	};
})(window,document);

FunctionHandler.register(
  '*',
  function(){
    // Google Analytics
    $.getScript('http://www.google-analytics.com/ga.js',function(){
      try {
        var pageTracker = _gat._getTracker("UA-176472-4");
        pageTracker._trackPageview();
      } catch( e ) {}});
    
    maxContentHeight();
	var r_timer;
	$(window)
		.resize(function(){
			if ( r_timer ){
				clearTimeout( r_timer );
				r_timer = false;
			}
			r_timer = setTimeout( realResize, 50 );
		});
	function realResize()
	{
		clearTimeout( r_timer );
		r_timer = false;
		maxContentHeight();
	}
  });

FunctionHandler.register(
  'faq',
  function(){
    $.getScript('http://assets.ecsstender.org/j/jquery.FAQHandler.js',function(){$('dl.faq').FAQify();});
  });