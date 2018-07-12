/*
 * 
 * 作者：李阿閒(winxd@dila.edu.tw)
 *
*/			
			
			var gMapObj = function(mapContainerID,lineNoCallback)	{
				if(!document.getElementById(mapContainerID))	{
					//alert('can not get the map container!google map does not set');
					return false;
				}
				
				//private variables
				var map,markerCluster;				
				var markersArray = [];
				var lineNoArray = [];	//放行號的array
				var infowindow =  new google.maps.InfoWindow();
				var latlng = new google.maps.LatLng(31.523897,105.162580);
				var myOptions = {
					zoom: 4,
					center: latlng,
					mapTypeId: google.maps.MapTypeId.TERRAIN
				};
				map = new google.maps.Map(document.getElementById(mapContainerID), myOptions);								
				
				//private functions				
				var addMark = function(placeObj,index)	{
					var custom_icon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|"+placeObj.color.replace('#',''),new google.maps.Size(21, 34),new google.maps.Point(0,0),new google.maps.Point(10, 34));
					var marker = new google.maps.Marker({
						position: new google.maps.LatLng(placeObj.y,placeObj.x),
						map: map,
						icon:custom_icon
					});
					google.maps.event.addListener(marker, 'click', function() {
						if(lineNoCallback)	{
							lineNoCallback(placeObj.from,placeObj.to,true);
						}
						//infowindow.setContent('<span class="nexusPointExplain" style="font-weight:bold;color:black;text-decoration:none">'+placeObj.title+'</span><br/>'+placeObj.desc); 
						//老闆要求的用地點去取得底下所有的經放在infowindow
						var place_grp_str = $('#dataArea > table td:contains("'+placeObj.title+'")').parent().get().map(function(o)	{	return $(o).find('td:eq(0)').text()+' '+$(o).find('td:eq(1)').text(); }).join('<br/>');
						infowindow.setContent('<span class="nexusPointExplain" style="font-weight:bold;color:black;text-decoration:none">'+placeObj.title+'</span><br/><br/>'+place_grp_str); 
						infowindow.setPosition(marker.getPosition());							
						infowindow.open(map);														
					});
					//marker.value=placeObj.title+'_'+placeObj.from+','+placeObj.to;
					//marker.desc = placeObj.desc;
					marker.indexValue=index;
					//marker.setVisible(false);
					return marker;					
				}
				
				var clearMarks = function()	{
					if(markersArray) {
						for (var i in markersArray) {
							markersArray[i].setMap(null);
						}
						markersArray.length = 0;
						markersArray = [];
					}
					if(markerCluster)	{
						markerCluster.clearMarkers();
						markerCluster = null;
					}					
					$('a.fitZoomLink').unbind('click');
					
				}
				
				//register events
				
				/*
				google.maps.event.addListener(map, 'click', function(e){
					infowindow.close();
				});				
				*/
				google.maps.event.addListener(map, 'zoom_changed', function(){
					infowindow.close();
					$('a.fitZoomLink').unbind('click');	//移除fitZoomLink榜定的事件，因為執行zoom時cluster就不一樣，故在此清除事件
				});	
				
				return	{
					load:function(data,kw_filter,callbackFunc)	{	//callbackFunc為限定load執行完畢後要才能執行的func
						var index = -1,
							table = [],
							kill_repeat = [],
							ps = this;
							
						if(kw_filter.length <=0 )	{
							$('#dataArea > table > tbody').html('');
							this.resetMap();
							return;
						}	
						
						//依work找關鍵字	
						var findKwByWork = function(work)	{	//注意：use global varible "data" , "kw_filter" in this function
							var res = [];
							for(var kw in data)	{								
								if(kw_filter.length > 0 && $.inArray(kw,kw_filter) == -1)	{
									continue;
								}
								var finded_works = data[kw].filter(function(e)	{return e.work == work;});	//使用原生的filter去找，效率佳
								if(finded_works.length > 0)	res.push(kw);	//如果找到任一個work，表示有該關鍵字								
							}		
							return res;
						};	
						
						//依西元中間年找朝代資訊
						var findDyInfoByYear = function(year)	{
							for(var dyi in linear_dynasties)	{
								var dyData = linear_dynasties[dyi].split(',');
								if(parseInt(year,10) >= parseInt(dyData[1],10) && parseInt(year,10) < parseInt(dyData[2],10))	{
									return 	get_dynasty_range_str(linear_dynasties[dyi].split(',')[1],linear_dynasties[dyi].split(',')[2]);
								}				
							}
							return false;
						};
						var get_dynasty_range_str = function(s_year,e_year)	{
							s_year = parseInt(s_year,10);
							e_year = parseInt(e_year,10);
							return ''+s_year+' '+(s_year <= 0 ? 'BCE':'CE')+' ~ '+e_year+' '+(e_year <= 0 ? 'BCE':'CE')+'';
						};
						
						
						this.resetMap();		
						for(var kw in data)	{
							if(kw_filter.length > 0 && $.inArray(kw,kw_filter) == -1)	{
								continue;
							}
							for(var i in data[kw])	{
								if(data[kw][i].deleted == 1)	continue;
								
								if(JINLU[data[kw][i].work].place_data && JINLU[data[kw][i].work].place_data.length > 0)	{
									var repeat_key = data[kw][i].work+data[kw][i].title+'_'+JINLU[data[kw][i].work].place_data[0]['p_name'];
									
									if(parseFloat(JINLU[data[kw][i].work].place_data[0]['long'],10) != 0.0 && parseFloat(JINLU[data[kw][i].work].place_data[0]['lat'],10) != 0.0 && $.inArray(repeat_key,kill_repeat) == -1)	{
										index++;
										markersArray.push(addMark({'y':parseFloat(JINLU[data[kw][i].work].place_data[0]['lat'],10),'x':parseFloat(JINLU[data[kw][i].work].place_data[0]['long'],10),'title':JINLU[data[kw][i].work].place_data[0]['p_name'],'desc':data[kw][i].work+' '+data[kw][i].title,'color':kw_colors[kw]},index));
										lineNoArray.push(data[kw][i].work+'_'+data[kw][i].lb);
										table.push('<tr data-index="'+index+'" data-work="'+data[kw][i].work+'"><td>'+data[kw][i].work+'</td><td>'+data[kw][i].title+'</td><td>'+findDyInfoByYear(JINLU[data[kw][i].work].time)+'</td><td>'+JINLU[data[kw][i].work].place_data[0]['p_name']+'</td></tr>');
										kill_repeat.push(repeat_key);

									}
								}
							}	
						}
						
						$('#dataArea > table > tbody').html(table.join(''));
						
						
						//將出現的關鍵字做成圓點點塞回table
						$('#dataArea > table > tbody > tr').each(function()	{
							var work = $(this).attr('data-work');
							var color = $(this).attr('data-kw-color');
							$(this).find('td:eq(1)').append(findKwByWork(work).map(function(kw)	{	return '<span class="keyword_dots" data-kw="'+kw+'" style="background-color:'+kw_colors[kw]+'"></span>';	}).join(''));
							
							
							//將經+地點重複的marker設成灰色
							if($(this).find('.keyword_dots').size() > 1)	{
								console.log(ps.getMarkers()[$(this).attr('data-index')])
								ps.getMarkers()[$(this).attr('data-index')].setIcon('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|BEB2B2');
								ps.getMarkers()[$(this).attr('data-index')].setZIndex(1000);	//灰色的要再前面
							}
						});
						
												
						if(callbackFunc)	callbackFunc();
						
						/*
						$.ajax({
							type: "GET",
							data:"filename="+filename,
							url: "getData.php?getType=kml&lang="+lang_flag,
							dataType: "json",
							success:function(result)	{
								var nexusObj = eval('('+result+')');
								var index = 0;
								for(var i in nexusObj)	{	
									if(nexusObj[i].x != '0' && nexusObj[i].y != '0' && nexusObj[i].x != '' && nexusObj[i].y != '')	{	//沒有座標或座標為0，0不秀
										markersArray.push(addMark(nexusObj[i],index++));
										lineNoArray.push(nexusObj[i].from+'_'+nexusObj[i].to);
									}
								}
								markerCluster = new MarkerClusterer(map, markersArray,{'zoomOnClick':false});
								google.maps.event.addListener(markerCluster, 'clusterclick',function(cluster) {	
									var marksInCluster = cluster.getMarkers();
									var html = '';									
									for(var i = 0 ; i < marksInCluster.length ; i++)	{
										html += '<tr><td width="30%">'+marksInCluster[i].value.split('_')[1]+'</td><td width="60%">'+marksInCluster[i].value.split('_')[0]+'</td><td width="10%"><a id="'+marksInCluster[i].indexValue+'_singlePlaceLink" href="javascript:void(null)" class="singlePlaceLink"><img src="./images/link_ico.png" title="see this nexus point"></a></td></tr>';
									}									
									html = '<div class="gmapBalloonStyle"> <span style="color:red">'+marksInCluster.length+'</span>  '+lang_config['gmap_group_title']+'<table><thead><tr><td>'+lang_config['gmap_group_table_lineNo']+'</td><td>'+lang_config['gmap_group_table_name']+'</td><td>'+lang_config['gmap_group_table_link']+'</td></tr></thead><tbody>'+html+'</tbody></table></div>';
									var pos = cluster.getCenter();			
									infowindow.setPosition(pos);
									infowindow.setContent(html);
									infowindow.open(map);				
									$('a.fitZoomLink').bind('click',function()	{	//綁定click事件
										map.fitBounds(cluster.getBounds());
									});		
								}); 
								callbackFunc();
							}
						});
						*/
					},
					resetMap:function()	{	//將map恢復到預設view
						clearMarks();
						if(lineNoArray)	{
							lineNoArray.length = 0;
							lineNoArray = [];
						}
						map.setCenter(latlng);
						map.setZoom(4);
					},
					getMap:function()	{
						return map;
					},
					getInfoWindow:function()	{
						return infowindow;
					},
					getMarkers:function()	{
						return markersArray;
					},
					getLineNo:function()	{
						return lineNoArray;
					}
				}				
			}