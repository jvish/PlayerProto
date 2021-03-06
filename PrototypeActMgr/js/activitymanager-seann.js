var eventManager = {
    subscribe : function(topic, callback) {
        amplify.subscribe(topic, callback);
    },

    publish : function(topic, data) {
        amplify.publish(topic, data);
    },
    
    unsubscribe : function(topic, callback) {
        amplify.unsubscribe(topic, callback);
    }
}

var activityManager = {
    
    getEventManager : function() {
        var eM = Object.create(eventManager);
        return eM;
    },

    collectContent : function(contentURL) {
        // THIS IS FAKE.
        // This is where you'd call to the PAF hub (or whatever content repo) using the contentURL
        // and return the JSON content (perhaps the enriched sequenceNode).
        // Instead we'll just fake up some json.

        // grab the id out of the contentURL so we can populate a couple of fake examples
        var regPattern = /\d*$/;
        var myid = regPattern.exec(contentURL);

        // This is the config that drives the interactives.  It's then buried in the enriched sequence node
        // below in "targetActivity"
        var interactiveConfig;
        if (myid[0] == '8883774665') {
            interactiveConfig = {
                "master": {
                    "widgets": [
                        {
                            "widget": {
                                "wtype": "button",
                                "targetid": "button1",
                                "id": "button1",
                                "text": "Submit #1"
                            }
                        }
                    ]
                }
            };
        } else if (myid[0] == '12345') {
            interactiveConfig = {
                "master": {
                    "widgets": [
                        {
                            "widget": {
                                "wtype": "button",
                                "targetid": "button2",
                                "id": "button2",
                                "text": "Submit #2"
                            }
                        }
                    ]
                }
            };
        } else if (myid[0] == '111001') { // NeffReactor
            interactiveConfig = {
                "master": {
                    "widgets": [
                        {
                            "widget": { // Callout
                                "wtype": "callout",
                                "targetid": "steps",
                                "id": "callme",
                                "show": "all",
                                "type": "numbered",
                                "headers": ["Nuclear Reactor function" ],
                                "textBits": [
                                {"cols": ["In a closed circuit, (green) water is pumped at high pressure to the reactor core."]},
                                {"cols":[ "Heat is generated by fission in the fuel rods in the reactor core, which heats the circulating water. Thick layers of concrete and steel or lead contain the reactor core’s radioactivity."]},
                                {"cols":[ "In the steam generator, the energy from the heated water is used to boil water from a separate supply. The resulting steam moves through a pipe to a turbine."]},
                                {"cols":["The steam turns the turbine, which is connected to an electricity generator. Power lines distribute the electricity. A typical reactor produces as much as a coal-fired power plant."]},
                                {"cols":[ "A third supply of water is used to cool the steam so it condenses into water, which is pumped back to the steam generator."]}
                                ]
                            }
                        }
                    ]
                }
            };
        }

        // let's pretend we have an "enriched" SequenceNode (step 5 in Assignment Startup sequence
        // diagram: https://hub.pearson.com/confluence/display/AF/Assignment+Startup)
        var sequenceNodeRich = {
          "@context" : "http://purl.org/pearson/paf/v1/ctx/core/SequenceNodeRich",
          "@type" : "SequenceNode",
          "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0] + '/nodes/1',
          "nodeIndex" : 1,
          "startTime" : Date(),
          "parentSequence" : {
            "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0],
            "user" : "http://idm.api.pearson.com/resources/identities/29d32894735b731",
            "learningContext" : {
              "@type" : "CourseSection",
              "@id" : "urn:udson:pearson.com/sms/prod:course/jsmith38271"
            },
            "overallActivity" : 'http://repo.paf.pearson.com/resources/activity/' + myid[0]
          },
          "targetBinding" : {
            "@id" : "http://repo.paf.pearson.com/resources/activity/4924948879517615/bindings/2",
            "boundActivity" : "http://repo.paf.pearson.com/resources/activity/59239547267",
            "activityFormat" : "application/vnd.pearson.qti.v2.asi.xml",
            "activityTitle" : "We'll put this in the targetActivity, thank you.",
            "credit" : "ForCredit",
            "scoreConstraints" : {
              "normalMaximum" : 10
            }
          },
          "targetActivity" : interactiveConfig,
          "aggregateResult" : {
            "templateVariables" : []
          },
          "player" : {
            "frameFrontend" : "http://example.com/myplayer",
            "widgetStartPage" : "http://hub.paf.pearson.com/widgets/83282736384572/index.html"
          },
          "resultCollection" : 'http://hub.paf.pearson.com/resources/sequences/' + myid[0] + '/nodes/1/results'
        };

        return sequenceNodeRich;
    },

    loadNodes : function(callback) {
        // get the nodeList
        var nodeList = this.scanNodes();
        
        // loop over it
        var nodeLength = nodeList.length;
        var counter = 0;
        while (counter < nodeLength) {
            // grab the 'about' url containing the content identifier (PAF).
            var contentURL = nodeList[counter].attributes.about.nodeValue;

            // pull down the content from PAF, local content repo, or wherever
            var content = this.collectContent(contentURL);

            // throw content back to the originating callback
            callback(content);

            counter++;
        }
    },

    scanNodes : function() {
        // scan through looking for 'Activity' divs.  We can change this to <object> tags if that's what
        // inkling prefers.
        // we're assuming we have jquery
        var nodes = $("div[typeof='Activity']");
        return nodes;
    },

    // initializing the activity manager 
    // - uses requirejs to load the interactives stuff just for debugging.
    // - the initActivityManager below doesn't bother with this, just relying on the compiled 
    //   interactives library.  You'd use one or the other.
    initActivityManagerAMD : function() {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();

        requirejs.config({
            baseURL: '../PrototypeDist/interactives',
            paths: {
                jquery: '../PrototypeDist/lib/jquery',
                underscore: '../PrototypeDist/lib/underscore',
                interactives: '../PrototypeDist/interactives',
                d3: '../PrototypeDist/lib/d3.v3.min' // TODO - shouldn't reference version
            },
            shim: {
                underscore: {
                    exports: 'underscore'
                },
                d3: {
                    exports: 'd3'
                }
            }
        });

        window.onload = function() {
            
            // this is require loading is weird but just here for testing/debugging
            require(['interactives', 'jquery', 'underscore', 'd3'], function (interactives, $, _, d3) {
                // todo - may want to clone the object here?

                that.loadNodes(function(content){
                    // initialize master player widget for each chunk of content

                    console.log(interactives);
                    console.log('Running jQuery %s', $().jquery);
                    console.log(interactives.version);
                    console.log(interactives.convert('convert test'));
                    interactives.init(content, eventManager);

                });
            });
        };
    },

    initActivityManager : function() {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        var eventManager = that.getEventManager();

        window.onload = function() {
            // may want to clone the interactives object here?

            that.loadNodes(function(content){
                // initialize master player widget for each chunk of content
                interactives.init(content, eventManager);
            });
            
        };
    }

}