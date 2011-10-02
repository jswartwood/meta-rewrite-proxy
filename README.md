Meta Rewrite Proxy (for Node.js)
================================

The Meta Rewrite Proxy module is used to stream an existing URL and adjust the meta [tag] data. It allows you to leverage the existing data without creating redundant pages. Rules can be created that will **add** new meta tags, **remove** unnecessary meta tags, and **modify** existing metas based on regex or functional definitions.

Install as dependency
---------------------

Install the module:

    npm install meta-rewrite-proxy

...or...

Add to your `package.json` file:

    {
      "name":        "my-app",
      // ...
      "dependencies": {
        // ...
        "meta-rewrite-proxy": "0.0.1"
      }
    }

Define your meta rewrite configuration
--------------------------------------

Require the module:

    var proxy = require("meta-rewrite-proxy");

Set the hostname for the domain you would like to proxy:

    proxy.set("hostname", "www.my-other-app.com");

Add rewrite rules for the meta tags:

    proxy.set("rw_rules", {
      "og:type": "my_app_namespace:my_object",
      "og:title": function( old_title ) {
        return old_title.replace(" - My App", "");
      },
      "fb:app_id": process.env.FACEBOOK_APP_ID,
      "og:url": function( old_url ) {
        return old_url.replace("www.my-other-app.com/", "www.my-new-app.com/proxy/");
      }
    });

Using the `route` method with Express
-------------------------------------

This is the simplest way to leverage the module.  It will setup an Express route
on `/proxy/`. For example: `www.my-new-app.com/proxy/user/profile/me.html` will
return `www.my-other-app.com/user/profile/me.html` with the meta rules applied.

    proxy.route(app, "/proxy/");

Using the `fetch` method
------------------------

The same as the `route` example, but explicitly defined.

    app.get(/\/proxy\/(.*)$/, function(request, response) {
      proxy.fetch("/" + request.params[0], function( html ) {
        response.write(html);
        response.end();
      });
    });

License
-------

    * Copyright (c) 2011 Jacob Swartwood
    * Licensed under the MIT license
    * http://jacob.swartwood.info/license/
