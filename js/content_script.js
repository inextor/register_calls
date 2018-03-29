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
		if( window.location.href == 'https://'+config.host_prefix+'/agent/admin/overview' )
		{
			let a			= Array.from( document.querySelectorAll('li>a') );
			let talk_link	= a.find(i=> i.getAttribute('href') == '/agent/admin/voice' );

			if( talk_link )
				talk_link.click();

		}
		else if( window.location.href != 'https://'+config.host_prefix+'/agent/admin/voice' )
		{
			let gear = document.querySelector('.toolbar_link.branding__color--contrast.admin_link');
			gear.click();
		}
		else
		{
			let iframe = document.querySelector('iframe[src="/voice/admin/settings"]');

			if( !iframe )
			{
				//DO something more than return please
				return;
			}

			let doc = iframe.contentWindow.document;
			if( ! doc )
			{
				//DO something more than return please
				return;
			}

			var divSettings = doc.querySelector('.voice-settings li[aria-selected="true"]>div');

			if( divSettings )
			{
				let text = divSettings.textContent;
				if( text == 'Settings' )
				{
					let panels	= Array.from( doc.querySelectorAll('.voice-settings li[aria-selected="false"]>div') );
					let history	= panels.find( i=>i.textContent == 'History' ); 

					if( history )
					{
						history.click();
						return; 
					}
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

			if( divSettings )
			{
				let text = divSettings.textContent;
				if( text == 'History' )
				{
					let panels		= Array.from( doc.querySelectorAll('.voice-settings li[aria-selected="false"]>div') );
					let settings	= panels.find( i=>i.textContent == 'Settings' ); 

					if( settings )
					{
						settings.click();
						return; 
					}
				}
			}
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
		var historyAnchor = doc.querySelector('li.tab-history span:nth-child(2)');
	
		if( one )
		{
			doc.querySelector('.c-pagination.center button[value="2"]').click();
		}
		else if( first )
	    {
		    first.click();
		}
	    else if( historyAnchor )
		{
			historyAnchor.click();
		}
		else
	    {
	        window.location.reload( true );
	    }
	},15*60000);
	
	var interval_id3 = setInterval(()=>
	{
	    window.location.reload( true );
	},3600000);
}
