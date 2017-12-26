
console.log('Inserted nextor');

if( window.location.hostname === config.site )
{
	var ext = new ExtensionFrameworkClient();
	
	ext.addCustomFunction('testThatShitInClient',()=>
	{
		console.log('Testing that Shit');
		return Promise.resolve( 1 );
	});
	
	console.log( 'ExtensionFor: '+window.location.href );
	
	var interval_id = setInterval(()=>
	{
		if( window.location.pathname === "/access/unauthenticated" )
		{
			let iframe = document.querySelector('iframe');
			let doc		= iframe.contentWindow.document;
	
			let input 		= doc.getElementById('user_email');
			input.value 	= config.email;
			let password	= doc.getElementById('user_password');
			password.value  = config.password;
			let button		= doc.querySelector('.button.primary');
			button.click();
			return;
		}
	
		console.log('ExtensionFor: '+window.location.href );

		if( window.location.href == "https://shuttlewizard.zendesk.com/agent/admin/voice" )
		{
			let iframe = document.querySelector('iframe[src="/voice/admin/settings"]');
			if( !iframe )
			{
				return;
			}
	
			let doc = iframe.contentWindow.document;
			if( ! doc )
				return;
	
			var voiceSettings = doc.querySelector('.voice-settings-tabs');
			if( voiceSettings )
			{
				var exportButton = doc.querySelector('.c-report-table--header--pull-right');
				if( !exportButton )
				{
					let history = doc.querySelector('.c-tab-list__item.tab-history');
					history.click();
				}
			}
	
			let calls	= [];
			var trs		= doc.querySelectorAll('.c-history-ticket-details article tr');

	
			for(let i=0;i<trs.length;i++)
			{
				var tr =  trs[ i ];
				var tds	= tr.querySelectorAll('td');
	
				var call = {};
	
				for(let j=0;j<tds.length;j++)
				{
					var td	= tds[ j ];
	
					for(var k=0;k<td.classList.length;k++)
					{
					//	console.log( td.classList );
						let name = td.classList.item( k );
						
						//console.log( name );
						if( /^qa-/.test(name) )
						{
							if( name == "qa-charge" )
							{
								let a = td.querySelector('a');
								call[ name ]	= a.textContent.trim();
							}
							else
							{
								call[ name ] = td.textContent.trim();
							}
						}
					}
				}
	
				if( call['qa-charge']  == 'Retrieving charge' )
				{
					continue;
				}

				if( typeof call['qa-call-id']  !== 'undefined' )
				{
					calls.push( call );
				}
			}
	
			if( calls.length > 0  )
			{
				ext.sendCustomRequest( 'calls_found', calls );
			}
		}
		else
		{
			window.location.href="https://shuttlewizard.zendesk.com/agent/admin/voice";
	
		}
	},25000 );
	
	var interval_id2	= setInterval(()=>
	{
		let iframe = document.querySelector('iframe[src="/voice/admin/settings"]');
		if( !iframe )
			return;
	
		let doc = iframe.contentWindow.document;
		if( ! doc )
			return;
	
		var first = doc.querySelector('.c-btn.c-pagination--left');
		var one		= doc.querySelector('button.c-btn.is-active[value="1"]');
	
		if( one )
		{
			doc.querySelector('.c-pagination.center button[value="2"]').click();
		}
		else if( first )
	    {
		    first.click();
		}
	    else
	    {
	        window.location.reload( true );
	    }
	},60000);
	
	var interval_id3 = setInterval(()=>
	{
	    window.location.reload( true );
	},3600000);
}

