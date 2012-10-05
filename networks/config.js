module.exports = {
	headers : {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Mypsn-AppKey": "d3d41e2a633ddc34e88ec8d1929d5c50"	
	},
	mongodb : {
		production :  'mongodb://nodejitsu:347fe515b3fad7ea90d66e57bb3406f4@alex.mongohq.com:10020/nodejitsudb408663363097',
		development : "mongodb://localhost:27017/timelines"
	},
	networks : {
		twitter : {		
			"bechtel-live.showoff.io" : ["https://api.twitter.com/oauth/request_token", 
							"https://api.twitter.com/oauth/access_token", 
							"059aEGUMpGSNUYVEnROcsw", 
							"NMhynyCzuK0XhlRIbOhRkW6ZAEsoDEjQGmQcT3YLxA", 
							"1.0", 
							"https://bechtel-live.showoff.io", 
							"HMAC-SHA1"],
			"localhost" : ["https://api.twitter.com/oauth/request_token", 
							"https://api.twitter.com/oauth/access_token", 
							"ayvLds2E2ztD20fbsSsUDw", 
							"RzHKjvbkT5OemY3D4YXcbRBh8ONhHoQV9lILdtGPJQ", 
							"1.0", 
							"https://bechtel.jit.su", 
							"HMAC-SHA1"],
			feedUrl		: 'https://api.twitter.com/1.1/statuses/home_timeline.json'
		},
		chatter : {
		    start_base_url : "https://bechtel.my.salesforce.com/services/",
		    oauth_path : "oauth2/authorize",
		    access_path : "oauth2/token",
			state       : "bechtel_live_chatter",
			grant_type  : "authorization_code",
		    response_type : "code",
		    type : "web_server",		
			"bechtel-live.showoff.io" : {
				name : "RCarrollDev",
				app_key : "3MVG9CVKiXR7Ri5qm55XNkyFqxebH3dQALl8nX1Pu_PeIR9dyWMAg61q.ylCVnNqNyEoXE5It2vvT628z.nwZ",
			    app_secret : "2897516583267596092",
				redirect_uri : "https://bechtel-live.showoff.io"
			},
			"bechtel.jit.su" : {
				name : "BechtelLive",
				app_key : "3MVG9CVKiXR7Ri5qm55XNkyFqxdAXx2zc9V7oXmt0ne0v.4srT4lCApUjNL.zYDapTqMUcc8YwnNgIkTbt3LK",
			    app_secret : "2436569273219565242",
				redirect_uri : "https://bechtel.jit.su"
			},
			feed_url		: 'data/v25.0/chatter/'
		},
		
		facebook : {	
				    start_base_url : "https://www.facebook.com/",
				    access_base_url : "https://graph.facebook.com/",	
				    oauth_path : "dialog/oauth",
				    access_path : "oauth/access_token",
					state       : "bechtel_live_facebook",
					scope      : "read_stream",
					feed_url		: 'me/home',
					"bechtel-live.showoff.io" : 
						{
							app_key : "454305501287934",
						    app_secret : "90492f1b8d61ccd05e2c2f2919b88dbf",
							redirect_uri : "https://bechtel-live.showoff.io/"
						},	
					"bechtel.jit.su" : 
						{
							app_key : "418943314839915",
						    app_secret : "b99cff5c082392299b5383016033a5bf",
							redirect_uri : "https://bechtel.jit.su/"
						}
		}		
	}
}
