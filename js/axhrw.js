/*
	var promise = axhrw
	({

		timeout				: 3000 			//in milliseconds
		,method				: 'GET'			//,'POST',...
		,async				: true			//boolean optional
		,url				: 'The url'		//Required
		,user				: ''//optional	//Optional
		,password			: ''//password
		,withCredentials	: false //if false not cookies is sent
		,requestHeaders		: { Content-type : 'text/html' }
		,data				: xxxx
		,responseType		: ''//arrayBuffer,blob,document,json,text
		,dataType			: '' alias of responseType
		,overrideMimeType	: ''//optional exampl 'text/plain; charset=utf-8'
		,success			: function( response, status, responseHeaders )
		,uploadFinish: function()
		{

		}
		,uploadProgress	: function( percent )
		{

		}
		,progress			: function( progress ) //Download
		{

		}
		,error			: function( xhr, statusText, e )
		{

		}
		,abort			: function()
		{

		}
	});
*/
function axhrw( obj )
{
	var xhr		= new XMLHttpRequest();
	var promise = new Promise(function(resolve,reject)
	{
		var i;

		xhr.open
		(
		 	obj.method 		|| 'GET'
			,obj.url
			,obj.async 		|| true
			,obj.user 		|| ''
			,obj.password	|| ''
		);

		xhr.timeout = obj.timeout || 0;

		if( obj.requestHeaders )
		{
			for(i in obj.requestHeaders )
			{
				xhr.setRequestHeader( i.toLowerCase() , obj.requestHeaders[ i ] );
			}
		}

		xhr.withCredentials 	= obj.withCredentials	|| false;

		xhr.responseType		= obj.responseType	|| obj.dataType || '';

		if( obj.overrideMimeType )
			xhr.overrideMimeType( obj.overrideMimeType );

		xhr.addEventListener("progress"	, obj.progress );
		xhr.addEventListener('error',function(e)
		{
			if( obj.error )
			{
				obj.error( xhr, xhr.statusText, e );
			}

			reject({ xhr: xhr, status: xhr.statusText, error: e });
		});

		if( obj.uploadProgress )
			xhr.upload.addEventListener("progress", obj.uploadProgress);

		if( obj.uploadFinish )
		{
			xhr.upload.addEventListener("load", obj.uploadFinish );
		}

		xhr.onreadystatechange = function(e)
		{
			if (xhr.readyState == 4)
			{
				if( xhr.status >= 200 && xhr.status < 300 )
				{
					if( xhr.responseType === "" || xhr.responseType == "text" )
					{
						if( obj.success )
							obj.success( xhr.responseText , xhr.statusText, xhr );

						resolve( xhr.responseText );
					}
					else
					{
						if( obj.success )
							obj.success( xhr.response , xhr.statusText, xhr );

						resolve( xhr.response );
					}
				}
				else if( xhr.status >=300 && xhr.status< 400 )
				{
					//never happens but when it do make something
					if( obj.error )
						obj.error( xhr, xhr.statusText, 'Redirection' );

					reject( xhr );
				}
				else if( xhr.status > 400 && xhr.status < 500 )
				{
					if( obj.error )
						obj.error( xhr, xhr.statusText, 'Not found error' );

					reject({ xhr: xhr, status:xhr.statusText, error: 'Not found error' });
				}
				else if(  xhr.status > 400 && xhr.status < 500 )
				{
					if( obj.error )
						obj.error( xhr, xhr.statusText, 'System server error' );


					reject({ xhr: xhr, status:xhr.statusText, error: 'System server Error' });
				}
				else
				{
					if( obj.error )
						obj.error( xhr, xhr.statusText, 'Unknown Error' );

					reject({ xhr: xhr, status:xhr.statusText, error: 'Unknow error' });
				}
			}
		};

		xhr.addEventListener('abort',function(e)
		{
			if( obj.abort )
				obj.abort( e );

			reject({ xhr: xhr, status:'Aborted', error: e });
		});


		var parameters	= null;
		var methods		= [Blob, Document, FormData, String ];

		if( obj.data )
		{
			var s = '';
			if( typeof obj.data === "string" )
			{
				parameters = obj.data;
			}
			else
			{
				for(i=0;i<methods.length;i++)
				{
					if( obj.data instanceof methods[i] )
					{
						parameters = obj.data;
						break;
					}
				}
			}

			if( !parameters )
			{
				var serialize = function(obj, prefix)
				{
					var p;
					var str = [];

					for(p in obj)
					{
						if (obj.hasOwnProperty(p))
						{
							var v = obj[p];
						   	var is_obj = typeof v == "object";
							var k = prefix ? prefix + "[" + (isNaN(+p) || is_obj ? p : '') + "]" : p;

							str.push
							(
							 	is_obj ?
									serialize( v, k ) :
									encodeURIComponent( k ) + "=" + encodeURIComponent( v )
							);
						}
					}
					return str.join("&");
				};

				xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');


				parameters = serialize( obj.data );
			}
		}

		xhr.send( parameters );
	});

	promise.xhr = xhr;

	return promise;
}
