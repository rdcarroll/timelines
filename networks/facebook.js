var request = require('request');
var hlp = require('./util');
var target = hlp.networks.facebook;
var headers = hlp.headers;

var oa;

var mongoose = require('mongoose');
var schema = new mongoose.Schema({
	name : String,
	env : String,
	registered : Boolean,
	show : Boolean,
	oauth_token : String,
	redirect_uri : String,
	access_token : String
});
var db = hlp.getDB();
var model = db.model('facebook', schema, 'facebook');
db.on('error', console.error.bind(console, 'connection error:'));

function getNetwork(query, cb){
	model.findOne(query, 
		function(err, matches) {
			if (err) {
				console.log(err)
				cb(err);
			}
			//console.log(matches)
			if(matches){
				cb(null, matches);
			}
			else{
				cb(new Error('no matches'));
			}
		});
}

function startAuth(network, cb){
	var url = target.start_base_url + target.oauth_path
				+ "?client_id=" + target[network.env].app_key
				+ "&redirect_uri=" + escape(target[network.env].redirect_uri)
				+ "&scope=" + target.scope
				+ "&state=" + target.state;
				
	network.oauth_token = target.state;
	network.save(function(e){
		if(e){
			console.log('error');
			cb(new Error('save error'));
		} 
		else{						
			console.log('token: ' + target.state);
			cb(null, url);
		}
	});
}
function auth(network, token, verifier, cb){
	
	try{
		options={
			url : target.access_base_url + target.access_path
				+ "?client_id=" + target[network.env].app_key
				+ "&redirect_uri=" + escape(target[network.env].redirect_uri)
				+ "&client_secret=" + target[network.env].app_secret
				+ "&code=" + token
		}
		console.log(options.url);
		request(options, function(err, response, body){
			if(err || !body){
				cb("Error getting auth token");
			}
			else{
				var _body = hlp.jsonifyQueryString(body);
				if(typeof(_body) === 'object'){
					if(_body.access_token){
						network.access_token = _body.access_token
						network.registered = true;
						network.save(function(err){
							if(err){
								cb(new Error('error saving network'));
							}
							else{
								cb(null, true);
							}
						})
					}
					else cb("Error getting ticket");
				}
				else cb("Body not found");
			}
		});
	}
	catch(err){
		cb( "error starting oauth request" );
	}
}
function getFeed(network, cb){
	
	try{
		options={
			url : target.access_base_url + target.feed_url
				+ "?access_token=" + network.access_token
		}
		request(options, function(err, response, body){
			if(err || !body){
				cb("Error getting auth token");
			}
			else{
				var _body = hlp.parseBody(body);
				if(typeof(_body) === 'object'){
					if(_body.data){
        				cb(null, _body.data);
					}
					else cb("Error getting facebook timeline");
				}
				else cb("Body not found");
			}
		});
	}
	catch(err){
		cb( "error starting oauth request" );
	}
}
function createNetwork(contact, cb){
	var item = new model({
		name : contact.username,
		env : contact.host,
		registered : false,
		show : true,
		oauth_token : null,
		redirect_uri : target[contact.host]['redirect_uri'],
		access_token : null
	});
		item.save(function(err, item) {
			if (err){ 
				console.log('failed saving item');
				cb(new Error(err)); 
			}
			
			startAuth(item, function(e, link){
				if(e) cb(new Error("error starting auth from create"));					
				cb(null, link);
			});	
			
		})
}

module.exports.StartAuth = function(req, res){
    var host = req.get('x-app-name');
	
	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = { "name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					//create network, return link
					console.log(err)
					contact.host = host;
					createNetwork(contact, function(err, link){
						if(err) res.json(500, {error:err});					
						else res.send(200, { oauth_done : false, redirect : true, redirect_uri : link } );
					});
				} 
				else if(!network.registered || network.access_token == null){
					//return link
					startAuth(network, function(err, link){
						if(err) res.json(500, {error:err});					
						else res.json( 200, { oauth_done : false, redirect : true, redirect_uri : link } );
					});
				}
				else{
					//oauth already set
					res.json(200, { oauth_done : true })
					
				}
			})
		}
		else{
			//return no contact found error
			res.json(500, {error: 'no contact found'});
		}
	})
	
}
module.exports.Auth = function(req, res){
	var token = req.get('oauth_token');
	var verifier = req.get( 'oauth_verifier' );
    var host = req.get('x-app-name');
	
	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = {"name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					res.json(500, {error:err});		
				} 
				else if(!network.registered || network.access_token == null){
					//complete auth
					auth(network, token, verifier, function(err, results){
						if(err) res.json(500, {error:err});	
						else if(results){
							//return success to callback redirect
							res.json(200, { success : true });
						}
					});
				}
				else{
					res.json( 200, { oauth_done : true });
				}
			});
		}
		else{
			//return no contact found error
			res.json(500, 'error: no contact found');
		}
	});
}
module.exports.Feed = function(req, res){
    var host = req.get('x-app-name');
	
	// oa = createOAuth( config[host]);
	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = { "name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					if(err) res.json(500, {error:err});
				} 
				else if(!network.registered || network.access_token == null){
					if(err) res.json(500, {error:"not registered"});	
				}
				else{
					//get feed
					getFeed(network, function(err, data){
						if(err){
							res.json( 500, { error : err });			
						}		
						else{
							res.json( 200, data );							
						}								
					});
					
				}
			})
		}
		else{
			//return no contact found error
			res.json(500, 'error: no contact found');
		}
	})
}
