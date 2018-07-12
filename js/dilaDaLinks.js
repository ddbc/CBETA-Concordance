/*
 * Author: 李阿閒@dila
*/

var dilaDaLinks = {
	projects:[
		{title:'CBETA線上閱讀',link:'http://cbetaonline.dila.edu.tw',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/cbetarp.png'},
		{title:'CBETA詞彙搜尋與分析',link:'http://cbetaconcordance.dila.edu.tw',img:'http://cbetaconcordance.dila.edu.tw/images/cbetaconcordance.png'},
		{title:'《成唯識論》及其注疏編撰',link:'http://vms.dila.edu.tw/',img:'http://vms.dila.edu.tw/images/vms-icon.png'},
		{title:'佛學規範資料庫',link:'http://authority.dila.edu.tw/',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/authority.jpg'},
		{title:'宋高僧傳校勘與數位化版本',link:'http://buddhistinformatics.dila.edu.tw/songgaosengzhuan/',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/sgs.png'},
		{title:'台灣佛寺時空平台',link:'http://buddhistinformatics.dila.edu.tw/taiwanbudgis/',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/taiwangis.jpg'},
		{title:'中國佛教寺廟志數位典藏',link:'http://buddhistinformatics.dila.edu.tw/fosizhi/',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/1b011p0964.jpg'},
		{title:'瑜伽師地論資料庫',link:'http://ybh.dila.edu.tw',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/ybh.jpg'},
		{title:'法鼓全集',link:'http://ddc.shengyen.org',img:'http://lic.dila.edu.tw/sites/all/themes/ilib/da_projects_images/fagoo.jpg'}
		/*{title:'',link:'',img:''},
		{title:'',link:'',img:''},
		{title:'',link:'',img:''},
		{title:'',link:'',img:''},
		{title:'',link:'',img:''}*/	
	],
	rowsNum:3,	//每一列專案的數量
	init:function(config)	{
		if(config.containerID)	{
			var thisObj = this;
			var container = document.getElementById(config.containerID);
			var backgroundColor = config.backgroundColor ? config.backgroundColor:'white';
			var anchorHTML = config.anchorHTML ? config.anchorHTML:'Projects';
			var widgetMinWidth = 335;
			var html = '\
				<div id="dilaDaLinksWidget">\
					<div id="dilaDaLinksWidget-anchor">'+anchorHTML+'</div>\
					<div id="dilaDaLinksWidget-arrow" class="dilaDaLinksWidget-boxItem" style="display:none"></div>\
					<div id="dilaDaLinksWidget-arrow-shadow" class="dilaDaLinksWidget-boxItem" style="display:none"></div>\
					<div id="dilaDaLinksWidget-box" class="dilaDaLinksWidget-boxItem" style="display:none"></div>\
				</div>\
			';
			
			var css = '\
				#dilaDaLinksWidget	{\
					position:absolute;\
				}\
				#dilaDaLinksWidget-anchor	{\
					cursor:pointer;\
				}\
				#dilaDaLinksWidget-box	{\
					background-color:'+backgroundColor+';\
					position:relative;\
					top:10px;\
					border:1px solid lightgray;\
					box-shadow:1px 3px 5px #ccc;\
					min-width:'+widgetMinWidth+'px;\
					display: flex;\
					display: -webkit-flex;\
					flex-wrap: wrap;\
					flex-direction: row;\
					justify-content: center;\
					align-items: center;\
					align-content: center;\
					padding:15px;\
				}\
				#dilaDaLinksWidget-box::after	{\
					  display: block;\
					  content: "";\
					  flex: 999 999 auto;\
				}\
				#dilaDaLinksWidget-arrow	{	\
					width: 0;\
					height: 0;\
					border-style: dashed dashed solid;\
					border-width: 0 10px 10px 10px;\
					border-color: transparent;\
					border-bottom-color: transparent;\
					/*left: 50%;*/\
					position: absolute;\
					border-bottom-color: rgba(0,0,0,.2);\
				}\
				#dilaDaLinksWidget-arrow-shadow	{\
					width: 0;\
					height: 0;\
					border-style: dashed dashed solid;\
					border-width: 0 10px 10px 10px;\
					border-color: transparent;\
					border-bottom-color: transparent;\
					/*left: 50%*/;\
					position: absolute;\
					border-bottom-color: '+backgroundColor+';\
					z-index: 1;\
					margin-top: 1px;\
				}\
				.dilaDaLinksWidget-boxItem	{\
					\
				}\
				.dilaDaLinksWidget-items	{\
					width:88px;\
					height:130px;\
					margin:5px;\
					cursor:pointer;\
					border: 1px solid '+backgroundColor+';\
				}\
				.dilaDaLinksWidget-items:empty:hover	{\
					border: 1px solid '+backgroundColor+';\
					cursor:default;\
				}\
				.dilaDaLinksWidget-items:hover	{\
					border: 1px solid #e5e5e5;\
				}\
				.dilaDaLinksWidget-items > img	{\
					margin:10px;\
					width:64px;\
					height:64px;\
				}\
				.dilaDaLinksWidget-items > div	{\
					font-size:13px;\
					text-align: center;\
					margin: 0 5px 5px 0;\
				}\
				#dilaDaLinksWidget-more {\
					text-align: center;\
					cursor: pointer;\
					width: 130%;\
					background-color: #f5f5f5;\
					margin: 0 -15px -15px;\
					font-size: 13px;\
					height: 40px;\
					padding: 12px;\
				}\
			';
			
			var head = document.head || document.getElementsByTagName('head')[0];
			var body = document.body;
			var style = document.createElement('style');
			style.type = 'text/css';
			if(style.styleSheet)	{
			  style.styleSheet.cssText = css;
			}
			else {
				style.appendChild(document.createTextNode(css));
			}			
			head.appendChild(style);
			container.innerHTML = html;
			this.mountProjects();
			
			this.attachEvent(document.getElementById('dilaDaLinksWidget-anchor'),'click',function(e)	{	//anchor click開啟選單
				var window_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;	//取得整個畫面的寬
				var window_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;	//取整個畫面的高
				var width_diff = 0;	//如果打開的選單超過畫面的最右邊需減回去的差值
				
				if(thisObj.getOffset(document.getElementById('dilaDaLinksWidget')).left + widgetMinWidth > window_width)	{
					width_diff = (thisObj.getOffset(document.getElementById('dilaDaLinksWidget')).left + widgetMinWidth) - window_width;
					width_diff += 10;	//可動態調整的自由值
					document.getElementById('dilaDaLinksWidget-box').style.left = (width_diff*-1)+'px';
				}
				
				document.querySelectorAll('.dilaDaLinksWidget-boxItem').forEach(function(item) {
					item.style.display = item.style.display === 'none' ? 'flex':'none';
				});
				e.stopPropagation();
			});
			
			this.attachEvent(document,'click',function(e)	{	//按一下元件以外的任何地方就將選單藏起來
				if(e.target && e.target.getAttribute('class') && (e.target.getAttribute('class').indexOf('dilaDaLinksWidget-boxItem') !== -1))	{
					var pass = true;				
				}
				else	{
					document.querySelectorAll('.dilaDaLinksWidget-boxItem').forEach(function(item)	{
						item.style.display = 'none';
					});						
				}
				e.stopPropagation();
			});
			
		}
	
	},
	mountProjects:function()	{
		var html = [];
		var more_html = '<div id="dilaDaLinksWidget-more" onclick="window.open(\'http://lic.dila.edu.tw/digital_archives_projects\')">更多</div>';
		this.projects.forEach(function(project)	{
			html.push('<div class="dilaDaLinksWidget-items" onclick="window.open(\''+project.link+'\')"><img src="'+project.img+'" /><div>'+project.title+'</div></div>');
		});
		var box_padding = (this.projects.length % 3 == 0 ? 0:(3 - (this.projects.length % 3)));
		if(box_padding > 0)	{
			for(var i = 0; i < box_padding; i++)	html.push('<div class="dilaDaLinksWidget-items"></div>');
		}
		
		document.getElementById('dilaDaLinksWidget-box').innerHTML = html.join('')+more_html;
	},
	attachEvent: function(obj,evt,fn) {
		if (obj.addEventListener)
			obj.addEventListener(evt,fn,false);
		else if (obj.attachEvent)
			obj.attachEvent('on'+evt,fn);
	},
	getOffset:function(el)	{
		var _x = 0;
		var _y = 0;
		while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
			_x += el.offsetLeft - el.scrollLeft;
			_y += el.offsetTop - el.scrollTop;
			el = el.offsetParent;
		}
		return { top: _y, left: _x };
	}
}