<?php
	/*Load file and (optionally) decode it from JSON, second parameter
	determines it (true or false)*/
	function loadFile($file_name, $json_dec) {
		$file = fopen($file_name, "r");
		$content = "";
		
		if ($file) {
		
			while (!feof($file)) {
				$content .= fgetss($file, 5000);
			}

			fclose($file);
		}
		
		if($json_dec)
			return json_decode($content);
		else
			return $content;
	}
?>