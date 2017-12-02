class ExtensionFrameworkClient
{
	constructor()
	{
		this.debug				= false;
		this.PORT_SERVER_NAME 	= 'PORT_SERVER_NAME';
		this.PORT_CLIENT_NAME 	= 'PORT_CLIENT_NAME';
		this.severPort			= null;

		this.customFunctions = {};

		console.log('Init');

		chrome.runtime.onConnect.addListener((port)=>
		{
			console.log('COnnect please'+port.name );
			if( port.name === this.PORT_CLIENT_NAME )
			{
				this.connect();
				port.postMessage({ command : 'PAGE_LOADED', value: JSON.parse( JSON.stringify( window.location ) )});
			}
		});

		this.connect();
	}

	connect()
	{
		//Testing if the lamda works instead of the function
		console.log('Connection maybe???');

		var port = chrome.runtime.connect({name: this.PORT_SERVER_NAME });

		port.onMessage.addListener((request)=>
		{
			console.log('Receiving message');
			var sendResponse = ( response )=>
			{
				port.postMessage({ id: request.id, response });
			};

			switch( request.request.command )
			{
			//	case "MAKE_PAYPAL_PAYMENT"	: return that.makePaypalPayment( request, sender, sendResponse );
				case "IS_READY_SELECTOR"	: return this.checkSelector( request.request,  sendResponse);
				case "WAIT_TILL_READY"		: return this.checkSelector( request.request,  sendResponse );
				case "EXECUTE_ACTIONS"		: return this.executeClientActions(request.request,  sendResponse );
				case "GET_VALUES"			: return this.getClientValues( request.request,  sendResponse);
				case "LOG"					: return this.makeLog( request.request ,sendResponse );
				default						: console.error('Command not found', request.request.command, request );
			}
		});

		this.serverPort	= port;

		try
		{
			console.log('Posting the message');
			port.postMessage({ command : 'PAGE_LOADED', value: JSON.parse( JSON.stringify( window.location ) )});
		}
		catch(exception)
		{
			console.error('Error on posting ', exception );
		}
	}


	makeLog( request, response )
	{
		if( typeof request.obj !== "undefined" )
			console.log( request.value, request.obj );
		else
			console.log( request.value );

	   	sendResponse({result: "success"});

		return Project.resolve(true);
	}

	checkSelector( request, sendResponse )
	{
		if( request.command === "IS_READY_SELECTOR" )
		{
			sendResponse({ result : this.isReadySelector( request.selector, request.is_array ) });
		}
		else
		{
			this.waitTillReadyClient( request.selector, request.is_array  ).then(()=>
			{
				sendResponse({ result : "success" });
			});
		}
		return true;
	}

	isReadySelector( selector, isArray )
	{
		var obj = isArray
			? document.querySelectorAll( selector )
			: document.querySelector( selector );

		return isArray ? obj !== null && obj.length > 0 : obj !== null;
	}

	isReadySelectorArray( selector )
	{
		var arr = document.querySelectorAll( selector );
		return arr && arr.length > 0;
	}

	waitTillReadyClient( selector, isArray  )
	{
		return new Promise((resolve,reject)=>
		{
			var interval_id = -1;

			if( this.isReadySelector( selector , isArray ) )
			{
				resolve( true );
				return;
			}

			interval_id = setInterval(()=>
			{
				if( this.isReadySelector( selector, isArray ) )
				{
					resolve( true );
					clearInterval( interval_id );
					return;
				}
			},300);
		});
	}

	getClientValues( request, sendResponse )
	{
		/* jshint shadow:true */
		var objResponse = {};

		request.actions.forEach((i)=>
		{
			var elements =  document.querySelectorAll( i.selector );

			switch(i.action)
			{
				case 'url'	:
				{
					objResponse[ i.selector ]= JSON.parse( JSON.stringify( window.location ) );
					break;
				}
				case 'textContent':
				{
					var element = document.querySelector( i.selector );
					if( element )
					{
						objResponse[ i.selector ] = element.textContent;
					}
					else
					{
						objResponse[ i.selector ] = '';
					}
					break;
				}
				case 'value':
				{
					var element = document.querySelector( i.selector );

					if( element && (typeof element.value !== "undefined") )
					{
						objResponse[ i.selector ] = element.value;
					}
					else
					{
						objResponse[ i.selector ] = element.value;
					}
					break;
				}
				case 'values':
				{
					var elements = document.querySelector( i.selector );
					var values = [];

					for(var i=0;i<elements.length;i++)
					{
						values.push( elements[ i ].value );
					}
					objResponse[ i.selector ] = values;
					break;
				}
				case 'dom_count'	:
				{
					var elements = document.querySelector( i.selector );
					objResponse[ i.selector ] = elements.length;
					break;
				}
				case 'existsSelector':
				{
					var elements = document.querySelectorAll( i.selector );
					objResponse[ i.selector ] =  elements.length > 0;
					break;
				}
				case 'option_values':
				{
					var element = document.querySelector( i.selector );

					objResponse[ i.selector ] = {};

					if( typeof element.options === "undefined" )
					{
						break;
					}

					for(var i=0;i<element.options.length;i++)
					{
						objResponse[ i.selector ][ element.options[ i ].value ] = element.options[ i ].text;
					}
					break;
				}
			}
		});
		console.log('Responsing',objResponse );
		sendResponse({ result:true , response: objResponse });
		return true;
	}

	executeClientActions( request, sendResponse )
	{
		/* jshint shadow:true */
		var generator = (i,index)=>
		{
			switch( i.action )
			{
				case 'KEY_PRESS':
				{
					/*
					var element = document.querySelector( i.selector );

					var dispatchEvent = (type,key,code,charCode)=>
					{
						var evt = new KeyboardEvent(type,
						{
							"key" : key //, optional and defaulting to "", of type DOMString, that sets the value of KeyboardEvent.key.
							,"code": code //optional and defaulting to "", of type DOMString, that sets the value of KeyboardEvent.code.
							,"location":0 //, optional and defaulting to 0, of type unsigned long, that sets the value of KeyboardEvent.location.
							,"ctrlKey": false //optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.ctrlKey.
							,"shiftKey": false // optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.shiftKey.
							,"altKey": false //optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.altKey.
							,"metaKey": false //optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.metaKey.
							,"repeat": false //optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.repeat.
							,"isComposing": false //optional and defaulting to false, of type Boolean, that sets the value of KeyboardEvent.isComposing.
							,"charCode": charCode //optional and defaulting to 0, of type unsigned long, that sets the value of the deprecated KeyboardEvent.charCode.
							,"keyCode": 0 //optional and defaulting to 0, of type unsigned long, that sets the value of the deprecated KeyboardEvent.keyCode.
							,"which":  0//optional and defaulting to 0, of type unsigned long, that sets the value of the deprecated KeyboardEvent.which.
						});
						element.dispatchEvent( evt );
					};

					dispatchEvent
					(
						"keydown"
						, i.value
						, "Key"+i.value.toUpperCase()
						, i.value.charCodeAt( 0 )
					);

					dispatchEvent
					(
						"keypress"
						,i.value
						,"Key"+i.value.toUpperCase()
						, i.value.charCodeAt( 0 )
					);

					element.value = element.value + i.value;

					dispatchEvent
					(
						"keyup"
						,i.value
						,"Key"+i.value.toUpperCase()
						, i.value.charCodeAt( 0 )
					);


					var inputEvent = new Event('input',
					{
						"bubbles" 		: true
						,"cancelable" 	: false
						,"composed" 		: false
					});

					element.dispatchEvent( inputEvent );
					*/

					return Promise.resolve( true );
				}
				case 'FILL_VALUE':
				{
					var input = document.querySelector( i.selector );
					if( input === null )
						return Promise.reject( 'selector does not exists selector:'+i.selector);

					if( typeof input.value === "undefined" )
					{
						return Promise.reject("Input '"+i.selector+"' does not have a value property");
					}
					else
					{
						input.value = i.value;
					}
					return Promise.resolve( true );
				}
				case 'FIRE_ON_CHANGE':
				{
					var input = document.querySelector( i.selector );

					if( input === null )
						return Promise.reject( 'selector does not exists selector:'+i.selector);

					var inputEvent = new Event('input',
					{
						"bubbles" 		: true
						,"cancelable" 	: false
						,"composed" 		: false
					});

					input.dispatchEvent( inputEvent );
					return Promise.resolve( true );
				}
				case 'DISABLE':
				{
					var input = document.querySelector( i.selector );
					input.disabled = false;
					return Promise.resolve( true );
				}
				case 'ENABLE':
				{
					var input = document.querySelector( i.selector );
					input.disabled = false;
					return Promise.resolve( true );
				}
				case 'WAIT':{ return PromiseUtil.resolveAfter( parseInt(i.value,10), 1 ); }
				case 'CLICK':
				{
					var obj = document.querySelector( i.selector );

					if( obj === null )
					{
						return Promise.reject("Selector does not exists selector:"+i.selector );
					}

					if( typeof obj.click  === "undefined" )
					{
						return Promise.reject("Selector doesnt have click evt");
					}
					else
						obj.click();

					return Promise.resolve( true );
				}
				case 'REDIRECT':
				{
					//window.location.href = i.action.value;
					window.location.assign( i.value );
					return Promise.resolve(true);
				}
				case 'WAIT_TILL_READY' : return this.waitTillReadyClient( i.selector, false );
				case 'LOG'	:
				{
					console.log( i.value );
					return Promise.resolve( true );
				}
				case 'EXEC_CUSTOM_FUNCTION':
				{
					if( typeof this.customFunctions[ i.selector ] ===  "function" )
					{
						return this.customFunctions[ i.selector ].apply( this.customFunctions[ i.selector ], i.value );
					}

					return Promise.reject('No function "'+i.selector+'" Found');
				}
				default: return Promise.reject('SOMETHING FAIL action:'+i.action );

			}
			return Promise.resolve();
		};

		PromiseUtil.runSequential( request.actions, generator ).then((response)=>
		{
			sendResponse({ result:true ,'command': 'response', response: response});
		})
		.catch((reason)=>
		{
			console.log( reason );
			sendResponse({ result: false , 'command': 'response', error : reason });
		});

		return true;
	}

	sendCustomRequest(name,request)
	{
		var url =window.location.href;
		if( this.serverPort === null )
		{
			console.error('Server Port is closed');
			return;
		}
		try
		{
			this.serverPort.postMessage({ command : 'CUSTOM_REQUEST', value:{ url:url ,name:name ,request: request} });
		}
		catch(e)
		{
			console.error('Error sending custom request',e);
		}
	}

	sendCustomRequestToClient(name,request)
	{
		var url =window.location.href;
		if( this.serverPort === null )
		{
			console.error('Server Port is closed');
			return;
		}
		try
		{
			this.serverPort.postMessage({ command : 'CUSTOM_REQUEST_TO_CLIENT', value:{ url:url ,name:name ,request: request} });
		}
		catch(e)
		{
			console.error('Error sending custom request',e);
		}
	}

	addCustomFunction(name,func)
	{

		this.customFunctions[ name ] = func;
	}
}
