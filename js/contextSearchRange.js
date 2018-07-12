/*
bip專用之全文搜尋範圍限制模組，注意：須搭配bootstrap 3.0和dynatree.js方可使用
2016.08.10:增加i18n全域變數_GLOBALS，需注意！！
作者：winxd@dila
*/
var ContextSearchRange = {
	active:false,
	template:''+
		'<div class="modal fade" id="jing_selector_contextSearch_dynatree_modal" tabindex="-1" role="dialog" aria-labelledby="myJSCSDynatreeLabel" aria-hidden="true" data-backdrop="static">'+
			'<div class="modal-dialog" style="width:80%">'+
				'<div class="modal-content">'+
					'<div class="modal-header">'+
						'<button id="JSCS_close" type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'+
						'<h4 class="modal-title" id="myJSCSDynatreeLabel" data-lang-id="3_1">經典範圍選擇 Set Search Range</h4>'+
					'</div>'+
					'<div class="modal-body">'+
						'<ul class="nav nav-tabs" role="tablist">'+
							//'<li class="active"><a href="#JSCS_tab_bulei" role="tab" data-toggle="tab" style="padding:6px;" data-lang-id="3_2">依部類 By Text Category</a></li>'+
							'<li class="active"><a href="#JSCS_tab_vol" role="tab" data-toggle="tab" style="padding:6px;" data-lang-id="3_3">依刊本 By Book Volume</a></li>'+
						'</ul>'+
						'<div class="tab-content">'+
							//'<div class="tab-pane active" id="JSCS_tab_bulei"><div id="JSCS_tree_bulei" style="height:450px;overflow:auto"></div><button id="JSCS_tree_bulei_save" class="btn btn-success" style="display:block;margin:auto" data-lang-id="3_5">OK</button></div>'+
							'<div class="tab-pane active" id="JSCS_tab_vol"><div id="JSCS_tree_vol" style="height:450px;overflow:auto"></div><button id="JSCS_tree_vol_save" class="btn btn-success" style="display:block;margin:auto" data-lang-id="3_5">OK</button></div>'+
						'</div>'+
					'</div>'+
				'</div>'+
			'</div>'+
		'</div>',
	
	bulei_cb:null,
	vol_cb:null,
	close_cb:null,
	init:function(bulei_cb_p,vol_cb_p,close_cb_p)	{
		if(!bulei_cb_p || !vol_cb_p || !close_cb_p)	{
			alert('[winxd:全文檢索搜尋範圍限制]必須給定三個callback參數。');
			return;
		}
		
		var ps = this;
		this.bulei_cb = bulei_cb_p;
		this.vol_cb = vol_cb_p;
		this.close_cb = close_cb_p;
		
		//apply tamplate to body's tail
		$('body').append(this.template);
		
		var trees = ['bulei','vol'];
		for(var tree in trees)	{
			(function(tree)	{
				$("#JSCS_tree_"+trees[tree]).dynatree({
					checkbox: true,
					selectMode: 3,
					minExpandLevel:2,
					onClick: function(node, event) {
						// We should not toggle, if target was "checkbox", because this
						// would result in double-toggle (i.e. no toggle)
						if( node.getEventTargetType(event) == "title" )
							node.toggleSelect();
					},					
					cookieId: "dynatree-Cb3",
					idPrefix: "dynatree-Cb3-"
				});				
				$.ajax({
					type:"GET",
					url:'resources/'+trees[tree]+'.html',
					success:function(returnStr)	{
						var child = $.trim(returnStr) == 'fail' ? []:eval('('+returnStr+')');
						$("#JSCS_tree_"+trees[tree]).dynatree("option", "children", child);							
						$("#JSCS_tree_"+trees[tree]).dynatree("getTree").reload();
					}
				});
			
			})(tree);
		}
		
		$('#JSCS_tree_bulei_save').click(function()	{
			var selKeys = [];
			selKeys = $.map($('#JSCS_tree_bulei').dynatree("getSelectedNodes"), function(node){
				if(node.data.key.match(/([TXJABCFGHKLMNPQRSUWZDIY]|ZS|ZW|GA|GB)[AB]?[0-9]{3,4}[A-Ca-c]?/g))
					return node.data.key;
			});
			$('#jing_selector_contextSearch_dynatree_modal').modal('hide');
			ps.bulei_cb(selKeys.join(','));
		});
		
		
		$('#JSCS_tree_vol_save').click(function()	{
			var selKeys = [];
			selKeys = $.map($('#JSCS_tree_vol').dynatree("getSelectedNodes"), function(node){
				if(node.data.key.match(/([TXJABCFGHKLMNPQRSUWZDIY]|ZS|ZW|GA|GB)[AB]?[0-9]{3,4}[A-Ca-c]?/g))
					return node.data.key;
			});
			$('#jing_selector_contextSearch_dynatree_modal').modal('hide');			
			ps.vol_cb(selKeys.join(','));		
		});

		$('#JSCS_close').on('click', function() {
			ps.close_cb();
		});	
		
		this.active = true;
	},
	show:function()	{
		if(this.active)	{
			//$("#JSCS_tree_bulei").dynatree("getTree").reload();
			//$("#JSCS_tree_vol").dynatree("getTree").reload();
			$('#jing_selector_contextSearch_dynatree_modal').modal();
		}
	}
};