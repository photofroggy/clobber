
/**
 * Lobby manager object.
 * 
 * @class Clobber.Lobby
 * @param client {Object} A reference to the main client
 * @param namespace {String} A namespace for the lobby
 * @param connections {Array} Information about the lobby connections
 */
Clobber.Lobby = function( client, ns, connections ) {

    this.client = client;
    this.namespace = ns;
    this.host = null;
    this.type = 'default';
    this.users = [];
    this.events = new EventEmitter();
    this.bindings();
    
    if( !connections )
        return;
    
    for( var i = 0; i < connections.length; i++ ) {
    
        if( !connections.hasOwnProperty( i ) )
            continue;
        
        this.registerUser( connections[i] );
    
    }

};

/**
 * Set up event bindings.
 *
 * @method bindings
 */
Clobber.Lobby.prototype.bindings = function(  ) {

    var lobby = this;
    
    this.on( 'pkt.lobby.user.join', function( event, lobby, client ) { lobby.userJoin( event, lobby, client ); } );
    this.on( 'pkt.lobby.user.part', function( event, lobby, client ) { lobby.userPart( event, lobby, client ); } );
    this.on( 'pkt.lobby.user.kicked', function( event, lobby, client ) { lobby.userPart( event, lobby, client ); } );
    
    this.on( 'pkt.lobby.join', function( event, lobby, client ) { lobby.joined( event, lobby, client ); } );
    this.on( 'pkt.lobby.part', function( event, lobby, client ) { lobby.parted( event, lobby, client ); } );
    this.on( 'pkt.lobby.kicked', function( event, lobby, client ) { lobby.kicked( event, lobby, client ); } );
    this.on( 'pkt.lobby.message', function( event, lobby, client ) { lobby.messaged( event, lobby, client ); } );

};

/**
 * Add an event listener for an event.
 * 
 * @method on
 * @param event {String} Event to listen for.
 * @param method {Function} Callback to fire when an event occurs.
 */
Clobber.Lobby.prototype.on = function( event, method ) {

    this.events.addListener(event, method);

};

/**
 * Trigger an event.
 * 
 * @method trigger
 * @param event {String} Event to trigger
 * @param data {Object} Event data
 */
Clobber.Lobby.prototype.trigger = function( event, data ) {

    this.events.emit( event, data, client );

};

/**
 * Register a user/connection with the lobby.
 * 
 * @method registerUser
 * @param data {Object} User data
 */
Clobber.Lobby.prototype.registerUser = function( data ) {

    this.users[ data.id ] = data;
    
    if( data.host )
        this.host = data;

};

/**
 * Send a message to this lobby.
 *
 * @method send
 * @param data {Object} Message data
 */
Clobber.Lobby.prototype.send = function( data ) {

    data.application = this.type;
    data.id = this.namespace;
    
    this.client.send( data );

};

/**
 * A user joined the lobby.
 * 
 * @method userJoin
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.userJoin = function( event, client ) {

    this.registerUser( event.user );
    console.log( this.type + ':' + this.namespace, '>> **', event.user.username, ' joined *' );

};

/**
 * A user left the lobby.
 * 
 * @method userPart
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.userPart = function( event, client ) {

    if( !this.users.hasOwnProperty( event.user.id )  )
        return;
    
    delete this.users[ event.user.id ];
    
    if( this.host == event.user )
        this.host = null;
    
    console.log( this.type + ':' + this.namespace, '>> **', event.user.username, ' left *', event.reason );

};

/**
 * Joined the lobby.
 * 
 * @method joined
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.joined = function( event, client ) {



};

/**
 * Left the lobby.
 * 
 * @method parted
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.parted = function( event, client ) {



};

/**
 * Received a message in the lobby.
 * 
 * @method messaged
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.messaged = function( event, client ) {

    console.log( this.type + ':' + this.namespace, '>>', '<' + event.user.username + '>', event.message );

};

/**
 * Kicked out of the lobby.
 * 
 * @method kicked
 * @param event {Object} Event data
 * @param client {Object} A reference to the client
 */
Clobber.Lobby.prototype.kicked = function( event, client ) {



};

