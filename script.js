/* Different possible states of a service, 'BUSY' means that the
service is starting, stopping or resetting*/
var STATE = {
	STOPPED: 0,
	RUNNING: 1,
	BUSY: 2
};

/* Possible orientations of a mobile device */
var ORIENTATION = {
	PORTRAIT: 0,
	LANDSCAPE: 1
};

//Possible actions for services
var ACTIONS = ["start","stop","reset"];

var TIMEOUT = 30000; //Previously REFRESH_INTERVAL * 6 * 1000

var pendingActions = []; /*Pending actions are stored to know what
services are in process of start/stop/reset and keep their buttons
locked on next refresh if the actions have not completed*/

var t_procs; //Main table which contains all the processes, their status and buttons
var txtNode_messages; //Shows error messages for timeouts trying to refresh the status
var txtNode_action; //Shows error messages for timeouts trying to send an action request to server
var reconn_btn; //Reconnect button

var interval; //Interval for timed operations
var fnSetInterval; //It contains the function that set the proper interval, in a similar way to a pointer to function
var countd_num = REFRESH_INTERVAL; //It stores the current nomber in case of having countdown enabled
var txtNodeCountd; //Text node that shows the current nomber of the countdown

var firstTimeoutMsg = true; //Intended to know what message should be displayed on timeout
var connLost = false; //For redrawing 't_procs' table after successful reconnect, to enable only the correct buttons
var procsStatus; //Process status in a native javascript object

var mobile; //Boolean. Stores if a mobile browser is used or not
var txtNodeMobile2; //Extra style rules when t_procs is larger than screen width
var previousOrientation; //Previous mobile device orientation

window.onload = function() {
	t_procs = document.getElementById("t_procs");
	createErrorMessageTextNodes();
	setReconnectButton();
	
	lowTimeoutIfIE();
	
	mobile = document.getElementById("mobile1") != null;
	if(mobile) {
		previousOrientation = getScreenOrientation();
		createMobileStyle2();
		window.onresize = checkIfChangeStyle;
	}
	
	procsStatus = JSON.parse(procsStatusJSON);
	showProcsStatus();
	
	if(t_procs.offsetWidth > window.innerWidth)
			shrinkToFit(true);
			
	if(SHOW_REFRESH_COUNTDOWN) {
		fnSetInterval = setCountdownInterval;
		createCountdownTextNode();
	}
	else
		fnSetInterval = setNoCountdownInterval;
	
	fnSetInterval();
}

function createErrorMessageTextNodes() {
	var div_messages = document.getElementById("div_messages");
	txtNode_messages = document.createTextNode("");
	div_messages.appendChild(txtNode_messages);
	
	var div_action = document.getElementById("div_action");
	txtNode_action = document.createTextNode("");
	div_action.appendChild(txtNode_action);
}

function setReconnectButton() {
	reconn_btn = document.getElementById("reconnect-button");
	reconn_btn.onclick = reconnect;
	var txtNode_reconn = document.createTextNode(MESSAGES.reconnect);
	reconn_btn.appendChild(txtNode_reconn);
}

function getScreenOrientation() {
	if(window.innerHeight > window.innerWidth)
		return ORIENTATION.PORTRAIT;
	else
		return ORIENTATION.LANDSCAPE;
}

function createCountdownTextNode() {
	var countdown = document.getElementById("countdown");
	txtNodeCountd = document.createTextNode(REFRESH_INTERVAL);
	countdown.appendChild(txtNodeCountd);
}

/*Create the second style tag for mobile devices, it will be used
when table "t_procs" doesn't fit on screen*/
function createMobileStyle2() {
	var head = document.getElementsByTagName("head")[0];
	var styleMobile2 = document.createElement("style");
	styleMobile2.id = "mobile2";
	txtNodeMobile2 = document.createTextNode("");
	styleMobile2.appendChild(txtNodeMobile2);
	head.appendChild(styleMobile2);
}

/*When viewport is resized, it will check if screen orientation has
changed, to shrink table's padding or leave it with default style*/
function checkIfChangeStyle() {
	
	var currentOrientation = getScreenOrientation();
	
	if(currentOrientation != previousOrientation) {
		if(t_procs.offsetWidth > window.innerWidth)
			shrinkToFit(true);
		else {
			shrinkToFit(false);

		}
		
		previousOrientation = currentOrientation;
	}
	
}

/*It will shrink blank spaces between cells (padding) to fit the
table into screen, or set the default style*/
function shrinkToFit(shrink) {
	
	var cells = document.getElementsByTagName("td");
	
	//Table doesn't fit on screen (commonly portrait orientation)
	if(shrink) {
	
		//Set all horizontal paddings to zero
		for(var i = 0; i < cells.length; i++)
			cells[i].style.padding = "0.5em 0";
		
		/*Now we can calculate the remaining space available for
		smaller paddings than before. 10% of total available space
		is subtracted for table margins*/
		var free_space = window.innerWidth - window.innerWidth * 0.1 - t_procs.clientWidth;
		
		//Padding is initially set to zero
		var padding = 0;
		
		/*If each cell can have at least one pixel of horizontal
		padding (left and right), it will be calculated*/
		if(free_space >= 12) {
			padding = Math.floor(free_space / 12);
		}
		
		//New css rules
		txtNodeMobile2.nodeValue = "th, td { padding: 0.5em " + padding +"px }";
		
		/*This is needed because despite we set new css rules in a
		style tag, specific rules applied in this function have
		higher priority*/
		for(var i = 0; i < cells.length; i++) {
			cells[i].style.padding = "0.5em " + padding + "px";
		}
		
	}
	/*Table fits on screen (usually landscape orientation), so
	default styles will be used*/
	else {
		
		//Clear new rules
		txtNodeMobile2.nodeValue = "";
		
		//Restore default specific rules
		for(var i = 0; i < cells.length; i++) {
			cells[i].style.padding = "0.5em 1em";
		}
		
	}
	
}

/*IE has a low default timeout, so, in that case, it should be
decreased to prevent errors*/
function lowTimeoutIfIE() {
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");
	
	if(msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
		TIMEOUT = 10000;
}

//Get processes status
function getProcsStatus() {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState==4 && xhr.status==200) {
			
			/* Server response is parsed from JSON and shown on
			   screen only if:
			   1. Processes status have changed, or
			   2. There are pending actions, or
			   3. Connection was lost, so processes status may have
				  changed */
			if(xhr.response !== procsStatusJSON || pendingActions.length > 0 || connLost) {
				procsStatusJSON = xhr.response;
				procsStatus = JSON.parse(procsStatusJSON);
				showProcsStatus();
			}
			
			/*If connection was previously lost and now the server
			gives response, reconnect button should be hidden*/
			if(connLost) {
				connLost = false;
				reconn_btn.style.display = "none";
			}
			
			firstTimeoutMsg = true; //To show the corresponding message for next "first timeout"
			
			//Set initial countdown value
			if(SHOW_REFRESH_COUNTDOWN)
				txtNodeCountd.nodeValue = countd_num;
			
			fnSetInterval();
		}
	};
	xhr.open("GET", "status.php",true);
	xhr.timeout = TIMEOUT;
	xhr.ontimeout = showStatusErrorMessage;
	xhr.send();
}

function showStatusErrorMessage() {
	
	//Clear "Getting status data from server..." message
	if(SHOW_REFRESH_COUNTDOWN)
		txtNodeCountd.nodeValue = "";
	
	//Different messages for first and next timeouts
	if(firstTimeoutMsg)
		txtNode_messages.nodeValue = MESSAGES.timeout1;
	else
		txtNode_messages.nodeValue = MESSAGES.timeout2;
	
	//Enable and show reconnect button
	reconn_btn.disabled = false;
	reconn_btn.style.display = "inline";
	
	enableActionButtons(false);
	
	connLost = true;
}

function reconnect() {

	//Clear error message
	txtNode_messages.nodeValue = "";
	
	//Disable and hide button
	this.disabled = true;
	reconn_btn.style.display = "none";
	
	//Some browsers allow a lower maximum timeout after the first try
	TIMEOUT = 2000;
	
	firstTimeoutMsg = false;
	
	getProcsStatus();
}

//Enable or disable ALL action buttons
function enableActionButtons(enable) {
	var tableButtons = t_procs.getElementsByTagName("button");
	for(index in tableButtons) {
		tableButtons[index].disabled = !enable;
	}
}

//Enable or disable specific service buttons
function enableServiceButtons(name, enable) {
	for(var i = 0; i < ACTIONS.length; i++) {
		var id = ACTIONS[i] + "-" + name;
		var button = document.getElementById(id);
		button.disabled = !enable;
	}
}

/*Re-enable buttons of a specific process before action timeout.
Only the proper buttons will be enabled or disabled depending on
the action queued*/
function enableServiceButtonsTimeout(name, action) {
	for(var i = 0; i < ACTIONS.length; i++) {
		var id = ACTIONS[i] + "-" + name;
		var button = document.getElementById(id);
		
		if(ACTIONS[i] == "start" && action == "start")
			button.disabled = false;
			
		if((ACTIONS[i] == "stop" || ACTIONS[i] == "reset") &&
		 (action == "stop" || action == "reset"))
			button.disabled = false;
	}
}

//Send an action request to server
function sendAction() {

	//Get action and proccess name
	var action = (this.id.split("-", 1))[0];
	var proc_name = this.id.substring(action.length + 1);
	
	//Disable buttons until getting server response or timeout
	enableServiceButtons(proc_name, false);
	
	//Data as array
	var data = [action, proc_name];
	
	//Data is now ready to be sent to server, in JSON format
	var request = JSON.stringify(data);
	
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState==4 && xhr.status==200) {
		
			var response = JSON.parse(xhr.response);
			
			/*If server responds with an "OK" code, this process
			status color will change to amber*/
			if(response.result === "OK") {
				var status = document.getElementById("status-" + response.p_name);
				status.className = "amber";
			}
			
			//Add this action to pending actions
			pendingActions.push([response.action, response.p_name]);
		}
	};
	xhr.open("POST", "action.php",true);
	xhr.action = data; //For later use on timeout handler to show the proper message
	xhr.timeout = 10000;
	xhr.ontimeout = showActionErrorMessage;
	xhr.send(request);
}

function showActionErrorMessage() {
	/*Build and show an error message displaying action and
	process that have been previously stored in 'action'
	variable*/
	var errorMsg = MESSAGES.timeoutAction;
	errorMsg = errorMsg.replace("%1", this.action[0]);
	errorMsg = errorMsg.replace("%2", this.action[1]);
	txtNode_action.nodeValue = errorMsg;
	
	//This message will disappear in ten seconds
	setTimeout(function() {txtNode_action.nodeValue = ""}, 10000);
	
	/*If there isn't a connection error and therefore, all
	buttons are NOT disabled, proper buttons of this process
	will be enabled*/
	if(!connLost)
		enableServiceButtonsTimeout(this.action[1], this.action[0]);
}

function getPendingActionIndex(name) {
	for(var i = 0; i < pendingActions.length; i++) {
		if(pendingActions[i][1] === name)
			return i;
	}
}

function deletePendingAction(name) {
	var index = getPendingActionIndex(name);
	pendingActions.splice(index, 1);
}

function setCountdownInterval() {
	interval = setInterval(function(){refreshCountdown()}, 1000);
}

/*This function will be called every second while
'show_refresh_countdown' option is set to 'true'*/
function refreshCountdown() {
	countd_num--;
	
	if(countd_num == 0) {
		txtNodeCountd.nodeValue = MESSAGES.gettingStatus;
		clearInterval(interval);
		getProcsStatus();
		countd_num = REFRESH_INTERVAL;
	}
	else
		txtNodeCountd.nodeValue = countd_num;
}

function setNoCountdownInterval() {
	interval = setInterval(function(){
		clearInterval(interval);
		getProcsStatus();
	},REFRESH_INTERVAL * 1000);
}

function showProcsStatus() {
	
	//Clean process list
	while (t_procs.firstChild) {
		t_procs.removeChild(t_procs.firstChild);
	}
	

	var pActions = new Object();
	//Store pending actions in an associative array, for the sake of easily accessing each element
	for(var i = 0; i < pendingActions.length; i++)
		pActions[pendingActions[i][1]] = pendingActions[i][0];

		
	for (var proc in procsStatus) {
	
		//Process status flag for later diable buttons
		var procState;
		
		//Current row
		var row = document.createElement("tr");

		//Process name field
		var colProcName = document.createElement("td");
		var txtProcName = document.createTextNode(proc);
		colProcName.appendChild(txtProcName);
		row.appendChild(colProcName);
		
		
		//Process status field
		var colProcStatus = document.createElement("td");
		colProcStatus.id = "status-" + proc;
		
		if(pActions[proc] != undefined) {
			if((pActions[proc] == "start" || pActions[proc] == "reset") && procsStatus[proc]) {
				colProcStatus.className = "green";
				procState = STATE.RUNNING;
				deletePendingAction(proc);
			}
			else if(pActions[proc] == "stop" && !procsStatus[proc]) {
				colProcStatus.className = "red";
				procState = STATE.STOPPED;
				deletePendingAction(proc);
			}
			else {
				colProcStatus.className = "amber";
				procState = STATE.BUSY;
			}
		}
		else {
			if(procsStatus[proc]) {
				colProcStatus.className = "green";
				procState = STATE.RUNNING;
			}
			else {
				colProcStatus.className = "red";
				procState = STATE.STOPPED;
			}
		}
		
		var spanProcStatus = document.createElement("span");
		spanProcStatus.className = "icon-record";
		colProcStatus.appendChild(spanProcStatus);
		row.appendChild(colProcStatus);
		
		
		//Separator
		var colSeparator = document.createElement("td");
		var txtSeparator = document.createTextNode(" ");
		colSeparator.appendChild(txtSeparator);
		row.appendChild(colSeparator);
		
		
		//Play button field
		var colProcPlay = document.createElement("td");
		var buttonProcPlay = document.createElement("button");
		var spanProcPlay = document.createElement("span");
		spanProcPlay.className = "icon-play";
		buttonProcPlay.id = "start-" + proc;
		if(procState == STATE.RUNNING || procState == STATE.BUSY)
			buttonProcPlay.disabled = true;
		buttonProcPlay.onclick = sendAction;
		buttonProcPlay.appendChild(spanProcPlay);
		colProcPlay.appendChild(buttonProcPlay);
		row.appendChild(colProcPlay);
		
		
		//Stop button field
		var colProcStop = document.createElement("td");
		var buttonProcStop = document.createElement("button");
		var spanProcStop = document.createElement("span");
		spanProcStop.className = "icon-stop";
		buttonProcStop.id = "stop-" + proc;
		if(procState == STATE.STOPPED || procState == STATE.BUSY)
			buttonProcStop.disabled = true;
		buttonProcStop.onclick = sendAction;
		buttonProcStop.appendChild(spanProcStop);
		colProcStop.appendChild(buttonProcStop);
		row.appendChild(colProcStop);
		
		
		//Reset button field
		var colProcReset = document.createElement("td");
		var buttonProcReset = document.createElement("button");
		var spanProcReset = document.createElement("span");
		spanProcReset.className = "icon-cycle";
		buttonProcReset.id = "reset-" + proc;
		if(procState == STATE.STOPPED || procState == STATE.BUSY)
			buttonProcReset.disabled = true;
		buttonProcReset.onclick = sendAction;
		buttonProcReset.appendChild(spanProcReset);
		colProcReset.appendChild(buttonProcReset);
		row.appendChild(colProcReset);
		
		
		t_procs.appendChild(row);
	}
	
}