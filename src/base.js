

/**
 * Clobber is a javascript client for lobber servers.
 *
 * Wooooo.
 * @class Clobber
 * @constructor
 */
var Clobber = function( config ) {

    this.server = config.server || false;
    this.user = config.user || false;
    this.conn = null;
    this.events = new EventEmitter();
    this.flow = new Clobber.Flow();
    this.connected = false;
    this.attempts = 0;
    
    this.lobbies = {
        'default': {
            manager: Clobber.Lobby,
            open: {}
        }
    };
    
    if( !this.server )
        throw Error("No server address provided");
    
    if( !this.user )
        throw Error("No login credentials provided");
    
    if( !this.user.name )
        throw Error("No username provided");
    
    if( !this.user.token )
        throw Error("No login token provided");

};

/**
 * Add an event listener for an event.
 * 
 * @method on
 * @param event {String} Event to listen for.
 * @param method {Function} Callback to fire when an event occurs.
 */
Clobber.prototype.on = function( event, method ) {

    this.events.addListener(event, method);

};

/**
 * Trigger an event.
 * 
 * @method trigger
 * @param event {String} Event to trigger
 * @param data {Object} Event data
 */
Clobber.prototype.trigger = function( event, data ) {

    this.events.emit( event, data, this );

};

/**
 * Find and return a lobby.
 * If no namespace is provided, return all open lobbies for the given application.
 * 
 * @method lobby
 * @param application {String} Application to find lobbies
 * @param namespace {String} Namespace of lobby to find
 */
Clobber.prototype.lobby = function( app, ns ) {

    if( !this.lobbies.hasOwnProperty(app) ) {
        return null;
    }
    
    var lobs = this.lobbies[app];
    
    if( !ns )
        return lobs.open;
    
    ns = ns.toLowerCase();
    
    for( var key in lobs.open ) {
    
        if( !lobs.open.hasOwnProperty(key) )
            continue;
        
        if( key.toLowerCase() == ns )
            return lobs.open[key];
    
    }
    
    return null;

};

/**
 * Call a method for each lobby in a given application namespace.
 * 
 * @method eachLobby
 * @param application {String} Application to iterate through namespaces for
 * @param method {Function} Callback to call with each lobby
 */
Clobber.prototype.eachLobby = function( app, method ) {

    if( !this.lobbies.hasOwnProperty(app) ) {
        return;
    }
    
    var lobs = this.lobbies[app];
    
    for( var key in lobs.open ) {
    
        if( !lobs.open.hasOwnProperty(key) )
            continue;
        
        method( lobs.open[key], key );
    
    }

};

/**
 * Create a lobby.
 * 
 * @method createLobby
 * @param application {String} Application type for the lobby
 * @param namespace {String} Namespace for the lobby
 * @param connections {Array} Information about the host
 */
Clobber.prototype.createLobby = function( app, ns, connections ) {
    
    if( !this.lobbies.hasOwnProperty( app ) ) {
        console.log('>> no such app', app, this.lobbies);
        return false;
    }
    
    var lobby = new this.lobbies[app].manager( this, ns, connections );
    this.lobbies[app].open[ns] = lobby;
    return lobby;

};

/**
 * Register a lobby object with a given application.
 * 
 * @method registerApplication
 * @param application {String} Name of the application
 * @param lobby {Class} Child class of Clobber.Lobby
 */
Clobber.prototype.registerApplication = function( app, lobby ) {

    this.lobbies[app] = {
        manager: lobby,
        open: {}
    };

};

/**
 * Open a connection to the server.
 * 
 * If the client is already connected, nothing happens.
 * 
 * @method connect
 */
Clobber.prototype.connect = function(  ) {

    //try {
        var client = this;
        this.conn = Clobber.Transport.Create(this.server);
        this.conn.open(function( evt, sock ) { client.flow.open( client, evt, sock ); });
        this.conn.disconnect(function( evt ) { client.flow.close( client, evt ); });
        this.conn.message(function( evt ) { client.flow.message( client, evt ); });
        this.conn.connect();
        this.trigger('start', { name: 'start', message: 'client connecting' });
    /*} catch(err) {
        console.log(err);
        this.trigger('start.error', { name: 'start', message: 'no websockets available' });
    }*/

};

/**
 * Send a message to the server.
 *
 * @method send
 * @param data {Object} Message data
 */
Clobber.prototype.send = function( data ) {

    this.conn.send( data );

};

/**
 * Log in to the server
 * 
 * @method login
 */
Clobber.prototype.login = function(  ) {

    this.send( {
        cmd: 'login',
        username: this.user.name,
        token: this.user.token
    } );

};

/**
 * Open a lobby on the server
 * 
 * @method open
 * @param application {String} Application to open a lobby for
 * @param namespace {String} Namespace for the lobby to open
 */
Clobber.prototype.open = function( app, ns ) {

    this.send( {
        cmd: 'lobby.open',
        application: app,
        id: ns
    } );

};

/**
 * Join a lobby on the server
 * 
 * @method join
 * @param application {String} Application to join a lobby for
 * @param namespace {String} Namespace for the lobby to join
 */
Clobber.prototype.join = function( app, ns ) {

    this.send( {
        cmd: 'lobby.join',
        application: app,
        id: ns
    } );

};

/**
 * Part a lobby on the server
 * 
 * @method part
 * @param application {String} Application to part a lobby for
 * @param namespace {String} Namespace for the lobby to part
 */
Clobber.prototype.part = function( app, ns ) {

    this.send( {
        cmd: 'lobby.part',
        application: app,
        id: ns
    } );

};


