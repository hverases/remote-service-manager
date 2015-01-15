<?php
	require 'load_file.php';
	
	//Checks if sent action is valid
	function validAction($action) {
		switch ($action) {
			case "start":
			case "stop":
			case "reset":
				return true;
				break;
			default:
				return false;
				break;
		}
	}
	
	//Checks if sent process name is valid (is included in 'procs' file)
	function validProcess($p_name, $procs) {
		foreach ($procs as $process) {
			$proc_name = $process[0];
			if($proc_name === $p_name) {
				return true;
			}
		}
		return false;
	}
	
	//Service name is needed to start, stop or reset a proccess
	function getServiceName($p_name, $procs) {
		foreach ($procs as $process) {
			if($process[0] === $p_name) {
				return $process[1];
			}
		}
	}
	

	$data = file_get_contents( "php://input" );
	$command = json_decode($data);
	$action = $command[0];
	$p_name = $command[1];
	
	$procs = loadFile("procs", true);
	$response["action"] = $action;
	$response["p_name"] = $p_name;
	
	
	header('Content-type: application/json');
	
	if($data === "")
		$response["result"] = "No data sent";
	elseif($command === null || gettype($command) != "array" || count($command) != 2)
		$response["result"] = "Invalid data sent";
	elseif(!validAction($action))
		$response["result"] = "Invalid action sent";
	elseif(!validProcess($p_name, $procs))
		$response["result"] = "Invalid process name";
	else {
		$response["result"] = "OK";
		$serv_name = getServiceName($p_name, $procs);
		shell_exec("sudo service " . $serv_name . " " . $action .
		" > /dev/null 2>/dev/null &"); /* Last part starting with > allows to
		continue executing PHP code before the command returns output */
	}
	
	echo json_encode($response);
	
	
?>