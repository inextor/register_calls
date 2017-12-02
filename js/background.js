
chrome.runtime.onInstalled.addListener(function()
{
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'g' ...
        conditions: 
		 [
         	new chrome.declarativeContent.PageStateMatcher
			({
				  pageUrl: { hostPrefix: config.host_prefix }
        	})
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});





var missedCalls				= {};
var ext						= new ExtensionFrameworkServer();

ext.addPageLoadListener( config.load_listener ,true,()=>
{
	console.log('Page Loaded', new Date() );
});

var init    = new Date(); 
ext.addCustomRequestListener('calls_arrived',(url,request,tab_id)=>
{
	console.log('Call Missed found', request, new Date() );
	/*
	 *Array(3)
	Array(3)
	qa-call-id : "114111378371"
	qa-charge : "$0.012FromToAgentMinutesCharge+1 (202) 997-5097+1 (213) 205-0042-1$0.009+1 (213) 205-0042Browser-1$0.003"
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
		request.forEach(i=>
		{
            let d       = new Date( i['qa-datetime'] );
            

			if( typeof missedCalls[ i['qa-call-id'] ] === 'undefined' && d > init  )
			{
				missedCalls[ i['qa-call-id'] ] = 1;
                let date = getDateString( i['qa-datetime'] );
                

				var promise = axhrw
				({

					method				: 'POST'			//,'POST',...
					,url				: config.create_ticket_url		//Required
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
	}
});


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
