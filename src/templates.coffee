# TEMPLATES.COFFEE IS AUTO-GENERATED. CHANGES WILL BE LOST!
exports.clientApplication = """"""

exports.logControlPanel = """<a class="select_mode active" href="#log_control_streams">Streams</a>
<a class="select_mode" href="#log_control_nodes">Nodes</a>"""

exports.logMessage = """<p>
  <span class='stream color<%= lmessage.get('stream').color %>'><%= lmessage.get('stream').id %></span>
  <span class='node color<%= lmessage.get('node').color %>'><%= lmessage.get('node').id %></span>
  <span class='message'><%= msg %></span>
</p>"""

exports.logScreenView = """<div class='controls'>
<% if (logScreens.length > 1) { %><a href="#" class='close'>close</a><% } %>
  <a href="#" class='clear'>clear</a>
  <a href="#" class='filter'>filter <input type='text'/></a>
</div>
<div class='messages'>
  <div class='msg'></div>
</div>"""

exports.logScreensPanel = """<div class='log_screens'></div>
<div class='status_bar'>
  <a href="#" class='button' id="new_screen_button">New Screen</a>
  <div class='stats'></div>
  <div style='clear: both;'</div>
</div>
"""

exports.logStatsView = """<%
var elapsed = (new Date().getTime() - stats.start) / 1000;
var minutes = parseInt(elapsed/60);
var seconds = parseInt(elapsed%60);
if (seconds < 10) { seconds = "0" + seconds; }
var prettyTime =  minutes + ":" + seconds;
%>
<div class='stat'>
  <span class='num'><%= (stats.messages / elapsed).toFixed(2) %></span>
  <span class='label'>messages/sec</span>
</div>
<div class='stat'>
  <span class='num'><%= prettyTime %></span>
  <span class='label'>elapsed</span>
</div>
<div class='stat'>
  <span class='num'><%= stats.messages %></span>
  <span class='label'>Messages</span>
</div>
<div class='stat'>
  <span class='num'><%= stats.nodes %></span>
  <span class='label'>Nodes</span>
</div>
<div class='stat'>
  <span class='num'><%= stats.streams %></span>
  <span class='label'>Streams</span>
</div>"""

exports.objectControls = """<input class='filter' placeholder="Filter..." type='text'/>
<div class='groups'></div>"""

exports.objectGroupControls = """<div class='items'></div>"""

exports.objectGroupHeader = """<div class='screen_buttons'>
<% 
var active = false;
logScreens.each(function(screen) {
  var sactive = screen.isActive(object, getPair);
  if (sactive) { active = true; }
%>
  <input type='checkbox' <% if (sactive) { %>checked="checked" <% } %>title='screen-<%= screen.cid %>'/>
<% }); %>
</div>
<div class='diode floatl <% if (active) { print('active color' + object.color) } %>'></div>
<div class='object_name floatl'><%= object.get('name') %></div>
<div style='clear: both;'></div>"""

exports.objectItemControls = """<div class='screen_buttons'>
<% 
var active = false;
logScreens.each(function(screen) {
  var haspair = screen.hasPair(stream, node);
  if (haspair) { active = true; }
%>
  <input type='checkbox' <% if (haspair) { %>checked='checked'<% } %>title='screen-<%= screen.cid %>'/>
<% }); %>
</div>
<div class='diode floatl <% if (active) { print('active color' + item.color); } %>'></div>
<div class='item_name floatl'><%= item.get('name') %></div>
<div style='clear: both;'></div>"""