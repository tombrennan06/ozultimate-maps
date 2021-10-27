<?php
	$json = $_POST['json'];
	$err = false; 
	/* sanity check */
	if (json_decode($json) != null) {
		if (is_numeric($_POST['id'])) {
			$id = $_POST['id'];
			if (!($file = fopen('data/'.$id.'.geojson','w+'))) {
				$err = true;
				$message = 'Failed to open file';
			}
			fwrite($file, $json);
			fclose($file);
		}
		else { 
			$err = true; 
			$message = 'Invalid id';
		}
	}
	else
	{
		$err = true;
		$message = 'Invalid JSON data';
	}
	if ($err)
	{
	header('HTTP/1.1 500 Internal Server Booboo');
	header('Content-Type: application/json; charset=UTF-8');
	die(json_encode(array('message' => 'ERROR', 'code' => $message)));
	}
?>