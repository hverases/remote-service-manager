# remote-service-manager
<b>remote-service-manager</b> is a web interface for GNU/Linux OSes that shows
the status of system daemons (started, stopped or in process), and allows to
start, stop or reset these daemons.

For security reasons, not all daemons are shown to the user. Only those that are
properly configured in <b>procs</b> file can be seen by the user, and, of course
started, stopped or deleted. If you use this software for your home server, you
probably won't like that one of your relatives could stop system critical
daemons. Or maybe stopping a critical process by mistakenly touching an unwanted
button in your tiny phone screen.

<br>
<h3>Installation guide</h3>
<ol>
	<li>Put all repository files, including <b>fonts</b> and <b>strings</b>
	folders, into a directory configured to be DocumentRoot in your favourite
	web server.</li>

	<li>Set <b>app_remote.php</b> as index. If you use Apache as web server, you
	won't have to do nothing, because this is declared on the <b>.htaccess</b>
	file. You only need to do this if you use another web server, like Nginx or
	lighttpd.</li>
	
	<li>If you don't have <b>service</b> command installed, install it. The
	server side scripts use this command to start, stop or reset daemons, so you
	will need it in order to interact with daemons.</li>
	
	<li>Then you need to grant privileges to the user who is running your web
	server, to execute <b>service</b> command. Giving root privileges to a user
	only to use <b>service</b> command is a nonsense, and could lead to
	unnecessary security risks. So, for example, if your user currently running
	your web server is named "www-data", you will need to add the next line to
	your <b>sudoers</b> config file (/etc/sudoers):<br/>
	<b>www-data ALL=(ALL) NOPASSWD: /usr/sbin/service</b>
	With this line, you grant root privileges to "www-data" user only to run
	<b>service</b> command. In addition, it won't ask for his password when
	using this command.</li>
	
	<li>Maybe, despite of you did the things mentioned in step four, daemons
	could not start, stop or reset. Viewing Apache logs, we could see "sudo
	effective uid is not 0 is sudo installed setuid root" message, so you will
	need to add the setuid bit to sudo. You can do it this way:<br>
	<b>chmod u+s /usr/bin/sudo</b></li>
</ol>
<br>
<h3>Configuration</h3>
There are two configuration files, both in JSON format:
<ul>
	<li><b>procs:</b>This file stores two strings for each daemon. The first
	string is the process name of the daemon as you can see it while doing
	<b>ps -e</b>, and the second string is the name of the init script,
	usually located in /etc/init.d<br>
	This is an example of procs file, configured to be able to check status,
	start, stop or reset "transmission daemon" and "amule daemon":
	<pre>
	[
		["amuled","amule-daemon"],
		["transmission-da","transmission-daemon"]
	]
	</pre>
	As you can see, strings are stored in a multidimensional array, where each
	pair of values are needed for a daemon.
	</li>
	<br>
	<li><b>conf:</b>Stores basic configuration values, like the refresh interval
	in seconds or the language of the error messages. In addition, you can
	choose if the countdown between each refresh will be shown or not, including
	a "Getting status data from server..." while retrieving data from server.
	<br>
	Here is an example of the default configuration:
	<pre>
	{
	"refresh_interval":5,
	"language":"en",
	"show_refresh_countdown":"false"
	}
	</pre>
	</li>
</ul>

At the moment, the error messages are available in two languages: English (en)
and Spanish (es). If you want to translate these messages to your language, you
will find the English original messages in the <b>strings</b> folder. You only 
need to translate the text at the right side of the colon (:), or the property
value of the JSON object that contains the messages.

This web interface makes use of <b>Mobile-Detect</b> PHP library to do some
adjustments in web layout when using a mobile device. At first, it was added as
a submodule, but for simplicity's sake only "Mobile-Detect.php" file was added
at the end. Thanks for the original author, Victor Stanciu, and current
repository maintainers, Serban Ghita and Nick Ilyin.