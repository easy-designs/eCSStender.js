/*------------------------------------------------------------------------------
Function:       eCSStender.transitions.js
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  2010-05-31
Version:        0.1
Homepage:       http://github.com/easy-designs/eCSStender.transitions.js
License:        MIT License 
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(){if(typeof eCSStender=="undefined"){return}var c=eCSStender,a=new b(c);function b(h){var q="property",g="-moz-",j="-webkit-",m="-khtml-",o="-o-",p="-ms-",i=" ",d=": ",f="; ",k="transition-duration",n=d+"0.5s";h.register({fragment:"transition",test:function(){var e=k+n;return(!h.isSupported(q,e))},fingerprint:"net.easy-designs."+k},false,l);function l(e,s,r){var t="",u;for(var v in s){if(h.isInheritedProperty(s,v)){continue}u=v+d+s[v]+f;t+=g+u+j+u+m+u+o+u+p+u}if(t!=""){h.embedCSS(e+" { "+t+" } ",r)}}}})();