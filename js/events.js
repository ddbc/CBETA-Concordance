/*
 * Author: 李阿閒@dila
*/

function register_events()	{
	$(window).resize(function()	{
		$('#right-area').css('height',($(window).height()-$('#top-bar').get(0).offsetHeight+15)+'px');
	});
	
	$('#search-btn').click(function()	{
		search_kwic();
	});
	
	$('#search-text').keypress(function(e)	{
		if(e.which == 13)	{
			search_kwic();
		}
	});
	
	//切換各個搜尋結果
	$(document).on('click','.search-result-label',function()	{
		var thisLabel = $(this);
		$('#gbox_jqGrid').block({ message: '<h1>Processing...</h1>', css: { 'background-color':'inherit','top':'50px','border':'none','color':'white' } });
		setTimeout(function()	{
			thisLabel.addClass('label-active').siblings().removeClass('label-active');
			$('#del_selected_row_btn').hide();	
			$("#jqGrid")[0].grid.beginReq(); 
			GLOBALS.active_keyword = thisLabel.attr('kw');
			reload_grid("#jqGrid",GLOBALS.search_data[thisLabel.attr('kw')]);	
			$('#gbox_jqGrid').unblock(); 			
		},200);

	});
	
	//刪除搜尋結果
	$(document).on('click','.search-result-label-close',function(e)	{
		delete GLOBALS.search_data[$(this).parent().attr('kw')];		//清除資料
		delete GLOBALS.search_data_color[$(this).parent().attr('kw')];	//清除顏色資料
		$('#jqGrid').jqGrid('clearGridData');	//清除grid
		$(this).parent().siblings().eq(0).trigger('click');	//啟動隔壁的label
		$(this).parent().remove();
		GLOBALS.dataPage_updated = true;	//切換到資料頁需更新
		saveMainDataToTmp();	//有異動，存到暫存檔
		
		e.stopPropagation();	//避免啟動父節點.search-result-label事件
		return false;
	});
	
	/*
	//資料匯總(top選單下拉式)
	$('.aggregation_btn').click(function()	{
		var target = $(this).attr('data-catalog');
		toView('statistic',target);
		get_statistic(target);
	});
	*/
	
	//匯入自訂經錄
	$('#import_files').change(function(e)	{
		var files = e.target.files; // FileList object

		for (var i = 0, f; f = files[i]; i++) {			// Loop through the FileList and render image files as thumbnails.			
			if (!f.type.match('application/json'))	continue;	// Only accept json
			
			var reader = new FileReader();
			reader.onload = (function(theFile) {	// Closure to capture the file information.
				return function(e) {
					//console.log(theFile)
					var jinluTemp = $.parseJSON(this.result);
					var firstKey = Object.keys(jinluTemp)[0];
					if(jinluTemp[firstKey] && jinluTemp[firstKey].work && jinluTemp[firstKey].title)	{	//抽取json的第一筆檢視是否為合格物件
						GLOBALS.jinlu = jinluTemp;	//將經錄檔換成自訂
						showGoodAlert(LANG[GLOBALS.lang]['msg-2-1']+theFile.name+LANG[GLOBALS.lang]['msg-2-2']);
					}
					else	{
						showGoodAlert(LANG[GLOBALS.lang]['msg-1']);
					}
				};
			})(f);
			reader.readAsText(f);
		}		
	});
	
	//匯入儲存的搜尋結果
	$('#import_saved_results').change(function(e)	{
		var files = e.target.files; // FileList object
		
		for (var i = 0, f; f = files[i]; i++) {			// Loop through the FileList and render image files as thumbnails.			
			//if (!f.type.match('application/json'))	continue;	// Only accept json
			
			var reader = new FileReader();
			reader.onload = (function(theFile) {	// Closure to capture the file information.
				return function(e) {
					//console.log(theFile)
					restore_data($.parseJSON(this.result));	//執行
				};
			})(f);
			reader.readAsText(f);
		}		
	});	
	
	
	//自訂刪除gird列的功能(不真正刪除，上刪除線和修改rowdata的deleted欄位)
	$(document).on('click','.delRow_btn',function(e)	{
		var rowid = $(this).parent().siblings('[aria-describedby="jqGrid_id"]').text();
		$(this).parents('tr:eq(0)').addClass('tr_deleted');	//增加刪除線class
		$('#jqGrid').jqGrid('setCell',rowid,'deleted',1);	//設定資料的deleted欄位為1
		$('#jqGrid').jqGrid('resetSelection');	//清除selection

		if($('#jqGrid').jqGrid('getGridParam', 'selrow'))	$('#search-result-tools').show();	//如果有勾任一項目，即顯示列操作按鈕，反之隱藏
		else	$('#search-result-tools').hide();		
		
		GLOBALS.dataPage_updated = true;
		saveMainDataToTmp();	//有異動，存到暫存檔
		
		save_search_data(GLOBALS.active_keyword,jQuery('#jqGrid').jqGrid ('getGridParam', 'data'));	//將更新過的將資料回存(因為資料會切換來切換去)
		
		e.stopPropagation();
		return false;
	});
	
	//第一頁搜尋表格-隱藏/顯示選擇的資料
	$('.search_selected_display_btn').click(function()	{
		var action = $(this).attr('data-action-type');
		var selRowIDs = $('#jqGrid').jqGrid('getGridParam','selarrrow');
		var jqGridKer = document.getElementById('jqGrid');
		
		for(var i in selRowIDs)	{
			if(action == 'hide')	{
				$('#'+selRowIDs[i],jqGridKer).addClass('tr_deleted');
				$('#jqGrid').jqGrid('setCell',selRowIDs[i],'deleted',1);	//設定資料的deleted欄位為1
			}
			else if(action == 'show')	{
				$('#'+selRowIDs[i],jqGridKer).removeClass('tr_deleted');
				$('#jqGrid').jqGrid('setCell',selRowIDs[i],'deleted',0);	//設定資料的deleted欄位為0			
			}
		}
		
		save_search_data(GLOBALS.active_keyword,jQuery('#jqGrid').jqGrid ('getGridParam', 'data'));	//將更新過的將資料回存(因為資料會切換來切換去)
		$('#jqGrid').jqGrid('resetSelection');	//清除selection
		$('#search-result-tools').hide();	//點了後按鈕區藏起
		GLOBALS.dataPage_updated = true;		//動過資料，故GLOBALS.dataPage_updated設為ture，切換到分析頁面時需重新統計
		saveMainDataToTmp();	//有異動，存到暫存檔
	});

	
	//圖表更新
	$('.updateChart_btn').click(function()	{
		/*
		var gridID = $(this).parent().find('[id ^= "gbox_"]').attr('id');
		var chartID = $(this).parent().find('canvas').attr('id');
		*/
		var gridID = $(this).attr('data-gridID');
		generate_chart([gridID]);	//進行chart繪圖，每次切換就重繪(因為資料可能使用者會增刪)
		
	});
	
	//將統計圖另存圖片按鈕
	$('.canvasExport_btn').on('click',function()	{
		var canvas_dataurl = document.getElementById($(this).attr('data-chartID')).toDataURL();
		var a = document.createElement('a');
		a.href = canvas_dataurl;
		a.setAttribute('download',$(this).attr('data-chartID')+'_export.png');
		a.id = 'temp_canvas_a';
		document.body.appendChild(a);
		$('#temp_canvas_a')[0].click();
		$('#temp_canvas_a').remove();
	});
	
	//切換各層次麵包屑click
	$(document).on('click','.search-breadcrumb-item',function()	{
		
		//由於使用「不彙總所有經」時，會直接跳到第三層，下面這行在於預防麵包屑點擊時因此跳層造成的bug，在這邊直接防止掉
		if($('.search-breadcrumb-item').size() == 2 && $(this).attr('data-fromto') == 'juanLevel')	return false;	
		
		toView($(this).attr('data-fromto'),$(this).attr('data-catalog'));
		pushBrowserState($(this).attr('data-fromto'),$(this).attr('data-catalog'));
	});
	
	//click grid 可到下一層之功能
	$(document).on('click','.grid2next',function(e)	{
		var type = $(this).parents('table:eq(0)').attr('id').replace('StatisticGrid','');
		var label = $.trim($(this).text());
		
		if(type == 'jingLevel' || type == 'jings')	{	//「不彙總所有經」也直接到juanLevel
			generate_juan_chart(type,label.split(' ')[0]);
		}
		else	{
			generate_jing_chart(type,label);
		}		
		
		e.stopPropagation();
		return false;
	});	
	
	
	//juan level click grid 可顯示kwic(前端自己做，ray api版無法處理deleted的問題，廢棄之)
	$(document).on('click','.juan2kwic',function(e)	{
		var work = $(this).attr('data-work');
		var juan = $(this).attr('data-juan');				
		var res = get_kwic(work,juan);
		
		$('#jaun_kwic').html('');
		
		for(var kw in res)	{
			var html = [];
			for(var i in res[kw])	{
				var kwic = res[kw][i].kwic;
				var cbeta_link = res[kw][i].cbeta_link;
				html.push('<tr><td>'+kwic+'</td><td style="text-align:right"><a target="_blank" href="http://cbetaonline.dila.edu.tw/'+cbeta_link+'">'+cbeta_link+'</a></td></tr>');			
			}
			$('#jaun_kwic').append(html.length > 0 ? '<table class="table" data-kw="'+kw+'">'+html.join('')+'</table>':'');
		}
		$('#jaun_kwic > table').hide().parent().prepend('<h4 id="juan-kwic-title">'+LANG[GLOBALS.lang]['juan-list-msg']+juan+':</h4><span class="label label-default"><span data-label="">ALL</span></span>'+Object.keys(GLOBALS.search_data).map(function(item)	{	return '<span class="label label-default" style="background-color:'+GLOBALS.search_data_color[item]+'" ><span data-label="">'+item+'</span></span>' ; }).join(''));
			
		$('#jaun_kwic .label').each(function()	{	//為label加入筆數
			var count;
			if($(this).text() === 'ALL')	count = $('#jaun_kwic tr').size();
			else	count = $('#jaun_kwic table[data-kw="'+$(this).text()+'"] tr').size();
			$(this).append(' ('+count+')');
				
		});	
		$('#jaun_kwic .label:eq(0)').trigger('click');
		
		e.stopPropagation();
		return false;		
	});
	
	
	/*
	//juan level click grid 可顯示kwic(ray API版，api版無法處理deleted的問題，廢棄之)
	$(document).on('click','.juan2kwic',function(e)	{
		var tasks = [];
		var work = $(this).attr('data-work');
		var juan = $(this).attr('data-juan');

		$('#jaun_kwic').html('');
		for(var kw in GLOBALS.search_data)	{	
			tasks.push(get_juan_kwic(kw,work,juan));
		}	
		
        $.when.apply(null, tasks).done(function() {	//用$.when搭配promise保證async執行順序，確保關鍵字之順序
			for(var i in arguments)	{	//用arguments取得不定長度的ajax回傳資訊
				//console.log(arguments)
				if(!arguments[i])	continue;
				
				var html = [];
				var json_res = arguments[i].results;
				for(var j in json_res)	{
					var cbeta_link = json_res[j].vol+'n'+json_res[j].work.replace('T','')+'_p'+json_res[j].lb;
					html.push('<tr><td>'+json_res[j]['kwic'].replace(new RegExp(arguments[i].kw,"g"),'<span style="color:'+GLOBALS.search_data_color[arguments[i].kw]+'">'+arguments[i].kw+'</span>')+'</td><td style="text-align:right"><a target="_blank" href="http://cbetaonline.dila.edu.tw/'+cbeta_link+'">'+cbeta_link+'</a></td></tr>');
				}
				$('#jaun_kwic').append(html.length > 0 ? '<table class="table" data-kw="'+arguments[i].kw+'">'+html.join('')+'</table>':'');
			}
			$('#jaun_kwic > table').hide().parent().prepend('<h4 id="juan-kwic-title">'+LANG[GLOBALS.lang]['juan-list-msg']+juan+':</h4><span class="label label-default"><span data-label="">ALL</span></span>'+Object.keys(GLOBALS.search_data).map(function(item)	{	return '<span class="label label-default" style="background-color:'+GLOBALS.search_data_color[item]+'" ><span data-label="">'+item+'</span></span>' ; }).join(''));
			
			$('#jaun_kwic .label').each(function()	{	//為label加入筆數
				var count;
				if($(this).text() === 'ALL')	count = $('#jaun_kwic tr').size();
				else	count = $('#jaun_kwic table[data-kw="'+$(this).text()+'"] tr').size();
				$(this).append(' ('+count+')');
					
			});	
			$('#jaun_kwic .label:eq(0)').trigger('click');
		});		
	
		
		e.stopPropagation();
		return false;
	});		
	*/
	
	//juan kwic label切換
	$(document).on('click','#jaun_kwic .label',function(e)	{
		$(this).addClass('kwic-label-active').siblings('.label').removeClass('kwic-label-active');
		var kw = $(this).find('span[data-label]').text();
		var target_table = $(this).parent().find('table');
		target_table.hide();
		if(kw === 'ALL')	{
			target_table.show();
		}
		else	{
			target_table.filter(function(index,elm)	{	return $(elm).attr('data-kw') == kw;}).show();
		}	
	});

	//detail info label切換
	$(document).on('click','.detail_switch_label',function(e)	{
		var catelog = $(this).attr('data-catalog');
		var kw_filter = $(this).text() == 'ALL' ? false:$.trim($(this).text());
		generate_detail(catelog,kw_filter);
	});	
	
	//前後綴標題按下打開或關閉內容
	$(document).on('click','.prevnext_word_title',function()	{
		$(this).parent().nextUntil('.detailInfo_item').toggleClass('show_prevnext_content');
		var open_close_icon = $(this).find('.glyphicon');
		if(open_close_icon.hasClass('glyphicon-plus'))	open_close_icon.removeClass('glyphicon-plus').addClass('glyphicon-minus');
		else	open_close_icon.removeClass('glyphicon-minus').addClass('glyphicon-plus');
	});
	
	//前後綴匯出
	$(document).on('click','.prevnext_export_btn',function(e)	{
		exportToExcel('prevnext',$(this));
		e.stopPropagation();
	});
	
	/*
	//最上方按鈕群
	$('.header-nav-btns').on('click',function()	{
		var type = $(this).attr('id');
		
		$(this).addClass('active').siblings().removeClass('active');
		
		if(type === 'nav-term-btn')	{	//詞彙
			toView('landing');
			//pushBrowserState('landing');
		}
		else if(type === 'nav-data-btn')	{	//資料
			toView('table');
			//pushBrowserState('table');
		}
		else if(type === 'nav-analysis-btn')	{	//分析
			if(GLOBALS.dataPage_updated)	{	//資料頁有更新資料的話，就重新統計
				get_statistic($('#change-aggregation-modal :radio:checked').val());
				GLOBALS.dataPage_updated = false;	//重設flag
			}
			toView('statistic',GLOBALS.lastAggregation);
			pushBrowserState('statistic',GLOBALS.lastAggregation,$('#change-aggregation-modal :radio:checked').val());
		}
	});
	*/
	
	//在麵包屑裡面的「改變彙總方式按鈕」
	$(document).on('click','#breadcrumb_change_aggregation_btn',function(e)	{
		$('#change-aggregation-modal :radio[value="'+GLOBALS.lastAggregation+'"]').prop('checked',true);
		$('#change-aggregation-modal').modal();
		e.stopPropagation();
	});
	
	//改變彙總方式modal 「開始分析」按鈕啟動
	$('#change-aggregation-submit').on('click',function()	{
		var target = $('#change-aggregation-modal :radio:checked').val();
		toView('statistic',target);
		pushBrowserState('statistic',target,target);
		get_statistic(target);		
		$('#change-aggregation-modal').modal('hide');
	});
	
	//更換chart type dropdown
	$('.changeChartType-dropdown .dropdown-menu > li').click(function()	{
		var menu_html = $(this).find('a').html();
		$(this).parents('.changeChartType-dropdown').find('.changeChartType-dropdown-menu').html(menu_html);
		generate_chart([$(this).attr('data-gridID')],{type:'changeChartType',param:{value:$(this).attr('data-type')}});
	});

	//更換比例百分比 / 計數 dropdown
	$('.changePercent-dropdown .dropdown-menu > li').click(function()	{
		var menu_html = $(this).find('a').html();
		$(this).parents('.changePercent-dropdown').find('.changePercent-dropdown-menu').html(menu_html);

		var category = $(this).attr('data-type').split(',')[0];
		var type = $(this).attr('data-type').split(',')[1];
		
		generate_grid({[category+'StatisticGrid']:GLOBALS.percentStatistic_switch[category][type]},category);		
	});	
	
	//圖表x軸文字的顯示 or 隱藏
	$('.xAxisDisplay-dropdown .dropdown-menu > li').click(function()	{
		var now_chart_type = $('#'+$(this).attr('data-parent-clue')).find('.changeChartType-dropdown-menu span:eq(1)').attr('data-lang-id') == 'histogram' ? 'bar':'line';	//目前的圖表類型
		generate_chart([$(this).attr('data-gridID')],{type:'xAxisDisplay',param:{value:$(this).attr('data-value'),chart_type:now_chart_type}});
	});
	
	//粉紅小視窗
	$(document).on('click','.landing-range-label-active',function()	{
		var centerWidth = ($(window).width() / 2) - ($('#collate-window').width() / 2);
		var centerHeight = ($(window).height() / 2) - ($('#collate-window').height() / 2);	
		var title,htmlContent;
		
		if($(this).attr('id') === 'landing-range-label')	{
			title = '範圍內的經典列表';
			htmlContent = GLOBALS.search_range.valuesTmp.split(',').map(function(work)	{	if(GLOBALS.jinlu[work])  return work+' '+GLOBALS.jinlu[work].title;	}).filter(function(jing)  { return jing; }).join('<br/>');
		}
		else	{	
			title = '只搜尋下列經典';
			htmlContent = GLOBALS.search_range.values.split(',').map(function(work)	{	if(GLOBALS.jinlu[work])  return work+' '+GLOBALS.jinlu[work].title;	}).filter(function(jing)  { return jing; }).join('<br/>');
		}
			
		$('#collate-window').css({'left':centerWidth,'top':centerHeight}).find('[role="main-title"]').text(title).end().find('[role="collate-window-content"]').html(htmlContent).end().show();
	});
	
	//資料頁的「增加新詞」按鈕
	$('#table-add-term-btn').on('click',function()	{
		var term = prompt(LANG[GLOBALS.lang]['msg-5']);
		if(term && !$('.search-result-label').map(function()	{  return $(this).attr('kw');  }).get().some(function(kw)  {  return term == kw;  }  ))	{
			GLOBALS.dataPage_updated = true;	//切換到資料頁需更新
			search_kwic(term,true);
			//saveMainDataToTmp();	//有異動，需存到暫存檔，但因為非同步，故寫在search_kwic()裡面不是寫在這
		}
		else if(term === "")	{
			alert("Please enter a keyword");
			return false;
		}
		else if(term === null)	{
			var pass = true;
		}
		else	{
			alert("The keyword is repeat.");
			return false;
		}
	});
	
	//另開視窗顯示經的google map分佈
	$(document).on('click','#open_jing_map_btn , #open_jing_table_btn',function()	{
		var data = $(this).attr('data-catalog') == 'jingLevel' ? GLOBALS.detailInfoLastObj['jingLevel']:GLOBALS.detailInfoLastObj['all'];	//分為全域跟jingLevel層次，於此判斷要用哪個全域變數
		var open_window;
		
		if($(this).attr('id') === 'open_jing_map_btn')	{
			open_window = window.open('plugin/map.html');
		}
		else if($(this).attr('id') === 'open_jing_table_btn')	{
			open_window = window.open('plugin/time_table.html');
		}		
		
		if(open_window)	{
			//console.log(open_window)
			open_window.data_from_parent = data;	//特殊技巧，將新開視窗的變數與這邊共用，就不用post上傳那麼久了
		}
		
		
	});
	
	
	//統計grid匯出按鈕
	$('.statisticGridExport_btn').on('click',function()	{
		exportToExcel('statistic_grid',$(this).attr('data-gridid'));
	});
	
	
	//卷level之kwic匯出按鈕
	$('#juan_kwic_export_btn').click(function()	{
		return;
		alert(123)
	});
	
	//任何內文中的經號可click直接到該經的卷level view
	$(document).on('click','.single-jing',function()	{
		generate_juan_chart('juanLevelChart',$(this).data('work'),null);
	});
	
	
	/*
	//scroll到內容
	$(document).on('click','.selector-multi-level-btn,.selector-btn-final',function()	{
		var target_val = $(this).attr('target');
		toContent($('a[name="'+target_val+'"]').get(0));
	});	
	*/

	
	//小視窗拖曳功能 + 
	var gMapFrameDrag = false;
	var gMapFrameDragClickedX = 0,
		gMapFrameDragClickedY = 0;
	$(document).mousemove(function(e)	{	
		if(gMapFrameDrag)	
			$('#collate-window').css({'left':e.pageX-(gMapFrameDragClickedX),'top':e.pageY-(gMapFrameDragClickedY)});
	});	
	$('#collate-window > div[role="collate-window-header"]').mousedown(function(e)	{	
		//alert(e.target.id)
		gMapFrameDrag = true;
		gMapFrameDragClickedX = e.pageX-parseInt($('#collate-window').css('left'));
		gMapFrameDragClickedY = e.pageY-parseInt($('#collate-window').css('top'));								
		
	});
	$('#collate-window > div[role="collate-window-header"]').mouseup(function()	{	
		gMapFrameDrag = false;
	});			
		
	//小視窗拖曳功能 -		
	
	/*
	//新的單框搜尋按enter啟動(預設啟動分析)
	$('#landing-main-text').keyup(function(e)	{
		if(e.which == 13)	$('#landing-main-btn-analysis').trigger('click');
	});
	*/

	
	//新的單框搜尋、分析按鈕啟動
	$('#landing-main-btn-search , #landing-main-btn-analysis').click(function()	{
		var keywords = $('#landing-main-text').val().replace(/\s+/g,' ').split(new RegExp(GLOBALS.spliter.join('|','g'))).filter(function(i) { return $.trim(i) !== '' }).map(function(i) { return $.trim(i); });
		var clicked_btn_id = $(this).attr('id');
		var tasks = [];
		
		$('#landing-main-text , #landing-main-select-range , #landing-main-btn-search , #landing-main-btn-analysis').prop('disabled',true).addClass('search-item-disabled');
		
		keywords.forEach(function(kw)	{
			if(location.hostname == GLOBALS.prodHost)	{	//紀錄使用者搜了什麼關鍵字，送到ga(just in prod server)
				ga('send', 'event', 'Search Terms', 'Normal term search event', kw);
			}
			
			tasks.push(check_kweywords_count(kw));
		});
		
		$.when.apply($,tasks).then(function()	{	//非同步取得所有關鍵字個別筆數
			//console.log('all ajax done');
			var all_keyword_sum;
			all_keyword_sum = Object.values(arguments).reduce(function(prev_handled,res_obj)	{
				return prev_handled += parseInt(res_obj.split('[PTT]')[1],10);
			},0);
			
			$('#landing-main-text , #landing-main-select-range , #landing-main-btn-search , #landing-main-btn-analysis').prop('disabled',false).removeClass('search-item-disabled');
			
			//console.log(arguments)
			if(all_keyword_sum > GLOBALS.totalRecordLimit)	{
				// confirm dialog
				var kw_count_html = [];
				for(var ii in arguments)	{
					var kww = arguments[ii].split('[PTT]')[0];
					var count = arguments[ii].split('[PTT]')[1];
					kw_count_html.push('<tr><td style="text-align:left">'+kww+'</td><td style="text-align:left">'+count+'</td></tr>');
				}
				kw_count_html = "<table class='table'><thead><tr><th>"+LANG[GLOBALS.lang]['term']+"</th><th>"+LANG[GLOBALS.lang]['counts']+"</th></tr></thead><tbody>"+kw_count_html.join('')+"</tbody></table>";
				
				alertify.set({
					labels: {
						ok:"Yes",
						cancel:"No"
					},
					buttonFocus:"none"
				});
				alertify.confirm("<h4 style='text-align:left'>"+LANG[GLOBALS.lang]['msg-7']+"</h4>"+kw_count_html, function(e) {
					if (e) {
						// user clicked "ok"
						prepare_search(clicked_btn_id);
					} else {
						// user clicked "cancel"
					}
				});	
			}
			else	{
				prepare_search(clicked_btn_id);
			}
		});
		

		return;
		
		

		
	});
	
	//取消開始分析
	$('#cancel-search-btn').on('click',function()	{
		GLOBALS.search_xhrs.forEach(function(xhr)	{
			xhr.abort();
		});
		$('.header-nav-btns').removeClass('page_disable');
		$('#search-progress-label,#search-progress-bar').hide();
		$('#term-progress-modal').modal('hide');
	});	
	
	//表格(搜尋)、分析view切換按鈕
	$('.switch-btns').click(function()	{
		$('.switch-btns').removeClass('switch-btns-active');
		if($(this).hasClass('switch-search-btn'))	{			//切換至表格
			$('.switch-search-btn').addClass('switch-btns-active');
			toView('table');
		}
		else if($(this).hasClass('switch-analysis-btn'))	{	//切換至分析
			$('.switch-analysis-btn').addClass('switch-btns-active');
			if(GLOBALS.dataPage_updated)	{	//資料頁有更新資料的話，就重新統計
				get_statistic($('#change-aggregation-modal :radio:checked').val());
				GLOBALS.dataPage_updated = false;	//重設flag
			}
			toView('statistic',GLOBALS.lastAggregation);
			pushBrowserState('statistic',GLOBALS.lastAggregation,$('#change-aggregation-modal :radio:checked').val());		
		}
	});
	
	//搜尋結果grid(#jqGrid)的lb click 要連回online
	$(document).on('click','#jqGrid td[role="gridcell"][aria-describedby="jqGrid_lb"]',function()	{	
		var vol = $(this).siblings('[aria-describedby="jqGrid_vol"]').text();
		var lb = $(this).text();
		window.open(GLOBALS.cbetaonline_url+vol+'p'+lb);
	});
	
	
	
	//popstate 事件，實做pjax，啟動時切換經
	$(window).on('popstate',function()	{
		if(history.state && history.state != '')	{			
			var state = history.state;
			toView(state.view,state.param);
			if(state.re_statistic)	{	//有給re_statistic需重新執行get_statistic
				get_statistic(re_statistic);
			}
		}
	});	

}