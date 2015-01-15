<?php
	require 'load_file.php';
	require 'get_status.php';
	
	$p_names = loadFile("procs", true);
	$processes = getStatus($p_names);
		
	header('Content-type: application/json');
	echo json_encode($processes);
?>