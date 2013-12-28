

/**
 * Control the flow of a client on a given event.
 *
 * @class Clobber.Flow
 */
Clobber.Flow = function(  ) {

};


/**
 * Established a connection.
 *
 * @method open
 * @param client {Object} Reference to the main client
 * @param event {Object} Event data
 * @param socket {Object} Connection socket
 */
Clobber.Flow.prototype.open = function( client, event, socket ) {

    client.trigger('connected', { name: 'connected', message: 'connected to the server' });
    client.connected = true;
    client.login();
    client.attempts = 0;

};

/**
 * A websocket connection was closed. Handle this.
 * @method close
 * @param client {Object} Reference to main client
 * @param event {Object} Event data
 */
Clobber.Flow.prototype.close = function( client, event ) {
    var evt = {
        name: 'closed',
        reason: '',
        evt: event,
        // Were we fully connected or did we fail to connect?
        connected: client.connected,
        // Are we using SocketIO?
        sio: client.conn instanceof Clobber.SocketIO,
        cause: event.cause || null,
        reconnect: true
    };
    
    var logevt = {
        name: 'log',
        ns: '~System',
        msg: '',
        info: ''
    };
    
    client.trigger( 'closed', evt );
    
    if(client.connected) {
        logevt.msg = 'Connection closed';
        client.trigger( 'log', logevt );
        client.connected = false;
        if( client.conn instanceof Clobber.SocketIO ) {
            logevt.msg = 'At the moment there is a problem with reconnecting with socket.io';
            logevt.info = 'Refresh to connect';
            client.trigger( 'log', logevt );
            logevt.info = '';
            return;
        }
    } else {
        logevt.msg = 'Connection failed';
        client.trigger( 'log', logevt );
    }
    
    evt.name = 'quit';
    
    // Tried more than twice? Give up.
    if( client.attempts > 2 ) {
        //client.ui.server_message("Can't connect. Try again later.");
        evt.reconnect = false;
        client.attempts = 0;
        client.trigger( 'quit', evt );
        return;
    }
    
    // If login failure occured, don't reconnect
    if( event.cause ) {
        if( event.cause.hasOwnProperty( 'name' ) && event.cause.name == 'login' ) {
            client.trigger( 'quit', evt );
            return;
        }
    }
    
    // Notify everyone we'll be reconnecting soon
    //client.ui.server_message("Connecting in 2 seconds");
    
    setTimeout(function () {
        client.connect();
    }, 2000);

}; 

/**
 * Data received from the WebSocket
 * 
 * @method message
 * @param client {Object} Reference to main client
 * @param event {Object} Event data
 */
Clobber.Flow.prototype.message = function( client, data ) {

    var event = JSON.parse( data.data );
    
    if(event == null)
        return;
    
    var lobby = client.lobby( event.application, event.id );
    
    if( lobby ) {
        event.lobby = lobby;
        lobby.trigger( 'pkt.' + replaceAll(event.cmd, '.', '_'), event );
    }
    
    this.handle(client, event);
    
    console.log('>>', event);
    
    client.trigger('pkt', event);
    client.trigger('pkt.' + replaceAll(event.cmd, '.', '_'), event);
    
};

/**
 * Handle a packet event.
 * 
 * @method handle
 * @param event {Object} Packet event data.
 * @param client {Object} Client object.
 */
Clobber.Flow.prototype.handle = function( client, event ) {

    try {
        this['evt_' + replaceAll(event.cmd, '.', '_')](event, client);
    } catch( err ) {}
    

};

/**
 * Logged in.
 * 
 * @method evt_login
 * @param event {Object} Event data
 * @param client {Object} Reference to the client
 */
Clobber.Flow.prototype.evt_login = function( event, client ) {

    client.user.name = event.username;
    client.user.id = event.id;

};

/**
 * Joined a lobby.
 * 
 * @method evt_lobby_join
 * @param event {Object} Event data
 * @param client {Object} Reference to the client
 */
Clobber.Flow.prototype.evt_lobby_join = function( event, client ) {

    var lobby = client.createLobby( event.lobby.application, event.lobby.id, event.lobby.connections );

};

