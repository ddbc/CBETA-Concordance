<?php
$api_base_url = 'http://cbdata.dila.edu.tw/v1.2/kwic3?';
$type = isset($_POST['type']) && trim($_POST['type']) != '' ? trim($_POST['type']):false;

if($type == 'kwic')	{
	$response = file_get_contents($api_base_url.'q='.trim(urlencode($_POST['kw'])).'&canon=T&edition=CBETA&rows=5000000'.(isset($_POST['works']) ? '&works='.trim($_POST['works']):''));	

	if(count(preg_grep('/Content-Encoding: gzip/u',$http_response_header)) > 0)	{	//判斷header是否有gzip
		header("X-Content-Length: " . strlen(gzencode($response)));	//gzencode先將回傳gzip後在算大小，這樣才準，strlen是回傳bytes：ref：http://serverfault.com/questions/183843/content-length-not-sent-when-gzip-compression-enabled-in-apache
	}
	else	{
		header("X-Content-Length: " . strlen($response));
	}
	echo $response;
}
else if($type == 'getResultCount')	{	//取得關鍵字筆數
	$response = file_get_contents($api_base_url.'q='.trim(urlencode($_POST['kw'])).'&canon=T&edition=CBETA'.(isset($_POST['works']) ? '&works='.trim($_POST['works']):''));
	echo $response;
}

?>