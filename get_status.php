<?php
	/*This function returns an associative array containing processes status.
	1 for 'running' and 2 for 'stopped', process name is used as index*/
	function getStatus($p_names) {
	
		foreach ($p_names as $process) {
			$p_name = $process[0];
			$output = shell_exec("ps -e | grep " . $p_name);
			if($output != "")
				$processes[$p_name] = 1;
			else
				$processes[$p_name] = 0;
		}
		return $processes;
	}

?>