var request = require('request');
var hlp = require('./util');
var target = hlp.networks.chatter;
var headers = hlp.headers;

var oa;

var mongoose = require('mongoose');
var schema = new mongoose.Schema({
  name : String,
  env : String,
  registered : Boolean,
  show : Boolean,
  issued_at : String,
  refresh_token : String,
  redirect_uri : String,
  access_token : String
});
var db = hlp.getDB();
var model = db.model('chatter', schema, 'chatter');
db.on('error', console.error.bind(console, 'connection error:'));

function getNetwork(query, cb){
  model.findOne(query, 
    function(err, matches) {
      if (err) {
        console.log(err)
        cb("Query_Error");
      }
      //console.log(matches)
      if(matches){
        cb(null, matches);
      }
      else{
        cb("Match_Not_Found");
      }
    });
}

function startAuth(network, cb){
  var url = target.start_base_url + target.oauth_path
        + "?client_id=" + target[network.env].app_key
        + "&redirect_uri=" + escape(target[network.env].redirect_uri) // + "?state=" + target.state + network.name)
        + "&response_type=" + target.response_type
        + "&type=" + target.type;
        
  network.save(function(e){
    if(e){
      console.log('error');
      cb(new Error('save error'));
    } 
    else{           
      console.log('url' + url);
      cb(null, url);
    }
  });
}
function auth(network, token, cb){
  
  try{
    options={
      url : target.start_base_url + target.access_path,
      method : "POST",
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      body : "client_id=" + target[network.env].app_key
        + "&redirect_uri=" + escape(target[network.env].redirect_uri)
        + "&client_secret=" + target[network.env].app_secret
        + "&grant_type=" + target.grant_type
        + "&code=" + token
    }
    request(options, function(err, response, body){
      if(err || !body){
        cb("Error getting auth token");
      }
      else{
        var _body = hlp.parseBody(body);
        if(typeof(_body) === 'object'){
          if(_body.access_token){
            network.access_token = _body.access_token
            network.registered = true;
            network.refresh_token = _body.refresh_token;
            network.issued_at = _body.issued_at;
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
// function getResources(network, cb){
    // options={
      // url : "https://bechtel.my.salesforce.com/chatter"
        // + " -H 'Authorization: Bearer " + network.access_token + "'"
    // }
    // request(options, function(err, response, body){
      // if(err || !body){
        // cb("Error getting resources");
      // }
      // else{
        // var _body = hlp.parseBody(body);
        // if(typeof(_body) === 'object'){
          // if(_body.access_token){
//            
          // }
          // else cb("Error getting resources");
        // }
        // else cb("Body not found getting resources");
      // }
    // });	
// 	
// }
function refreshToken(network, cb){
  
  try{
    options={
      url : target.start_base_url + target.access_path,
      method : "POST",
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      body : "client_id=" + target[network.env].app_key
        + "&client_secret=" + target[network.env].app_secret
        + "&grant_type=" + "refresh_token"
        + "&refresh_token=" + network.refresh_token
    }
    request(options, function(err, response, body){
      if(err || !body){
        cb("Request_Refresh_Error");
      }
      else{
        var _body = hlp.parseBody(body);
        if(typeof(_body) === 'object'){
          if(_body.access_token){
            network.access_token = _body.access_token
            network.save(function(err){
              if(err){
                cb(new Error('Query_Update_Error'));
              }
              else{
                cb(null, true);
              }
            })
          }
          else cb("Request_Refresh_Error");
        }
        else cb("Body_Not_Found");
      }
    });
  }
  catch(err){
    cb( "Request_Refresh_Error" );
  }
}

function getFeed(network, cb){
  
  try{
    options={
      url : target.start_base_url + target.feed_url
        + "feeds/company/feed-items",
      headers : {'Authorization': 'Bearer ' + network.access_token }   
    }
    request(options, function(err, response, body){
      if(err || !body){
        cb("Request_Feed_Error");
      }
      else{
        var _body = hlp.parseBody(body);
        if(typeof(_body) === 'object'){
          if(_body.length && _body[0]['errorCode'] == "INVALID_SESSION_ID"){
            network.access_token = null;
            network.save(function(err){
              if(err){
                cb(new Error('Query_Update_Error'));
              }
              else if(_body.items.length){
                cb("Invalid_Session");
              }
            });
          }
          else if(_body.items && _body.items.length){
            cb(null, _body.items);
          }
          else cb("Request_Feed_Error");
        }
        else cb("Body_Not_Found");
      }
    });
  }
  catch(err){
    cb( "Request_Feed_Error" );
  }
}
function createNetwork(contact, cb){
  var item = new model({
    name : contact.username,
    env : contact.host,
    registered : false,
    show : true,
    issued_at : null,
    refresh_token : null,
    redirect_uri : null,
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
          if(network.refresh_token){
	          refreshToken(network, function(err, results){
	            if(err) res.json(500, {error:err}); 
	            else if(results){
	              //return success to callback redirect
	              res.json(200, { oauth_done : true });
	            }
	          });          	
          }
          else{
	          startAuth(network, function(err, link){
	            if(err) res.json(500, {error:err});         
	            else res.json( 200, { oauth_done : false, redirect : true, redirect_uri : link } );
	          });          	
          }
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
    var host = req.get('x-app-name');
  
  hlp.getContact(req, function(err, contact){
    if(contact){
      var q = { "name" : contact.username, "env" : host }
      getNetwork(q, function(err, network){
        if(err) {
          res.json(500, {error:err});   
        } 
        else if(!network.registered || network.access_token == null){
          //complete auth
          auth(network, token, function(err, results){
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
      res.json(500, {'error': 'no contact found'});
    }
  })
}
module.exports.RefreshAuth = function(req, res){
    var host = req.get('x-app-name');
  
  hlp.getContact(req, function(err, contact){
    if(contact){
      var q = { "name" : contact.username, "env" : host }
      getNetwork(q, function(err, network){
        if(err) {
          res.json(500, {error:err});   
        } 
        else{
          refreshToken(network, function(err, results){
            if(err) res.json(500, {error:err}); 
            else if(results){
              //return success to callback redirect
              res.json(200, { success : true });
            }
          });
        }
      });
    }
    else{
      //return no contact found error
      res.json(500, {'error': 'Match_Not_Found'});
    }
  })
}
module.exports.Feed = function(req, res){
    var host = req.get('x-app-name');
  
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
      res.json(500, {'error': 'Match_Not_Found'});
    }
  })
}
