
var missedCalls				= {};
var ext						= new ExtensionFrameworkServer();

ext.addPageLoadListener( config.load_listener ,true,()=>
{
	console.log('Page Loaded', new Date() );
});

var init    = new Date(); 
ext.addCustomRequestListener('calls_found',(url,request,tab_id)=>
{
	console.log('Call Missed found', request, new Date() );
	/*
	 *Array(3)
	Array(3)
	qa-call-id : "114111378371"
	qa-charge : ""
	qa-datetime : "August 28, 2017 13:47"
	qa-from : "+1 (202) 997-5097"
	qa-hold-time : "00:00"
	qa-minutes : "1"
	qa-status : "Abandoned In Queue"
	qa-ticket-id : ""
	qa-to : "+1 (213) 205-0042"
	qa-wait-time : "00:17"
	qa-wrap-up-time : "00:00"
	*/

	if( Array.isArray( request ) )
	{
		let calls	= [];

		request.forEach(i=>
		{
            let d       = new Date( i['qa-datetime'] );

			var callInfo	= {
				id				: i['qa-call-id']
				,ticket_id		: i['qa-ticket-id']
				,date			: getUTCMysqlTimestamp( i['qa-datetime'] )
				,local_time		: getMysqlTimestamp( i['qa-datetime'] )
				,to				: i['qa-to']
				,from			: i['qa-from']
				,agent			: i['qa-agent']
				,call_status	: i['qa-status']
				,wait_time		: i['qa-wait-time']
				,hold_time		: i['qa-hold-time']
				,wrap_up_time	: i['qa-wrap-up-time']
				,minutes		: i['qa-minutes']
				,charge			: i['qa-charge']
			};

			calls.push( callInfo );

			if( typeof missedCalls[ i['qa-call-id'] ] === 'undefined' && d > init  )
			{
				missedCalls[ i['qa-call-id'] ] = 1;
                let date = getDateString( i['qa-datetime'] );
                

				var promise = axhrw
				({

					method				: 'POST'			//,'POST',...
					,url				: config.create_ticket_url		//Required
					//,headers			: { "connection"	: config.http_connection }
					,data				:
					{
						title			: 'Missed Call From '+i['qa-from']+' '+date
						,message			: 'Missed Call From '+i['qa-from']+' '+date
									+'\nCall Status: '+i['qa-status']
									+'\nCall To: '+i['qa-to']
                                    +'\nWait Time: '+i['qa-wait-time']
                                    +'\nHold Time: '+i['qa-hold-time']
					}
				})
				.then((response)=>
				{
					console.log( response );
				})
				.catch((reason)=>
				{
					console.log('Fails to send to server');
				});
			}
		});

		axhrw
		({
			method	: 'POST'				//,'POST',...
			,url	: config.add_calls_url	//Required
			,data	: { 'calls' : calls }
		})
		.then((response)=>
		{
			
		});
	}
});


function getUTCMysqlTimestamp( str )
{
    let d       = new Date(str);

	let month	= d.getUTCMonth()<9 ? '0'+(d.getUTCMonth()+1):(d.getUTCMonth()+1);
	let days	= d.getUTCDate() < 10 ? '0'+d.getUTCDate() : d.getUTCDate();

    let seconds = d.getUTCSeconds() < 10 ? '0'+d.getUTCSeconds() : d.getUTCSeconds();
    let min     = d.getUTCMinutes() < 10 ? '0'+d.getUTCMinutes() : d.getUTCMinutes();
    let hour    = d.getUTCHours()<10 ? '0'+d.getUTCHours() : d.getUTCHours();

	return d.getFullYear()+'-'+month+'-'+days+' '+hour+':'+min+':'+seconds;
}

function getMysqlTimestamp( str )
{
    let d       = new Date(str);

	let month	= d.getMonth()<9 ? '0'+(d.getMonth()+1):(d.getMonth()+1);
	let days	= d.getDate()  < 10 ? '0'+d.getDate() : d.getDate();

    let seconds = d.getSeconds() < 10 ? '0'+d.getSeconds() : d.getSeconds();
    let min     = d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes();
    let hour    = d.getHours()<10 ? '0' + d.getHours() : d.getHours();

	return d.getFullYear()+'-'+month+'-'+days+' '+hour+':'+min+':'+seconds;
}

function getDateString( str )
{

    let month   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let d       = new Date(str);
    let hour    = d.getHours()%12;

    if( hour === 0 )
        hour = 12;

    let m       = d.getHours() > 11 ? 'PM':'AM';
    let min     = d.getMinutes();


    let dateString = month[ d.getMonth() ]+' '+d.getDate()+' '+d.getFullYear()+' '+(hour < 10 ? '0'+hour: hour)+':'+(min<10?'0'+min:min)+' '+m;
    return dateString;
}
