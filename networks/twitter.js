var request = require('request');
var hlp = require('./util');
var target = hlp.networks.twitter;
var headers = hlp.headers;
var OAuth = require('oauth').OAuth;
var oa;

var mongoose = require('mongoose');
var schema = new mongoose.Schema({
	name : String,
	env : String,
	registered : Boolean,
	show : Boolean,
	oauth_token : String,
	oauth_token_secret : String,
	access_token : String,
	access_secret : String
});

var db = hlp.getDB();
var model = db.model('twitter', schema, 'twitter');
db.on('error', console.error.bind(console, 'connection error:'));

function getNetwork(query, cb){
  model.findOne(query, 
    function(err, matches) {
      if (err) {
        cb("DB_Query_Error");
      }
      if(matches){
        cb(null, matches);
      }
      else{
        cb("DB_Match_Not_Found");
      }
    });
}

function startAuth(network, cb){
	try{
		oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
			if (error || !results) {
				cb("Request_Auth_URL_Error");
			} else {				
				network.oauth_token = oauth_token;
				network.oauth_token_secret = oauth_token_secret;
				network.save(function(e){
					if(e){
						cb(new Error('DB_Save_Error'));
					} 
					else{						
						// console.log('token: ' + oauth_token);
						// console.log('oauth.token_secret: ' + oauth_token_secret);
						cb(null, 'https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
					}
				})
			}
		});
		
	}
	catch(err){
		cb( "Request_Auth_URL_Error" );
	}
	
}
function auth(network, token, verifier, cb){
	oa.getOAuthAccessToken( network.oauth_token, network.oauth_token_secret, verifier, 
		function(error, oauth_access_token, oauth_access_token_secret, results){
			if(error){
				cb('Request_Auth_Error');
			}
			else{
				network.access_token = oauth_access_token;
				network.access_secret = oauth_access_token_secret;
				network.registered = true;
				network.save(function(err){
					if(err){
						cb("DB_Save_Error");
					}
					else{
						cb(null, true);
					}
				})
			}
	});
}
function getFeed(network, cb){
	oa.get(target.feedUrl, network.access_token, network.access_secret, function(error, data, response){
		if(error){ cb("Request_Feed_Error"); }
		else{
			cb(null, data);
		}
	})
}
function createNetwork(contact, cb){
	var item = new model({
		name : contact.username,
		env : contact.host,
		registered : false,
		show : true,
		oauth_token : null,
		oauth_token_secret : null,
		access_token : null,
		access_secret : null
	});
		item.save(function(err, item) {
			if (err){ 
				cb("DB_Save_Error"); 
			}
			
			startAuth(item, function(e, link){
				if(e) cb("Error_Starting_Auth");					
				cb(null, link);
			});	
			
		})
}
var createOAuth = (function() {
    function F(args) {
        return OAuth.apply(this, args);
    }
    F.prototype = OAuth.prototype;

    return function(args) {
        return new F(args);
    }
})();

module.exports.StartAuth = function(req, res){
    var host = req.get('x-app-name');
	oa = createOAuth( target[host]);
	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = {"name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					contact.host = host;
					createNetwork(contact, function(err, link){
						if(err) res.send(500, {error:err});					
						else res.send(200, { oauth_done : false, redirect : true, redirect_uri : link } );
					});
				} 
				else if(!network.registered || network.access_token == null || network.access_secret == null){
					//return link
					startAuth(network, function(err, link){
						if(err) res.send(500, {error:err});					
						else res.send( 200, { oauth_done : false, redirect : true, redirect_uri : link } );
					});
				}
				else{
					//oauth already set
					res.send(200, { oauth_done : true })
					
				}
			})
		}
		else{
			//return no contact found error
			res.send(500, {'error' : 'User_Not_Found'});
		}
	})
	
}
module.exports.Auth = function(req, res){
	var token = req.get('oauth_token');
	var verifier = req.query.oauth_verifier;
	var host = req.get('x-app-name')

	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = {"name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					res.send(500, {error:err});		
				} 
				else if(!network.registered || network.access_token == null || network.access_secret == null){
					//complete auth
					auth(network, token, verifier, function(err, results){
						if(err) res.send(500, {error:err});	
						if(results){
							//return success to callback redirect
							res.send(200, { success : true });
						}
					});
				}
				else{
					res.send( 200, { oauth_done : true });
				}
			})
		}
		else{
			//return no contact found error
			res.send(500, { error : 'User_Not_Found'});
		}
	})
}
module.exports.Feed = function(req, res){
	var host = req.get('x-app-name')
	oa = createOAuth( target[host]);
	hlp.getContact(req, function(err, contact){
		if(contact){
			var q = { "name" : contact.username, "env" : host }
			getNetwork(q, function(err, network){
				if(err) {
					res.send(500, {error:err});
				} 
				else if(!network.registered || network.access_token == null || network.access_secret == null){
					if(err) res.send(500, {error:err});	
				}
				else{
					//get feed
					getFeed(network, function(err, data){
						if(err){
							res.send( 500, { error : err });			
						}		
						else{
							res.send( 200, JSON.parse(data) );							
						}								
					});
					
				}
			})
		}
		else{
			//return no contact found error
			res.send(500, {error: 'User_Not_Found'});
		}
	})
}
