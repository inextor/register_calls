
if( !Document.prototype.get )
{
	Document.prototype.get = function(id)
	{
		return this.getElementById( id );
	};
}

if( !Document.prototype.query  )
{
	Document.prototype.query = function(selector)
	{
		return this.querySelector( selector );
	};
}

if( !Document.prototype.queryAll  )
{
	Document.prototype.query = function(selector)
	{
		return this.querySelectorAll( selector );
	};
}



if( !Element.prototype.query  )
{
	Element.prototype.query = function(selector)
	{
		return this.querySelector( selector );
	};
}

if( !Element.prototype.queryAll  )
{
	Element.prototype.query = function(selector)
	{
		return this.querySelectorAll( selector );
	};
}


if( !Element.prototype.addClass )
{
	Element.prototype.addClass = function()
	{
		var args = Array.from( arguments );
		this.classList.add.apply( this.classList, args );
	};
}

if( !Element.prototype.removeClass )
{
	Element.prototype.removeClass= function()
	{
		var args = Array.from( arguments );
		this.classList.remove.apply(this.classList, args );
	};
}

if( !Element.prototype.toggleClass )
{
	Element.prototype.toggleClass= function()
	{
		var args = Array.from( arguments );
		this.classList.toggle.apply(this.classList, args );
	};
}

if( !Element.prototype.containsClass)
{
	Element.prototype.containsClass = function(str)
	{
		return this.classList.contains( str );
	};
}

if( !Element.prototype.on )
{
	Element.prototype.on = function(type,callback,options)
	{
		var args = Array.from( arguments );
		var opt = typeof options === "undefined" ? false : options;
		this.addEventListener( type,callback, options );
	};
}


