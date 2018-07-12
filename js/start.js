$.jgrid.defaults.width = 780;
$.jgrid.defaults.styleUI = 'Bootstrap';
		
$(document).ready(function()	{
	GLOBALS.isLocal = false;	//是否為離線版
	register_events();
	init();
});