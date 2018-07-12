/*
 * Author: 李阿閒@dila
*/

var GLOBALS = {};
GLOBALS.url_obj = null;
GLOBALS.lang = 'zh';					//語系，預設是中文
GLOBALS.keywords = null;
GLOBALS.gogogoBtn_finished_counter;		//按下開始分析後判斷是否所有關鍵字都完成的計數器
GLOBALS.new_keywords = [];				//新keywords陣列，儲存add-term的關鍵字
GLOBALS.search_xhrs = [];
GLOBALS.scroll_target = null;
GLOBALS.search_data = {};				//使用者的搜尋物件存檔
GLOBALS.active_keyword = null;			//正在瀏覽哪個關鍵字表格
GLOBALS.lastAggregation = null;			//紀錄選擇的匯總方式
GLOBALS.jinlu = null;					//全經錄物件
GLOBALS.charts = {};					//圖表物件
GLOBALS.jing_charts = {};				//各經圖表物件
GLOBALS.detailInfoLastObj = {'all':{},'jingLevel':''};			//地理分佈、時間分佈資料暫存變數，有分為全域統計跟jingLevel層次，故裡面拆成兩種
GLOBALS.isDesktop = true;				//是否桌機還是行動裝置，預設是桌機
GLOBALS.totalRecordLimit = 500000;		//搜尋結果總筆數限制
GLOBALS.colorSet = {colorIndex:0,colors:['#0075EB','#FF8205','#8205FF','#FF1463','#009966','#996600','#008099','#003399','#993399','#CC00CC']};
GLOBALS.search_data_color = {};
GLOBALS.dataPage_updated = false;		//如果資料頁的資料有更新，此變數設為ture，用於切換到分析頁時重新統計資料
GLOBALS.mainClickedBtn = 'search';		//從大首頁框按下的是搜尋還是分析按鈕
GLOBALS.search_range = {values:false,valuesTmp:false};	//搜尋範圍，values為真正用到的值，valuesTmp為暫存選擇器選擇的值，確定真正要搜尋時再把值複製給values
GLOBALS.has_xAxes_chartIDs = ['buleiChart','customChart','juanLevelChart'];	//"一定"有x軸的chartIDs
GLOBALS.percentStatistic_switch = {'dynastyLinear':{count:0,percent:0},'bulei':{count:0,percent:0},'authors':{count:0,percent:0},'jings':{count:0,percent:0}};	//製作筆數與總字數比例百分比切換時的儲存變數
GLOBALS.bulei = ['阿含部類','本緣部類','般若部類','法華部類','華嚴部類','寶積部類','涅槃部類','大集部類','經集部類','密教部類','律部類','毘曇部類','中觀部類','瑜伽部類','論集部類','淨土宗部類','禪宗部類','史傳部類','事彙部類','敦煌寫本部類'];	//,'新編部類'
GLOBALS.dynasties = ['後漢,25,220','曹魏,220,265','吳,229,280','西晉,265,316','晉,265,420','前涼,301,387','東晉,317,420','前秦/符秦,351,394','姚秦/後秦,384,417','西秦,385,431','北涼,397,460','劉宋,420,479','北魏/後魏/元魏,386,534','蕭齊,479,502','梁,502,557','東魏,534,550','北齊/高齊,550,577','北周,557,581','陳,557,589','隋,581,618','唐,618,907','宋,960,1279','元,1271,1368','清,1644,1911'/*,'新羅,-56,936','高麗,918,1392'*/];
GLOBALS.linear_dynasties = ['東漢,25,220','三國,220,280','西晉,280,317','東晉,317,420','南北朝,420,589','隋,589,618','唐,618,907','五代十國,907,960','北宋,960,1127','南宋,1127,1279','元,1279,1368','明,1368,1644','清,1644,1911'];	//不overlap線狀朝代清單,暫時移除：'西漢,-201,9'  '新,9,25'
GLOBALS.customDefined = ['長阿含經(Dīrgha-āgama),T0001','中阿含經(Madhyama-āgama),T0026','雜阿含經(Saṃyukta-āgama),T0099','增一阿含經(Ekottarika-āgama),T0125'];
GLOBALS.punctuations = ['(',')','，','。','！','…','、','「','」','.',',','》','《','：','）','（','；','？','　','─','"',"'",'*','︰','〉','〈','』','『','．','－','～','＼','｡','?'];	
GLOBALS.spliter = [' ',',','，','；',';','、'];
GLOBALS.cbetaonline_url = 'http://cbetaonline.dila.edu.tw/';	
GLOBALS.API_prefix = 'http://cbdata.dila.edu.tw/v1.2/';	
GLOBALS.prodHost = 'cbetaconcordance.dila.edu.tw';
GLOBALS.dynasty_linear_words_count = {	//各朝代的字數統計，製作年代分佈比例用的，字數來源為經錄規範資料庫首頁，朝代列表為GLOBALS.linear_dynasties之統計結果陣列(參functions.js , get_statistic() )
	'東漢  (25 CE ~ 220 CE);123':642341,
	'三國  (220 CE ~ 280 CE);250':652670,
	'西晉  (280 CE ~ 317 CE);299':2153673,
	'東晉  (317 CE ~ 420 CE);369':9888600,
	'南北朝  (420 CE ~ 589 CE);505':12426827,
	'隋  (589 CE ~ 618 CE);604':5275390,
	'唐  (618 CE ~ 907 CE);763':36495915,
	'五代十國  (907 CE ~ 960 CE);934':256598,
	'北宋  (960 CE ~ 1127 CE);1044':6483629,
	'南宋  (1127 CE ~ 1279 CE);1203':2346185,
	'元  (1279 CE ~ 1368 CE);1324':1173155,
	'明  (1368 CE ~ 1644 CE);1506':1118821,
	'清  (1644 CE ~ 1911 CE);1778':236218
};
GLOBALS.bulei_words_count = {};
GLOBALS.author_words_count = {};

function init()	{

	//處理selection換頁失效問題用到之變數，下方jqGrid事件會用到 +
	//ref:http://stackoverflow.com/questions/18502592/make-jqgrid-multiselect-selection-persist-following-pagination-toolbar-search
	var selectedRows = {};
	var agentsGrid = $('#jqGrid');
	//end -
			
	$(window).trigger('resize');
	
	var url_lang = $.url().param('lang');			//取得網址lang參數，準備判斷語系
	if(url_lang && $.trim(url_lang) == 'en')	{	//依據網址設定全域語系，預設中文
		GLOBALS.lang = 'en';
		$('body').addClass(GLOBALS.lang);
	}
	$('[data-lang-id]').each(function()	{			//根據語系替換靜態網頁的翻譯值
		$(this).text(LANG[GLOBALS.lang][$(this).attr('data-lang-id')]);
	});
	
	//語系按鈕href更換
	$('[data-lang-id="lang-siwtch-btn"]').parent().get(0).href = '?lang='+(GLOBALS.lang == 'en' ? 'zh':'en');
	


	//搜尋範圍初始化
	ContextSearchRange.init(
		function(res)	{
			
			if(res.length > 0)	{
				GLOBALS.search_range.valuesTmp = res;
				if($('#landing-range-selected').is(':visible'))	{
					
					//$('#landing-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');
					$('#landing-range-selected').text(LANG[GLOBALS.lang]['custom-range']);
				}
				else if($('#table-range-area').is(':visible'))	{	//於資料頁的「改變範圍」，此段等同於重新執行搜尋!!
					GLOBALS.new_keywords = $('.search-result-label').get().map(function(v) {	return $.trim($(v).attr('kw'));	});	//從資料頁的label取得目前關鍵字組合
					GLOBALS.search_range.values = GLOBALS.search_range.valuesTmp; //由於等於重新執行搜尋，故可將tmp值設給真正用到的GLOBALS.search_range.values
					GLOBALS.search_range.valuesTmp = false;	//已重搜，清空range tmp值
					$('#table-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');
					$('#table-range-reset').show();	
					
					//啟動開始分析需將所有變數回到初始狀態 +
					GLOBALS.search_data = {};
					GLOBALS.active_keyword = false;
					$('#search-result-lists').html('');	//清空關鍵字labels
					GLOBALS.colorSet.colorIndex = 0;	//顏色計數器要歸零
					GLOBALS.search_data_color = {};		//顏色要清空
					GLOBALS.gogogoBtn_finished_counter = 0;
					GLOBALS.search_xhrs = [];
					//啟動開始分析需將所有變數回到初始狀態 -
					
					GLOBALS.dataPage_updated = true;	//切換到資料頁需更新
					GLOBALS.new_keywords.forEach(function(kw)	{					
						search_kwic(kw,true);
					});		
				}
			}
		},
		function(res)	{
			if(res.length > 0)	{
				
				GLOBALS.search_range.valuesTmp = res;
				if($('#landing-range-selected').is(':visible'))	{
					
					//$('#landing-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');
					$('#landing-range-selected').text(LANG[GLOBALS.lang]['custom-range']);
				}
				else if($('#table-range-area').is(':visible'))	{	//於資料頁的「改變範圍」，此段等同於重新執行搜尋!!
					GLOBALS.new_keywords = $('.search-result-label').get().map(function(v) {	return $.trim($(v).attr('kw'));	});	//從資料頁的label取得目前關鍵字組合
					GLOBALS.search_range.values = GLOBALS.search_range.valuesTmp; //由於等於重新執行搜尋，故可將tmp值設給真正用到的GLOBALS.search_range.values
					GLOBALS.search_range.valuesTmp = false;	//已重搜，清空range tmp值
					$('#table-range-label').text(LANG[GLOBALS.lang]['custom-range']).addClass('landing-range-label-active');
					$('#table-range-reset').show();	
					
					//啟動開始分析需將所有變數回到初始狀態 +
					GLOBALS.search_data = {};
					GLOBALS.active_keyword = false;
					$('#search-result-lists').html('');	//清空關鍵字labels
					GLOBALS.colorSet.colorIndex = 0;	//顏色計數器要歸零
					GLOBALS.search_data_color = {};		//顏色要清空
					GLOBALS.gogogoBtn_finished_counter = 0;
					GLOBALS.search_xhrs = [];
					//啟動開始分析需將所有變數回到初始狀態 -
					
					GLOBALS.dataPage_updated = true;	//切換到資料頁需更新
					GLOBALS.new_keywords.forEach(function(kw)	{					
						search_kwic(kw,true);
					});		
				}
			}
		},
		function()	{
			return;
			
		}
	);

	
	if(GLOBALS.isLocal)	{	//config from index.html
		//載入離線版搜尋結果(寫死的檔案)
		$.getScript( "js/kwic_fake_res.js" ).done(function( script, textStatus ) {}).fail(function( jqxhr, settings, exception ) {});
	}

	//載入預設的經錄資料 from jinlu.js
	GLOBALS.jinlu = JINLU;	//JINLU is from js/jinlu.js
	JINLU = null;			//release variable
	
	//檢查是否已有暫存檔，有的話解鎖讀取暫存檔選單
	loadMainDataFromTmp(true);
	
	//啟動自動儲存使用者編輯的資料
	//setInterval(saveMainDataToTmp,10000);
	
	//載入dilaDaLinks.js外掛
	dilaDaLinks.init({containerID:'da-links-container',anchorHTML:'<i class="fa fa-th" aria-hidden="true" style="opacity:0.7"></i>',backgroundColor:'white'});
	       	
	
    $("#jqGrid").jqGrid({
        datatype: "local",
		editurl: 'clientArray',	//編輯模式(含刪除)需用到，固定此值即可
        colModel: [			
			{ label: 'ID', name: 'id', width: 45, key: true ,hidden:true},
			{ label: LANG[GLOBALS.lang]['jqGrid_del'], name: 'delLine', width: 15,search:false,formatter: function(cellValue, options, rowObject)	{	//search:false = 此欄不會出現在內建搜尋框
				return '<span class="delRow_btn glyphicon glyphicon-trash"></span>';
			}},			
			{ label: LANG[GLOBALS.lang]['jqGrid_category'], name: 'category', width: 70 },
			{ label: LANG[GLOBALS.lang]['jqGrid_work'], name: 'work', width: 55 },
			{ label: LANG[GLOBALS.lang]['jqGrid_title'], name: 'title', width: 120 },
			{ label: LANG[GLOBALS.lang]['jqGrid_lb'], name: 'lb', width: 40 },
			{ label: 'Keyword in context', name: 'kwic', width: 180, sorttype: function(cell_str,obj)	{
				//console.log(cell_str)
				//console.log(obj)
				var regexObj = /(.*?)(<mark[^<]+<\/mark>)(.*)/.exec(cell_str);
				//console.log(regexObj)
				return regexObj[3];
				//return regexObj[1].split("").reverse().join("");
			}},
			{ label: 'dynastyYear', name: 'dynastyYear', width: 10,hidden:true },
			{ label: '作譯者', name: 'authors', width: 10,hidden:true },
			{ label: 'deleted row', name: 'deleted', width: 10,hidden:true },
			{ label: '冊數', name: 'vol', width: 10,hidden:true },
			{ label: '卷', name: 'juan', width: 10,hidden:true }
			/*
		    {
				label: "刪除",
				name: "delAction",
				width: 40,
				formatter: "actions",
				formatoptions: {
					keys: true,
					editbutton:false
				}       
            },			
			
			// sorttype is used only if the data is loaded locally or loadonce is set to true
			{ label: 'Quantity', name: 'Quantity', width: 80, sorttype: 'number' }                   
			*/
        ],
		loadonce: false,
		viewrecords: true,
        width: 1100,
        height: 'auto',
        rowNum: 50,
		//rowList : [500,3000,10000,100000],
        rownumbers: true, 
        rownumWidth: 50, 
        multiselect: true,
		subGrid: true, // set the subGrid property to true to show expand buttons for each row
        subGridRowExpanded: function(parentRowID,parentRowKey)	{
			var thisGrid = $(this);
			var lb = thisGrid.getCell(parentRowKey, 'lb');
			var vol = thisGrid.getCell(parentRowKey, 'vol');
			var work = thisGrid.getCell(parentRowKey, 'work');
			//console.log(vol+'n'+work.replace('T','')+'_p'+lb);
			$.getJSON(GLOBALS.API_prefix+'lines?linehead='+(vol+'n'+work.replace('T','')+'_p'+lb)+'&before=3&after=3&callback=?',function(json)	{
				var html = [];
				if(json.results)	{
					for(var i in json.results)	{
						/*
						if(json.results[i].linehead == (vol+'n'+work.replace('T','')+'_p'+lb))	{	//只有kwic該行做hl
							var hlText = $('<div/>').html(thisGrid.getCell(parentRowKey, 'kwic')).find('mark').text();
							var hlTextArr = hlText.split('');	//由於ray的資料有一堆tag，必須做跨tag hl，先將字拆成陣列...
							var regexp_pattern = [];
							for(var hti in hlTextArr)	{
								//做跨tag hl...(可跨 1. <tag>..</tag>、2. <br />、3.下列標點符號)，規則可能不足，有需要得新增
								regexp_pattern.push(hlTextArr[hti]+'(<[^>]+>[^<]+<\/[^>]+>|<br.*?/>|：|。|，|、|「|」|《|》|（|）|\(|\))*?');
							}
							var r = new RegExp('('+regexp_pattern.join('')+')','g');
							json.results[i].html = json.results[i].html.replace(r,"<mark style='background-color:inherit;color:"+GLOBALS.search_data_color[hlText]+";font-weight:bold'>$1</mark>");
						}
						*/
						html.push(json.results[i].html);
					}

					html = html.join('');
					var hlText = $('<div/>').html(thisGrid.getCell(parentRowKey, 'kwic')).find('mark').text();
					var hlTextArr = hlText.split('');	//由於ray的資料有一堆tag，必須做跨tag hl，先將字拆成陣列...
					var regexp_str = '(<[^>]+>[^<]+<\/[^>]+>|<a class="noteAnchor"[^>]+></a>|<br.*?/>|：|。|，|、|「|」|《|》|（|）|\\(|\\)|！|…|\\.|\\\|；|？|　|─|"|\\*|︰|〉|〈|』|『|『|』|．|－|～|＼|｡|\\?)*?';
					var regexp_pattern = [];
					for(var hti in hlTextArr)	{
						//做跨tag hl...(可跨 1. <tag>..</tag>、2. <br />、3.下列標點符號)，規則可能不足，有需要得新增
						regexp_pattern.push(hlTextArr[hti]+regexp_str);
					}
					var r = new RegExp('('+regexp_pattern.join('')+')','g');
					hlText = hlText.replace(new RegExp(regexp_str.substring(0,regexp_str.length-2),'g'),'');	//關鍵字於此需去除本身字與字間的escape字元，否則下一行取GLOBALS.search_data_color[hlText]會取不到
					html = html.replace(r,"<mark style='background-color:inherit;color:"+GLOBALS.search_data_color[hlText]+";font-weight:bold'>$1</mark>");	
					
					$("#"+parentRowID).append(html);
				}
			});
		},
		sortname : 'work',
        pager: "#jqGridPager",
		toppager: true,	//上方也出現分頁
		/*
		grouping:true,
		groupingView : { groupField : ['work'],
			groupColumnShow : [true],
			groupCollapse : false,
			groupText : ['<b><span class="jqGrid-group-work">{0}</span> - {1} Item(s)</b>'] 
		},
		*/
        onSelectRow: function (rowId, status, e) {
			if($('#jqGrid').jqGrid('getGridParam', 'selrow'))	$('#search-result-tools').show();	//如果有勾任一項目，即顯示列操作按鈕，反之隱藏
			else	$('#search-result-tools').hide();
        },
		onSelectAll: function (rowIds, status) {
			if($('#jqGrid').jqGrid('getGridParam', 'selrow'))	$('#search-result-tools').show();	//如果有勾任一項目，即顯示列操作按鈕，反之隱藏
			else	$('#search-result-tools').hide();
		},
		gridComplete: function () {
			
			/*
			if($('.search-result-label').size() > 0)	{	//每次grid完成後，調整統計按鈕和列操作按鈕顯示
				
			}
			else	{
				$('#search-result-tools').hide();
			}
			*/
			
			//在內建的grid完成refresh後，我自己加的class會不見，故於此將class塞回去
			var deleted_count = 0;
			var allDataObj = jQuery('#jqGrid').jqGrid ('getGridParam', 'data');			
			var jqGridObj = document.getElementById('jqGrid');
			for(var i in allDataObj)	{
				if(allDataObj[i].deleted == 1)	{	//delete =1就塞回class
					var rowid = allDataObj[i].id;
					$('#'+rowid,jqGridObj).addClass('tr_deleted');
					deleted_count++;
				}
			}
			
			//為#jqGrid的group field加上經名
			$('.jqGrid-group-work').each(function()	{
				$(this).append(' '+GLOBALS.jinlu[$(this).text()].title);
			});
			
			
		} 
		/*
		//以下事件處理selection換頁會失效的問題
                onSelectAll: function (rowIds, status) {
                    if (status === true) {
                        for (var i = 0; i < rowIds.length; i++) {
                            selectedRows[rowIds[i]] = true;
                        }
                    } else {
                        for (var i = 0; i < rowIds.length; i++) {
                            delete selectedRows[rowIds[i]];
                        }
                    }
                },
                onSelectRow: function (rowId, status, e) {
                    if (status === false) {
                        delete selectedRows[rowId];
                    } else {
                        selectedRows[rowId] = status;
                    }

                },
                gridComplete: function () {
                    for (var rowId in selectedRows) {
                        agentsGrid.setSelection(rowId, true);
                    }
                }     
		*/
    }).navGrid('#jqGridPager',{	//設定工具列
		edit: false,
		add: false,
		del: false,
		search: true,
		refresh: true,
		view: false,
		position: "left",
		cloneToTop: true
	}).searchGrid({	//設定搜尋相關
		caption: "搜尋過濾",
		sopt:['cn','eq'],
		Find: "搜尋",
		Reset: "Reset",		
		odata: [{ oper:'eq', text:'完全符合'},{ oper:'ne', text:'not equal'},{ oper:'lt', text:'less'},{ oper:'le', text:'less or equal'},{ oper:'gt', text:'greater'},{ oper:'ge', text:'greater or equal'},{ oper:'bw', text:'begins with'},{ oper:'bn', text:'does not begin with'},{ oper:'in', text:'is in'},{ oper:'ni', text:'is not in'},{ oper:'ew', text:'ends with'},{ oper:'en', text:'does not end with'},{ oper:'cn', text:'包含'},{ oper:'nc', text:'does not contain'},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}, {oper:'bt', text:'between'}],	
		left:350,
		top:200,
		modal:false,
		showOnLoad:false
	}).jqGrid('navButtonAdd',"#jqGridPager",{	//在工具列增加自訂按鈕(匯出按鈕)
		caption:"",
		buttonicon:"glyphicon-export",
		onClickButton:function()	{	exportToExcel('main_grid');	},
		position: "last",
		title:"Export this form to Excel",
		cursor: "pointer",
		id:"jqGrid_export_excel_btn"
	});

	$('#jqGrid_export_excel_btn').clone().appendTo($('#pg_jqGrid_toppager #jqGrid_toppager_left table > tbody > tr')).on('click',function()	{	exportToExcel('main_grid');	});	//因為工具列自訂按鈕只能在最下面，故複製一份至topbar(匯出按鈕)
	$('#searchmodfbox_jqGrid .ui-jqdialog-titlebar-close').trigger('click');	//在searchGrid執行後頁面初次讀取時搜尋框不知為何會跳出來，於此啟動close隱藏
			   
			   
			   

    $("#statisticGrid").jqGrid({
        datatype: "local",
		editurl: 'clientArray',	//編輯模式(含刪除)需用到，固定此值即可
        colModel: [			
			{ label: 'ID', name: 'id', width: 45, key: true ,hidden:true,sorttype: 'integer'},
			{ label: '部類', name: 'category', width: 70 },
			{ label: '詞', name: 'keyword', width: 60,sorttype: 'integer' },
			/*
			{ label: '刪除', name: 'delLine', width: 40,formatter: function(cellValue, options, rowObject)	{
				return '<span class="delRow_btn glyphicon glyphicon-trash"></span>';
			}}
		    {
				label: "刪除",
				name: "delAction",
				width: 40,
				formatter: "actions",
				formatoptions: {
					keys: true,
					editbutton:false
				}       
            },			
			
			// sorttype is used only if the data is loaded locally or loadonce is set to true
			{ label: 'Quantity', name: 'Quantity', width: 80, sorttype: 'number' }                   
			*/
        ],
		loadonce: false,
		viewrecords: true,
        width: 900,
        height: 'auto',
        rowNum: 1000,
		//rowList : [500,3000,10000,100000],
        rownumbers: true, 
        rownumWidth: 50, 
        //multiselect: true,
		/*
		subGrid: true, // set the subGrid property to true to show expand buttons for each row
        subGridRowExpanded: function(parentRowID,parentRowKey)	{
			 $("#" + parentRowID).append('ddbc the best');
		},
		*/
		sortname : 'id',
        //pager: "#statisticGridPager"
    });	
		

	//create charts
	var chartIDs = ['buleiChart','dynastyLinearChart','authorsChart','customChart','jingsChart','jingLevelChart','juanLevelChart'];
	
	for(var ci in chartIDs)	{
		var ctx = document.getElementById(chartIDs[ci]);
		var chartData = {
			labels: ["January", "February", "March", "April", "May", "June", "July"],
			datasets: [
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
					data: [65, 59, 80, 81, 56, 55, 40],
				}
			]
		};		
		
		var chart_type = chartIDs[ci] == 'dynastyLinearChart' ? 'line':'bar';	//只有dynasty預設是線圖，否則都為長條圖
		chart_type = 'line';	//先都改line好了
		var scales_obj = {
			yAxes: [{
				ticks: {
					beginAtZero:false
				}
			}]
		};
		if(chartIDs[ci] == 'dynastyLinearChart')	{	//x軸為線狀的話需加入的scales設定
			scales_obj['xAxes'] = [{
                type: 'linear',
                position: 'bottom',
				/*
				ticks: {
                    max: 2000,
                    min: 0,
                    stepSize: 195
                },
				*/
				scaleLabel:{
					labelString:'Years',
					display:true
				}
            }];
		}
		else if(GLOBALS.has_xAxes_chartIDs.indexOf(chartIDs[ci]) == -1)	{	//隱藏x軸
			scales_obj['xAxes'] = [{
                display: false
            }];			
		}
		
		
		GLOBALS.charts[chartIDs[ci]] = new Chart(ctx, {
			type: chart_type,
			data: chartData,
			options: {
				scales: scales_obj,
				tooltips: {
					enabled: true,
					mode: 'index',
					callbacks: {
						/*
						label: function(tooltipItems, data) { 
							console.log(tooltipItems)
							console.log(data)
							//return 'x座標：'+tooltipItems.xLabel+'<br/>y:'+tooltipItems.yLabel;
							return data.datasets[tooltipItems.datasetIndex].label+':'+tooltipItems.yLabel;
						},
						*/
						title: function(tooltipItems, data)	{
							//console.log(tooltipItems)
							tooltipItems = tooltipItems[0];
							var dyObj = findDyNameByYear(tooltipItems.xLabel);
							var dyRange = get_dynasty_range_str(dyObj.start,dyObj.end);
							return dyObj ? dyObj.dyName+dyRange : tooltipItems.xLabel;	//如果用x座標可取到朝代名稱(表這個為線狀年代之x軸)就回傳朝代，否則照預設回傳x軸之值
						}
						
					}
				},
				onClick:function(evt)	{	//chart click event
					//console.log(this)
					chart_click_action(this,evt);
				}
			}
		});			
		//$('#'+chartIDs[ci]).hide();//圖表先藏起來
	}
	
	
	//建立部類、各作譯者的字數統計陣列
	for(var work in GLOBALS.jinlu)	{
		//部類
		var buleis = GLOBALS.jinlu[work].category.split(',');	//部類多值處理
		for(var bi in buleis)	{
			if(!GLOBALS.bulei_words_count[buleis[bi]])	GLOBALS.bulei_words_count[buleis[bi]] = 0;
			GLOBALS.bulei_words_count[buleis[bi]] += parseInt(GLOBALS.jinlu[work].word_count,10);
		}
		
		//作譯者
		for(var ai in GLOBALS.jinlu[work].authors)	{
			if(!GLOBALS.author_words_count[GLOBALS.jinlu[work].authors[ai]])	GLOBALS.author_words_count[GLOBALS.jinlu[work].authors[ai]] = 0;
			GLOBALS.author_words_count[GLOBALS.jinlu[work].authors[ai]] += parseInt(GLOBALS.jinlu[work].word_count);
		}
	}
	/*
	console.log(GLOBALS.bulei_words_count)
	console.log(GLOBALS.author_words_count)
	*/

}

//加入ga(just in production：cbetaconcordance.dila.edu.tw才列入統計):
if(location.hostname == GLOBALS.prodHost)	{
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

	ga('create', 'UA-76091794-4', 'auto');
	ga('send', 'pageview');
}


	//擴充jquery，增加textNodes function，使用方法:$(xxx).textNodes().wrap('<span/>')
	$.fn.textNodes = function() {
		var ret = [];
		(function(el){
			if (!el) return;
			if ((el.nodeType == 3))	{	//||(el.nodeName =="BR")
				ret.push(el);
			}
			else	{
				if(!$(el).is('.lb,.lineInfo,.note-link,.lb_br'))	{	//列出的class不做textnode
					for (var i=0; i < el.childNodes.length; ++i)	{
						arguments.callee(el.childNodes[i]);
					}
				}
			}
		})(this[0]);
		return $(ret);
	}	
	
	Object.size = function(obj) {	// Get the size of an object : Object.size(myArray);
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};	


	//object find by specify key and value,use:data.findKey({ id: 3 }); ref:http://stackoverflow.com/questions/5443436/how-do-i-recursively-search-an-object-tree-and-return-the-matching-object-based
	//使用jquery時不能複寫Object.prototype，僅能使用Object.defineProperty來擴充，ref：http://stackoverflow.com/questions/21729895/jquery-conflict-with-native-prototype
	Object.defineProperty(Object.prototype, 'findKey',{
	  value : function(keyObj) {
			var p, key, val, tRet;
			for (p in keyObj) {
				if (keyObj.hasOwnProperty(p)) {
					key = p;
					val = keyObj[p];
				}
			}

			for (p in this) {
				if (p == key) {
					if (this[p] == val) {
						return this;
					}
				} else if (this[p] instanceof Object) {
					if (this.hasOwnProperty(p)) {
						tRet = this[p].findKey(keyObj);
						if (tRet) { return tRet; }
					}
				}
			}

			return false;
		},
	  enumerable : false
	});	
	
	
	String.prototype.stripTags = function()	{	//移除字串的html tag
		return this.replace(/(<([^>]+)>)/ig,"");
	}	
	
	GLOBALS['datasetSample'] =
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
		