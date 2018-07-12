/*
 * Author: 李阿閒@dila
*/

function prepare_search(clicked_btn_id)	{
	var keywords = $('#landing-main-text').val().replace(/\s+/g,' ').split(new RegExp(GLOBALS.spliter.join('|','g'))).filter(function(i) { return $.trim(i) !== '' }).map(function(i) { return $.trim(i); });
	//console.log(keywords)
	if(keywords.length > 0)	{
		GLOBALS.new_keywords = keywords;
		if(GLOBALS.new_keywords.length > 0)	{
			GLOBALS.search_range.values = GLOBALS.search_range.valuesTmp; //確定要分析後，將tmp值設給真正用到的GLOBALS.search_range.values
			if(GLOBALS.search_range.values)	
				$('#table-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');	//根據GLOBALS.search_range.values，有值的話設定label為「自訂範圍」
			else
				$('#table-range-label').text(LANG[GLOBALS.lang]['all-taisho']).removeClass('landing-range-label-active');
				
				
			$('.switch-search-analysis-area > .switch-btns').removeClass('switch-btns-active');
			if(clicked_btn_id === 'landing-main-btn-search')	{
				$('.switch-search-analysis-area .switch-search-btn').addClass('switch-btns-active');
				GLOBALS.mainClickedBtn = 'search';
			}
			else if(clicked_btn_id === 'landing-main-btn-analysis')	{
				$('.switch-search-analysis-area .switch-analysis-btn').addClass('switch-btns-active');
				GLOBALS.mainClickedBtn = 'analysis';
			}
				
				
			$('#search-progress-label').show();
			$('#term-progress-modal').modal('show');
			$('.header-nav-btns').addClass('page_disable');
				
				
			//啟動開始分析需將所有變數回到初始狀態 +
			GLOBALS.search_data = {};
			GLOBALS.active_keyword = false;
			$('#search-result-lists').html('');	//清空關鍵字labels
			GLOBALS.colorSet.colorIndex = 0;	//顏色計數器要歸零
			GLOBALS.search_data_color = {};		//顏色要清空
			GLOBALS.gogogoBtn_finished_counter = 0;
			GLOBALS.search_xhrs = [];
			//啟動開始分析需將所有變數回到初始狀態 -
				
			GLOBALS.new_keywords.forEach(function(kw)	{					
				//$('#search-text').val(kw);
				search_kwic(kw);
			});	
		}
	}				
}

function search_kwic(kw,not_gogogo)	{
	var counter = 0,cc=0;
	var resData = [];
	var keywords = kw ? [kw]:$.trim($('#search-text').val()).split(',').map(function(item)	{	return $.trim(item);	});
	var activeLabel_color = GLOBALS.colorSet.colors[((GLOBALS.colorSet.colorIndex++) % 10)];	//每次搜尋選定不同顏色
	
	var search_action = function(json,keyword,parseJSON)	{
		if(parseJSON)	json = $.parseJSON(json);
			
		if(parseInt(json.num_found,10) > 0)	{
			
			if(not_gogogo && (check_kweyword_count_by_label()+parseInt(json.num_found,10) > GLOBALS.totalRecordLimit))	{	//於資料頁新增新詞時也要檢查最大筆數
				if(!confirm(LANG[GLOBALS.lang]['msg-7']))	{
					$('#gbox_jqGrid').unblock();
					return;
				}
			}
			
			for(var ji in json.results)	{
				//var jinlu_obj = GLOBALS.jinlu.findKey({work:json.results[ji].work});
				var jinlu_obj = GLOBALS.jinlu[json.results[ji].work];
				if(!jinlu_obj)	continue;
				
				//json.results[ji].kwic = json.results[ji].kwic.replace(keyword,"<mark style='background-color:inherit;color:"+activeLabel_color+";font-weight:bold'>"+keyword+"</mark>");
				var hlTextArr = keyword.split('');	//由於ray的資料有一堆tag，必須做跨tag hl，先將字拆成陣列...
				var regexp_pattern = [];
				for(var hti in hlTextArr)	{
					//做跨tag hl...(可跨 1. <tag>..</tag>、2. <br />、3.下列標點符號)，規則可能不足，有需要得新增
//					['\\(','\\)','，','。','！','…','、','「','」','\\.','\\,','》','《','：','）','（','；','？','　','─','"',"'",'\\*','︰','〉','〈','』','『','．','－','～','＼','｡','\\?'],
					regexp_pattern.push(hlTextArr[hti]+'(<[^>]+>[^<]+<\/[^>]+>|<a class="noteAnchor"[^>]+></a>|<br.*?/>|：|。|，|、|「|」|《|》|（|）|\\(|\\)|！|…|\\.|\\\|；|？|　|─|"|\\*|︰|〉|〈|』|『|．|－|～|＼|｡|\\?)*?');
				}
				var r = new RegExp('('+regexp_pattern.join('')+')','g');					
				json.results[ji].kwic = json.results[ji].kwic.replace(r,"<mark style='background-color:inherit;color:"+activeLabel_color+";font-weight:bold'>$1</mark>");				
				
				resData.push({id:++cc,category:jinlu_obj.category,work:jinlu_obj.work,title:jinlu_obj.title,kwic:json.results[ji].kwic,lb:json.results[ji].lb,dynastyYear:jinlu_obj.time,authors:jinlu_obj.authors,vol:json.results[ji].vol,juan:json.results[ji].juan,deleted:0});
							
			}
		}

		//if(++counter == keywords.length)	{
						
			GLOBALS.search_data[kw] = resData;
			GLOBALS.active_keyword = kw;
			$('#search-result-lists .label-active').removeClass('label-active');
			$('#search-result-lists').append('<span kw="'+kw+'" class="label label-active search-result-label" style="background-color:'+activeLabel_color+'">'+kw+'(<span class="search-result-label-count">'+resData.length+'</span>)<button class="close search-result-label-close" type="button" style=""><span aria-hidden="true">×</span></button></span>');
			GLOBALS.search_data_color[kw] = activeLabel_color;	//根據關鍵字紀錄顏色
						
			reload_grid("#jqGrid",resData);	
			$('#gbox_jqGrid').unblock(); 
			if(not_gogogo)	{	//於資料頁增加新詞後要把progress-bar隱藏
				$('#search-progress-bar').hide();
				saveMainDataToTmp();	//增加新詞後也需要存到暫存檔
			}
			
			if(!not_gogogo && ++GLOBALS.gogogoBtn_finished_counter == GLOBALS.new_keywords.length)	{	//全部關鍵字ajax做完後的動作
				$('#search-progress-bar').hide();
				$('#term-progress-modal').modal('hide');
				
				get_statistic('bulei');	//預設執行部類匯總
				
				//根據首頁按的是搜尋還是分析決定要看哪個view
				if(GLOBALS.mainClickedBtn === 'search')	{
					toView('table');
					pushBrowserState('table');
				}
				else if(GLOBALS.mainClickedBtn === 'analysis')	{
					toView('statistic','bulei');	
					pushBrowserState('statistic','bulei','bulei');
				}
				
				saveMainDataToTmp();	//完成時存一份資料到暫存檔
				
				//將原頁面回到landing頁的初始狀態 +
				GLOBALS.search_range.valuesTmp = false;		//清空範圍tmp(真正的GLOBALS.search_range.values需保留，因為資料頁增加新詞時還會用到範圍)
				$('#landing-range-label').text(LANG[GLOBALS.lang]['all-taisho']).removeClass('landing-range-label-active');
				$('#landing-range-selected').text(LANG[GLOBALS.lang]['all-taisho']);
				$('#landing-main-text').val('');			//清空搜尋框
				//將原頁面回到landing頁的初始狀態 -
			}
			
		//}		
	};
	
	
	$('#gbox_jqGrid').block({ 
		message: '<h1>Processing...</h1>', 
		css: { 'background-color':'inherit','top':'50px','border':'none','color':'white' } 
	}); 
	
	
	$("#jqGrid")[0].grid.beginReq();
	$('#del_selected_row_btn').hide();
	GLOBALS.keywords = [];
	for(var i in keywords)	{
		(function(keyword)	{
			GLOBALS.keywords.push(keyword);
			//$.getJSON(GLOBALS.API_prefix+'kwic2?q='+encodeURIComponent(keyword)+'&edition=CBETA&rows=99999&callback=?',function(json)	{
			if(GLOBALS.isLocal)	{
				search_action(STATIC_SEARCH_TEST[keyword],keyword,false);
			}
			else	{
				
				GLOBALS.search_xhrs.push(
					$.ajax({
						type:'POST',
						data:'type=kwic&kw='+encodeURIComponent(keyword)+(GLOBALS.search_range.values ? '&works='+GLOBALS.search_range.values :''),
						url:'getData.php',
						xhr: function () {	//下載進度實驗
							var xhr = new window.XMLHttpRequest();
							//Download progress
							xhr.addEventListener("progress", function (evt) {
								$('#search-progress-label').hide();
								$('#search-progress-bar > [role="progressbar"]').attr({'aria-valuenow':0}).css({'width':'0%'}).text('0%').parent().show();	//進度條歸0
						
								var content_length = evt.target.getResponseHeader("X-Content-Length");	//X-Content-Length為我客製化的header，內容為gzip後的大小，因content-length與gzip在http規範中不能同時使用只好這樣做
								//if (evt.lengthComputable) {
									var percentComplete = evt.loaded / content_length;	//如果有conten-length header，就可使用evt.total
									var percent = Math.round(percentComplete * 100);									
									$('#search-progress-bar > [role="progressbar"]').attr({'aria-valuenow':percent}).css({'width':percent+'%','background-color':activeLabel_color}).text('「'+keyword+'」:'+percent+'%');
									//console.log(percent+' '+content_length)
									if(percent >= 100)	{
										$('#search-progress-bar > [role="progressbar"]').append('...is done..please wait....');
									}
									
								//}
							}, false);
							return xhr;
						},		
						success:function(json,status,xhr)	{
							//console.log( xhr.getResponseHeader("X-Content-Length"));
							search_action(json,keyword,true);
						}
					})
				);			
			}
		})(keywords[i]);
	}
}

function check_kweyword_count_by_label()	{
	var c = 0;
	$('.search-result-label-count').each(function()	{
		c += parseInt($(this).text(),10);
	});
	return c;
}

//開始搜尋前檢查各關鍵字筆數用的func
function check_kweywords_count(kw)	{
	var deferred = $.Deferred();
			
	$.ajax({
		type:'POST',
		data:'type=getResultCount&kw='+encodeURIComponent(kw)+(GLOBALS.search_range.valuesTmp ? '&works='+GLOBALS.search_range.valuesTmp :''),
		url:'getData.php',	
		success:function(json,status,xhr)	{
			json = $.parseJSON(json);
			//console.log(json.num_found);
			deferred.resolve(kw+'[PTT]'+json.num_found);
		}
	});
		
	return deferred.promise();
}
	
function reload_grid(grid_id,data)	{
	
	if($('#gbox_jqGrid').is(':hidden'))	{	//first search
		$('#gbox_jqGrid,#export_files_btn').show();
	}
	
	$(grid_id).jqGrid('clearGridData');
	$(grid_id).jqGrid('setGridParam', { data: data});	// set the new data
	$(grid_id)[0].grid.endReq();	// hide the show message
	$(grid_id).trigger('reloadGrid');	// refresh the grid		
}

function get_dynasty_range_str(s_year,e_year)	{
	s_year = parseInt(s_year,10);
	e_year = parseInt(e_year,10);
	return '  ('+s_year+' '+(s_year <= 0 ? 'BCE':'CE')+' ~ '+e_year+' '+(e_year <= 0 ? 'BCE':'CE')+')';
}

function get_statistic(catalog)	{	
	var bulei = {},
		dynasty_linear = {},
		authors = {},
		custom = {},
		jings = {};
	
	
	if(catalog === 'bulei')	{	//部類summary 
	
		$('#bulei-statistic-table-area .changePercent-dropdown .changePercent_btn .changePercent-dropdown-menu').html($('#bulei-statistic-table-area .changePercent-dropdown .dropdown-menu li [role="count"]').html());	//重新彙總後，比例按鈕要回到預設狀態
		
		var exist_bulei = $.extend([],GLOBALS.bulei);	//先建立所有部類陣列，先將預設的繼承，因為使用者可能增加自訂部類
		for(var kw in GLOBALS.search_data)	{	
			for(var i in GLOBALS.search_data[kw])	{
				var categories = GLOBALS.search_data[kw][i].category.split(',');	//部類多值處理
				for(var cai in categories)	{
					if($.inArray(categories[cai],exist_bulei) == -1)	exist_bulei.push(categories[cai]);
				}
			}
		}
		
		for(var bi in exist_bulei)	{	//建立資料模型並初始化
			for(var kw in GLOBALS.search_data)	{
				if(!bulei[exist_bulei[bi]])	{
					bulei[exist_bulei[bi]] = {};
				}			
				bulei[exist_bulei[bi]][kw] = 0;
			}		
		}	

		
		for(var kw in GLOBALS.search_data)	{	//填入統計資料
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				var buleis = GLOBALS.search_data[kw][i].category.split(',')	//部類多值處理
				for(var bui in buleis)	{
					bulei[buleis[bui]][kw]++;
				}
			}		
		}
		
		
		//比例計算
		var bulei_percent = $.extend(true, {}, bulei);	//拷貝一份bulei來重算比例百分比統計
		for(var bulei_label in bulei_percent)	{
			for(var bulei_kw in bulei_percent[bulei_label])	{
				bulei_percent[bulei_label][bulei_kw] = ((bulei_percent[bulei_label][bulei_kw] / GLOBALS.bulei_words_count[bulei_label])*100).toFixed(6);
			}
		}
		
		//將筆數、比例百分比的統計資訊存入變數，以方便後續按鈕切換顯示
		GLOBALS.percentStatistic_switch[catalog].count = bulei;
		GLOBALS.percentStatistic_switch[catalog].percent = bulei_percent;	

		
		generate_grid({buleiStatisticGrid:bulei},catalog);
	}
	
	
	if(catalog === 'dynastyLinear')	{			//線狀年代summary
	
		$('#dynastyLinear-statistic-table-area .changePercent-dropdown .changePercent_btn .changePercent-dropdown-menu').html($('#dynastyLinear-statistic-table-area .changePercent-dropdown .dropdown-menu li [role="count"]').html());	//重新彙總後，比例按鈕要回到預設狀態

	
		for(var dy in GLOBALS.linear_dynasties)	{	//建立資料模型並初始化
			var dynasty_name = GLOBALS.linear_dynasties[dy].split(',')[0];
			var dynasty_year_center = Math.round((parseInt(GLOBALS.linear_dynasties[dy].split(',')[1],10) + parseInt(GLOBALS.linear_dynasties[dy].split(',')[2],10)) / 2);
			var dynasty_year_range = get_dynasty_range_str(GLOBALS.linear_dynasties[dy].split(',')[1],GLOBALS.linear_dynasties[dy].split(',')[2]);
			
			for(var kw in GLOBALS.search_data)	{
				if(!dynasty_linear[dynasty_name+dynasty_year_range+';'+dynasty_year_center])	{
					dynasty_linear[dynasty_name+dynasty_year_range+';'+dynasty_year_center] = {};
				}			
				dynasty_linear[dynasty_name+dynasty_year_range+';'+dynasty_year_center][kw] = 0;
			}		
		}
		
		for(var kw in GLOBALS.search_data)	{	//填入統計資料
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				
				for(var dyi in GLOBALS.linear_dynasties)	{
					var dyData = GLOBALS.linear_dynasties[dyi].split(',');
					var dyRange = get_dynasty_range_str(GLOBALS.linear_dynasties[dyi].split(',')[1],GLOBALS.linear_dynasties[dyi].split(',')[2]);
					if(parseInt(GLOBALS.search_data[kw][i].dynastyYear,10) >= parseInt(dyData[1],10) && parseInt(GLOBALS.search_data[kw][i].dynastyYear,10) < parseInt(dyData[2],10))	{
						dynasty_linear[dyData[0]+dyRange+';'+Math.round((parseInt(dyData[1],10)+parseInt(dyData[2],10)) / 2)][kw]++;					
					}				
				}
			}		
		}

		
		//比例計算
		var dynasty_linear_percent = $.extend(true, {}, dynasty_linear);	//拷貝一份dynasty_linear來重算比例百分比統計
		for(var dy_label in dynasty_linear_percent)	{
			for(var dy_kw in dynasty_linear_percent[dy_label])	{
				dynasty_linear_percent[dy_label][dy_kw] = ((dynasty_linear_percent[dy_label][dy_kw] / GLOBALS.dynasty_linear_words_count[dy_label])*100).toFixed(6);
			}
		}
		//console.log(dynasty_linear_percent)
		
		//將筆數、比例百分比的統計資訊存入變數，以方便後續按鈕切換顯示
		GLOBALS.percentStatistic_switch[catalog].count = dynasty_linear;
		GLOBALS.percentStatistic_switch[catalog].percent = dynasty_linear_percent;
		
		generate_grid({dynastyLinearStatisticGrid:dynasty_linear},catalog);
	}
	
	if(catalog === 'authors')	{		//作譯者summary
	
		$('#authors-statistic-table-area .changePercent-dropdown .changePercent_btn .changePercent-dropdown-menu').html($('#authors-statistic-table-area .changePercent-dropdown .dropdown-menu li [role="count"]').html());	//重新彙總後，比例按鈕要回到預設狀態
	
		var exist_authors = [];
		for(var kw in GLOBALS.search_data)	{	//先建立所有人名陣列
			for(var i in GLOBALS.search_data[kw])	{
				for(var ai in GLOBALS.search_data[kw][i].authors)	{
					if($.inArray(GLOBALS.search_data[kw][i].authors[ai],exist_authors) == -1)	exist_authors.push(GLOBALS.search_data[kw][i].authors[ai]);
				}
			}
		}
		
		for(var ai in exist_authors)	{	//建立資料模型並初始化
			for(var kw in GLOBALS.search_data)	{
				if(!authors[exist_authors[ai]])	{
					authors[exist_authors[ai]] = {};
				}			
				authors[exist_authors[ai]][kw] = 0;
			}		
		}
		

		
		for(var kw in GLOBALS.search_data)	{	//填入統計資料
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				
				for(var ai in GLOBALS.search_data[kw][i].authors)	{
					authors[GLOBALS.search_data[kw][i].authors[ai]][kw]++;
				}
			}		
		}	
		
		
		//比例計算
		var authors_percent = $.extend(true, {}, authors);	//拷貝一份bulei來重算比例百分比統計
		for(var authors_label in authors_percent)	{
			for(var authors_kw in authors_percent[authors_label])	{
				authors_percent[authors_label][authors_kw] = ((authors_percent[authors_label][authors_kw] / GLOBALS.author_words_count[authors_label])*100).toFixed(6);
			}
		}
		
		//將筆數、比例百分比的統計資訊存入變數，以方便後續按鈕切換顯示
		GLOBALS.percentStatistic_switch[catalog].count = authors;
		GLOBALS.percentStatistic_switch[catalog].percent = authors_percent;	
		
		generate_grid({authorsStatisticGrid:authors},catalog);
	}
	
	
	if(catalog === 'custom')	{		//custom summary
		for(var cusi in GLOBALS.customDefined)	{	//建立資料模型並初始化
			var jing_name = GLOBALS.customDefined[cusi].split(',')[0];
			for(var kw in GLOBALS.search_data)	{
				if(!custom[jing_name])	{
					custom[jing_name] = {};
				}			
				custom[jing_name][kw] = 0;
			}		
		}
		
		for(var kw in GLOBALS.search_data)	{	//填入統計資料
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				for(var cusi in GLOBALS.customDefined)	{
					var jing_name = GLOBALS.customDefined[cusi].split(',')[0];
					var jing_work = GLOBALS.customDefined[cusi].split(',')[1];
					if(GLOBALS.search_data[kw][i].work == jing_work)
						custom[jing_name][kw]++;
				}			
			}		
		}	
		generate_grid({customStatisticGrid:custom},catalog);
	}
	
	if(catalog === 'jings')	{		//所有經summary
	
		$('#jings-statistic-table-area .changePercent-dropdown .changePercent_btn .changePercent-dropdown-menu').html($('#jings-statistic-table-area .changePercent-dropdown .dropdown-menu li [role="count"]').html());	//重新彙總後，比例按鈕要回到預設狀態

		
		var exist_jings = [];
		for(var kw in GLOBALS.search_data)	{	//先建立所有經陣列（有搜尋結果才建）
			for(var i in GLOBALS.search_data[kw])	{
				if($.inArray(GLOBALS.search_data[kw][i].work,exist_jings) == -1)	exist_jings.push(GLOBALS.search_data[kw][i].work+' '+GLOBALS.search_data[kw][i].title);
				
			}
		}
		
		for(var ji in exist_jings)	{	//建立資料模型並初始化
			for(var kw in GLOBALS.search_data)	{
				if(!jings[exist_jings[ji]])	{
					jings[exist_jings[ji]] = {};
				}			
				jings[exist_jings[ji]][kw] = 0;
			}		
		}
		

		
		for(var kw in GLOBALS.search_data)	{	//填入統計資料
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				
				jings[GLOBALS.search_data[kw][i].work+' '+GLOBALS.search_data[kw][i].title][kw]++;
			}		
		}	
		
		//比例計算
		var jings_percent = $.extend(true, {}, jings);	//拷貝一份dynasty_linear來重算比例百分比統計
		for(var jings_label in jings_percent)	{
			for(var jings_kw in jings_percent[jings_label])	{
				jings_percent[jings_label][jings_kw] = ((jings_percent[jings_label][jings_kw] / GLOBALS.jinlu[jings_label.split(' ')[0]].word_count)*100).toFixed(6);
			}
		}
		
		//將筆數、比例百分比的統計資訊存入變數，以方便後續按鈕切換顯示
		GLOBALS.percentStatistic_switch[catalog].count = jings;
		GLOBALS.percentStatistic_switch[catalog].percent = jings_percent;		
		
		
		generate_grid({jingsStatisticGrid:jings},catalog);
	}	
	
	GLOBALS.lastAggregation = catalog;
	GLOBALS.detailInfoLastObj['all'] = GLOBALS.search_data;	//準備產生detail 座標時間分析，但因為有label切換功能，故用全域變數已方便之後切換，第一層之匯總皆屬於全域範圍
	generate_detail(catalog);	//產生座標、前後字分析
	
}

function generate_grid(dataObj,catalog)	{
	//建立grids
	var categories = {[LANG[GLOBALS.lang]['statisticGrid_bulei']]:'buleiStatisticGrid',[LANG[GLOBALS.lang]['statisticGrid_dynasty_linear']]:'dynastyLinearStatisticGrid',[LANG[GLOBALS.lang]['statisticGrid_author']]:'authorsStatisticGrid','Custom Defined':'customStatisticGrid',[LANG[GLOBALS.lang]['all-jings']]:'jingsStatisticGrid'};
	for(var ci in categories)	{
		//console.log(ci)
		var colModelDynamic = [
			{ label: 'ID', name: 'id', width: 45, key: true ,hidden:true,sorttype: 'integer'},
			{ label: 'deleted row', name: 'deleted', width: 10,hidden:true },
		];		
		
		//如果是現狀朝代則使用DyYearCenter做自訂排序，因朝代需要照年代而不是字串，其餘type則照預設的字串(text)排序
		var category_sorttype = categories[ci] == 'dynastyLinearStatisticGrid' ? function(cell, rowData)	{	return parseInt(rowData.DyYearCenter,10);	} :'text';	
		colModelDynamic.push({ label: ci, name: 'category', width: 70 ,sorttype:category_sorttype});
		
		for(var kw in GLOBALS.search_data)	{	//動態新增colModel by 關鍵字
			var formatter_obj = ($('#'+catalog+'-statistic-table-area .changePercent-dropdown > .changePercent_btn span[role="percent"]').size() > 0 ? function(cellvalue, options, rowObject)	{ return cellvalue+' %'; } : false);	//如果按鈕切到比例顯示時，加入顯示小數和百分比的formatter
			colModelDynamic.push({ label: kw, name: kw, width: 60,sorttype: 'integer' , classes:'colorsSet_'+GLOBALS.colorSet.colors.indexOf(GLOBALS.search_data_color[kw]),formatter:formatter_obj	});
		}
		
		colModelDynamic.push({ label: [LANG[GLOBALS.lang]['statisticGrid_del']], name: 'deleted_label', width: 15,hidden:true});	//原可以照delete排序用的label，暫時不用，hidden設為true
		
		if(categories[ci] == 'dynastyLinearStatisticGrid')	colModelDynamic.push({ label: 'DyYearCenter', name: 'DyYearCenter', width: 15, hidden:true,sorttype: 'integer'});	//線狀朝代新增年代西元年中點欄位
		
		
		//重新產生物件前如果先前已有必須先GridUnload
		if($('#gbox_'+categories[ci]).size() > 0)	$.jgrid.gridUnload("#"+categories[ci]);

		$("#"+categories[ci]).jqGrid({
			datatype: "local",
			editurl: 'clientArray',	//編輯模式(含刪除)需用到，固定此值即可
			colModel: colModelDynamic,
			loadonce: false,
			viewrecords: true,
			width: 550,//原本的滿版：1090
			height: 'auto',
			rowNum: 100000,
			rownumbers: true, 
			rownumWidth: 50, 
			multiselect: true,
			sortname : 'id',
			onSelectRow: function (rowId, status, e) {	//使用checkbox勾選時即進行隱藏/顯示
				if(status)	{
					$(this).find('tbody > tr[id="'+rowId+'"]').removeClass('tr_deleted');
					$(this).jqGrid('setCell',rowId,'deleted',0);	//設定資料的deleted欄位為0
					$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
				}
				else 	{
					$(this).find('tbody > tr[id="'+rowId+'"]').addClass('tr_deleted');
					$(this).jqGrid('setCell',rowId,'deleted',1);	//設定資料的deleted欄位為1	
					$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');
				}
			},
			beforeSelectRow: function (rowid, e) {	//阻擋在multiselect時，點擊row就會自動select的功能，強制只能點選checkbox
				var $myGrid = $(this),
					i = $.jgrid.getCellIndex($(e.target).closest('td')[0]),
					cm = $myGrid.jqGrid('getGridParam', 'colModel');
				return (cm[i].name === 'cb');
			},				
			onSelectAll: function (rowIds, status) {	//使用checkbox勾選時即進行隱藏/顯示
				for(var i in rowIds)	{
					if(status)	{
						$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').removeClass('tr_deleted');
						$(this).jqGrid('setCell',rowIds[i],'deleted',0);	//設定資料的deleted欄位為0
						$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
					}
					else 	{
						$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').addClass('tr_deleted');
						$(this).jqGrid('setCell',rowIds[i],'deleted',1);	//設定資料的deleted欄位為1
						$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');						
					}
				}				
			},			
			gridComplete: function () {
			
				//在內建的grid完成refresh後，我自己加的class會不見，故於此將class塞回去
				var allDataObj = jQuery(this).jqGrid('getGridParam', 'data');
		
				for(var i in allDataObj)	{
					if(allDataObj[i].deleted == 1)	{	//delete =1就塞回class
						var rowid = allDataObj[i].id;
						$(this).find('tbody > tr[id="'+rowid+'"]').addClass('tr_deleted');
					}
				}
			}
		});	

		for(var kw in GLOBALS.search_data)	{	//為colModel依據關鍵字上色
			$('#jqgh_buleiStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
			$('#jqgh_dynastyLinearStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
			$('#jqgh_authorsStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
			$('#jqgh_customStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
			$('#jqgh_jingsStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
		}		
	}
	
	//grid填入資料
	for(var gridID in dataObj)	{
		var resData = [],
			cc = 0,
			dataTmp = {};
		for(var category in dataObj[gridID])	{
			if(gridID == 'dynastyLinearStatisticGrid')	{	//線狀年代資料處理：取出category裡面分號的西元年中點資料並塞入colModel
				dataTmp = {id:++cc,'category':'<span class="grid2next">'+category.split(';')[0]+'</span>',DyYearCenter:category.split(';')[1]};
			}
			else	{
				dataTmp = {id:++cc,'category':'<span class="grid2next">'+category+'</span>'};
			}
			
			for(var kw in dataObj[gridID][category])	{
				dataTmp[kw] = dataObj[gridID][category][kw];	//統計次數
			}
			dataTmp['deleted'] = 0;	//是否隱藏，0=hide 1=show，預設全部顯示
			resData.push(dataTmp);
		}
		reload_grid('#'+gridID,resData);
		
	}
	
	//預設全選所有列
	for(var ci in categories)	{	
		$('#'+categories[ci]).jqGrid('resetSelection');
		var ids = $('#'+categories[ci]).getDataIDs();
		for (var i=0, il=ids.length; i < il; i++) {
			$('#'+categories[ci]).jqGrid('setSelection',ids[i], true);
		}	
	}
	
	$('.statistic-content').hide();
	$('#'+catalog+'-statistic-table-area').show();
	generate_chart([catalog+'StatisticGrid']);
}

function generate_chart(gridIDs,repaint_config)	{
	
	for(var gi in gridIDs)	{
		var chartID = gridIDs[gi].replace('StatisticGrid','Chart');
		var data;
		if(gridIDs[gi] == 'dynastyLinearStatisticGrid')				//朝代不可使用重新排序後的資料，因此用getGridParam
			data = jQuery('#'+gridIDs[gi]).jqGrid ('getGridParam', 'data');
		else	{
			//由於'getGridParam', 'data'是沒有排序的資料，故使用下列方法排序 ref：http://stackoverflow.com/questions/27867882/is-it-possible-to-get-all-jqgrid-rows-across-multiple-pages-in-the-currently-s
			data = jQuery('#'+gridIDs[gi]).jqGrid ('getGridParam', 'data');
			var query = $.jgrid.from(data);
			query.orderBy($('#'+gridIDs[gi]).jqGrid('getGridParam','sortname'),
						  $('#'+gridIDs[gi]).jqGrid('getGridParam','sortorder'), // or "d" for "desc" sorting
						  $('#'+gridIDs[gi]).jqGrid('getGridParam','sortname') == 'category' ? 'text':'integer',  // sorttype from colModel oder "text"
						  '', // typically ""
						  null); // typically null
			data = query.select();			
		}
		
		var chartLabel = [] , chartData = {};
		for(var i in data)	{
			if(data[i].deleted == 1)	continue;
			
			for(var prop_name in data[i])	{
				if($.trim(data[i][prop_name]) == '')	data[i][prop_name] = 0;
				if(prop_name == 'category')	chartLabel.push(data[i][prop_name].stripTags());	//category可能含有html tag，避免在畫圖時跑出來需stripTag掉
				else if(prop_name != 'deleted' && prop_name != 'deleted_label' && prop_name != 'id' && prop_name != 'DyYearCenter')	{	//非deleted、deleted_label、id、DyYearCenter即關鍵字統計資料，push之
					if(gridIDs[gi] == 'dynastyLinearStatisticGrid')	{	//dynastyLinearStatisticGrid 是線狀圖表，data資料部份需做成含有xy的物件，與其他不同需特殊處理
						if(!chartData[prop_name])	chartData[prop_name] = [];
						chartData[prop_name].push({x:data[i]['DyYearCenter'],y:data[i][prop_name]});	
					}
					else	{
						if(!chartData[prop_name])	chartData[prop_name] = [];
						chartData[prop_name].push(data[i][prop_name]);	
					}
				}
			}
		}
		
		//console.log(chartData)
		/*
		if(type == 'bulei' || type == 'authors')	GLOBALS.chart.type = 'bar';	//部類跟作者用長條圖
		else if(type == 'dynasty')	GLOBALS.chart.type = 'line';	//朝代用線圖
		*/
		
		var datasetSample =
				{
					label: "My First dataset",
					fill: false,
					lineTension: 0.1,
					backgroundColor: "rgba(75,192,192,0.4)",
					borderColor: "rgba(75,192,192,1)",
					borderCapStyle: 'butt',
					borderDash: [],
					borderDashOffset: 0.0,
					borderJoinStyle: 'miter',
					pointBorderColor: "rgba(75,192,192,1)",
					pointBackgroundColor: "#fff",
					pointBorderWidth: 1,
					pointHoverRadius: 5,
					pointHoverBackgroundColor: "rgba(75,192,192,1)",
					pointHoverBorderColor: "rgba(220,220,220,1)",
					pointHoverBorderWidth: 2,
					pointRadius: 1,
					pointHitRadius: 10,
					data: [],
				};
		
		
		//var chart_type = $('#gbox_'+gridIDs[gi]).prev('.statistic-tools').find('.chart-type-control > option:selected').val() || 'bar';	//根據select變換chart type
		GLOBALS.charts[chartID].data.labels = chartLabel;
		GLOBALS.charts[chartID].data.datasets = [];	//清空dataset準備重繪
		
		
		for(var kw in chartData)	{
			var new_dataset = jQuery.extend({}, datasetSample);	//物件是傳址，後面會蓋掉前面，要複製一份來用才對
			new_dataset.label = kw;	//kw為關鍵字名稱，拿來當key
			new_dataset.data = chartData[kw];
			new_dataset.backgroundColor = GLOBALS.search_data_color[kw];
			new_dataset.borderColor = GLOBALS.search_data_color[kw];
			new_dataset.pointBorderColor = GLOBALS.search_data_color[kw];
			new_dataset.pointHoverBackgroundColor = GLOBALS.search_data_color[kw];
			GLOBALS.charts[chartID].data.datasets.push(new_dataset);
		}

		if(repaint_config)	{
			var changeChartType;
			if(repaint_config.type == 'xAxisDisplay')
				changeChartType = repaint_config.param.chart_type;
			else if(repaint_config.type == 'changeChartType')
				changeChartType = repaint_config.param.value;
			
			
			var ctx = document.getElementById(chartID);
			var chart_data_config = jQuery.extend({}, GLOBALS.charts[chartID].data);	//複製一份上面的chart設定給新物件
			var tooltip_mode = changeChartType == 'line' ? 'index':'nearest';	//tooltip group的方式，依據type有所不同
			var scales_obj = {
				yAxes: [{
					ticks: {
						beginAtZero:false
					}
				}]
			};
			
			if(GLOBALS.has_xAxes_chartIDs.indexOf(chartID) == -1)	{	//根據has_xAxes_chartIDs 預設設定是否隱藏x軸
				scales_obj['xAxes'] = [{
					display: false
				}];			
			}
			
			if(repaint_config.type == 'xAxisDisplay')	{	//如有從介面額外設定x軸之顯示，就依此為主覆蓋上面if的x軸設定
				var display_xAxis = repaint_config.param.value == 'show' ? true:false;
				scales_obj['xAxes'] = [{
					display: display_xAxis
				}];					
			}
			
			GLOBALS.charts[chartID].destroy();
			GLOBALS.charts[chartID] = new Chart(ctx, {
				type: changeChartType,
				data: chart_data_config,
				options: {	
					scales:scales_obj,
					tooltips: {
						enabled: true,
						mode: tooltip_mode
					},
					onClick:function(evt)	{	//chart click event					
						chart_click_action(this,evt);	
					}				
				}
			});
		
		}
		else	{
			GLOBALS.charts[chartID].update();			
		}
	}
}


//產生各經chart
function generate_jing_chart(origChartID,label,value)	{
	
	//建立grid
	var colModelDynamic = [
		{ label: 'ID', name: 'id', width: 45, key: true ,hidden:true,sorttype: 'integer'},
		{ label: 'deleted row', name: 'deleted', width: 10,hidden:true },
	];		
	colModelDynamic.push({ label: LANG[GLOBALS.lang]['jing_level_gird_column1'], name: 'category', width: 70 });
	for(var kw in GLOBALS.search_data)	{	//動態新增colModel by 關鍵字
		colModelDynamic.push({ label: kw, name: kw, width: 60,sorttype: 'integer' , classes:'colorsSet_'+GLOBALS.colorSet.colors.indexOf(GLOBALS.search_data_color[kw])});
	}
		
	colModelDynamic.push({ label: 'Delete', name: 'deleted_label', width: 15,hidden:true});	//刪除之排序先藏起來
		
		
		
	//重新產生物件前如果先前已有必須先GridUnload
	if($('#gbox_jingLevelStatisticGrid').size() > 0)	$.jgrid.gridUnload("#jingLevelStatisticGrid");

	$("#jingLevelStatisticGrid").jqGrid({
		datatype: "local",
		editurl: 'clientArray',	//編輯模式(含刪除)需用到，固定此值即可
		colModel: colModelDynamic,
		loadonce: false,
		viewrecords: true,
		width: 550,	//原本滿版：1090
		height: 'auto',
		rowNum: 100000,
		rownumbers: true, 
		rownumWidth: 50, 
		multiselect: true,
		sortname : 'category',
		onSelectRow: function (rowId, status, e) {	//使用checkbox勾選時即進行隱藏/顯示
			if(status)	{
				$(this).find('tbody > tr[id="'+rowId+'"]').removeClass('tr_deleted');
				$(this).jqGrid('setCell',rowId,'deleted',0);	//設定資料的deleted欄位為0
				$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
			}
			else 	{
				$(this).find('tbody > tr[id="'+rowId+'"]').addClass('tr_deleted');
				$(this).jqGrid('setCell',rowId,'deleted',1);	//設定資料的deleted欄位為1	
				$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');
			}
		},
		beforeSelectRow: function (rowid, e) {	//阻擋在multiselect時，點擊row就會自動select的功能，強制只能點選checkbox
			var $myGrid = $(this),
				i = $.jgrid.getCellIndex($(e.target).closest('td')[0]),
				cm = $myGrid.jqGrid('getGridParam', 'colModel');
			return (cm[i].name === 'cb');
		},		
		onSelectAll: function (rowIds, status) {	//使用checkbox勾選時即進行隱藏/顯示
			for(var i in rowIds)	{
				if(status)	{
					$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').removeClass('tr_deleted');
					$(this).jqGrid('setCell',rowIds[i],'deleted',0);	//設定資料的deleted欄位為0
					$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
				}
				else 	{
					$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').addClass('tr_deleted');
					$(this).jqGrid('setCell',rowIds[i],'deleted',1);	//設定資料的deleted欄位為1
					$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');						
				}
			}				
		},			
		gridComplete: function () {
			
			//在內建的grid完成refresh後，我自己加的class會不見，故於此將class塞回去
			var allDataObj = jQuery(this).jqGrid('getGridParam', 'data');
		
			for(var i in allDataObj)	{
				if(allDataObj[i].deleted == 1)	{	//delete =1就塞回class
					var rowid = allDataObj[i].id;
					$(this).find('tbody > tr[id="'+rowid+'"]').addClass('tr_deleted');
				}
			}
		}
	});	

	for(var kw in GLOBALS.search_data)	{	//為colModel依據關鍵字上色
		$('#jqgh_jingLevelStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
	
	}		

	
	//處理資料
	//clear_jing_charts();	//清除上一次的jing_charts
	var dataType = origChartID.replace(/Chart|StatisticGrid/g,'');
	var resData = {};
	var forDetailInfoData = {};	//給此經level產生座標、時間分佈用的資料
	for(var kw in GLOBALS.search_data)	{
		for(var j in GLOBALS.search_data[kw])	{
			

			if(GLOBALS.search_data[kw][j].deleted == 1)	continue;
			if(dataType == 'bulei')	{
				if(!GLOBALS.search_data[kw][j].category.match(new RegExp(label,'g')))	continue;				//不是統計中的部類當然跳過，2018-03-19：增加處理部類多值，改用str.match
			}
			else if(dataType == 'authors')	{
				if($.inArray(label,GLOBALS.search_data[kw][j].authors) == -1)	continue;	//如果不是選中的作譯者跳過
			}
			else if(dataType == 'dynastyLinear')	{
				var dyRangeObj = /\(([^~]+)~([^~]+)\)/g.exec(label);
				var start_year = parseInt(dyRangeObj[1].replace(/[BCE]+/g,''),10);
				var end_year = parseInt(dyRangeObj[2].replace(/[BCE]+/g,''),10);
				
				if(!(parseInt(GLOBALS.search_data[kw][j].dynastyYear,10) >= start_year && parseInt(GLOBALS.search_data[kw][j].dynastyYear,10) < end_year))	continue;	//如果西元年不在範圍內就跳過
			}
			else if(dataType == 'custom')	{
				var selected_work = GLOBALS.customDefined.filter(function(item)	{	return item.split(',')[0] == label;	}).join('').split(',')[1];
				if(GLOBALS.search_data[kw][j].work != selected_work)	continue;	//不符合阿含群組的work就跳過
			}
			else if(dataType == 'jings')	{
				if(GLOBALS.search_data[kw][j].work+' '+GLOBALS.search_data[kw][j].title != label)	continue;
			}
				
				
			if(!resData[[GLOBALS.search_data[kw][j]['work']]])		resData[[GLOBALS.search_data[kw][j]['work']]] = {};
			if(!resData[GLOBALS.search_data[kw][j]['work']][kw])	resData[GLOBALS.search_data[kw][j]['work']][kw] = 0;
			resData[GLOBALS.search_data[kw][j]['work']][kw]++;
			
			
			if(!forDetailInfoData[kw])		forDetailInfoData[kw] = [];
			forDetailInfoData[kw].push(GLOBALS.search_data[kw][j]);
		}
	}

	
	//grid填入資料
	var gridData = [];
	var work_count = 0;
	for(var work in resData)	{
		var dataTmp = {id:++work_count,'category':'<span class="grid2next">'+work+' '+GLOBALS.jinlu[work].title+'</span>'};
		for(var omg_kw in GLOBALS.search_data)	{	//為每個關鍵字補0
			dataTmp[omg_kw] = 0;
		}
		for(var wkw in resData[work])	{
			dataTmp[wkw] = resData[work][wkw];	//統計次數
		}
		dataTmp['deleted'] = 0;
		gridData.push(dataTmp);
	}
	reload_grid('#jingLevelStatisticGrid',gridData);
	
	
	//預設全選所有列

	$('#jingLevelStatisticGrid').jqGrid('resetSelection');
	var ids = $('#jingLevelStatisticGrid').getDataIDs();
	for (var i=0, il=ids.length; i < il; i++) {
		$('#jingLevelStatisticGrid').jqGrid('setSelection',ids[i], true);
	}	
	
	generate_chart(['jingLevelStatisticGrid']);
	
	GLOBALS.detailInfoLastObj['jingLevel'] = forDetailInfoData;	//準備產生detail 座標時間分析，但因為有label切換功能，故用全域變數已方便之後切換，此為jingLevel層次
	generate_detail('jingLevel');	//產生座標、前後字分析
	
	toView('jingLevel',label);
	pushBrowserState('jingLevel',label);
}



//產生各卷chart
function generate_juan_chart(origChartID,label,value)	{
	
	//建立grid
	var colModelDynamic = [
		{ label: 'ID', name: 'id', width: 45, key: true ,hidden:true,sorttype: 'integer'},
		{ label: 'deleted row', name: 'deleted', width: 10,hidden:true },
	];		
	colModelDynamic.push({ label: LANG[GLOBALS.lang]['fascicle'], name: 'category', width: 70 });
	for(var kw in GLOBALS.search_data)	{	//動態新增colModel by 關鍵字
		colModelDynamic.push({ label: kw, name: kw, width: 60,sorttype: 'integer' , classes:'colorsSet_'+GLOBALS.colorSet.colors.indexOf(GLOBALS.search_data_color[kw])});
	}
		
	colModelDynamic.push({ label: 'Delete', name: 'deleted_label', width: 15,hidden:true});	//刪除之排序先藏起來
		
		
		
	//重新產生物件前如果先前已有必須先GridUnload
	if($('#gbox_juanLevelStatisticGrid').size() > 0)	$.jgrid.gridUnload("#juanLevelStatisticGrid");

	$("#juanLevelStatisticGrid").jqGrid({
		datatype: "local",
		editurl: 'clientArray',	//編輯模式(含刪除)需用到，固定此值即可
		colModel: colModelDynamic,
		loadonce: false,
		viewrecords: true,
		width: 550,
		height:'auto',
		rowNum: 100000,
		rownumbers: true, 
		rownumWidth: 50, 
		multiselect: true,
		sortname : 'id',
		onSelectRow: function (rowId, status, e) {	//使用checkbox勾選時即進行隱藏/顯示
			if(status)	{
				$(this).find('tbody > tr[id="'+rowId+'"]').removeClass('tr_deleted');
				$(this).jqGrid('setCell',rowId,'deleted',0);	//設定資料的deleted欄位為0
				$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
			}
			else 	{
				$(this).find('tbody > tr[id="'+rowId+'"]').addClass('tr_deleted');
				$(this).jqGrid('setCell',rowId,'deleted',1);	//設定資料的deleted欄位為1	
				$(this).jqGrid('setCell',rowId,'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');
			}
		},
		beforeSelectRow: function (rowid, e) {	//阻擋在multiselect時，點擊row就會自動select的功能，強制只能點選checkbox
			var $myGrid = $(this),
				i = $.jgrid.getCellIndex($(e.target).closest('td')[0]),
				cm = $myGrid.jqGrid('getGridParam', 'colModel');
			return (cm[i].name === 'cb');
		},			
		onSelectAll: function (rowIds, status) {	//使用checkbox勾選時即進行隱藏/顯示
			for(var i in rowIds)	{
				if(status)	{
					$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').removeClass('tr_deleted');
					$(this).jqGrid('setCell',rowIds[i],'deleted',0);	//設定資料的deleted欄位為0
					$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-open"></span>');
				}
				else 	{
					$('#'+$(this).attr('id')).find('tbody > tr[id="'+rowIds[i]+'"]').addClass('tr_deleted');
					$(this).jqGrid('setCell',rowIds[i],'deleted',1);	//設定資料的deleted欄位為1
					$(this).jqGrid('setCell',rowIds[i],'deleted_label','<span class="glyphicon glyphicon-eye-close"></span>');						
				}
			}				
		},			
		gridComplete: function () {
			
			//在內建的grid完成refresh後，我自己加的class會不見，故於此將class塞回去
			var allDataObj = jQuery(this).jqGrid('getGridParam', 'data');
		
			for(var i in allDataObj)	{
				if(allDataObj[i].deleted == 1)	{	//delete =1就塞回class
					var rowid = allDataObj[i].id;
					$(this).find('tbody > tr[id="'+rowid+'"]').addClass('tr_deleted');
				}
			}
		}
	});	

	for(var kw in GLOBALS.search_data)	{	//為colModel依據關鍵字上色
		$('#jqgh_juanLevelStatisticGrid_'+kw).css('color',GLOBALS.search_data_color[kw]);
	
	}		

	
	//處理資料
	var resData = {};
	for(var kw in GLOBALS.search_data)	{
		for(var j in GLOBALS.search_data[kw])	{

			if(GLOBALS.search_data[kw][j].deleted == 1)	continue;
			if(GLOBALS.search_data[kw][j].work != label)	continue;	//需是選擇的經號
				

			if(!resData[[GLOBALS.search_data[kw][j]['work']]])		resData[[GLOBALS.search_data[kw][j]['work']]] = {};
			if(!resData[GLOBALS.search_data[kw][j]['work']][GLOBALS.search_data[kw][j]['juan']])		resData[GLOBALS.search_data[kw][j]['work']][GLOBALS.search_data[kw][j]['juan']] = {};
			if(!resData[GLOBALS.search_data[kw][j]['work']][GLOBALS.search_data[kw][j]['juan']][kw])	resData[GLOBALS.search_data[kw][j]['work']][GLOBALS.search_data[kw][j]['juan']][kw] = 0;
			resData[GLOBALS.search_data[kw][j]['work']][GLOBALS.search_data[kw][j]['juan']][kw]++;				
		}
	}

	
	//grid填入資料
	var gridData = [];
	var juan_count = 0;
	for(var work in resData)	{
		for(var juan in resData[work])	{
			var dataTmp = {id:++juan_count,'category':'<span class="juan2kwic" data-juan="'+juan+'" data-work="'+work+'">卷'+juan+'</span>'};
			for(var omg_kw in GLOBALS.search_data)	{	//為每個關鍵字補0
				dataTmp[omg_kw] = 0;
			}
			for(var wkw in resData[work][juan])	{
				dataTmp[wkw] = resData[work][juan][wkw];	//統計次數
			}
			dataTmp['deleted'] = 0;
			gridData.push(dataTmp);
		}
	}
	reload_grid('#juanLevelStatisticGrid',gridData);
	
	
	//預設全選所有列

	$('#juanLevelStatisticGrid').jqGrid('resetSelection');
	var ids = $('#juanLevelStatisticGrid').getDataIDs();
	for (var i=0, il=ids.length; i < il; i++) {
		$('#juanLevelStatisticGrid').jqGrid('setSelection',ids[i], true);
	}	
	
	generate_chart(['juanLevelStatisticGrid']);
	
	$('.juan2kwic:eq(0)').trigger('click');	//預設啟動第一個卷的kwic
	$('#gbox_juanLevelStatisticGrid').css({'overflow':'auto','overflow-x':'hidden','max-height':'600px'});	//調整max-height
	
	toView('juanLevel',label);
	pushBrowserState('juanLevel',label);
}


//取得卷層級的kwic - 前端自己做，ray api版無法處理deleted的問題，廢棄之
function get_kwic(work,juan)	{
	var res = {};
	for(var kw in GLOBALS.search_data)	{
		for(var i in GLOBALS.search_data[kw])	{
			if(GLOBALS.search_data[kw][i].deleted == 1)	continue;	//刪除的跳過
			if(GLOBALS.search_data[kw][i].work == work && GLOBALS.search_data[kw][i].juan == juan)	{
				if(!res[kw])	res[kw] = [];
				res[kw].push({'kwic':GLOBALS.search_data[kw][i].kwic , 'cbeta_link':GLOBALS.search_data[kw][i].vol+'n'+GLOBALS.search_data[kw][i].work.replace('T','')+'_p'+GLOBALS.search_data[kw][i].lb});
			}
		}	
	}
	return res;
}

/*
function get_juan_kwic(kw,work,juan)	{	//取得卷層級的kwic(ray API版，api版無法處理deleted的問題，廢棄之)
	var promise_obj = $.Deferred();
	$.getJSON(GLOBALS.API_prefix+'kwic?q='+encodeURIComponent(kw)+'&work='+work+'&juan='+juan+'&rows=99999&canon=T&edition=CBETA&callback=?',function(json)	{
		if(parseInt(json.num_found,10) <= 0)	{
			promise_obj.resolve();
		}
		json.kw = kw;
		promise_obj.resolve(json);
	});
	return promise_obj.promise();
}
*/



function generate_detail(catalog,kw_filter)	{	//產生座標、前後字分析
	var data = catalog == 'jingLevel' ? GLOBALS.detailInfoLastObj['jingLevel']:GLOBALS.detailInfoLastObj['all'];	//分為全域跟jingLevel層次，於此判斷要用哪個全域變數
	var result = {
		max_x:{p:0,pname:'',work:'',counter:0},
		min_x:{p:10000,pname:'',work:'',counter:0},
		max_y:{p:0,pname:'',work:'',counter:0},
		min_y:{p:10000,pname:'',work:'',counter:0},
		earliest_year:{y:100000,dname:'',work:'',counter:0},
		latest_year:{y:0,dname:'',work:'',counter:0}
	};
	
	var prefix_words = {},
		suffix_words = {};
		
	var findDyInfoByYear = function(year)	{
		for(var dyi in GLOBALS.linear_dynasties)	{
			var dyData = GLOBALS.linear_dynasties[dyi].split(',');
			if(parseInt(year,10) >= parseInt(dyData[1],10) && parseInt(year,10) < parseInt(dyData[2],10))	{
				return 	get_dynasty_range_str(GLOBALS.linear_dynasties[dyi].split(',')[1],GLOBALS.linear_dynasties[dyi].split(',')[2]);
			}				
		}
		return false;
	};
	
	var findKwByWork = function(work)	{	//注意：use local varible "data" , "kw_filter" in this function
		var res = [];
		for(var kw in data)	{
			if(kw_filter && kw != kw_filter)	{
				continue;
			}
			var finded_works = data[kw].filter(function(e)	{return e.work == work;});	//使用原生的filter去找，效率佳
			if(finded_works.length > 0)	res.push(kw);	//如果找到任一個work，表示有該關鍵字			
		}		
		return res;
	};
		
	//console.log(data)	
	for(var kw in data)	{
		if(kw_filter && kw != kw_filter)	{
			continue;
		}
		
		for(var i in data[kw])	{
			if(data[kw][i].deleted == 1)	continue;
					
			if(GLOBALS.jinlu[data[kw][i].work].place_data && GLOBALS.jinlu[data[kw][i].work].place_data.length > 0)	{
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].place_data[0]['long'],10) <= result.min_x.p)	{
					result.min_x.p = GLOBALS.jinlu[data[kw][i].work].place_data[0]['long'];
					result.min_x.pname = GLOBALS.jinlu[data[kw][i].work].place_data[0]['p_name'];
					result.min_x.work = data[kw][i].work;
				}
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].place_data[0]['long'],10) >= result.max_x.p)	{
					result.max_x.p = GLOBALS.jinlu[data[kw][i].work].place_data[0]['long'];
					result.max_x.pname = GLOBALS.jinlu[data[kw][i].work].place_data[0]['p_name'];
					result.max_x.work = data[kw][i].work;
				}
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].place_data[0].lat,10) <= result.min_y.p)	{
					result.min_y.p = GLOBALS.jinlu[data[kw][i].work].place_data[0].lat;
					result.min_y.pname = GLOBALS.jinlu[data[kw][i].work].place_data[0]['p_name'];
					result.min_y.work = data[kw][i].work;
				}
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].place_data[0].lat,10) >= result.max_y.p)	{
					result.max_y.p = GLOBALS.jinlu[data[kw][i].work].place_data[0].lat;
					result.max_y.pname = GLOBALS.jinlu[data[kw][i].work].place_data[0]['p_name'];
					result.max_y.work = data[kw][i].work;
				}
			}
			
			if(GLOBALS.jinlu[data[kw][i].work].time)	{
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].time,10) <= result.earliest_year.y)	{
					result.earliest_year.y = GLOBALS.jinlu[data[kw][i].work].time;
					result.earliest_year.dname = findDyInfoByYear(GLOBALS.jinlu[data[kw][i].work].time);
					result.earliest_year.work = data[kw][i].work;
				}
				if(parseFloat(GLOBALS.jinlu[data[kw][i].work].time,10) >= result.latest_year.y)	{
					result.latest_year.y = GLOBALS.jinlu[data[kw][i].work].time;
					result.latest_year.dname = findDyInfoByYear(GLOBALS.jinlu[data[kw][i].work].time);
					result.latest_year.work = data[kw][i].work;
				}	
			}
			
			//前後綴字分析(林北自己算)
			if(data[kw][i].kwic)	{
				var prefix_suffix = /([^<]?)(<mark[^>]+>[^<]+<\/mark>)(.?)/.exec(data[kw][i].kwic);
				
				if(prefix_suffix && prefix_suffix.length == 4)	{
					if(prefix_suffix[1] && $.trim(prefix_suffix[1]) != '' && GLOBALS.punctuations.indexOf($.trim(prefix_suffix[1])) == -1)	{	//前綴字(不含標點)
						if(!prefix_words[prefix_suffix[1]+prefix_suffix[2]])	prefix_words[prefix_suffix[1]+prefix_suffix[2]] = 0;
						prefix_words[prefix_suffix[1]+prefix_suffix[2]]++;
					}
					if(prefix_suffix[3] && $.trim(prefix_suffix[3]) != '' && GLOBALS.punctuations.indexOf($.trim(prefix_suffix[3])) == -1)	{	//後綴字(不含標點)
						if(!suffix_words[prefix_suffix[2]+prefix_suffix[3]])	suffix_words[prefix_suffix[2]+prefix_suffix[3]] = 0;
						suffix_words[prefix_suffix[2]+prefix_suffix[3]]++;
					}				
				}
			}
			
		}
	}	

	
	//計算次數
	for(var kw in data)	{
		if(kw_filter && kw != kw_filter)	continue;
		for(var i in data[kw])	{	
			if(data[kw][i].deleted == 1)	continue;
			for(var type in result)	{
				if(result[type].work == data[kw][i].work)	result[type].counter++;
			}
		}
	}
	
	//console.dir(result);
	
	//產生地理、時間分佈
	var gis_html = [],
		time_html = [],
		word_html = [],
		typeTitle;
	for(var type in result)	{
		if(!result[type].work)	continue;	//連work都沒有表沒資料，跳過
		typeTitle = '';
		if(type == 'min_x' || type == 'max_x' || type == 'min_y' || type == 'max_y')	{
			if(type == 'min_x')	typeTitle = LANG[GLOBALS.lang]['most-west'];
			if(type == 'max_x')	typeTitle = LANG[GLOBALS.lang]['most-east'];
			if(type == 'min_y')	typeTitle = LANG[GLOBALS.lang]['most-south'];
			if(type == 'max_y')	typeTitle = LANG[GLOBALS.lang]['most-north'];
			
			gis_html.push('<div class="detailInfo_content"><div>'+typeTitle+'：<span class="single-jing" data-work="'+result[type].work+'">'+result[type].work+' '+GLOBALS.jinlu[result[type].work].title+'</span> '+result[type].pname+' ('+result[type].counter+')</div>'+findKwByWork(result[type].work).map(function(color_kw)	{  return '<div style="float:right;display:inline-block;width:1em;border-radius:10px;height:1em;background-color:'+GLOBALS.search_data_color[color_kw]+'"></div>';; }).join('')+'</div>');
		}
		else if(type == 'earliest_year' || type == 'latest_year')	{
			if(type == 'earliest_year')	typeTitle = LANG[GLOBALS.lang]['most-early'];
			if(type == 'latest_year')	typeTitle = LANG[GLOBALS.lang]['most-late'];			
			time_html.push('<div class="detailInfo_content"><div>'+typeTitle+'：<span class="single-jing" data-work="'+result[type].work+'">'+result[type].work+' '+GLOBALS.jinlu[result[type].work].title+'</span> '+result[type].dname+' ('+result[type].counter+')</div>'+findKwByWork(result[type].work).map(function(color_kw)	{	return '<div style="float:right;display:inline-block;width:1em;border-radius:10px;height:1em;background-color:'+GLOBALS.search_data_color[color_kw]+'"></div>';	}).join('')+'</div>');
		}
	}
	
	
	var detail_btns = Object.keys(GLOBALS.search_data).map(function(v)	{	return '<span class="label label-default detail_switch_label'+(v == kw_filter ? ' kwic-label-active':'')+'" data-catalog="'+catalog+'" style="background-color:'+GLOBALS.search_data_color[v]+'">'+v+'</span>'}).join('');
	detail_btns = '<span class="label label-default detail_switch_label'+(!kw_filter ? ' kwic-label-active':'')+'" data-catalog="'+catalog+'">ALL</span>'+detail_btns; 
	
	$('#'+catalog+'DetailInfo').html(detail_btns+(gis_html.length > 0 ? '<div class="detailInfo_item"><h4>'+LANG[GLOBALS.lang]['geo-analysis']+'<span id="open_jing_map_btn" title="map view" data-catalog="'+catalog+'" class="glyphicon glyphicon-globe"></span></h4>'+gis_html.join('')+'</div>':'')+(time_html.length > 0 ? '<div class="detailInfo_item"><h4>'+LANG[GLOBALS.lang]['time-analysis']+'<span id="open_jing_table_btn" title="table view" data-catalog="'+catalog+'" class="glyphicon glyphicon-list-alt"></span></h4>'+time_html.join('')+'</div>':'')+('<div id="prevnext_word_count"><div class="detailInfo_item"><h4 class="prevnext_word_title">'+LANG[GLOBALS.lang]['prefix-analysis']+'<span class="glyphicon glyphicon-plus prevnext_display_btn" aria-hidden="true"></span><span id="prefix_export_btn" class="glyphicon glyphicon-export prevnext_export_btn" aria-hidden="true"></span></h4></div><div class="detailInfo_item"><h4 class="prevnext_word_title">'+LANG[GLOBALS.lang]['suffix-analysis']+'<span class="glyphicon glyphicon-plus prevnext_display_btn" aria-hidden="true"></span><span id="suffix_export_btn" class="glyphicon glyphicon-export prevnext_export_btn" aria-hidden="true"></span></h4></div></div>'));
	
	
	/*
	//產生前後綴分析(API版)
	var prev_word_html = '',
		next_word_html = '',
		keywords = kw_filter ? [kw_filter]:Object.keys(GLOBALS.search_data);
	
	for(var ki in keywords)	{
		(function(ki)	{
			$.getJSON(GLOBALS.API_prefix+'kwic?q='+encodeURIComponent(keywords[ki])+'&word_count=1&callback=?',function(res)	{
				if(res.prev_word_count)	{
					prev_word_html = res.prev_word_count.map(function(item)	{	if($.trim(item[0]) !== '')	return '<div style="margin:0 1em 0.3em 1em;min-width:110px;max-width:110px"><span class="detail_word_prefix">'+item[0]+'</span><span style="color:'+GLOBALS.search_data_color[keywords[ki]]+'">'+keywords[ki]+'</span>('+item[1]+')</div>';	}).join('<br/>');
				}
				if(res.next_word_count)	{
					next_word_html = res.next_word_count.map(function(item)	{	if($.trim(item[0]) !== '')	return '<div style="margin:0 1em 0.3em 1em;min-width:110px;max-width:110px"><span style="color:'+GLOBALS.search_data_color[keywords[ki]]+'">'+keywords[ki]+'</span><span class="detail_word_prefix">'+item[0]+'</span>('+item[1]+')</div>';	}).join('<br/>');
				}				
				$('#'+catalog+'DetailInfo #prevnext_word_count > .detailInfo_item:eq(0)').after('<div class="prevnext_word_flex">'+prev_word_html+'</div>');
				$('#'+catalog+'DetailInfo #prevnext_word_count > .detailInfo_item:eq(1)').after('<div class="prevnext_word_flex">'+next_word_html+'</div>');				
			});
		})(ki);
	}
	*/

	//產生前後綴分析 - 前端自己算版
	var prev_word_html = [],
		next_word_html = [],
		prefix_words_sorted = [],
		suffix_words_sorted = [];
	
	//照出現次數由大到小排序
	for(var pwi in prefix_words) 	prefix_words_sorted.push([pwi, prefix_words[pwi]]);
	for(var swi in suffix_words) 	suffix_words_sorted.push([swi, suffix_words[swi]]);
	
	prefix_words_sorted.sort(function(a, b) {	return b[1] - a[1];	});		
	suffix_words_sorted.sort(function(a, b) {	return b[1] - a[1];	});
	
	for(var pwi in prefix_words_sorted)	{
		prev_word_html.push('<div style="margin:0 1em 0.3em 1em;min-width:110px;max-width:110px"><span class="detail_word_prefix">'+prefix_words_sorted[pwi][0].substr(0,1)+'</span>'+prefix_words_sorted[pwi][0].substr(1)+'('+prefix_words_sorted[pwi][1]+')</div>');
	}
	for(var swi in suffix_words_sorted)	{
		next_word_html.push('<div style="margin:0 1em 0.3em 1em;min-width:110px;max-width:110px">'+suffix_words_sorted[swi][0].substr(0,suffix_words_sorted[swi][0].length-1)+'<span class="detail_word_prefix">'+suffix_words_sorted[swi][0].substr(-1)+'</span>'+'('+suffix_words_sorted[swi][1]+')</div>');
	}
		
	$('#'+catalog+'DetailInfo #prevnext_word_count > .detailInfo_item:eq(0)').after('<div class="prevnext_word_flex">'+prev_word_html.join('<br/>')+'</div>');
	$('#'+catalog+'DetailInfo #prevnext_word_count > .detailInfo_item:eq(1)').after('<div class="prevnext_word_flex">'+next_word_html.join('<br/>')+'</div>');	
	
}

/*備份！！
//產生各經chart
function generate_jing_chart(origChartID,label,value)	{
	clear_jing_charts();	//清除上一次的jing_charts
	var dataType = origChartID.replace('Chart','');
	var resData = {};
	for(var kw in GLOBALS.search_data)	{
		for(var j in GLOBALS.search_data[kw])	{
			

			if(GLOBALS.search_data[kw][j].deleted == 1)	continue;
			if(dataType == 'bulei')	{
				if(GLOBALS.search_data[kw][j].category != label)	continue;				//不是統計中的部類當然跳過
			}
			else if(dataType == 'authors')	{
				if($.inArray(label,GLOBALS.search_data[kw][j].authors) == -1)	continue;	//如果不是選中的作譯者跳過
			}
			else if(dataType == 'dynastyLinear')	{
				var dyRangeObj = /\(([^~]+)~([^~]+)\)/g.exec(label);
				var start_year = parseInt(dyRangeObj[1].replace(/[BCE]+/g,''),10);
				var end_year = parseInt(dyRangeObj[2].replace(/[BCE]+/g,''),10);
				
				if(!(parseInt(GLOBALS.search_data[kw][j].dynastyYear,10) >= start_year && parseInt(GLOBALS.search_data[kw][j].dynastyYear,10) < end_year))	continue;	//如果西元年不在範圍內就跳過
			}
			else if(dataType == 'custom')	{
				var selected_work = GLOBALS.customDefined.filter(function(item)	{	return item.split(',')[0] == label;	}).join('').split(',')[1];
				if(GLOBALS.search_data[kw][j].work != selected_work)	continue;	//不符合阿含群組的work就跳過
			}
				
				
			if(!resData[[GLOBALS.search_data[kw][j]['work']]])		resData[[GLOBALS.search_data[kw][j]['work']]] = {};
			if(!resData[GLOBALS.search_data[kw][j]['work']][kw])	resData[GLOBALS.search_data[kw][j]['work']][kw] = {};
			if(!resData[GLOBALS.search_data[kw][j]['work']][kw][GLOBALS.search_data[kw][j]['juan']])	resData[GLOBALS.search_data[kw][j]['work']][kw][GLOBALS.search_data[kw][j]['juan']] = 0;
			resData[GLOBALS.search_data[kw][j]['work']][kw][GLOBALS.search_data[kw][j]['juan']]++;	
		}
	}

	//補上各經的最大卷最小卷，下面預備要為每條關鍵字資料補0
	for(var work in resData)	{	
		var minJuan = 99999,maxJuan = 0;
		for(var kw in resData[work])	{
			for(juan in resData[work][kw])	{
				if(parseInt(juan,10) <= minJuan)	minJuan = juan;
				if(parseInt(juan,10) >= maxJuan)	maxJuan = juan;
			}
		}
		resData[work]['minJuan'] = minJuan;
		resData[work]['maxJuan'] = maxJuan;
	}
	
	
	//為各關鍵字補上缺卷的0
	for(var work in resData)	{	
		for(var kw in resData[work])	{
			for(var ii = parseInt(resData[work]['minJuan'],10) ; ii <= parseInt(resData[work]['maxJuan'],10) ; ii++)	{
				//if(!resData[work][kw][ii])	resData[work][kw][ii] = 0;			
				if(!resData[work][kw][ii] && !isAllZero(resData[work],ii))	resData[work][kw][ii] = 0;	//使用isAllZero檢查如果所有關鍵字的統計都是0就不列入
				

			}
		}
	}	
	
	
	$('#jing_charts').append('<h3 id="jing-tables-title"><b>'+$('#statistic-search-info-catelog').text()+'：'+label+'</b> 分經統計結果：</h3>');
	//準備產生chart
	var chartCount = 0;
	for(var work in resData)	{	
		
		var chartLabel = [];
		var chartData = {};
		

		//產生chartLabel
		for(var kw in resData[work])	{
			for(var juan in resData[work][kw])	{
				chartLabel.push(juan+'卷');
			}
			break;
		}		
		//產生chartData
		for(var kw in resData[work])	{
			if(kw == 'minJuan' || kw == 'maxJuan')	continue;
			chartData[kw] = [];
			for(var juan in resData[work][kw])	{
				chartData[kw].push(resData[work][kw][juan]);
			}
		}
		
		var chartDataStructure = {
			labels:chartLabel,
			datasets:[]
		};
		var datasetSample =	{
			label: "My First dataset",
			fill: false,
			lineTension: 0.1,
			backgroundColor: "rgba(75,192,192,0.4)",
			borderColor: "rgba(75,192,192,1)",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			pointBorderColor: "rgba(75,192,192,1)",
			pointBackgroundColor: "#fff",
			pointBorderWidth: 1,
			pointHoverRadius: 5,
			pointHoverBackgroundColor: "rgba(75,192,192,1)",
			pointHoverBorderColor: "rgba(220,220,220,1)",
			pointHoverBorderWidth: 2,
			pointRadius: 1,
			pointHitRadius: 10,
			data: [],
		};

		for(var kw in chartData)	{
			var new_dataset = jQuery.extend({}, datasetSample);	//物件是傳址，後面會蓋掉前面，要複製一份來用才對
			new_dataset.label = kw;	//kw為關鍵字名稱，拿來當key
			new_dataset.data = chartData[kw];
			new_dataset.backgroundColor = GLOBALS.search_data_color[kw];
			new_dataset.borderColor = GLOBALS.search_data_color[kw];
			new_dataset.pointBorderColor = GLOBALS.search_data_color[kw];
			new_dataset.pointHoverBackgroundColor = GLOBALS.search_data_color[kw];
			chartDataStructure.datasets.push(new_dataset);
		}		
	

		//console.log(chartData)
		var chartID = 'jing_charts_'+(++chartCount);
		$('<div class="jing-tables-div">'+get_jingChart_data(work,chartData,chartLabel)+'<canvas id="'+chartID+'" width="800" height="200" class="canvas_chart"></canvas></div>').appendTo('#jing_charts');
		var ctx = document.getElementById(chartID);
		GLOBALS.jing_charts[chartID] = new Chart(ctx, {
			type: 'line',
			data: chartDataStructure,
			options: {
				onClick:function(evt)	{	//chart click event
					var chartID = this.chart.canvas.id;
					var activePoints = this.getElementsAtEvent(evt);
					if(activePoints.length > 0)	{
					
						var clickedElementindex = activePoints[0]["_index"];	//get the internal index of slice in pie chart
						var label = this.data.labels[clickedElementindex];	//get specific label by index 
						var value = this.data.datasets[0].data[clickedElementindex];	//get value by index
						var work = $('#'+chartID).parent('.jing-tables-div').find('.jing-tables-work').text();
						
						console.log(Object.keys(GLOBALS.search_data)+' '+' '+work+' '+label.replace(/卷/g,''));
					}
				},
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				},
				tooltips:{
					enabled:true,
					mode:'index'			
				}
			}
		});			
	}	
}
*/

function clear_jing_charts()	{
	for(var i in GLOBALS.jing_charts)	{
		GLOBALS.jing_charts[i].destroy();
	}
	GLOBALS.jing_charts = {};
	$('#jing_charts').html('');
}

function get_jingChart_data(work,chartData,chartLabel)	{
	
	var summary = [],
		table_str = [];
		
	table_str.push('<thead><tr><td></td>'+chartLabel.map(function(item)	{	return '<td>'+item+'</td>';	}).join('')+'</tr></thead>');
	for(var kkw in chartData)	{
		summary.push('<span style="color:'+ GLOBALS.search_data_color[kkw]+'">'+kkw+'</span>：共 '+chartData[kkw].reduce(function(prev,curr)	{	return prev+curr;	})+' 次');
		table_str.push('<tr><td style="color:'+GLOBALS.search_data_color[kkw]+'">'+kkw+'</td>'+chartData[kkw].map(function(juan_statistic)	{	return '<td>'+juan_statistic+'</td>';}).join('')+'</tr>');
	}
	table_str = '<div style="overflow:auto;width:99%"><table class="table table-bordered jing-tables" style="">'+table_str.join('')+'</table></div>';
	
	return '<div><span style="font-size:20px;margin-right:0.5em"><span class="jing-tables-work">'+work+'</span> '+GLOBALS.jinlu[work].title+'</span><span style="float:right">'+summary.join('、')+'</span>'+table_str+'</div>';
}

function isAllZero(obj,index)	{
	var allZero = true;
	for(var kw2 in obj)	{
		if(kw2 == 'minJuan' || kw2 == 'maxJuan')	continue;
		if(obj[kw2][index])	{allZero = false;break;}
	}
	return allZero;
}

function toView(from_to,catalog)	{
	$('body').removeClass('index-show');
	
	if(from_to == 'statistic')	{
		setTimeout(function()	{
			$('#statistic-view,#search-info-view').show();
			$('#loading-hold-view').hide();
		},0);	//至統計頁「故意」的延遲特效
		
		$('#loading-hold-view,#nav-term-btn,#nav-data-btn,#nav-analysis-btn').show();
		$('#statistic-view,#table-view,#jing-level-view,#juan-level-view,.main-search,#landing-view').hide();	
		$('#seach-keywords').html(LANG[GLOBALS.lang]['analysis_keywords']+'：'+Object.keys(GLOBALS.search_data).map(function(v)	{	return '<span style="color:'+GLOBALS.search_data_color[v]+'">'+v+'</span>'}).join('、')+$('#table-range-label').parent().clone().find('button').remove().end().css('font-size','20px').html()+'<button class="btn btn-link btn-ls" style="vertical-align:top;margin-right:0;padding-right: 0;margin-left: -1em;" onclick="javascript:$(\'.switch-search-btn\').trigger(\'click\');ContextSearchRange.show();" data-lang-id="change-range">改變範圍</button>');
		
		$('#search-breadcrumb').html('').append(LANG[GLOBALS.lang]['analysis_levels']+'<li data-fromto="'+from_to+'" data-catalog="'+catalog+'" data-catalog-type="'+catalog+'" class="search-breadcrumb-item"><a href="javascript:void(null)">'+$('.aggregation_btn[data-catalog="'+catalog+'"]').text()+'</a><a id="breadcrumb_change_aggregation_btn">('+LANG[GLOBALS.lang]['change-aggregation']+')</a></li>');
		$('#statistic-view .viewTitle').html($('.aggregation_btn[data-catalog="'+catalog+'"]').text()+' '+' 的彙總結果');
		//clear_jing_charts();
	}
	else if(from_to == 'table')	{
		$('#statistic-view,#jing-level-view,#search-info-view,#juan-level-view,#landing-view').hide();
		$('#table-view').show();		//2016-05-16:排除 .main-search，新版不須使用到它
	}
	else if(from_to == 'jingLevel')	{
		$('#statistic-view,#table-view,#juan-level-view,.main-search,#landing-view').hide();
		$('#jing-level-view').show();
		
		var first_part = $('.search-breadcrumb-item').slice(0,1).get().map(function(i) {return i.outerHTML}).join('');
		$('#search-breadcrumb').html(LANG[GLOBALS.lang]['analysis_levels']+''+first_part).append('<li data-fromto="'+from_to+'" data-catalog="'+catalog+'" data-catalog-type="jingLevel" class="search-breadcrumb-item"><a href="javascript:void(null)">'+catalog+'</a></li>');
		$('#jing-level-view .viewTitle').html(catalog+' 的各經分佈結果');
	}
	else if(from_to == 'juanLevel')	{
		$('#statistic-view,#table-view,.main-search,#jing-level-view,#landing-view').hide();
		$('#juan-level-view').show();
		
		var first_part = $('.search-breadcrumb-item').slice(0,2).get().map(function(i) {return i.outerHTML}).join('');
		$('#search-breadcrumb').html(LANG[GLOBALS.lang]['analysis_levels']+''+first_part).append('<li data-fromto="'+from_to+'" data-catalog="'+catalog+'" data-catalog-type="juanLevel" class="search-breadcrumb-item"><a href="javascript:void(null)">'+catalog+' '+GLOBALS.jinlu[catalog].title+'</a></li>');
		$('#juan-level-view .viewTitle').html(catalog+' '+GLOBALS.jinlu[catalog].title+' 的各卷分佈結果');
	}	
	else if(from_to == 'landing')	{
		$('#statistic-view,#table-view,.main-search,#jing-level-view,#juan-level-view,#search-info-view').hide();
		$('#landing-view').show();
		$('body').addClass('index-show');
	}
	
	$(document).scrollTo(0);	//切換view需回到頁面最上方
}

//圖表click時的動作
function chart_click_action(chartObj,evt)	{
	var chartID = chartObj.chart.canvas.id;
	var activePoints = chartObj.getElementsAtEvent(evt);
	if(activePoints.length > 0)	{
					
		var clickedElementindex = activePoints[0]["_index"];	//get the internal index of slice in pie chart
		var label = chartObj.data.labels[clickedElementindex];	//get specific label by index 
		var value = chartObj.data.datasets[0].data[clickedElementindex];	//get value by index
		
		if(chartID == 'jingLevelChart' || chartID == 'jingsChart')	{	//「不彙總所有經」也直接到juanLevel
			generate_juan_chart(chartID,label.split(' ')[0],value);
		}
		else if(chartID == 'juanLevelChart')	{	//juan level的圖表click啟動kwic
			$('#juanLevelStatisticGrid td[title="'+label+'"] .juan2kwic').trigger('click');
		}
		else	{
			generate_jing_chart(chartID,label,value);
		}
		
		/*
		console.log(label)
		console.log(value)
		*/
	}	
}

function save_search_data(kw,data)	{
	var deleted_count = 0;
	for(var i in data)	if(data[i].deleted == 1)	deleted_count++;
	$('#search-result-lists .search-result-label[kw="'+kw+'"]').find('.search-result-label-count').text(data.length - deleted_count);	//更新label的統計數字
	
	GLOBALS.search_data[kw] = data;
}

function toContent(anchor)	{
	$('#book-container').scrollTo(anchor,200,{offset: {left:-30} });
}
		

function afterScroll()	{
	return false;
	//$('#page_num').val(searchTopPoint()[0].split('_')[1]);
}

function exportToExcel(type,clues)	{	//各式匯出excel之func
	if(type === 'main_grid')	{	//主資料表匯出
		var rows = '',
			tables = [],
			tables_id = [],
			sheets = [],
			counter = 0;
		for(var kw in GLOBALS.search_data)	{
			counter++;
			rows = '';
			for(var i in GLOBALS.search_data[kw])	{
				if(GLOBALS.search_data[kw][i].deleted == 1)	continue;
				rows += '<tr><td>'+GLOBALS.search_data[kw][i].category+'</td><td>'+GLOBALS.search_data[kw][i].work+'</td><td>'+GLOBALS.search_data[kw][i].title+'</td><td>'+GLOBALS.search_data[kw][i].lb+'</td><td>'+GLOBALS.search_data[kw][i].kwic+'</td></tr>';
			}
			$('<table/>').attr('id','main_grid_export-'+counter).html('<thead><th>部類</th><th>經號</th><th>經名</th><th>行號</th><th>kwic</th></thead><tbody>'+rows+'</tbody>').hide().appendTo('body');
			tables.push('main_grid_export-'+counter);
			tables_id.push('main_grid_export-'+counter);
			sheets.push(kw);
		}

		tablesToExcel(tables,sheets,'export-'+Object.keys(GLOBALS.search_data).join('-')+'.xls');
		
		for(var j in tables_id)	{
			$('#'+tables_id[j]).remove();	//用完後移除暫存表格
		}	
	}
	else if(type === 'statistic_grid')	{
		var grid_id = clues;
		var columnNames = $('#'+grid_id).jqGrid('getGridParam','colNames');
		var allDataObj = $('#'+grid_id).jqGrid('getGridParam', 'data');
		var rows = '';
		//console.log(columnNames)
		
		for(var i in allDataObj)	{
			if(allDataObj[i].deleted == 1)	continue;
			rows += '<tr><td>'+allDataObj[i].category+'</td>'+Object.keys(GLOBALS.search_data).map(function(kw)	{	return '<td>'+allDataObj[i][kw]+'</td>';	}).join('')+'</tr>';
		}	
		
		$('<table/>').attr('id','statistic_grid_export').html('<thead><th>'+columnNames[4]+'</th>'+Object.keys(GLOBALS.search_data).map(function(kw)	{	return '<th>'+kw+'</th>';	}).join('')+'</thead><tbody>'+rows+'</tbody>').hide().appendTo('body');
		tablesToExcel(['statistic_grid_export'],['Sheet1'],'export-statistic-'+Object.keys(GLOBALS.search_data).join('-')+'.xls');		
		$('#statistic_grid_export').remove();	//用完後移除暫存表格		
	}
	else if(type === 'prevnext')	{	//前後綴字匯出
		var word_contents = clues.parents('.detailInfo_item:eq(0)').next('.prevnext_word_flex').find('div');
		var type = clues.attr('id');
		var rows = '';
		word_contents.each(function()	{
			var main_word = $(this).find('mark').text();
			var word_prefix = $(this).find('.detail_word_prefix').text();
			var count = $(this).clone().find('mark,.detail_word_prefix').remove().end().text().replace(/[\(\)]+/g,'');
			//console.log(main_word+' '+word_prefix+' '+count)
			
			if(type == 'prefix_export_btn')
				rows += '<tr><td><Font Color="#FF0000"><B>'+word_prefix+'</B></Font>'+main_word+'</td>';	//在excel裡面加入粗體紅字
			else if(type == 'suffix_export_btn')
				rows += '<tr><td>'+main_word+'<Font Color="#FF0000"><B>'+word_prefix+'</B></Font></td>';	//在excel裡面加入粗體紅字
			
			rows += '<td>'+count+'</td></tr>';
		});
		
		$('<table/>').attr('id','prevnext_export').html('<thead><th>Term</th><th>Count</th></thead><tbody>'+rows+'</tbody>').hide().appendTo('body');
		tablesToExcel(['prevnext_export'],['Sheet1'],'export-'+(type == 'prefix_export_btn' ? 'prefix':'suffix')+'-'+Object.keys(GLOBALS.search_data).join('-')+'.xls');
		$('#prevnext_export').remove();	//用完後移除暫存表格		
		
	}
}

		
function PadDigits(n, totalDigits)	{ 	//eg.Response.Write(PadDigits(46,8)) ' returns 00000046
	n = n.toString(); 
	var pd = ''; 
	if (totalDigits > n.length) 
	{ 
		for (i=0; i < (totalDigits-n.length); i++) 
		{ 
			pd += '0'; 
		} 
	} 
	return pd + n.toString(); 
}	


function collate_window_close()	{	//關閉粉紅色小視窗
	$('#collate-window').hide();
	$('.active-note').removeClass('active-note');
}
	
function findDyNameByYear(year)	{	//使用年代起始年的中間值，找到該年代所屬朝代名稱
	for(var ly in GLOBALS.linear_dynasties)	{
		var middle_year = Math.round((parseInt(GLOBALS.linear_dynasties[ly].split(',')[1],10) + parseInt(GLOBALS.linear_dynasties[ly].split(',')[2],10)) / 2);
		if(year == middle_year)	
			return	{
				dyName:GLOBALS.linear_dynasties[ly].split(',')[0],
				start:GLOBALS.linear_dynasties[ly].split(',')[1],
				end:GLOBALS.linear_dynasties[ly].split(',')[2]
			};
	}
	return false;
}

function pushBrowserState(view_name,view_param,re_statistic)	{	//re_statistic有值表示需重新執行get_statistic() 重新統計
	history.pushState({"view":view_name,"param":view_param,'re_statistic':re_statistic},'', '');
}

function showGoodAlert(msg)	{		//漂亮且自動消失的alert
	$('#alert_msg > section').html(msg).parent().fadeIn(300);
	setTimeout(function()	{ $('#alert_msg').fadeOut(300);},4000);			
}

function saveMainDataToTmp()	{
	var exportedData = {id:'',data:{},range:{}};
	if(Object.keys(GLOBALS.search_data).length > 0)	{
		exportedData.data = GLOBALS.search_data;
		exportedData.range = GLOBALS.search_range.values;
		exportedData.id = 'myGridData';
		

		var request = indexedDB.open('MainGridData', 2);

		request.onerror = function(event) {
		  // Handle errors.
		};
		
		request.onupgradeneeded = function(event) {
			var db = event.target.result;
			var objectStore = db.createObjectStore("girdData", { keyPath: "id" });
		};
		
		request.onsuccess = function(event) {
			var db = event.target.result;
			var gridObjectStore = db.transaction("girdData", "readwrite").objectStore("girdData");
			gridObjectStore.count().onsuccess = function(e)	{
				if(e.target.result > 0)	{
					gridObjectStore.put(exportedData);
				}
				else	{
					gridObjectStore.add(exportedData);
				}
				$('#load_data_from_tmp_btn').removeClass('disabled');
			}
		};			
	}	
}

function restore_data(restoreObj)	{	//從暫存檔、存檔中讀回資料的程式
	if(!restoreObj || !restoreObj.data || Object.keys(restoreObj.data).length <= 0)	{
		showGoodAlert(LANG[GLOBALS.lang]['msg-3']);
		return false;
	}
	GLOBALS.search_data = null;
	GLOBALS.search_data = restoreObj.data;	//將GLOBALS.search_data重設為暫存的資料
	GLOBALS.active_keyword = Object.keys(GLOBALS.search_data).join(',');
	$('#search-result-lists').html('');	//清空關鍵字labels
	GLOBALS.colorSet.colorIndex = 0;	//顏色計數器要歸零
	GLOBALS.search_data_color = {};		//顏色要清空
	GLOBALS.gogogoBtn_finished_counter = 0;
	GLOBALS.search_xhrs = [];
					
	//重設搜尋範圍 +
	//GLOBALS.search_range.valuesTmp = false;
	GLOBALS.search_range.values = restoreObj.range;	
	if(GLOBALS.search_range.values)	$('#table-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');
	else		$('#table-range-label').text(LANG[GLOBALS.lang]['all-taisho']).removeClass('landing-range-label-active');
	//重設搜尋範圍 -
					
	//將資料讀回資料頁的main grid
	var resData = [];
	for(var kw in GLOBALS.search_data)	{
		//var activeLabel_color = GLOBALS.colorSet.colors[((GLOBALS.colorSet.colorIndex++) % 10)];	//舊的寫法，重取顏色可能會跟存下來的kwic欄之<mark>裡面寫死的顏色衝突，故不採此法
		var find_color = /<mark style=.+color:([^;]+)[^>]+>/g.exec(GLOBALS.search_data[kw][0].kwic)[1];	//承上，改由kwic裡的mark去找顏色填回
		//console.log(find_color);		
		var activeLabel_color = find_color;
		GLOBALS.colorSet.colorIndex++;	//顏色填好需將index++
		
		resData = GLOBALS.search_data[kw];
		var resData_size = resData.filter(function(o)	{	return o.deleted == 0;	}).length;	//需計算扣除deleted的資料筆數
		$('#search-result-lists').append('<span kw="'+kw+'" class="label label-active search-result-label" style="background-color:'+activeLabel_color+'">'+kw+'(<span class="search-result-label-count">'+resData_size+'</span>)<button class="close search-result-label-close" type="button" style=""><span aria-hidden="true">×</span></button></span>');
		GLOBALS.search_data_color[kw] = activeLabel_color;	//根據關鍵字紀錄顏色						
	}
					
	reload_grid("#jqGrid",resData);	
	$('#gbox_jqGrid').unblock(); 
	$('.search-result-label:eq(0)').trigger('click');	//啟動第一個label
	
	//顯示header navs為資料頁
	$('.switch-btns').removeClass('switch-btns-active');
	$('.switch-search-btn').addClass('switch-btns-active');
	
	
	GLOBALS.dataPage_updated = true;	//設定切到分析後馬上更新
	saveMainDataToTmp();	//有異動，存到暫存檔
	toView('table');
}

function loadMainDataFromTmp(just_unlock_menu)	{
	var request = indexedDB.open('MainGridData', 2);
	request.onupgradeneeded = function(event) {
		var db = event.target.result;
		var objectStore = db.createObjectStore("girdData", { keyPath: "id" });
	};
		
	request.onsuccess = function(event) {
		var db = event.target.result;
		
		try	{
			db.transaction("girdData","readonly").objectStore("girdData").get("myGridData").onsuccess = function(event) {
				if(event.target.result && !just_unlock_menu && confirm(LANG[GLOBALS.lang]['msg-4']))	{	//將暫存檔讀回來
					restore_data(event.target.result);		
				}
				else if(event.target.result && just_unlock_menu)	{
					$('#load_data_from_tmp_btn').removeClass('disabled');
				}
			};
		}
		catch(e)	{
			console.log('get indexed db data error')
		}

	};	
}


//export jqgrid data

function exportAllData(grid_id){
	var exportedData = {id:'',data:{},range:{}};
	if(Object.keys(GLOBALS.search_data).length > 0)	{
		var d = new Date();
		exportedData.data = GLOBALS.search_data;
		exportedData.range = GLOBALS.search_range.values;
		exportedData.id = 'myGridData';
		JSON2Text(JSON.stringify(exportedData),'TaishoConcordance_export_'+d.getFullYear()+(d.getMonth()+1)+d.getDate()+(d.getHours()+1)+(d.getMinutes()+1)+(d.getSeconds()+1)+'_'+Object.keys(GLOBALS.search_data).join('_')+'.json');
	}
	/*
	var exportedData = {keyword:'',data:[]};
	var allDataObj = jQuery(grid_id).jqGrid ('getGridParam', 'data');
	if(parseInt(allDataObj.length,10) > 0)	{
		exportedData.data = allDataObj;
		exportedData.keyword = GLOBALS.keywords.toString();
		JSON2Text(JSON.stringify(exportedData),'abc.txt')
	}
	*/
}

function exportSelectedData(grid_id){
	var gridid 		= jQuery(grid_id).getDataIDs(); // Get all the ids in array
	var label 		= jQuery(grid_id).getRowData(gridid[0]); // Get First row to get the labels
	var selRowIds 	= jQuery(grid_id).jqGrid ('getGridParam', 'selarrrow');	

	var obj 		= new Object();
	obj.count		= selRowIds.length;
	
	if(obj.count) {	
		obj.items		= new Array();
		for(elem in selRowIds) {
			obj.items.push(jQuery(grid_id).getRowData( selRowIds[elem] ));
		}
		var json = JSON.stringify(obj);
		JSONToCSVConvertor(json, "csv", 1);
	}
}

function JSON2Text(jsonTxt,filename)	{
	//this trick will generate a temp "a" tag
	var link = document.createElement("a");    
	link.id="lnkDwnldLnk";

	//this part will append the anchor tag and remove it after automatic click
	document.body.appendChild(link);

	var blob = new Blob([jsonTxt], { type: 'text/plain' }); 
	
	var myURL = window.URL || window.webkitURL;
	
	var txtUrl = myURL.createObjectURL(blob);
	var filename = filename;
	jQuery("#lnkDwnldLnk")
	.attr({
	    'download': filename,
	    'href': txtUrl
	}); 

	jQuery('#lnkDwnldLnk')[0].click();    
	document.body.removeChild(link);	
}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {     

	//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
	var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
	var CSV = '';    
	//This condition will generate the Label/Header
	if (ShowLabel) {
	    var row = "";

	    //This loop will extract the label from 1st index of on array
	    for (var index in arrData.items[0]) {
	        //Now convert each value to string and comma-seprated
	        row += index + ',';
	    }
	    row = row.slice(0, -1);
	    //append Label row with line break
	    CSV += row + '\r\n';
	}

	//1st loop is to extract each row
	for (var i = 0; i < arrData.items.length; i++) {
	    var row = "";
	    //2nd loop will extract each column and convert it in string comma-seprated
	    for (var index in arrData.items[i]) {
	        row += '"' + arrData.items[i][index].replace(/(<([^>]+)>)/ig, '') + '",';
	    }
	    row.slice(0, row.length - 1);
	    //add a line break after each row
	    CSV += row + '\r\n';
	}

	if (CSV == '') {        
	    alert("Invalid data");
	    return;
	}   

	/*
	 * 
	 * FORCE DOWNLOAD
	 * 
	 */
	
	
	//this trick will generate a temp "a" tag
	var link = document.createElement("a");    
	link.id="lnkDwnldLnk";

	//this part will append the anchor tag and remove it after automatic click
	document.body.appendChild(link);

	var csv = CSV;  
	blob = new Blob([csv], { type: 'text/csv' }); 
	
	var myURL = window.URL || window.webkitURL;
	
	var csvUrl = myURL.createObjectURL(blob);
	var filename = 'UserExport.csv';
	jQuery("#lnkDwnldLnk")
	.attr({
	    'download': filename,
	    'href': csvUrl
	}); 

	jQuery('#lnkDwnldLnk')[0].click();    
	document.body.removeChild(link);
	
}

//排序json、 例如：people= [{"f_name": "john","l_name": "doe","sequence": "0"},{"f_name": "lee","l_name": "kk","sequence": "1"},...，執行：sortJSONByprop(people,f_name,true) :照f_name排序
function sortJSONByprop(obj,prop,asc)	{
	obj = obj.sort(function(a, b) {
		if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
		else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
	});
	return obj;
}

//取得短的uid
function getShortUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}

//處理數字千分位符號
function addCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())) {
        val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
    }
    return val;
}