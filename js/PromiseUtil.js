class PromiseUtil
{
	static runSequential( array ,generator )
	{
		var response	= new Array(array.length);

		var lambda = ( i )=>
		{
			if( i === (array.length - 1) )
			{
				return generator(array[i], i).then((result)=>
				{
					response[ i ] = result;
					return Promise.resolve( response );
				});
			}

			return generator( array[i], i).then((result)=>
			{
				response[ i ] = result;
				return lambda( i+1 );
			});
		};

		return lambda( 0 );
	}

	static runUntilFirstResolve( array, generator, index )
	{
		var i = typeof index === "undefined"? 0 : index;
		if( i > array.length-1 )
		{
			return Promise.reject('No resolved values found');
		}

		return generator( array[ i ], i).then((response)=>
		{
			return Promise.resolve( response );
		})
		.catch((reason)=>
		{
			return this.runUntilFirstResolve( array, generator, i+1 );
		});
	}


	static runAtMax( array, generator, max )
	{
		var results = new Array( array.length );
		var taskers	= new Array( max );

		var indexes	= array.reduce((prev,curr,index)=>
		{
			prev.push(index);
			return prev;
		},[]);

		var tasker = ()=>
		{
			var index =  indexes.pop();

			if( typeof index === 'undefined' )
			{
				return Promise.resolve(true);
			}

			return generator(array[index],index).then
			(
				(value)=>
				{
					results[index] = value;
					return tasker();
				}
				,(reason)=>
				{
					return Promise.reject( reason );
				}
			);
		};

		for(var i=0;i<max;i++)
		{
			taskers[i] = tasker();
		}

		return Promise.all( taskers ).then
		(
		 	value	=>{ return Promise.resolve( results ); }
			,reason =>{ return Promise.reject( reason ); }
		);
	}

	static all( object )
	{
		var promises	= [];
		var index		= [];

		for( var i in object )
		{
			index.push( i );
			promises.push( object[ i ] );
		}

		return new Promise((resolve,reject)=>
		{
			Promise.all( promises ).then
			(
			 	(values)=>
				{
					var obj = {};
					for(var i=0;i<values.length;i++)
					{
						obj[ index[ i ] ] = values [ i ];
					}

					resolve( obj );
				},
				(reason)=>
				{
					reject( reason );
				}
			);
		});
	}

	static resolveAfter(milliseconds, value )
	{
		return new Promise((resolve, reject)=>
		{
			setTimeout(()=>{ resolve( value ); }, milliseconds );
		});
	}

	static rejectAfter(milliseconds, value )
	{
		return new Promise((resolve, reject)=>
		{
			setTimeout(()=>{ reject( value ); }, milliseconds );
		});
	}
}

