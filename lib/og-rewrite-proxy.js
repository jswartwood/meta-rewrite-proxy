var http = require("http"),
	url = require("url");

var config = {
		"hostname": "",
		"port": 80,
		"add-rules": {},
		"rw-rules": {}
	};

function applyRule( rule, data ) {
	return (typeof rule === "function") ? rule(data) : rule;
}

var rules_added = false;
function rewriteOGmeta( html ) {
	var addStr = "";
	
	if (!rules_added && /\<head\>/.test(html)) {
		rules_added = true;
		for (var ar in config["add-rules"]) {
			addStr += "<meta property=\"" + ar + "\" content=\"" + applyRule(config["add-rules"]) + "\"/>";
		}
		if (addStr) {
			console.log("Adding '" + addStr + "'");
			html = html.replace(/\<head\>/, "<head>" + addStr);
		}
	}
	
	for (var rr in config["rw-rules"]) {
		var re = new RegExp(rr + "\\\" content=\\\"([^\\\"]+)\\\""),
			m = html.match(re),
			content;
		if (m) {
			content = applyRule(config["rw-rules"][rr], m[1]);
			console.log("Replacing '" + m[1] + "' with '" + content);
		}
		html = html.replace(re, rr + "\" content=\"" + content + "\"");
	}

	return html;
}

function fetch( path, callback ) {
	var options = {
			"host": config["hostname"],
			"port": config["port"],
			"path": path
		},
		html = "";

	console.log("Fetching: " + options.host + options.path);
	http.get(options, function( aeRes ) {
		aeRes.on("data", function( data ) {
			console.log(data.toString());
			html += rewriteOGmeta(data.toString());
		}).on("end", function() {
			console.log("html: " + html)
			callback(html);
		});
	}).on('error', function(e) {
			console.log("Got error: " + e.message);
		}).end();
}

function route( app, basepath, reqType ) {
	console.log("Setting up " + (reqType || "") + " route for path: " + basepath);
	app[reqType || "get"](new RegExp(basepath.replace(/\//g, "\\/") + "(.*)$"), function(request, response) {
		fetch("/" + request.params[0] + (url.parse(request.url).search || ""), function( html ) {
			response.write(html);
			response.end();
		});
	});
}

module.exports = {
	"fetch": fetch,
	"route": route,
	"set": function( prop, value ) {
		config[prop] = value;
	}
};