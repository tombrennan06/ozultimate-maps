<?php
   $json = $_POST['json'];

   /* sanity check */
   if (json_decode($json) != null) {
		 if (is_numeric($_POST['id'])) {
			 $id = $_POST['id'];
			 $file = fopen('data/'.$id.'.geojson','w+');
			 fwrite($file, $json);
			 fclose($file);
		 }
   }
   else
   {
     // user has posted invalid JSON, handle the error 
   }
?>