class ExtensionFrameworkServer
{
	constructor()
	{
		this.debug				= true;
		this.pageLoadListeners	= {};
		this.PORT_SERVER_NAME	= 'PORT_SERVER_NAME';
		this.PORT_CLIENT_NAME	= 'PORT_CLIENT_NAME';
		this.ports				= [];
		this.messageListeners	= {};
		this.customRequestListeners = {};

		console.log("init",Date.now() );

		chrome.runtime.onConnect.addListener((port)=>
		{
			this.ports.push( port );

			console.log('Open ports for '+port.name);

			if( port.name !== this.PORT_SERVER_NAME)
				return;


			port.onMessage.addListener((msg,sendingPort)=>
			{
				if( typeof msg.command === "undefined" )
				{
					console.error('Error not well formed message',msg );
				}

				if( typeof this.messageListeners[ msg.id ] !== "undefined")
				{
					this.messageListeners[ msg.id ].call( null , msg );
					delete this.messageListeners[ msg.id ];
				}
				else if( msg.command === 'PAGE_LOADED' )
				{
					this.onPageLoaded( msg );
				}
				else if( msg.command === 'CUSTOM_REQUEST' )
				{
					console.log('Custom Request call msg=>',msg );
					if( typeof sendingPort.sender !== "undefined" && typeof sendingPort.sender.tab !== "undefined"  )
					{
						this.customRequestListeners[ msg.value.name ].call( this ,msg.value.url ,msg.value.request, sendingPort.sender.tab.id );
					}
					else
					{
						this.customRequestListeners[ msg.value.name ].call( this ,msg.value.url ,msg.value.request, null );
					}
				}
				else if( msg.command == "CUSTOM_REQUEST_TO_CLIENT" )
				{
					this.executeActions
					([
						{ action : 'EXEC_CUSTOM_FUNCTION' ,selector: msg.value.name ,value:msg.value.request }
					])
					.then(( )=>
					{
						console.log('Finish testing that shit in background');
					})
					.catch((reason)=>
					{
						console.log(reason);
					});
				}
			});

			port.onDisconnect.addListener((port)=>
			{
				var index = this.ports.indexOf( port );
				console.log('Removing port '+index);

				if( index+1 )
					this.ports.splice( index, 1 );
			});
		});

		this.reconnect();
	}

	addCustomRequestListener(name,callback)
	{
		this.customRequestListeners[ name ] = callback;
	}

	reconnect()
	{
		chrome.tabs.query({active: true, currentWindow: true}, (tabs)=>
		{
			var clientPort = chrome.tabs.connect( tabs[0].id,{name : this.PORT_CLIENT_NAME});

			clientPort.onMessage.addListener((request)=>
			{
				if( request.command === 'PAGE_LOADED')
				{
					this.onPageLoaded( request );
				}
			});

			try
			{
				console.log('Posting to client');
				clientPort.postMessage({command: 'CONNECT' });
			}
			catch(exception)
			{
				console.log('An error occourred ',exception );
			}
		});
	}

	onPageLoaded( request )
	{
		if( this.debug )
			console.log( 'page loaded is '+request.value );

		for(var i in this.pageLoadListeners )
		{
			var regex = new RegExp( i );

			if( this.debug )
				console.log('Testing '+i );

			if( regex.test( request.value.href ) )
			{
				console.log('YEad testing successfull');
				this.pageLoadListeners[ i ].callback.call( null, request.value.href );
				if( !this.pageLoadListeners[ i ].is_persistent )
					delete this.pageLoadListeners[ i ];
			}
			else
			{
				console.log(request.value+' fails for '+i );
			}
		}
	}

	sendMessage( request )
	{
		if( this.ports.length === 0 )
		{
			this.reconnect();
			return Promise.reject('Port is closed');
		}
		else return new Promise((resolve,reject)=>
		{
			var msg = { id:Date.now() ,request:request };

			this.messageListeners[ msg.id ] = (msg)=>
			{
				resolve( msg.response );
			};

			try
			{
				if( this.ports.length )
					this.ports[ 0 ].postMessage( msg );
				else
					reject('No open ports(tabs) are open');
			}
			catch(exception)
			{
				delete this.messageListeners[ msg.id ];
				reject( exception );
			}
		});
	}

	makeLog( request, sender, response )
	{
		if( typeof request.obj !== "undefined" )
			console.log( request.value, request.obj );
		else
			console.log( request.value );

	   	sendResponse({result: "success"});

		return Project.resolve(true);
	}

	getValuesFromClient( array, ignore_errors )
	{
		return this.sendMessage({ command : 'GET_VALUES', actions: array ,ignore_errors: ignore_errors });
	}
	executeCustomClientFunction(funcName,request)
	{
		return this.sendMessage
		({
			command: 'EXECUTE_ACTIONS', actions:[{ action : 'EXEC_CUSTOM_FUNCTION' ,selector: funcName ,value: request }]
		});
	}
	/*

		executeActions
		([
			{ action : "FILL_VALUE" ,selector : 'input.name' ,value: 'myemail@nextor.mx'}
			,{ action : "FILL_VALUE" ,selector : 'input[type="password"]', value:'password'}
			,{ action : "CLICK"	,selector: 'a.login_button'}
			,{ action : 'EXEC_CUSTOM_FUNCTION' ,selector: 'functionName' ,value:[ JSON-ifiable Array parameters ] }
		]);

	*/

	executeActions( array, ignore_errors )
	{
		return this.sendMessage({ command : 'EXECUTE_ACTIONS', actions: array, ignore_errors: ignore_errors });
	}

	/*
		executeServerActions
		([
			{ type : 'client' ,actions : { action : "REDIRECT" ,value:"https://www.paypal.com/mx/signin" } }
		]);
	*/

	executeServerActions( actionsArray )
	{
		var generator = (action,index)=>
		{
			switch( action.action )
			{
				case "WAIT_PAGE_LOADED"		: return this.waitToPageLoad( action );
				case "WAIT_TILL_READY"		: return this.waitTillReady( action.selector , action.is_array , action.ignore_errors );
				default	: return Promise.reject('No valid action type "'+action.action+'" '+JSON.stringify(action) );
			}
		};

		return PromiseUtil.runSequential( actionsArray, generator );
	}

	waitToPageLoad( action )
	{
		return new Promise((resolve,reject)=>
		{
			var callback = (response)=>
			{
				if( this.debug )
					console.log('Page Loaded detected',response);

				resolve( response );
			};

			this.addPageLoadListener( action.value, false, callback );
		});
	}

	addPageLoadListener( value, is_persistent , callback)
	{
		this.pageLoadListeners[ value ] = { callback: callback , is_persistent : is_persistent };
	}

	/*
		metaExecutor
		([

			{ type : 'CLIENT_ACTIONS' ,actions : { action : "REDIRECT" ,value:"https://www.paypal.com/mx/signin" } }
			,{ type : 'CLIENT_VALUES'	,actions : {
			,{ type : 'SERVER_ACTIONS' ,actions : { action : "WAIT_TILL_READY", selector : "#email" } }
			{ 	type : 'CLIENT_ACTIONS' ,actions :
				[
					{ action : "FILL_VALUE" ,selector : '#email' ,value: 'myemail@nextor.mx'}
					,{ action : "FILL_VALUE" ,selector : '#password', value:'password'}
					,{ action : "CLICK"	,selector: '#btnLogin'}
				]
			}
		]);
	*/
	metaExecutor( array )
	{
		var generator = (item,index)=>
		{
			if( this.debug )
				console.log('Executing', item.type  );

			switch( item.type )
			{
				case 'CLIENT_ACTIONS' 	: return this.executeActions( item.actions , item.ignore_errors );
				case 'GET_VALUES'		: return this.getValuesFromClient( item.actions , item.ignore_errors );
				case 'SERVER_ACTIONS'	: return this.executeServerActions( item.actions , item.ignore_errors );
				default					: return Promise.reject('No actions defined with the name '+item.type);
			}
		};

		return PromiseUtil.runSequential( array, generator );
	}


	waitTillReady( selector, is_array ,ignore_errors )
	{
		if( this.debug )
			console.log('Wait til ready selector: '+selector );

		return this.sendMessage({ command : 'WAIT_TILL_READY', selector : selector, is_array: is_array , ignore_errors: ignore_errors});
	}
}
/*

	chrome.tabs.query({active: true, currentWindow: true}, (tabs)=>
	{
		chrome.tabs.connect( tabs[0].id,{name : this.PORT_NAME });
	    chrome.tabs.sendMessage( tabs[0].id, messageObject, {},function(response)
		{

		});
	});

	chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>
	{
		if( this.debug )
			console.log( 'Requesting', request.command );

		//sendResponse({ result : "success" });
		return false;
	});

	chrome.runtime.sendMessage(null,{command: "PAGE_LOADED" , value: window.location.href }, {});

	sendMessage( messageObject )
	{
		var current = this;

		return new Promise((resolve,reject)=>
		{
			chrome.tabs.query({active: true, currentWindow: true}, (tabs)=>
			{
			    chrome.tabs.sendMessage(tabs[0].id, messageObject, {},function(response)
				{
					if( messageObject.ignore_errors )
					{
						resolve( typeof response  === "undefined" ? true : false );
						return;
					}

					if(  current.debug )
						console.log( chrome.runtime.lastError );

					if( current.debug )
						console.log('Response received for: '+messageObject.command, response );

					if( typeof response === "undefined" || response === null )
					{
						if( current.debug )
							console.log("Response is undefined or null response",response, messageObject);

						reject( "Response is undefined or null response",response, messageObject );
						return;
					}

					if( typeof response.result  === "undefined" || response.result === null )
					{
						if( this.debug )
							console.log("Response.result is undefined or null response:",response );

						reject("Response.result is undefined or null "+response );
						return;
					}

					if( response.result )
					{
						resolve( response );
					}
					else
					{
						reject( response.error );
					}

				});
			});
		});
	}
*/
