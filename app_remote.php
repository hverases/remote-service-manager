<!DOCTYPE html>
<html>
	<head>
		<title>Remote Service Manager</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" type="text/css" href="style.css">
		<?php
			// Include and instantiate the class 'Mobile_Detect'
			require_once 'Mobile_Detect.php';
			$detect = new Mobile_Detect;

			// Any mobile device (phones or tablets).
			if ( $detect->isMobile() ) {
				echo "<style id='mobile1'>#t_procs { margin: auto } body { font-size:1em }</style>";
			}
		?>
		<script type="text/javascript">
			<?php
				require 'load_file.php';
				require 'get_status.php';
				
				/*Insert process status associative array in JSON format.
				This will be used to do the first "print" of the process
				table*/
				$processes = loadFile("procs", true);
				$p_status = getStatus($processes);
				echo "var procsStatusJSON = '" . json_encode($p_status) . "';\n";
				
				//Set JS values for refresh interval and show or not show countdown
				$conf = loadFile("conf", true);
				echo "var REFRESH_INTERVAL = " . $conf->refresh_interval . ";\n";
				echo "var SHOW_REFRESH_COUNTDOWN = " . $conf->show_refresh_countdown . ";\n";
				
				/*Set error MESSAGES in the specified language in conf file
				Notice that this is not parsed from JSON and is passed directly
				to a JS variable, so it will be a native JS object identical
				to selected language file*/
				$msgs = loadFile("strings/" . $conf->language, false);
				echo "var MESSAGES = " . $msgs . ";\n";
			?>
		</script>
		<script type="text/javascript" src="script.js"></script>
	</head>
	<body>
		<table id="t_procs"></table>
		<span id="countdown"></span>
		<div id="div_messages"></div>
		<button id="reconnect-button"></button>
		<div id="div_action"></div>
	</body>
</html>