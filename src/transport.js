/**
 * Client transport.
 * Acts as a basic wrapper around a transport.
 * 
 * @class Clobber.Transport
 * @constructor
 * @param server {String} Address for the server to connect to.
 * @param [open=Clobber.Transport.sopen] {Method} This method will be called when
 *   a connection is established with the server.
 * @param [message=Clobber.Transport.smessage] {Method} When a message is received
 *   on the transport, this method will be called.
 * @param [disconnect=Clobber.Transport.sdisconnect] {Method} The method to be
 *   called when the connection has been closed.
 */
Clobber.Transport = function( server, open, message, disconnect ) {

    this.sock = null;
    this.conn = null;
    this.server = server;
    this.open( open );
    this.message( message );
    this.disconnect( disconnect );

};

/**
 * Static class method.
 * Create a new client transport object.
 * 
 * @method Create
 */
Clobber.Transport.Create = function( server, open, message, disconnect ) {

    if( typeof io !== 'undefined' ) {
        return new Clobber.SocketIO( server, open, message, disconnect );
    }
    
    if(!window["WebSocket"]) {
        throw "This browser does not support websockets.";
    }
    
    return new Clobber.WebSocket( server, open, message, disconnect );

};

/**
 * Register open event callback.
 * 
 * @method open
 * @param [callback=Clobber.Transport.sopen] {Method} This method will be called
 *   when a connection is established with the server.
 */
Clobber.Transport.prototype.open = function( callback ) {

    this._open = callback || this.sopen;

};

/**
 * Register message event callback.
 * 
 * @method message
 * @param [callback=Clobber.Transport.smessage] {Method} When a message is received
 *   on the transport, this method will be called.
 */
Clobber.Transport.prototype.message = function( callback ) {

    this._message = callback || this.smessage;

};

/**
 * Register disconnect event callback.
 * 
 * @method disconnect
 * @param [callback=Clobber.Transport.sdisconnect] {Method} The method to be called
 *   when the connection has been closed.
 */
Clobber.Transport.prototype.disconnect = function( callback ) {

    this._disconnect = callback || this.sdisconnect;

};

/**
 * Open connection event stub.
 * 
 * @method sopen
 */
Clobber.Transport.prototype.sopen = function(  ) {};

/**
 * Message event stub.
 * 
 * @method smessage
 */
Clobber.Transport.prototype.smessage = function(  ) {};

/**
 * Close connection event stub.
 * 
 * @method sdisconnect
 */
Clobber.Transport.prototype.sdisconnect = function(  ) {};

Clobber.Transport.prototype._open = function( event, sock ) {};
Clobber.Transport.prototype._message = function( event ) {};
Clobber.Transport.prototype._disconnect = function( event ) {};

/**
 * Connect to the server.
 * 
 * @method connect
 */
Clobber.Transport.prototype.connect = function(  ) {};

/**
 * Send a message to the server.
 * 
 * @method send
 * @param message {String} message to send to the server.
 */
Clobber.Transport.prototype.send = function( message ) {};

/**
 * Close the connection.
 * 
 * @method close
 */
Clobber.Transport.prototype.close = function(  ) {};


/**
 * WebSocket transport object.
 * 
 * @class Clobber.WebSocket
 * @constructor
 * @param server {String} Address for the server to connect to.
 * @param [open=Clobber.WebSocket.sopen] {Method} This method will be called when
 *   a connection is established with the server.
 * @param [message=Clobber.WebSocket.smessage] {Method} When a message is received
 *   on the transport, this method will be called.
 * @param [disconnect=Clobber.WebSocket.sdisconnect] {Method} The method to be
 *   called when the connection has been closed.
 */
Clobber.WebSocket = function( server, open, message, disconnect ) {

    this.sock = null;
    this.conn = null;
    this.server = server;
    this.cause = null;
    this.open( open );
    this.message( message );
    this.disconnect( disconnect );

};

Clobber.WebSocket.prototype = new Clobber.Transport;
Clobber.WebSocket.prototype.constructor = Clobber.WebSocket;

/**
 * Called when the connection is opened.
 * Sets the `sock` attribute.
 * 
 * @method onopen
 * @param event {Object} WebSocket event object.
 * @param sock {Object} Transport object.
 */
Clobber.WebSocket.prototype.onopen = function( event, sock ) {

    this.sock = sock || this.conn;
    this._open( event, this );

};

/**
 * Called when the connection is closed.
 * Resets `sock` and `conn` to null.
 * 
 * @method ondisconnect
 * @param event {Object} WebSocket event object.
 */
Clobber.WebSocket.prototype.ondisconnect = function( event ) {

    this.sock = null;
    this.conn = null;
    this._disconnect( { wsEvent: event, cause: this.cause } );

};

/**
 * Connect to the server.
 * 
 * @method connect
 */
Clobber.WebSocket.prototype.connect = function(  ) {

    var tr = this;
    this.conn = new WebSocket( this.server, 'lobber' );
    this.conn.onopen = function(event, sock) { tr.onopen( event, sock ) };
    this.conn.onmessage = this._message;
    this.conn.onclose = function(event) { tr.ondisconnect( event ); };

};

/**
 * Send a message to the server.
 * 
 * @method send
 * @param message {String} message to send to the server.
 */
Clobber.WebSocket.prototype.send = function( message ) {

    if( this.sock == null )
        return -1;
    
    return this.sock.send( JSON.stringify( message ) );

};

/**
 * Close the connection.
 * 
 * @method close
 */
Clobber.WebSocket.prototype.close = function( cause ) {

    if( this.sock == null )
        return;
    
    this.cause = cause;
    
    this.sock.close();

};


/**
 * SocketIO wrapper.
 * 
 * @class Clobber.SocketIO
 * @constructor
 * @param server {String} Address for the server to connect to.
 * @param [open=Clobber.SocketIO.sopen] {Method} This method will be called when
 *   a connection is established with the server.
 * @param [message=Clobber.SocketIO.smessage] {Method} When a message is received
 *   on the transport, this method will be called.
 * @param [disconnect=Clobber.SocketIO.sdisconnect] {Method} The method to be
 *   called when the connection has been closed.
 */
Clobber.SocketIO = function( server, open, message, disconnect ) {

    this.sock = null;
    this.conn = null;
    this.server = server;
    this.open( open );
    this.message( message );
    this.disconnect( disconnect );

};

Clobber.SocketIO.prototype = new Clobber.Transport('');
Clobber.SocketIO.prototype.constructor = Clobber.SocketIO;

/**
 * Connect to the server.
 * 
 * @method connect
 */
Clobber.SocketIO.prototype.connect = function(  ) {

    var tr = this;
    this.conn = io.connect( this.server );
    this.conn.on('connect', function(event, sock) { tr.onopen( event, sock ) });
    this.conn.on('message', function( message ) { tr._message( { 'data': message } ) } );
    this.conn.on('close', function(event) { tr.ondisconnect( event ); });

};

/**
 * Called when the connection is opened.
 * Sets the `sock` attribute.
 * 
 * @method onopen
 * @param event {Object} SocketIO event object.
 * @param sock {Object} Transport object.
 */
Clobber.SocketIO.prototype.onopen = function( event, sock ) {

    this.sock = sock || this.conn;
    this._open( event, this );

};

/**
 * Called when the connection is closed.
 * Resets `sock` and `conn` to null.
 * 
 * @method ondisconnect
 * @param event {Object} SocketIO event object.
 */
Clobber.SocketIO.prototype.ondisconnect = function( event ) {

    this.sock = null;
    this.conn = null;
    this._disconnect( event );

};

/**
 * Send a message to the server.
 * 
 * @method send
 * @param message {String} message to send to the server.
 */
Clobber.SocketIO.prototype.send = function( message ) {

    if( this.sock == null )
        return -1;
    
    return this.sock.send( JSON.stringify( message ) );

};

/**
 * Close the connection.
 * 
 * @method close
 */
Clobber.SocketIO.prototype.close = function(  ) {

    if( this.sock == null )
        return;
    
    this.sock.close();

};




