var http = require("http"),
  url = require("url");

// ## Define the configuration defaults
// - `hostname`, `protocol`, & `port` are used directly in the `http.get(...)`
// - `hostname` is required (I can't guess this)
// - `add_rules` is the set of meta tags to be added into the stream
// - `rw_rules` is the set of meta tags to be replaced in the stream
// - `use_redirect` determines whether the (streamed copy) page should be shown,
// or whether it should be suppressed and redirected to the original url
// 
// The rules objects (`add_rules` & `rw_rules`) are defined using key/value pairs matching the meta name/value respectively.
var config = {
    hostname: "",
    protocol: "http",
    port: 80,
    route_path_prefix: "/proxy/",
    add_rules: {},
    rw_rules: {},
    use_redirect: true
  };

function applyRule( rule, data ) {
  return (typeof rule === "function") ? rule(data) : rule;
}

var rules_added = false;
function rewriteOGmeta( html ) {
  var addStr = "";
  
  if (!rules_added && /\<head\>/.test(html)) {
    rules_added = true;
    for (var ar in config.add_rules) {
      addStr += "<meta property=\"" + ar + "\" content=\"" + applyRule(config.add_rules) + "\"/>";
    }
    if (addStr) {
      console.log("Adding '" + addStr + "'");
      html = html.replace(/\<head\>/, "<head>" + addStr);
    }
  }
  
  for (var rr in config.rw_rules) {
    var re = new RegExp(rr + "\\\" content=\\\"([^\\\"]+)\\\""),
      m = html.match(re),
      content;
    if (m) {
      content = applyRule(config.rw_rules[rr], m[1]);
      console.log("Replacing '" + m[1] + "' with '" + content + "'");
    }
    html = html.replace(re, rr + "\" content=\"" + content + "\"");
  }

  return html;
}

function fetch( path, callback ) {
  var options = {
      host: config.hostname,
      port: config.port,
      protocol: config.protocol,
      path: path
    },
    html = "";

  console.log("Fetching: " + options.host + options.path);
  http.get(options, function( aeRes ) {
    aeRes.on("data", function( data ) {
      html += rewriteOGmeta(data.toString());
    }).on("end", function() {
      if (config.use_redirect) {
        html = html.replace(/\<\/head\>/, "<style>*{display:none !important;}</style><meta http-equiv=\"refresh\" content=\"0; url=" + options.protocol + "://" + options.host + options.path + "\"/></head>");
      }
      callback(html);
    });
  }).on('error', function(e) {
      console.log("Got error: " + e.message);
    }).end();
}

function route( app, basepath, reqType ) {
  if (!basepath) basepath = config.route_path_prefix;
  console.log("Setting up " + (reqType || "") + " route for path: " + basepath);
  app[reqType || "get"](new RegExp(basepath.replace(/\//g, "\\/") + "(.*)$"), function(request, response) {
    fetch("/" + request.params[0] + (url.parse(request.url).search || ""), function( html ) {
      response.write(html);
      response.end();
    });
  });
}

// ## Define the exports
// - `fetch` gets the processed html (with all rules applied)
// - `route` sets up an express route with a given **app**
// - `set` defines a configuration property
module.exports = {
  fetch: fetch,
  route: route,
  set: function( prop, value ) {
    config[prop] = value;
  }
};