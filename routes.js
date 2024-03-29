app = module.parent.exports.app;

app.get( '/timelines/twitter/feed', require( "./networks/twitter" ).Feed );
app.get( '/timelines/twitter/start', require( "./networks/twitter" ).StartAuth );
app.get( '/timelines/twitter/auth', require( "./networks/twitter" ).Auth );

app.get( '/timelines/linkedin/feed', require( "./networks/linkedin" ).Feed );
app.get( '/timelines/linkedin/start', require( "./networks/linkedin" ).StartAuth );
app.get( '/timelines/linkedin/auth', require( "./networks/linkedin" ).Auth );

app.get( '/timelines/facebook/feed', require( "./networks/facebook" ).Feed );
app.get( '/timelines/facebook/start', require( "./networks/facebook" ).StartAuth );
app.get( '/timelines/facebook/auth', require( "./networks/facebook" ).Auth );

// app.get( '/timelines/box/feed', require( "./networks/box" ).Feed );
// app.get( '/timelines/box/start', require( "./networks/box" ).StartAuth );
// app.get( '/timelines/box/auth', require( "./networks/box" ).Auth );

app.get( '/timelines/chatter/feed', require( "./networks/chatter" ).Feed );
app.get( '/timelines/chatter/start', require( "./networks/chatter" ).StartAuth );
app.get( '/timelines/chatter/auth', require( "./networks/chatter" ).Auth );
app.get( '/timelines/chatter/refresh', require( "./networks/chatter" ).RefreshAuth );
app.all( '/timelines/chatter/native', require( "./networks/chatter" ).NativeOp );

// app.get( '/timelines/box/feed', require( "./networks/box" ).Feed );
// app.get( '/timelines/box/start', require( "./networks/box" ).StartAuth );
// app.get( '/timelines/box/auth', require( "./networks/box" ).Auth );
// app.get( '/timelines/box/refresh', require( "./networks/box" ).RefreshAuth );
// app.all( '/timelines/box/native', require( "./networks/box" ).NativeOp );