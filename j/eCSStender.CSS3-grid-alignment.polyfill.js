(function(e){
	
	if ( typeof e == 'undefined' ){ return; }
	
	var
	UNDEFINED,
	NULL		= null,
	TRUE		= true,
	FALSE		= false,
	WINDOW		= window,
	DOCUMENT	= document,
	DOCELMT		= DOCUMENT.documentElement,
	
	PROPERTY	= 'property',
	MOZ			= '-moz-',
	MS			= '-ms-',
	OPERA		= '-o-',
	WEBKIT		= '-webkit-',
	SPACE		= ' ',
	PERIOD		= '.',
	COLON		= ':',
	SEMICOL		= ';',
	OPEN_CURLY  = '{',
	CLOSE_CURLY = '}',
	HYPHEN		= '-',
	EMPTY		= '',
	AUTO		= 'auto',
	NONE		= 'none',
	DISPLAY		= 'display',
	POSITION	= 'position',
	RELATIVE	= 'relative',
	STATIC		= 'static',
	ABSOLUTE	= 'absolute',
	WIDTH		= 'width',
	HEIGHT		= 'height',
	PADDING		= 'padding',
	MARGIN		= 'margin',
	BORDER		= 'border',
	STYLE		= '-style',
	TOP			= 'top',
	BOTTOM		= 'bottom',
	LEFT		= 'left',
	RIGHT		= 'right',
	MIN			= 'min-',
	MAX			= 'max-',
	PX			= 'px',
	EM			= 'em',
	PERCENT		= '%',
	REM			= 'rem',
	FR			= 'fr',
	CONTENTBOX	= 'content-box',
	PADDINGBOX	= 'padding-box',
	STRETCH		= 'stretch',
	
	// properties, etc.
	GRID				= 'grid',
	INLINEGRID			= 'inline-grid',
	GRIDCOLUMNS			= 'grid-columns',
	GRIDCOLUMN			= 'grid-column',
	GRIDCOLUMNSPAN		= 'grid-column-span',
	GRIDCOLUMNALIGN		= 'grid-column-align',
	GRIDROWS 			= 'grid-rows',
	GRIDROW				= 'grid-row',
	GRIDROWSPAN			= 'grid-row-span',
	GRIDROWALIGN		= 'grid-row-align',
	BOXSIZING			= 'box-sizing',
	BLOCKPROGRESSION	= 'block-progression',

	precision					= 0, // decimal places
	agentTruncatesLayoutLengths	= TRUE,

	regexSpaces = /\s+/,
	div			= document.createElement('div'),
	intrinsicSizeCalculatorElement			= NULL,
	intrinsicSizeCalculatorElementParent	= NULL,
	
	calculatorOperationEnum	= {
		minWidth: {},
		maxWidth: {},
		minHeight: {},
		maxHeight: {},
		shrinkToFit: {}
	},
	gridTrackValueEnum = {
		  auto: { keyword: AUTO },
		  minContent: { keyword: 'min-content' },
		  maxContent: { keyword: 'max-content' },
		  fitContent: { keyword: 'fit-content' },
		  minmax: { keyword: 'minmax' }
	},
	gridAlignEnum = {
		  stretch: { keyword: STRETCH },
		  start: { keyword: 'start' },
		  end: { keyword: 'end' },
		  center: { keyword: 'center' }
	},
	positionEnum = {
		  "static": { keyword: STATIC },
		  relative: { keyword: RELATIVE },
		  absolute: { keyword: ABSOLUTE },
		  fixed: { keyword: 'fixed' }
	},
	blockProgressionEnum = {
		  tb: { keyword: 'tb' },
		  bt: { keyword: 'bt' },
		  lr: { keyword: 'lr' },
		  rl: { keyword: 'rl' }
	},
	borderWidths = {
		  thin:		0,
		  medium:	0,
		  thick:	0
	},
	sizingTypeEnum = {
		  valueAndUnit: {},
		  keyword: {}
	},
	
	// aliasing eCSStender's built-ins
	getCSSValue				= e.getCSSValue;

	String.prototype.contains = function( str )
	{
		return ( this.indexOf(str) != -1 );
	};
	
	function defined( test )
	{
		return test != UNDEFINED;
	}
	
	function createBoundedWrapper( object, method )
	{
	  return function() {
	    return method.apply(object, arguments);
	  };
	}
	
	function WidthAndHeight()
	{
		this.width	= NULL;
		this.height = NULL;
	}
	
	function CSSValueAndUnit()
	{
		this.value	= NULL;
		this.unit	= NULL;
	}
	
	window.CSSGridAlignment = function( element, selector, properties, media, grid_items )
	{
		this.gridElement				= element;
		this.selector					= selector;
		this.properties					= properties;
		this.media						= media;
		this.grid_items					= grid_items;
		this.blockProgression			= this.blockProgressionStringToEnum(
											getCSSValue( element, BLOCKPROGRESSION )
										  );
		this.availableSpaceForColumns	= NULL;
		this.availableSpaceForRows		= NULL;
		this.items						= NULL;
		this.columnTrackManager			= new TrackManager();
		this.rowTrackManager			= new TrackManager();
		this.useAlternateFractionalSizingForColumns = FALSE;
		this.useAlternateFractionalSizingForRows	= FALSE;
		
		this.setup();
	};
	CSSGridAlignment.prototype = {
		setup: function()
		{
			var
			gridElement = this.gridElement,
			gridCols	= this.properties[GRIDCOLUMNS] || NONE,
			gridRows	= this.properties[GRIDROWS] || NONE;

			// Get the available space for the grid since it is required
			// for determining track sizes for auto/fit-content/minmax 
			// and fractional tracks.
			this.determineGridAvailableSpace();

			// console.log( "Grid element content available space: columns = " + 
			//			 this.availableSpaceForColumns.getPixelValueString() + "; rows = " +
			//			 this.availableSpaceForRows.getPixelValueString() );

			PropertyParser.parseGridTracksString( gridCols, this.columnTrackManager );
			PropertyParser.parseGridTracksString( gridRows, this.rowTrackManager );

			this.mapGridItemsToTracks();
			this.saveItemPositioningTypes();

			this.determineTrackSizes( WIDTH );
			this.determineTrackSizes( HEIGHT );

			this.calculateGridItemShrinkToFitSizes();

			this.determineBorderWidths();

			//this.verifyGridItemSizes();
			//this.verifyGridItemPositions(gridObject);

			this.layout();
		},
		layout: function()
		{
			// console.log('laying out now');
			var
			items		= this.items,
			i			= items.length,
			item, details, position, dimensions,
			styles		= EMPTY,
			gridstyles	= EMPTY,
			height		= 0,
			width		= 0,
			rows		= this.rowTrackManager.tracks,
			cols		= this.columnTrackManager.tracks;

			while ( i-- )
			{
				item		= items[i];
				details		= item.styles;
				newclass	= e.makeUniqueClass();
				e.addClass( item.itemElement, newclass );
				position	= this.getPosition( item );
				dimensions	= this.getDimensions( item );
				styles += details.selector + PERIOD + newclass + OPEN_CURLY + POSITION + COLON + ABSOLUTE + SEMICOL;
				styles += TOP + COLON + position.top + SEMICOL;
				styles += LEFT + COLON + position.left + SEMICOL;
				styles += WIDTH + COLON + dimensions.width + PX + SEMICOL;
				styles += HEIGHT + COLON + dimensions.height + PX + SEMICOL;
				styles += CLOSE_CURLY;
			}

			if ( getCSSValue( this.gridElement, POSITION ) == STATIC )
			{
				gridstyles += POSITION + COLON + RELATIVE + SEMICOL;
			}
			i = rows.length;
			while ( i-- )
			{
				height += rows[i].measure.getRawMeasure();	
			}
			gridstyles += HEIGHT + COLON + height + PX + SEMICOL;
			i = cols.length;
			while ( i-- )
			{
				width += cols[i].measure.getRawMeasure();
			}
			gridstyles += WIDTH + COLON + width + PX + SEMICOL;
			styles += this.selector + OPEN_CURLY + gridstyles + CLOSE_CURLY;

			// console.log(styles);
			e.embedCSS( styles, this.media );
		},
		determineBorderWidths: function()
		{
			var
			el		= div.cloneNode(FALSE),
			border	= BORDER + HYPHEN + RIGHT,
			width, size;
			DOCUMENT.body.appendChild( el );
			el.style.width = '100px';
			width = parseInt( el.offsetWidth, 10 );
			for ( size in borderWidths )
			{
				if ( e.isInheritedProperty( borderWidths, size ) ){ continue; }
				el.style[border]	= size + ' solid';
				borderWidths[size]	= parseInt( el.offsetWidth, 10 ) - width;
			}
		},
		getPosition: function( item )
		{
			var
			col	= item.column - 1,
			row	= item.row - 1,
			pos	= {
				top:	0,
				left:	0
			};
			while ( col-- )
			{
				pos.left += this.columnTrackManager.tracks[col].measure.internalMeasure;
			}
			while ( row-- )
			{
				pos.top += this.rowTrackManager.tracks[row].measure.internalMeasure;
			}

			pos.left += PX;
			pos.top += PX;
			return pos;
		},
		getDimensions: function( item )
		{
			var
			dimensions	= item.shrinkToFitSize,
			element		= item.itemElement,
			margins = {}, padding = {}, borders = {},
			sides		= [TOP,RIGHT,BOTTOM,LEFT],
			s			= sides.length;
			dimensions	= {
				height:	dimensions.height.getRawMeasure(),
				width:	dimensions.width.getRawMeasure()
			};
			while ( s-- )
			{
				margins[sides[s]] = LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + sides[s] );
				padding[sides[s]] = LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + sides[s] );
				borders[sides[s]] = LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + sides[s] + HYPHEN + WIDTH );
			}
			dimensions.height -= ( margins.top.getRawMeasure() + margins.bottom.getRawMeasure() +
			 					   padding.top.getRawMeasure() + padding.bottom.getRawMeasure() +
			 					   borders.top.getRawMeasure() + borders.bottom.getRawMeasure() );
			dimensions.width -= ( margins.left.getRawMeasure() + margins.right.getRawMeasure() +
			 					  padding.left.getRawMeasure() + padding.right.getRawMeasure() + 
								  borders.left.getRawMeasure() + borders.right.getRawMeasure() );
			return dimensions;
		},
		/* Determines the available space for the grid by:
		 * 1. Swapping in a dummy block|inline-block element where the grid 
		 *    element was with one fractionally sized column and one fractionally sized row,
		 *    causing it to take up all available space.
		 *    a. If getting the cascaded (not used) style is possible (IE only),
		 * 		 copy the same width/height/box-sizing values to ensure the available
		 *	 	 space takes into account explicit constraints.
		 * 2. Querying for the used widths/heights
		 * 3. Swapping back the real grid element
		 * Yes, this depends on the dummy block|inline-block sizing to work correctly.
		 **/
		determineGridAvailableSpace: function()
		{
			var
			gridElement			= this.gridElement,
			dummy				= gridElement.cloneNode(FALSE),
			gridProperties		= this.properties,
			gridElementParent	= gridElement.parentNode,
			isInlineGrid,
			zero	= '0px',
			sides	= [TOP,RIGHT,BOTTOM,LEFT],
			s		= sides.length,
			margins = {}, padding = {}, borders = {}, innerHTML, width, height, floated,
			widthToUse, heightToUse, marginToUse, borderWidthToUse, borderStyleToUse, paddingToUse,
			cssText, scrollWidth, scrollHeight, removedElement,
			widthAdjustment, heightAdjustment, widthMeasure, heightMeasure, widthAdjustmentMeasure, heightAdjustmentMeasure;
			
			// we need to get grid props from the passed styles
			isInlineGrid = gridProperties.display === INLINEGRID ? TRUE : FALSE;
			
			// Get each individual margin, border, and padding value for
			// using with calc() when specifying the width/height of the dummy element.
			while ( s-- )
			{
				margins[sides[s]] = LayoutMeasure.measureFromStyleProperty( gridElement, MARGIN + HYPHEN + sides[s] );
				padding[sides[s]] = LayoutMeasure.measureFromStyleProperty( gridElement, PADDING + HYPHEN + sides[s] );
				borders[sides[s]] = LayoutMeasure.measureFromStyleProperty( gridElement, BORDER + HYPHEN + sides[s] + HYPHEN + WIDTH );
			}

			// If the grid has an explicit width and/or height, that determines the available space for the tracks.
			// If there is none, we need to use alternate fractional sizing. The exception is if we are a non-inline grid;
			// in that case, we are a block element and take up all available width.
			// TODO: ensure we do the right thing for floats.
			// need to remove the content to ensure we get the right height
			gridElementParent.insertBefore( dummy, gridElement );
			width	= getCSSValue( dummy, WIDTH );
			floated	= getCSSValue( gridElement, 'float' );
			if ( width == zero ){ width = AUTO; }
			if ( width == AUTO &&
			 	 ( isInlineGrid ||
				   floated === LEFT ||
				   floated === RIGHT ) )
			{
				this.useAlternateFractionalSizingForColumns = TRUE;
			}
			height = getCSSValue( dummy, HEIGHT );
			if ( height == zero ){ height = AUTO; }
			if ( height == AUTO )
			{
				this.useAlternateFractionalSizingForRows = TRUE;
			}
			// remove the dummy
			gridElementParent.removeChild( dummy );

			// build the straw man for getting dimensions
			dummy = document.createElement( gridElement.tagName );
			widthToUse	= width !== AUTO	? width
											: this.determineSize( WIDTH, margins, padding, borders ) + PX;
			heightToUse = height !== AUTO ? height
											: this.determineSize( HEIGHT, margins, padding, borders ) + PX;
			cssText = DISPLAY + COLON + ( ! isInlineGrid ? "block" : "inline-block" ) + SEMICOL
					+ MARGIN + COLON + getCSSValue( gridElement, MARGIN ) + SEMICOL
					+ BORDER + HYPHEN + WIDTH + COLON + getCSSValue( gridElement, BORDER + HYPHEN + WIDTH ) + SEMICOL
					+ PADDING + COLON + getCSSValue( gridElement, PADDING ) + SEMICOL
					+ BORDER + STYLE + COLON + getCSSValue( gridElement, BORDER + STYLE ) + SEMICOL
					+ WIDTH + COLON + widthToUse + SEMICOL
					+ HEIGHT + COLON + heightToUse + SEMICOL
					+ BOXSIZING + COLON + getCSSValue( gridElement, BOXSIZING ) + SEMICOL
					+ MIN + WIDTH + COLON + getCSSValue( gridElement, MIN + WIDTH ) + SEMICOL
					+ MIN + HEIGHT + COLON + getCSSValue( gridElement, MIN + HEIGHT ) + SEMICOL
					+ MAX + WIDTH + COLON + getCSSValue( gridElement, MAX + WIDTH ) + SEMICOL
					+ MAX + HEIGHT + COLON + getCSSValue( gridElement, MAX + HEIGHT ) + SEMICOL;
			dummy.style.cssText = cssText;

			// Determine width/height (if any) of scrollbars are showing with the grid element on the page.
			scrollWidth		= this.verticalScrollbarWidth();
			scrollHeight	= this.horizontalScrollbarHeight();

			// Insert before the real grid element.
			gridElementParent.insertBefore(dummy, gridElement);

			// Remove the real grid element.
			removedElement = gridElementParent.removeChild(gridElement);

			// The dummy item should never add scrollbars if the grid element didn't.
			widthAdjustment			= width !== AUTO ? 0 : scrollWidth - this.verticalScrollbarWidth();
			heightAdjustment		= height !== AUTO ? 0 : scrollHeight - this.horizontalScrollbarHeight();
			// get the final measurements
			widthMeasure			= LayoutMeasure.measureFromStyleProperty( dummy, WIDTH );
			heightMeasure			= LayoutMeasure.measureFromStyleProperty( dummy, HEIGHT );
			widthAdjustmentMeasure	= LayoutMeasure.measureFromPx( widthAdjustment );
			heightAdjustmentMeasure	= LayoutMeasure.measureFromPx( heightAdjustment );

			// Get the content width/height; this is the available space for tracks and grid items to be placed in.
			if ( ! this.shouldSwapWidthAndHeight() )
			{
				this.availableSpaceForColumns	= widthMeasure.subtract(widthAdjustmentMeasure);
				this.availableSpaceForRows		= heightMeasure.subtract(heightAdjustmentMeasure);
			}
			else
			{
				this.availableSpaceForColumns	= heightMeasure.subtract(heightAdjustmentMeasure);
				this.availableSpaceForRows		= widthMeasure.subtract(widthAdjustmentMeasure);
			}
			
			// Restore the DOM.
			gridElementParent.insertBefore( removedElement, dummy );
			gridElementParent.removeChild( dummy );
		},
		determineSize: function ( dimension, margins, padding, borders )
		{
			var
			parent	= this.gridElement.parentNode,
			one		= dimension == WIDTH ? LEFT : TOP,
			two		= dimension == WIDTH ? RIGHT : BOTTOM,
			size	= dimension == WIDTH ? parent.offsetWidth : parent.offsetHeight,
			border1	= LayoutMeasure.measureFromStyleProperty( parent, BORDER + HYPHEN + one + HYPHEN + WIDTH ),
			border2 = LayoutMeasure.measureFromStyleProperty( parent, BORDER + HYPHEN + two + HYPHEN + WIDTH ),
			padd1	= LayoutMeasure.measureFromStyleProperty( parent, PADDING + HYPHEN + one ),
			padd2	= LayoutMeasure.measureFromStyleProperty( parent, PADDING + HYPHEN + two );
			size -= ( border1.getRawMeasure() + border2.getRawMeasure() +
					  padd1.getRawMeasure() + padd2.getRawMeasure() +
					  margins[one].getRawMeasure() + margins[two].getRawMeasure() +
					  borders[one].getRawMeasure() + borders[two].getRawMeasure() +
					  padding[one].getRawMeasure() + padding[two].getRawMeasure() );
			return size;
		},
		verticalScrollbarWidth: function()
		{
			return ( self.innerWidth - DOCELMT.clientWidth );
		},
		horizontalScrollbarHeight: function()
		{
			return ( self.innerHeight - DOCELMT.clientHeight );
		},
		mapGridItemsToTracks: function ()
		{
			var
			items	= [],
			i		= this.grid_items.length,
			curItem, column, columnSpan, row, rowSpan,
			columnAlignString, columnAlign, rowAlignString, rowAlign,
			boxSizing, newItem, firstColumn, lastColumn, firstRow, lastRow;

			while ( i-- )
			{
				curItem = this.grid_items[i];

				column	= parseInt( curItem.details.properties[GRIDCOLUMN], 10 );
				if ( isNaN(column) )
				{
					this.error = TRUE;
					// console.log("column is NaN");
					column = 1;
				}

				columnSpan = parseInt( curItem.details.properties[GRIDCOLUMNSPAN], 10 );
				if ( isNaN(columnSpan) )
				{
					this.error = TRUE;
					// console.log("column-span is NaN");
					columnSpan = 1;
				}

				row = parseInt( curItem.details.properties[GRIDROW], 10 );
				if ( isNaN(row) )
				{
					this.error = TRUE;
					// console.log("row is NaN");
					row = 1;
				}

				rowSpan = parseInt( curItem.details.properties[GRIDROWSPAN], 10 );
				if ( isNaN(rowSpan) )
				{
					this.error = TRUE;
					// console.log("row-span is NaN");
					rowSpan = 1;
				}

				columnAlignString = curItem.details.properties[GRIDCOLUMNALIGN] || EMPTY;
				if ( columnAlignString.length === 0 )
				{
					this.error = TRUE;
					// console.log("getPropertyValue for " + GRIDCOLUMNALIGN + " is an empty string");
				}
				columnAlign = this.gridAlignStringToEnum(columnAlignString);

				rowAlignString = curItem.details.properties[GRIDROWALIGN] || EMPTY;
				if ( rowAlignString.length === 0 )
				{
					this.error = TRUE;
					// console.log("getPropertyValue for " + GRIDROWALIGN + " is an empty string");
				}
				rowAlign = this.gridAlignStringToEnum(rowAlignString);

				// TODO: handle directionality. These properties are physical; we probably need to map them to logical values.
				boxSizing = getCSSValue( curItem.element, BOXSIZING );

				newItem				= new Item();
				newItem.itemElement	= curItem.element;
				newItem.styles		= curItem.details;
				newItem.column		= column;
				newItem.columnSpan	= columnSpan;
				newItem.columnAlign	= columnAlign;
				newItem.row			= row;
				newItem.rowSpan		= rowSpan;
				newItem.rowAlign	= rowAlign;

				firstColumn			= newItem.column;
				lastColumn			= firstColumn + newItem.columnSpan - 1;
				firstRow			= newItem.row;
				lastRow				= firstRow + newItem.rowSpan - 1;

				// Ensure implicit track definitions exist for all tracks this item spans.
				this.ensureTracksExist( this.columnTrackManager, firstColumn, lastColumn );
				this.ensureTracksExist( this.rowTrackManager, firstRow, lastRow );

				// place the items as appropriate
				this.addItemToTracks( this.columnTrackManager, newItem, firstColumn, lastColumn );
				this.addItemToTracks( this.rowTrackManager, newItem, firstRow, lastRow );

				items.push(newItem);
			}
			this.items = items;
		},
		gridAlignStringToEnum: function ( alignString )
		{
			switch ( alignString )
			{
				case gridAlignEnum.start.keyword:
					return gridAlignEnum.start;
				case gridAlignEnum.end.keyword:
					return gridAlignEnum.end;
				case gridAlignEnum.center.keyword:
					return gridAlignEnum.center;
				// default
				case gridAlignEnum.stretch.keyword:
				case NULL:
				case EMPTY:
					return gridAlignEnum.stretch;
				default:
					// console.log("unknown grid align string: " + alignString);
			}
		},
		positionStringToEnum: function ( positionString )
		{
			switch ( positionString )
			{
				case positionEnum.relative.keyword:
					return positionEnum.relative;
				case positionEnum.absolute.keyword:
					return positionEnum.absolute;
				case positionEnum.fixed.keyword:
					return positionEnum.fixed;
				 // default
				case positionEnum[STATIC].keyword:
				case NULL:
				case EMPTY:
					return positionEnum[STATIC];
				default:
					// console.log("unknown position string: " + positionString);
			}
		},
		blockProgressionStringToEnum: function (positionString)
		{
			switch ( positionString )
			{
				// default
				case blockProgressionEnum.tb.keyword:
				case NULL:
				case EMPTY:
					return blockProgressionEnum.tb;
				case blockProgressionEnum.bt.keyword:
					return blockProgressionEnum.bt;
				case blockProgressionEnum.lr.keyword:
					return blockProgressionEnum.lr;
				case blockProgressionEnum.rl.keyword:
					return blockProgressionEnum.rl;
				default:
					// console.log("unknown block-progression string: " + positionString);
			}
		},
		gridTrackValueStringToEnum: function (trackValueString)
		{
			switch (trackValueString)
			{
				case gridTrackValueEnum.auto.keyword:
					return gridTrackValueEnum.auto;
				case gridTrackValueEnum.minContent.keyword:
					return gridTrackValueEnum.minContent;
				case gridTrackValueEnum.maxContent.keyword:
					return gridTrackValueEnum.maxContent;
				case gridTrackValueEnum.fitContent.keyword:
					return gridTrackValueEnum.fitContent;
				default:
					// console.log("unknown grid track string: " + trackValueString);
			}
		},
		// Creates track objects for implicit tracks if needed.
		ensureTracksExist: function ( trackManager, firstTrackNumber, lastTrackNumber )
		{
			/* TODO: we need a better data structure for tracks created by spans.
			 * If a grid item has a really high span value,
			 * we currently end up creating implicit tracks for every one of the
			 * implicit tracks (span 100000=>100000 tracks created).
			 * Instead, a single track object should be able to represent multiple
			 * implicit tracks. The number of implicit tracks it represents would 
			 * be used during the track sizing algorithm when redistributing space
			 * among each of the tracks to ensure it gets the right proportional amount.
			 **/
			trackManager.ensureTracksExist( firstTrackNumber, lastTrackNumber );
		},
		// Traverses all tracks that the item belongs to and adds a reference to it in each of the track objects.
		addItemToTracks: function (trackManager, itemToAdd, firstTrackNumber, lastTrackNumber)
		{
			var
			i					= 0,
			tracks				= trackManager.tracks.length,
			implicitTrackIndex	= 0,
			implicitTracks		= trackManager.implicitTracks;

			for ( ; i < tracks; i++)
			{
				if ( trackManager.tracks[i].number === firstTrackNumber )
				{
					trackManager.tracks[i].items.push(itemToAdd);
				}
				else if ( trackManager.tracks[i].number > firstTrackNumber )
				{
					break;
				}
			}
			// TODO: check if we can remove this.
			for ( ; implicitTrackIndex < implicitTracks; implicitTrackIndex++ )
			{
				if ( firstTrackNumber >= trackManager.implicitTracks[implicitTrackIndex].firstNumber &&
					 lastTrackNumber <= trackManager.implicitTracks[implicitTrackIndex].length )
				{
					trackManager.implicitTracks[implicitTrackIndex].items.push(itemToAdd);
				}
			}
		},
		saveItemPositioningTypes: function()
		{
			// console.log('saving positioning types');
			var
			items	= this.items,
			i		= items.length;
			while ( i-- )
			{
				if ( items[i].position === NULL )
				{
					items[i].position	= this.positionStringToEnum( getCSSValue( items[i].itemElement, POSITION ) );
				}
			}
		},
		/* Determines track sizes using the algorithm from sections 9.1 and 9.2 of the W3C spec.
		 * Rules:
		 *   1. If it's a defined length, that is the track size.
		 * 	 2. If it's a keyword, its sizing is based on its content. 
		 * 		Iterate over the items in the track to attempt to determine the size of the track.
		 * TODO: handle percentages
		 **/
		determineTrackSizes: function ( lengthPropertyName )
		{
			var
			computingColumns				= ( lengthPropertyName.toLowerCase() === WIDTH ),
			trackManager					= computingColumns	? this.columnTrackManager : this.rowTrackManager,
			availableSpace					= computingColumns	? this.availableSpaceForColumns : this.availableSpaceForRows,
			useAlternateFractionalSizing	= computingColumns	? this.useAlternateFractionalSizingForColumns
																: this.useAlternateFractionalSizingForRows,
			// Keep track of spans which could affect track sizing later.
			spans					= [],
			autoTracks				= [],
			fractionalTracks		= [],
			respectAvailableLength	= TRUE,
			iter					= trackManager.getIterator(),
			curTrack				= iter.next(),
			curSize, sizingAlternateFraction, i, iLen, curItem, minItemMeasure, maxCellMeasure,
			actualMeasure, remainingSpace, autoTrackIndex, autoTrackLength, trackShareOfSpace,
			curSpanningItem, firstTrack, numSpanned, sumOfTrackMeasures, measureSpanCanGrow,
			sumOfFractions, oneFractionMeasure, totalMeasureToAdd,
			lastNormalizedFractionalMeasure, accumulatedFactors, accumulatedFactorsInDistributionSet,
			normalizedDelta, j, spaceToDistribute, sortFunc;
			
			if ( useAlternateFractionalSizing &&
				 availableSpace.getRawMeasure() == 0 )
			{
				// Assume we have as much space as we want.
				respectAvailableLength = FALSE;
			}

			// 9.1.1/9.2.1: [Columns|Widths] are initialized to their minimum [widths|heights].
			while ( curTrack !== NULL )
			{
				if ( curTrack.sizingType !== sizingTypeEnum.keyword &&
					 curTrack.sizingType !== sizingTypeEnum.valueAndUnit )
				{
					 // console.log("Unknown grid track sizing type");
				}

				// TODO: add support for minmax (M3)
				curTrack.measure		= LayoutMeasure.zero();
				curTrack.minMeasure		= LayoutMeasure.zero();
				curTrack.maxMeasure		= LayoutMeasure.zero();
				sizingAlternateFraction	= ( useAlternateFractionalSizing && this.trackIsFractionSized(curTrack) );

				if ( curTrack.sizingType === sizingTypeEnum.keyword ||
					 sizingAlternateFraction )
				{
					curSize	= curTrack.size;

					if ( curSize !== gridTrackValueEnum.fitContent &&
						 curSize !== gridTrackValueEnum.minContent &&
						 curSize !== gridTrackValueEnum.maxContent &&
						 curSize !== gridTrackValueEnum.auto &&
						 ! sizingAlternateFraction )
					{
						// console.log("Unknown grid track sizing value " + curSize.keyword);
					}
					if ( ! sizingAlternateFraction )
					{
						curTrack.contentSizedTrack = TRUE;
					}

					for ( i = 0, iLen = curTrack.items.length; i < iLen; i++ )
					{
						curItem = curTrack.items[i];

						if ( curItem.position !== positionEnum[STATIC] &&
						 	 curItem.position !== positionEnum.relative )
						{
							// Only position: static and position: relative items contribute to track size.
							continue;
						}

						// 9.1.a.i/9.2.a.i: Spanning elements are ignored to avoid premature growth of [columns|rows].
						if ( ( computingColumns ? curItem.columnSpan : curItem.rowSpan ) > 1 )
						{
							// This is a span; determine and save its max width or height for use later in the track sizing algorithm.
							if ( curItem.maxWidthMeasure === NULL )
							{
								if ( computingColumns )
								{
									curItem.maxWidthMeasure = IntrinsicSizeCalculator
																.calcMaxWidth(curItem.itemElement);
								}
								else
								{
									curItem.maxHeightMeasure = IntrinsicSizeCalculator
																.calcMaxHeight( curItem.itemElement, curItem.usedWidthMeasure );
								}
							}
							if ( curSize === gridTrackValueEnum.fitContent ||
								 curSize === gridTrackValueEnum.auto )
							{
								/* Only keep track of this span if we found it in a non-fixed size track.
								 * Note: we are adding the span multiple times for each track but the 
								 * sizing algorithm will be unaffected by trying to
								 * process the same span multiple times.
								 **/
								spans.push(curItem);
							}
						}
						// Not a span. Let's size the track.
						else
						{
							if ( ! sizingAlternateFraction && 
								 ( curSize === gridTrackValueEnum.minContent ||
								   curSize === gridTrackValueEnum.fitContent ||
								   curSize === gridTrackValueEnum.auto ) )
							{
								if ( computingColumns )
								{
									minItemMeasure = IntrinsicSizeCalculator.calcMinWidth(curItem.itemElement);
								}
								else
								{
									minItemMeasure = IntrinsicSizeCalculator.calcMinHeight(curItem.itemElement, curItem.usedWidthMeasure);
								}
								if ( minItemMeasure.getRawMeasure() > curTrack.minMeasure.getRawMeasure() )
								{
									curTrack.minMeasure = minItemMeasure;
								}
							}
							// Auto sized tracks may grow to their maximum length. Determine that length up front.
							if ( sizingAlternateFraction ||
								 curSize === gridTrackValueEnum.maxContent ||
								 curSize === gridTrackValueEnum.auto )
							{
								if ( computingColumns )
								{
									maxCellMeasure = IntrinsicSizeCalculator.calcMaxWidth(curItem.itemElement);
								}
								else
								{
									maxCellMeasure = IntrinsicSizeCalculator.calcMaxHeight(curItem.itemElement, curItem.usedWidthMeasure);
								}
								if ( maxCellMeasure.getRawMeasure() > curTrack.maxMeasure.getRawMeasure() )
								{
									curTrack.maxMeasure = maxCellMeasure;
								}
							}
						}
					}
					/* Note: for content sized tracks, the layout engine may be using more than 1px precision.
					 * To ensure we match the layout engine's rounded result, we will get the actual track length
					 * and compare against our calculated length. If it is within 1px, we will assume that it is correct.
					 **/
					// console.log( 'dealing with content-sized tracks now' );
					switch ( curSize )
					{
						case gridTrackValueEnum.maxContent:
							actualMeasure = this.getActualTrackMeasure( trackNum, computingColumns );
							if ( actualMeasure.equals( curTrack.maxMeasure ) !== TRUE )
							{
								// Not an error; we will catch the problem later when we verify grid items.
								// console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
								//			 ": " + "max-content length difference detected; expected = " +
								//			 curTrack.maxMeasure.getPixelValueString() + ", actual = " +
								//			 actualMeasure.getPixelValueString() );
							}
							curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure;
							break;
						case gridTrackValueEnum.minContent:
							actualMeasure = this.getActualTrackMeasure( trackNum, computingColumns );
							if ( actualMeasure.equals( curTrack.minMeasure ) !== TRUE )
							{
								// Not an error; we will catch the problem later when we verify grid items.
								// console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
								// 			 ": " + "min-content length difference detected; expected = " +
								// 			 curTrack.minMeasure.getPixelValueString() + ", actual = " +
								// 			 actualMeasure.getPixelValueString() );
							}
							curTrack.measure = curTrack.maxMeasure = curTrack.minMeasure;
							break;
						case gridTrackValueEnum.fitContent:
						case gridTrackValueEnum.auto:
							// We can't determine at this point if we need to adjust 
							// to the actual track length since sizing isn't complete.
							curTrack.measure = curTrack.minMeasure;
					}
				}
				if ( curTrack.sizingType === sizingTypeEnum.keyword &&
					 ( curTrack.size === gridTrackValueEnum.auto ||
						 curTrack.size === gridTrackValueEnum.fitContent ) )
				{
					autoTracks.push(curTrack);
				}
				if ( curTrack.sizingType === sizingTypeEnum.valueAndUnit )
				{
					if (curTrack.size.unit === PX)
					{
						curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure = LayoutMeasure.measureFromPx(curTrack.size.value);
					}
					else if (curTrack.size.unit === FR)
					{
						// 9.1.1.b/9.2.1.b: A column with a fraction-sized minimum length is assigned a 0px minimum.
						curTrack.measure = LayoutMeasure.zero();
						fractionalTracks.push(curTrack);
						// TODO: fractional tracks should go through the max calculation for 
						// use with verifying a grid in infinite/unconstrained space.
					}
					else
					{
						// Track lengths are assumed to always be in pixels or fractions. Convert before going into this function.
						this.error = TRUE;
						// console.log("track size not converted into px!");
						// TODO: throw after we start doing conversions and don't want to ignore this anymore.
					}
				}
				curTrack = iter.next();
			}

			// 9.1.2/9.2.2: All [columns|rows] not having a fraction-sized maximum are grown from
			// their minimum to their maximum specified size until available space is exhausted.
			remainingSpace = availableSpace.subtract( this.getSumOfTrackMeasures( trackManager ) );
			if ( remainingSpace.getRawMeasure() > 0 )
			{
				sortFunc = createBoundedWrapper( this, this.compareAutoTracksAvailableGrowth );
				autoTracks.sort( sortFunc );

				for ( autoTrackIndex=0, autoTrackLength=autoTracks.length; autoTrackIndex < autoTrackLength; autoTrackIndex++ )
				{
					if ( remainingSpace.getRawMeasure() <= 0 )
					{
						break;
					}
					trackShareOfSpace = remainingSpace.divide(autoTracks.length - autoTrackIndex);

					trackShareOfSpace = LayoutMeasure
											.min(trackShareOfSpace, autoTracks[autoTrackIndex]
																		.maxMeasure
																		.subtract( autoTracks[autoTrackIndex].measure ) );
					autoTracks[autoTrackIndex].measure = autoTracks[autoTrackIndex].measure.add(trackShareOfSpace);
					remainingSpace = remainingSpace.subtract(trackShareOfSpace);
				}
			}

			/* 9.1.2.c/9.2.2.c: After all [columns|rows] (excluding those with a fractional maximum)
			 * have grown to their maximum [width|height], consider any spanning elements that could
			 * contribute to a content-based [column|row] [width|height] (minimum or maximum) and 
			 * grow equally all [columns|rows] covered by the span until available space is exhausted.
			 **/
			for ( i=0, iLen=spans.length; i < iLen && remainingSpace > 0; i++ )
			{
				curSpanningItem	= spans[i];
				firstTrack		= (computingColumns ? curSpanningItem.column : curSpanningItem.row);
				numSpanned		= (computingColumns ? curSpanningItem.columnSpan : curSpanningItem.rowSpan);

				/* 9.1.2.c.i/9.2.2.c.i. Spanning elements covering [columns|rows] with
				 * fraction-sized maximums are ignored as the fraction column "eats" all
				 * the space from the spanning element which could have caused growth 
				 * in [columns|rows] with a content-based size.
				 **/
				if ( ! trackManager.spanIsInFractionalTrack(firstTrack, numSpanned) )
				{
					continue;
				}

				sumOfTrackMeasures	= this.getSumOfSpannedTrackMeasures(trackManager, firstTrack, numSpanned);
				measureSpanCanGrow	= (computingColumns === TRUE ? curSpanningItem.maxWidthMeasure
																 : curSpanningItem.maxHeightMeasure).subtract(sumOfTrackMeasures);
				
				if ( measureSpanCanGrow.getRawMeasure() > 0 )
				{
					// Redistribute among all content-sized tracks that this span is a member of.
					tracksToGrow	= this.getContentBasedTracksThatSpanCrosses(trackManager, firstTrack, numSpanned);
					remainingSpace	= this.redistributeSpace(tracksToGrow, remainingSpace, measureSpanCanGrow);
				}
			}

			// REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
			// remainingSpace = remainingSpace
			// 						.subtract( this.adjustForTrackLengthDifferences( autoTracks, computingColumns ) );

			/* 9.1.3/9.2.3: Fraction-sized [columns|rows] are grown 
			 * from their minimum to their maximum [width|height] in 
			 * accordance with their space distribution factor until 
			 * available space is exhausted.
			 **/
			if ( fractionalTracks.length > 0 &&
				 ( remainingSpace.getRawMeasure() > 0 ||
					 useAlternateFractionalSizing ) )
			{
				if ( ! useAlternateFractionalSizing ||
					 respectAvailableLength )
				{
					// console.log("remaining space for fractional sizing = " + remainingSpace.getPixelValueString());
				}
				sortFunc = createBoundedWrapper( this, this.compareFractionTracksNormalMeasure );
				fractionalTracks.sort( sortFunc );
				sumOfFractions = 0;
				for ( i=0, iLen=fractionalTracks.length; i < iLen; i++ )
				{
					sumOfFractions += fractionalTracks[i].size.value;
				}
				oneFractionMeasure = NULL;
				if ( ! useAlternateFractionalSizing )
				{
					oneFractionMeasure = remainingSpace.divide(sumOfFractions);
				}
				else
				{
					// In alternate fractional sizing, we determine the max "1fr"
					// length based on the max-content size of the track.
					oneFractionMeasure = this.determineMeasureOfOneFractionUnconstrained(fractionalTracks);
				}

				iLen = fractionalTracks.length;
				if ( useAlternateFractionalSizing )
				{
					if ( respectAvailableLength )
					{
						// Using alternate sizing but still need to stay within the remaining space.
						// Adjust the one fraction length so that everything will fit.
						totalMeasureToAdd = LayoutMeasure.zero();
						for ( i=0; i < iLen; i++ )
						{
							totalMeasureToAdd = totalMeasureToAdd.add(oneFractionMeasure.multiply(fractionalTracks[i].size.value));
						}
						if ( totalMeasureToAdd.getRawMeasure() > remainingSpace.getRawMeasure() )
						{
							oneFractionMeasure = oneFractionMeasure.multiply(remainingSpace.divide(totalLengthToAdd.getRawMeasure()));
						}
					}
					for ( i = 0; i < iLen; i++)
					{
						fractionalTracks[i].measure = fractionalTracks[i]
														.measure
														.add( oneFractionMeasure.multiply( fractionalTracks[i].size.value ) );
					}
				}
				else if ( iLen > 0 )
				{
					lastNormalizedFractionalMeasure		= this.getNormalFractionMeasure(fractionalTracks[0]);
					accumulatedFactors					= 0;
					accumulatedFactorsInDistributionSet	= 0;
					for ( i=0; i < iLen; i++ )
					{
						if ( lastNormalizedFractionalMeasure.getRawMeasure() <
						 	 this.getNormalFractionMeasure(fractionalTracks[i]).getRawMeasure() )
						{
							accumulatedFactorsInDistributionSet = accumulatedFactors;
							normalizedDelta = this
												.getNormalFractionMeasure(fractionalTracks[i])
												.subtract(lastNormalizedFractionalMeasure);
							for ( j=0; j < i; j++ )
							{
								spaceToDistribute = 0;
								if ( accumulatedFactorsInDistributionSet > 0 )
								{
									spaceToDistribute = remainingSpace
															.multiply(fractionalTracks[j].size.value)
															.divide(accumulatedFactorsInDistributionSet);
									spaceToDistribute = LayoutMeasure
															.min(spaceToDistribute,
																 normalizedDelta.multiply(fractionalTracks[j].size.value));
									spaceToDistribute = LayoutMeasure.min(spaceToDistribute, fractionalTracks[j].maxMeasure);
								}

								fractionalTracks[j].measure 		 = fractionalColumnsArray[j].measure.add(spaceToDistribute);
								remainingSpace						-= spaceToDistribute;
								accumulatedFactorsInDistributionSet	-= fractionalTracks[j].size.value;
							}
							lastNormalizedFractionalMeasure = this.getNormalFractionMeasure(fractionalTracks[i]);
						}
						accumulatedFactors += fractionalTracks[i].size.value;
						if ( remainingSpace.getRawMeasure() <= 0 )
						{
							break;
						}
					}
					// Once all fractional tracks are in the same group, do a final pass to distribute the remaining space.
					accumulatedFactorsInDistributionSet = accumulatedFactors;
					for ( i=0; i < iLen; i++)
					{
						spaceToDistribute = 0;
						if ( accumulatedFactorsInDistributionSet > 0 )
						{
							spaceToDistribute = remainingSpace
													.multiply( fractionalTracks[i].size.value / accumulatedFactorsInDistributionSet );
							//	uncomment and scope to minmax functionality
							//spaceToDistribute = LayoutMeasure.min(spaceToDistribute, fractionalTracks[i].maxMeasure);
						}
						fractionalTracks[i].measure			 = fractionalTracks[i].measure.add(spaceToDistribute);
						remainingSpace						 = remainingSpace.subtract(spaceToDistribute);
						accumulatedFactorsInDistributionSet -= fractionalTracks[i].size.value;
					}
				}
				// REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
				// remainingSpace = remainingSpace
				// 					.subtract( this.adjustForTrackLengthDifferences( fractionalTracks, computingColumns ) );
			}
			if (computingColumns)
			{
				// Save the used widths for each of the items so that it can be used during row size resolution.
				this.saveUsedCellWidths(trackManager);
			}
		},
		// Inserts an empty grid item into a given track and gets its size.
		getActualTrackMeasure: function ( trackNumber, computingColumns )
		{
			var
			blockProgression, trackMeasure,
			gridElement	= this.gridElement,
			dummyItem	= div.cloneNode(TRUE),
			cssText		= "margin:0px;border:0px;padding:0px;"
						+ ( computingColumns ? GRIDCOLUMNALIGN : GRIDROWALIGN )
						+ COLON + STRETCH + SEMICOL
						+ ( computingColumns ? GRIDCOLUMN : GRIDROW )
						+ COLON + trackNumber + SEMICOL;
			dummyItem.style.cssText = cssText;

			dummyItem			= gridElement.appendChild(dummyItem);
			blockProgression	= this.blockProgressionStringToEnum(
									getCSSValue( this.gridElement, BLOCKPROGRESSION )
								  );
			trackMeasure		= this.usePhysicalWidths(blockProgression, computingColumns)
								? LayoutMeasure.measureFromStyleProperty( dummyItem, WIDTH )
								: LayoutMeasure.measureFromStyleProperty( dummyItem, HEIGHT );

			gridElement.removeChild(dummyItem);
			return trackMeasure;
		},
		compareAutoTracksAvailableGrowth: function ( a, b )
		{
			var
			availableGrowthA = a.maxMeasure.subtract(a.measure),
			availableGrowthB = b.maxMeasure.subtract(b.measure);
			if ( availableGrowthA.getRawMeasure() < availableGrowthB.getRawMeasure() )
			{
				return -1;
			}
			if ( availableGrowthA.getRawMeasure() > availableGrowthB.getRawMeasure() )
			{
				return 1;
			}
			return 0;
		},
		usePhysicalWidths: function ( blockProgression, verifyingColumns )
		{
			var usePhysicalWidths = FALSE;
			if ( ( ( blockProgression === blockProgressionEnum.tb ||
					 blockProgression === blockProgressionEnum.bt ) &&
					 verifyingColumns === TRUE ) ||
				 ( ( blockProgression === blockProgressionEnum.lr ||
					 blockProgression === blockProgressionEnum.rl ) &&
					 verifyingColumns === FALSE ) )
			{
				usePhysicalWidths = TRUE;
			}
			return usePhysicalWidths;
		},
		trackIsFractionSized: function ( trackToCheck )
		{
			return ( trackToCheck.sizingType === sizingTypeEnum.valueAndUnit &&
					 trackToCheck.size.unit === FR );
		},
		getSumOfTrackMeasures: function ( trackManager )
		{
			var
			sum			= LayoutMeasure.zero(),
			trackIter	= trackManager.getIterator(),
			curTrack	= trackIter.next();
			while ( curTrack !== NULL )
			{
				sum = sum.add( curTrack.measure );
				curTrack = trackIter.next();
			}
			return sum;
		},
		getSumOfSpannedTrackMeasures: function ( trackManager, firstTrackNum, numSpanned )
		{
			var
			sum		= LayoutMeasure.zero(),
			tracks	= trackManager.getTracks( firstTrackNum, firstTrackNum + numSpanned - 1 ),
			i		= tracks.length;
			while ( i-- )
			{
				sum = sum.add( tracks[i].measure );
			}
			return sum;
		},
		getNormalFractionMeasure: function ( track )
		{
			if ( ! this.trackIsFractionSized( track ) )
			{
				// console.log("getNormalFractionMeasure called for non-fraction sized track");
			}
			var frValue = track.size.value;
			return frValue === 0 ? LayoutMeasure.zero() : track.measure.divide(frValue);
		},
        compareFractionTracksNormalMeasure: function ( a, b )
		{
            var
			result					= 0,
			// Called from a sort function; can't depend on "this" object being CSSGridAlignment.
            normalFractionMeasureA	= this.getNormalFractionMeasure( a ),
			normalFractionMeasureB	= this.getNormalFractionMeasure( b );
			if ( defined( a ) &&
				 defined( b ) )
			{
	            if ( normalFractionMeasureA.getRawMeasure() < normalFractionMeasureB.getRawMeasure() )
				{
	                result = -1;
	            }
	            else if ( normalFractionMeasureA.getRawMeasure() > normalFractionMeasureB.getRawMeasure() )
				{
	                result = 1;
	            }
	            else
				{
	                if ( a.size.value > b.size.value )
					{
	                    result = -1;
	                }
	                else if ( a.size.value < b.size.value )
					{
	                    result = 1;
	                }
	            }
			}
            return result;
        },
		determineMeasureOfOneFractionUnconstrained: function ( fractionalTracks )
		{
		    // Iterate over all of the fractional tracks, 
		    var
			maxOneFractionMeasure = LayoutMeasure.zero(),
			i					  = fractionalTracks.length,
			curTrack, curFractionValue, oneFractionMeasure;
		    while ( i-- )
			{
				curTrack			= fractionalTracks[i];
				curFractionValue	= curTrack.size.value;
				oneFractionMeasure	= curTrack.maxMeasure.divide(curFractionValue);
				if ( oneFractionMeasure.getRawMeasure() > maxOneFractionMeasure.getRawMeasure() )
				{
				    maxOneFractionMeasure = oneFractionMeasure;
				}
			}
			return maxOneFractionMeasure;
		},
		saveUsedCellWidths: function ( columnTrackManager )
		{
			var
			iter		= columnTrackManager.getIterator(),
			curTrack	= iter.next(),
			i, curItem;

			while ( curTrack !== NULL )
			{
				i = curTrack.items.length;
				while ( i-- )
				{
					curItem = curTrack.items[i];
					if ( curItem.usedWidthMeasure === NULL )
					{
						curItem.usedWidthMeasure	= this.getSumOfSpannedTrackMeasures(
														columnTrackManager, curItem.column, curItem.columnSpan
													  );
					}
				}
				curTrack = iter.next();
			}
		},
		calculateGridItemShrinkToFitSizes: function()
		{
			var
			columnTrackManager	= this.columnTrackManager,
			rowTrackManager		= this.rowTrackManager,
			items				= this.items,
			i, iLen 			= items.length,
			curItem, columnsBreadth, rowsBreadth,
			swapWidthAndHeight, forcedWidth = NULL, forcedHeight = NULL;

			for ( i=0; i < iLen; i++ )
			{
				curItem = items[i];
				if ( curItem.shrinkToFitSize === NULL )
				{
					// Percentage resolution is based on the size of the cell for the grid item.
					columnsBreadth	= this.getSumOfSpannedTrackMeasures(
										this.columnTrackManager, curItem.column, curItem.columnSpan
									  );
					rowsBreadth		= this.getSumOfSpannedTrackMeasures(
										this.rowTrackManager, curItem.row, curItem.rowSpan
									  );

					// Force a stretch if requested.
					if ( curItem.position === positionEnum[STATIC] ||
						 curItem.position === positionEnum.relative )
					{
						swapWidthAndHeight = this.shouldSwapWidthAndHeight();
						if ( curItem.columnAlign === gridAlignEnum.stretch )
						{
							if ( ! swapWidthAndHeight )
							{
								forcedWidth = columnsBreadth;
							}
							else
							{
								forcedHeight = columnsBreadth;
							}
						}
						if ( curItem.rowAlign === gridAlignEnum.stretch )
						{
							if ( ! swapWidthAndHeight )
							{
								forcedHeight = rowsBreadth;
							}
							else
							{
								forcedWidth = rowsBreadth;
							}
						}
					}

					// Only calculate an intrinsic size if we're not forcing both width and height.
					if ( forcedWidth === NULL ||
						 forcedHeight === NULL )
					{
						curItem.shrinkToFitSize	= IntrinsicSizeCalculator.calcShrinkToFitWidthAndHeight(
													curItem.itemElement, columnsBreadth, rowsBreadth, forcedWidth, forcedHeight
												  );
					}
					else
					{
						curItem.shrinkToFitSize = new WidthAndHeight();
					}
					if ( forcedWidth !== NULL )
					{
						curItem.shrinkToFitSize.width = forcedWidth;
					}
					if ( forcedHeight !== NULL )
					{
						curItem.shrinkToFitSize.height = forcedHeight;
					}
				}
			}
		},
		shouldSwapWidthAndHeight: function()
		{
			return ( this.blockProgression === blockProgressionEnum.lr ||
					 this.blockProgression === blockProgressionEnum.rl );
		},
		verifyGridItemSizes: function()
		{
			this.verifyGridItemLengths( TRUE );
			this.verifyGridItemLengths( FALSE );
		},
		verifyGridItemLengths: function ( verifyingColumnBreadths )
		{
			var
			items					= this.items,
			i						= items.length,
			trackManager			= verifyingColumnBreadths ? this.columnTrackManager : this.rowTrackManager,
			blockProgression		= this.blockProgression,
			verifyingPhysicalWidths	= this.usePhysicalWidths( blockProgression, verifyingColumnBreadths ),
			dimension				= verifyingPhysicalWidths ? 'Width' : 'Height',
			curItem, curItemElement, trackNum, alignType, actualMeasure, itemId, offsetLength, offsetMeasure,
			expectedMeasure, firstTrack, trackSpan;

			// Uncomment if needed for debugging.
			//this.dumpTrackLengths(trackManager, GridTest.logger, GridTest.logger.logDebug);

			if ( verifyingColumnBreadths &&
				 ! verifyingPhysicalWidths )
			{
				// console.log("Column breadths are heights due to block-progression value '" + blockProgression.keyword + "'");
			}
			else if ( ! verifyingColumnBreadths &&
						verifyingPhysicalWidths )
			{
				// console.log("Row breadths are widths due to block-progression value '" + blockProgression.keyword + "'");
			}

			while ( i-- )
			{
				curItem			= items[i];
				curItemElement	= curItem.itemElement;

				if ( ( verifyingColumnBreadths ? curItem.verified.columnBreadth : curItem.verified.rowBreadth ) !== TRUE )
				{
					trackNum		= verifyingColumnBreadths ? curItem.column : curItem.row;
					alignType		= verifyingColumnBreadths ? curItem.columnAlign : curItem.rowAlign;
					// console.log(curItemElement.parentNode);
					// console.log(getCSSValue(curItemElement,WIDTH));
					actualMeasure	= BoxSizeCalculator['calcMarginBox'+dimension]( curItemElement );

					itemId = EMPTY;
					if ( curItem.itemElement.id.length > 0 )
					{
						itemId = "[ID = " + curItem.itemElement.id + "] ";
					}

					// Check the offsetWidth/offsetHeight to make sure it agrees.
					offsetLength	= curItem.itemElement['offset'+dimension];
					offsetMeasure	= LayoutMeasure.measureFromPx( offsetLength );
					if ( actualMeasure.getMeasureRoundedToWholePixel().equals(offsetMeasure) !== TRUE )
					{
						this.error = TRUE;
						// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + 
						//			 trackNum + ", item " + i + ": " +
						//			 "offset length doesn't agree with calculated margin box length (" +
						//			 ( verifyingPhysicalWidths ? "offsetWidth" : "offsetHeight" ) +
						//			 ": " + offsetMeasure.getPixelValueString() + "; expected (unrounded): " +
						//			 actualMeasure.getPixelValueString() );
					}


					if ( curItem.position === positionEnum.absolute )
					{
						// Use shrink-to-fit sizes.
						if ( curItem.shrinkToFitSize === NULL )
						{
							// console.log("Current item's shrink to fit size has not been calculated");
						}
						expectedMeasure = (verifyingPhysicalWidths ? curItem.shrinkToFitSize.width : curItem.shrinkToFitSize.height);
					}
					else
					{
						switch (alignType)
						{
							case gridAlignEnum.stretch:
								// Grid item's width/height should be equal to the lengths of the tracks it spans.
								firstTrack		= ( verifyingColumnBreadths ? curItem.column : curItem.row );
								trackSpan		= ( verifyingColumnBreadths ? curItem.columnSpan : curItem.rowSpan );
								expectedMeasure	= this.getSumOfSpannedTrackMeasures( trackManager, firstTrack, trackSpan );
								break;
							case gridAlignEnum.start:
							case gridAlignEnum.end:
							case gridAlignEnum.center:
								// Item uses its shrink-to-fit size.
								if (curItem.shrinkToFitSize === NULL)
								{
									// console.log("Current item's shrink to fit size has not been calculated");
								}
								// shrinkToFitSize is physical
								expectedMeasure = ( verifyingPhysicalWidths ? curItem.shrinkToFitSize.width
																			: curItem.shrinkToFitSize.height );
								break;
							default:
								// console.log("Unknown grid align type " + alignType.keyword);
						}
					}

					if ( expectedMeasure.equals(actualMeasure) !== TRUE )
					{
						// If the agent is more precise than whole pixels, and we are off 
						// by just one layout pixel (1/100th of a pixel for IE), it's close enough.
						if ( precision > 0 && Math.abs(expectedMeasure.subtract(actualMeasure).getRawMeasure()) === 1)
						{
							// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
							//			 "sizing check passed after adjustment for fuzzy error checking (alignment: " + 
							//			 alignType.keyword + "; expected: " + expectedMeasure.getPixelValueString() + 
							//			 "; actual: " + actualMeasure.getPixelValueString() + ")" );
						}
						else
						{
							this.error = TRUE;
							// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
							//			 "sizing check failed (alignment: " + alignType.keyword + "; expected: " +
							//			 expectedMeasure.getPixelValueString() + "; actual: " + 
							//			 actualMeasure.getPixelValueString() + ")" );
						}
					}
					else
					{
						// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
						//			 "sizing check passed (alignment: " + alignType.keyword + "; expected: " +
						//			 expectedMeasure.getPixelValueString() + "; actual: " + actualMeasure.getPixelValueString() + ")" );
					}

					if ( verifyingColumnBreadths )
					{
						curItem.verified.columnBreadth = TRUE;
					}
					else
					{
						curItem.verified.rowBreadth = TRUE;
					}
				}
				else
				{
					// console.log( itemId + ": already verified " + (verifyingColumnBreadths ? "column" : "row") + " breadth" );
				}
			}
		},
		verifyGridItemPositions: function (gridObject)
		{
			this.verifyGridItemTrackPositions(gridObject, TRUE);
			this.verifyGridItemTrackPositions(gridObject, FALSE);
		}
	};
	
	function Track()
	{
		this.number				= NULL;
		this.size				= NULL;
		this.sizingType			= NULL;
		this.items				= [];
		this.measure			= NULL;
		this.minMeasure			= NULL;
		this.maxMeasure			= NULL;
		this.contentSizedTrack	= FALSE;
		this.implicit			= FALSE;
	}
	function ImplicitTrackRange()
	{
		this.firstNumber	= NULL;
		this.span			= NULL;
		this.size			= gridTrackValueEnum.auto;
		this.sizingType		= sizingTypeEnum.keyword;
		this.items			= [];
		this.measure		= NULL;
	}
	function Item()
	{
		this.itemElement		= NULL;
		this.styles				= NULL;
		this.position			= NULL;
		this.column				= 1;
		this.columnSpan			= 1;
		this.columnAlign		= gridAlignEnum.stretch;
		this.row				= 1;
		this.rowSpan			= 1;
		this.rowAlign			= gridAlignEnum.stretch;
		// Used width calculated during column track size resolution.
		this.usedWidthMeasure	= NULL;
		this.maxWidthMeasure	= NULL;
		this.maxHeightMeasure	= NULL;
		this.shrinkToFitSize	= NULL; // physical dimensions
		this.verified = {
			columnBreadth:	FALSE,
			rowBreadth:		FALSE,
			columnPosition: FALSE,
			rowPosition:	FALSE
		};
	}

	var
	BoxSizeCalculator = {
		calcMarginBoxWidth: function( element )
		{
			// console.log('element',element);
			// console.log('marginBoxWidth',"'"+getCSSValue( element, WIDTH)+"'");
			var
			boxSizing		= getCSSValue( element, BOXSIZING ),
			marginBoxWidth	= LayoutMeasure.measureFromStyleProperty( element, WIDTH );
			marginBoxWidth	= marginBoxWidth
								.add( LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + LEFT ) )
								.add( LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + RIGHT ) );
			
			if ( boxSizing === CONTENTBOX )
			{
				marginBoxWidth = marginBoxWidth
									.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + LEFT ) )
									.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + RIGHT ) );
			}
			if ( boxSizing === CONTENTBOX ||
				 boxSizing === PADDINGBOX )
			{
				if ( getCSSValue( element, BORDER + HYPHEN + LEFT + STYLE ) !== NONE )
				{
					marginBoxWidth = marginBoxWidth
										.add( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + LEFT + HYPHEN + WIDTH ) );
				}
				if ( getCSSValue( element, BORDER + HYPHEN + RIGHT + STYLE ) !== NONE )
				{
					marginBoxWidth = marginBoxWidth
										.add( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + RIGHT + HYPHEN + WIDTH ) );
				}
			}
			return marginBoxWidth;
		},
		calcMarginBoxHeight: function ( element )
		{
			var
			boxSizing		= getCSSValue( element, BOXSIZING ),
			marginBoxHeight = LayoutMeasure.measureFromStyleProperty( element, HEIGHT );

			marginBoxHeight = marginBoxHeight
								.add( LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + TOP ) )
								.add( LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + BOTTOM ) );

			if ( boxSizing === CONTENTBOX )
			{
				marginBoxHeight = marginBoxHeight
									.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + TOP ) )
									.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + BOTTOM ) );
			}
			if ( boxSizing === CONTENTBOX ||
				 boxSizing === PADDINGBOX )
			{
				if ( getCSSValue( element, BORDER + HYPHEN + TOP + STYLE ) !== NONE )
				{
					marginBoxHeight = marginBoxHeight
										.add( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + TOP + HYPHEN + WIDTH ) );
				}
				if ( getCSSValue( element, BORDER + HYPHEN + BOTTOM + STYLE ) !== NONE )
				{
					marginBoxHeight = marginBoxHeight
										.add( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + BOTTOM + HYPHEN + WIDTH ) );
				}
			}
			return marginBoxHeight;
		},
		// Calculates a box width suitable for use with the width property from a given margin box width.
		// Takes into account the box-sizing of the box.
		calcBoxWidthFromMarginBoxWidth: function ( element, marginBoxWidth )
		{
			var
			boxSizing	= getCSSValue( element, BOXSIZING ),
			boxWidth	= marginBoxWidth;

			if ( boxSizing === CONTENTBOX )
			{
				boxWidth = boxWidth
							.subtract(
								LayoutMeasure
									.measureFromStyleProperty( element, PADDING + HYPHEN + LEFT )
									.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + RIGHT ) )
							 );
			}
			if ( boxSizing === CONTENTBOX ||
				 boxSizing === PADDINGBOX )
			{
				if ( getCSSValue( element, BORDER + HYPHEN + LEFT + STYLE ) !== NONE )
				{
					boxWidth = boxWidth.subtract( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + LEFT + HYPHEN + WIDTH ) );
				}
				if ( getCSSValue( element, BORDER + HYPHEN + RIGHT + STYLE ) !== NONE )
				{
					boxWidth = boxWidth.subtract( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + RIGHT + HYPHEN + WIDTH ) );
				}
			}
			boxWidth = boxWidth
						.subtract(
							LayoutMeasure
								.measureFromStyleProperty( element, MARGIN + HYPHEN + LEFT )
								.add( LayoutMeasure.measureFromStyleProperty( element, MARGIN + HYPHEN + RIGHT ) )
						 );
			return boxWidth;
		},
		// Calculates a box height suitable for use with the height property from a given margin box height.
		// Takes into account the box-sizing of the box.
		calcBoxHeightFromMarginBoxHeight: function ( element, marginBoxHeight )
		{
			var
			boxSizing	= getCSSValue( element, BOXSIZING );
			boxHeight	= marginBoxHeight;

			if ( boxSizing === CONTENTBOX )
			{
				boxHeight = boxHeight
								.subtract(
									LayoutMeasure
										.measureFromStyleProperty( element, PADDING + HYPHEN + TOP )
										.add( LayoutMeasure.measureFromStyleProperty( element, PADDING + HYPHEN + BOTTOM ) )
								 );
			}
			if ( boxSizing === CONTENTBOX ||
				 boxSizing === PADDINGBOX )
			{
				if ( getCSSValue( element, BORDER + HYPHEN + TOP + STYLE ) !== NONE )
				{
					boxHeight = boxHeight.subtract( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + TOP + HYPHEN + WIDTH ) );
				}
				if ( getCSSValue( element, BORDER + HYPHEN + BOTTOM + STYLE ) !== NONE )
				{
					boxHeight = boxHeight.subtract( LayoutMeasure.measureFromStyleProperty( element, BORDER + HYPHEN + BOTTOM + HYPHEN + WIDTH ) );
				}
			}
			boxHeight = boxHeight
							.subtract(
								LayoutMeasure
									.measureFromStyleProperty( usedStyle, MARGIN + HYPHEN + TOP )
									.add( LayoutMeasure.measureFromStyleProperty( usedStyle, MARGIN + HYPHEN + BOTTOM ) )
							 );
			return boxHeight;
		}
	},
	
	IntrinsicSizeCalculator = {
		zeroLength:		{ cssText: '0px' },
		infiniteLength: { cssText: '1000000px' },
						/* last 2 params only required for shrink-to-fit calculation */
		prepare:		function ( element, calculatorOperation, containerWidth, containerHeight)
		{
			if ( intrinsicSizeCalculatorElement === NULL )
			{
				 intrinsicSizeCalculatorElement = div.cloneNode(TRUE);
				 intrinsicSizeCalculatorElement.id = "intrinsicSizeCalculator";
			}

			var
			cssText		= EMPTY,
			gridElement = element.parentNode,
			gridElementUsedStyle,
			FONT		= 'font-',
			FONTFAMILY	= FONT + 'family',
			FONTSIZE	= FONT + 'size',
			FONTADJUST	= FONTSIZE + '-adjust',
			FONTSTRETCH = FONT + STRETCH,
			FONTSTYLE	= FONT + 'style',
			FONTVARIANT	= FONT + 'variant',
			FONTWEIGHT	= FONT + 'weight',
			DIRECTION	= 'direction';
			
			if ( ! defined( containerWidth ) &&
				 containerWidth !== NULL )
			{
				cssText += WIDTH + COLON + containerWidth.getPixelValueString() + PX + SEMICOL;
			}
			else
			{
				switch (calculatorOperation)
				{
					case calculatorOperationEnum.minWidth:
					case calculatorOperationEnum.maxHeight:
						cssText += WIDTH + COLON + this.zeroLength.cssText + SEMICOL;
						break;
					case calculatorOperationEnum.minHeight:
					case calculatorOperationEnum.maxWidth:
						cssText += WIDTH + COLON + this.infiniteLength.cssText + SEMICOL;
						break;
					case calculatorOperationEnum.shrinkToFit:
						// console.log("Calculating shrink to fit size without specified container width");
						break;
				}
			}
			if ( defined( containerHeight ) &&
				 containerHeight !== NULL )
			{
				cssText += HEIGHT + COLON + containerHeight.getPixelValueString() + PX + SEMICOL;
			}
			else
			{
				switch (calculatorOperation)
				{
					case calculatorOperationEnum.minWidth:
					case calculatorOperationEnum.maxHeight:
						cssText += HEIGHT + COLON + this.infiniteLength.cssText + SEMICOL;
						break;
					case calculatorOperationEnum.minHeight:
					case calculatorOperationEnum.maxWidth:
						cssText += HEIGHT + COLON + this.zeroLength.cssText + SEMICOL;
						break;
					case calculatorOperationEnum.shrinkToFit:
						// console.log("Calculating shrink to fit size without specified container height");
						break;
				}
			}
			
			/* Insert our calculator at the same level as the grid to ensure child selectors work as well as we can reasonably achieve.
			 * Special case: the grid is the body element.
			 * In that case, put the calculator under the grid anyway;
			 * it shouldn't impact calculations assuming selectors aren't impacted.
			 **/
			intrinsicSizeCalculatorElementParent = gridElement === DOCUMENT.body ? gridElement : gridElement.parentNode;
		
			// Copy styles from the grid to the calculator to ensure any values that are inherited by grid items still happens.
			// TODO: add additional properties if new test content requires it.
			if ( intrinsicSizeCalculatorElementParent !== gridElement )
			{
				cssText +=	FONTFAMILY + COLON + getCSSValue( gridElement, FONTFAMILY ) + SEMICOL
						+	FONTSIZE + COLON + getCSSValue( gridElement, FONTSIZE ) + SEMICOL
						+ 	FONTADJUST + COLON + getCSSValue( gridElement, FONTADJUST ) + SEMICOL
						+ 	FONTSTRETCH + COLON + getCSSValue( gridElement, FONTSTRETCH ) + SEMICOL
						+ 	FONTSTYLE + COLON + getCSSValue( gridElement, FONTSTYLE ) + SEMICOL
						+ 	FONTVARIANT + COLON + getCSSValue( gridElement, FONTVARIANT ) + SEMICOL
						+ 	FONTWEIGHT + COLON + getCSSValue( gridElement, FONTWEIGHT ) + SEMICOL
						+ 	DIRECTION + COLON + getCSSValue( gridElement, DIRECTION ) + SEMICOL
						+ 	BLOCKPROGRESSION + COLON + getCSSValue( gridElement, BLOCKPROGRESSION) + SEMICOL;
			}
			intrinsicSizeCalculatorElement.style.cssText += cssText;
			intrinsicSizeCalculatorElementParent.appendChild(intrinsicSizeCalculatorElement);
		},
		unprepare: function()
		{
			intrinsicSizeCalculatorElementParent.removeChild(intrinsicSizeCalculatorElement);
		},
		cloneAndAppendToCalculator: function(element)
		{
			var clone = element.cloneNode(TRUE);
			// Float it so that the box won't constrain itself to the parent's size.
			clone.style.cssText = clone.style.cssText + SEMICOL + "float:left";
			intrinsicSizeCalculatorElement.appendChild(clone);
			return clone;
		},
		calcMinWidth: function(element)
		{
			this.prepare(element, calculatorOperationEnum.minWidth);
		
			var
			clone	= this.cloneAndAppendToCalculator(element),
			width	= BoxSizeCalculator.calcMarginBoxWidth( clone );
		
			intrinsicSizeCalculatorElement.removeChild(clone);
			this.unprepare();
		
			return width;
		},
		calcMaxWidth: function (element)
		{
			this.prepare(element, calculatorOperationEnum.maxWidth);
		
			var
			clone	= this.cloneAndAppendToCalculator(element),
			width	= BoxSizeCalculator.calcMarginBoxWidth( clone );
		
			intrinsicSizeCalculatorElement.removeChild(clone);
			this.unprepare();
		
			return width;
		},
		calcMinHeight: function (element, usedWidth)
		{
			if ( defined( usedWidth ) ||
				 usedWidth === NULL )
			{
				// console.log("calcMinHeight: no usedWidth specified");
			}
		
			this.prepare( element, calculatorOperationEnum.minHeight, usedWidth );
		
			var
			clone	= this.cloneAndAppendToCalculator(element),
			height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
		
			intrinsicSizeCalculatorElement.removeChild(clone);
			this.unprepare();
		
			return height;
		},
		calcMaxHeight: function (element, usedWidth)
		{
			if ( defined( usedWidth ) ||
				 usedWidth === NULL )
			{
				// console.log("calcMaxHeight: no usedWidth specified");
			}
		
			this.prepare(element, calculatorOperationEnum.maxHeight, usedWidth);
		
			var
			clone	= this.cloneAndAppendToCalculator(element),
			height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
		
			intrinsicSizeCalculatorElement.removeChild(clone);
			this.unprepare();
		
			return height;
		},
		calcShrinkToFitWidthAndHeight: function ( element, containerWidth, containerHeight, forcedMarginBoxWidth, forcedMarginBoxHeight )
		{
			// If we're forcing a specific size on the grid item, adjust the calculator's container size to accomodate it.
			if ( forcedMarginBoxWidth !== NULL )
			{
				containerWidth = forcedMarginBoxWidth;
			}
			if ( forcedMarginBoxHeight !== NULL )
			{
				containerHeight = forcedMarginBoxHeight;
			}
		
			this.prepare(element, calculatorOperationEnum.shrinkToFit, containerWidth, containerHeight);
		
			var
			clone						= this.cloneAndAppendToCalculator(element),
			cloneUsedStyle				= WINDOW.getComputedStyle(clone, NULL),
			shrinkToFitWidthAndHeight	= new WidthAndHeight(),
			forcedWidth, forcedHeight;
		
			/* Force a width or height for width/height if requested.
			 * We don't want to change the box-sizing on the box since we are not 
			 * overriding all of the border/padding/width/height properties and
			 * want the original values to work correctly. Convert the specified 
			 * forced length to the appropriate length for the width/height property.
			 **/
			if ( forcedMarginBoxWidth !== NULL )
			{
				forcedWidth = BoxSizeCalculator.calcBoxWidthFromMarginBoxWidth( clone, forcedMarginBoxWidth);
				clone.style.cssText +=	MIN + WIDTH + COLON + forcedWidth.getPixelValueString() + PX + SEMICOL +
										MAX + WIDTH + COLON + forcedWidth.getPixelValueString() + PX + SEMICOL;
			}
			if ( forcedMarginBoxHeight !== NULL )
			{
				forcedHeight = BoxSizeCalculator.calcBoxHeightFromMarginBoxHeight( clone, forcedMarginBoxHeight);
				clone.style.cssText +=	MIN + HEIGHT + COLON + forcedHeight.getPixelValueString() + PX + SEMICOL +
										MAX + HEIGHT + COLON + forcedHeight.getPixelValueString() + PX + SEMICOL;
			}
			shrinkToFitWidthAndHeight.width		= BoxSizeCalculator.calcMarginBoxWidth( clone );
			shrinkToFitWidthAndHeight.height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
		
			intrinsicSizeCalculatorElement.removeChild(clone);
			this.unprepare();
		
			return shrinkToFitWidthAndHeight;
		}
	},
	
	PropertyParser = {
		zerostring: '0',
		// Parses property string definitions and get an associative array of track objects.
		parseGridTracksString: function ( tracksDefinition, trackManager )
		{
			// TODO: add support for minmax definitions which will involve a more complicated tokenizer than split() (a regex?).
			var
			trackStrings	= tracksDefinition.split(regexSpaces),
			length			= trackStrings.length,
			i, newTrack, valueAndUnit;
			if ( length === 1 &&
				 ( trackStrings[0].length === 0 ||
					 trackStrings[0].toLowerCase() === NONE ) )
			{
				// Empty definition.
			}
			else
			{
				for ( i = 0; i < length; i++ )
				{
					trackStrings[i] = trackStrings[i].toLowerCase();

					newTrack = NULL;
					if ( this.isKeywordTrackDefinition(trackStrings[i]) )
					{
						newTrack			= new Track();
						newTrack.number		= i + 1;
						newTrack.size		= GridTest.layoutVerifier.gridTrackValueStringToEnum(trackStrings[i]);
						newTrack.sizingType = sizingTypeEnum.keyword;
						trackManager.addTrack(newTrack);
					}
					else
					{
						// Not a keyword; this is a CSS value.
						valueAndUnit = this.tryParseCssValue(trackStrings[i]);
						if ( valueAndUnit.value === NULL ||
							 valueAndUnit.unit === NULL )
						{
							// console.log("Not a keyword or a valid CSS value; track " + (i + 1) + " = " + trackStrings[i]);
							// console.log("Invalid track definition '" + trackStrings[i] + "'");
						}

						if ( ! this.isValidCssValueUnit(valueAndUnit.unit) )
						{
							// console.log("Invalid track unit '" + valueAndUnit.unit + "'");
						}

						newTrack			= new Track();
						newTrack.number		= i + 1;
						newTrack.size		= valueAndUnit;
						newTrack.sizingType = sizingTypeEnum.valueAndUnit;
						trackManager.addTrack(newTrack);
					}
				}
			}
		},
		// Parses CSS values into their value and their unit.
		tryParseCssValue: function (typedValue)
		{
			// First match: 0 or more digits, an optional decimal, and any digits after the decimal.
			// Second match: anything after the first match (the unit).
			var
			expression		= /^(\d*\.?\d*)(.*)/,
			regexResult		= typedValue.match(expression),
			valueAndUnit	= new CSSValueAndUnit();

			if ( regexResult[0].length > 0 &&
				 regexResult[1].length > 0 &&
				 regexResult[2].length > 0 )
			{
				if ( regexResult[1].indexOf(PERIOD) < 0 )
				{
					valueAndUnit.value = parseInt(regexResult[1], 10);
				}
				else {
					valueAndUnit.value = parseFloat(regexResult[1], 10);
				}
				valueAndUnit.unit = regexResult[2];
			}
			return valueAndUnit;
		},
		isValidCssValueUnit: function (unit)
		{
			var ret = FALSE;
			switch (unit)
			{
				case PX:
				case PERCENT:
				case 'pt':
				case 'pc':
				case 'in':
				case 'cm':
				case 'mm':
				case EM:
				case 'ex':
				case 'vh':
				case 'vw':
				case 'vm':
				case 'ch':
				case REM:
				case FR: // Grid only
					ret = TRUE;
			}
			return ret;
		},
		isKeywordTrackDefinition: function (definition)
		{
			var ret = FALSE;
			switch (definition)
			{
				case gridTrackValueEnum.auto.keyword:
				case gridTrackValueEnum.minContent.keyword:
				case gridTrackValueEnum.maxContent.keyword:
				case gridTrackValueEnum.fitContent.keyword:
					ret = TRUE;
			}
			return ret;
		}
	};
	
	function LayoutMeasure( measure )
	{
		if ( measure % 1 !== 0 )
		{
			// console.log("LayoutMeasures must be integers, measure was " + typeof(measure) + "(" + measure + ")" );
			measure = 0;
		}
		this.internalMeasure = measure;
	}
	LayoutMeasure.measureFromPx = function( measureInPx )
	{
		// Convert to accuracy of agent's layout engine.
		return new LayoutMeasure( Math.round( measureInPx * Math.pow(10, precision) ) );
	};
	LayoutMeasure.measureFromPxString = function( measureInPxString )
	{
		var
		length			= measureInPxString.length,
		wholePart		= 0,
		fractionPart	= 0,
		decimalPosition = measureInPxString.indexOf(PERIOD);
		
		// Don't depend on a potentially lossy conversion to a float-- we'll parse it ourselves.
		measureInPxString = measureInPxString.substr( 0, measureInPxString.length - 2 );
		
		if ( decimalPosition >= 0 )
		{
			fractionPart = measureInPxString.substring( decimalPosition + 1 );
			while ( fractionPart.length < precision )
			{
				fractionPart += this.zerostring;
			}
			fractionPart = parseInt( fractionPart, 10 );
		}
		if ( decimalPosition !== 0 )
		{
			wholePart = measureInPxString.substring( 0, decimalPosition >= 0 ? decimalPosition : length );
			wholePart = parseInt( wholePart, 10 ) * Math.pow( 10, precision );
		}
		return new LayoutMeasure( wholePart + fractionPart );
	};
	LayoutMeasure.measureFromStyleProperty = function ( el, property )
	{
		// TODO: handle borders with no style and keywords
		var
		val		= getCSSValue( el, property ),
		found	= FALSE,
		size, s, em, rem, percent, num;
		if ( ! val.contains(PX) )
		{
			if ( property.contains('border-width') )
			{
				size = getCSSValue( el, 'border-style' );
				if ( size === NONE )
				{
					val		= 0 + PX;
					found	= TRUE;
				}
				else
				{
					for ( s in borderWidths )
					{
						if ( size == s )
						{
							val 	= borderWidths[s] + PX;
							found	= TRUE;
							break;
						}
					}
				}
			}
			if ( ! found )
			{
				em		= val.contains(EM);
				rem		= val.contains(REM);
				percent	= val.contains(PERCENT);
				if ( em || rem )
				{
					size	= parseInt( getCSSValue( ( em ? el : DOCUMENT.body ), 'font-size' ), 10 );
					val		= ( parseInt( val, 10 ) * size ) + PX;
				}
				else if ( percent )
				{
					if ( property.contains(WIDTH) ||
			 	 	     property.contains(LEFT) ||
				 	     property.contains(RIGHT) )
					{
						s = el.parentNode.clientWidth;
					}
					else if ( property.contains(HEIGHT) ||
					 	 	  property.contains(TOP) ||
						 	  property.contains(BOTTOM) )
					{
						s = el.parentNode.clientHeight;
					}
					val		= Math.round( ( parseInt( val, 10 ) / 100 ) * s ) + PX;
				}
			}
		}
		return this.measureFromPxString( val );
	};
	LayoutMeasure.zero = function()
	{
		return new LayoutMeasure(0);
	};
	LayoutMeasure.min = function ( a, b )
	{
		return new LayoutMeasure(Math.min(a.internalMeasure, b.internalMeasure));
	};
	LayoutMeasure.max = function ( a, b )
	{
		return new LayoutMeasure(Math.max(a.internalMeasure, b.internalMeasure));
	};
	LayoutMeasure.prototype = {
		getRawMeasure: function()
		{
			return this.internalMeasure;
		},
		getPixelValue: function()
		{
			return this.internalMeasure / Math.pow(10, precision);
		},
		getMeasureRoundedToWholePixel: function()
		{
			var
			abs = Math.abs,
			pow = Mat.pow,
			fractionOfPixel = abs( this.internalMeasure % pow(10, precision) ),
			adjustment;
			if ( fractionOfPixel >= 5 * pow(10, precision - 1) )
			{
				// Round up.
				adjustment = pow(10, precision) - fractionOfPixel;
			}
			else
			{
				// Round down.
				adjustment = 0 - fractionOfPixel;
			}
			if ( this.internalMeasure < 0 )
			{
				adjustment = 0 - adjustment;
			}
			return new LayoutMeasure( this.internalMeasure + adjustment );
		},
		add: function( measure )
		{
			if ( ! ( measure instanceof LayoutMeasure ) )
			{
				// console.log("LayoutMeasure.add only accepts layout measures");
			}
			return new LayoutMeasure( this.internalMeasure + measure.internalMeasure );
		},
		subtract: function( measure )
		{
			if ( ! ( measure instanceof LayoutMeasure ) )
			{
				// console.log("LayoutMeasure.subtract only accepts layout measures");
			}
			return new LayoutMeasure( this.internalMeasure - measure.internalMeasure );
		},
		multiply: function( number )
		{
			if ( typeof number !== "number" )
			{
				// console.log("LayoutMeasure.multiply only accepts numbers");
			}
			// Integer arithmetic; drop any remainder.
			return new LayoutMeasure( Math.floor(this.internalMeasure * number) );
		},
		divide: function( number )
		{
			if (typeof number !== "number")
			{
				// console.log("LayoutMeasure.divide only accepts number");
			}
			// Integer arithmetic; drop any remainder.
			return new LayoutMeasure( Math.floor(this.internalMeasure / number) );
		},
		equals: function( measure )
		{
			if ( ! ( measure instanceof LayoutMeasure ) )
			{
				// console.log("LayoutMeasure.equals only accepts layout measures");
			}
			return this.internalMeasure === measure.internalMeasure;
		}
	};


	function TrackManager()
	{
		this.tracks					= [];
		this.implicitTrackRanges	= [];
	}
	TrackManager.prototype = {
		addTrack: function( trackToAdd )
		{
			this.tracks.push( trackToAdd );
		},
		getRangeLastTrackNumber: function( range )
		{
			return range.firstNumber + range.span - 1;
		},
		makeRoomForExplicitTrack: function( trackNumber )
		{
			var
			i = 0, len = this.implicitTrackRanges.length,
			curRange, nextRange, firstRangeNum, firstRangeSpan, secondRangeNum, secondRangeSpan, newRange, lastTrackNumber;

			for ( ; i < len; i++)
			{
				curRange		= this.implicitTrackRanges[i];
				lastTrackNumber = this.getRangeLastTrackNumber( curRange );
				if ( trackNumber >= curRange.firstNumber &&
					 trackNumber <= lastTrackNumber )
				{
					// This range covers the explicit track we are adding. Split, if necessary, and vacate the track.
					nextRange = i < len - 1 ? NULL : this.implicitTrackRanges[i + 1];
					// In the first track this range covers.
					if ( trackNumber === curRange.firstNumber )
					{
						if (curRange.span === 1) {
							// Remove the range.
							this.implicitTrackRanges.splice(i, 1);
						}
						else
						{
							// Vacate the track.
							curRange.firstNumber += 1;
							curRange.span -= 1;
						}
					}
					// In the last track this range covers.					
					else if ( trackNumber === lastTrackNumber )
					{
						// Vacate the track.
						curRange.span -= 1;
					}
					// Need to split the range.
					else
					{
						// Compute new range values.
						firstRangeNum	= curRange.firstNumber;
						firstRangeSpan	= trackNumber - curRange.firstNumber;
						secondRangeNum	= trackNumber + 1;
						secondRangeSpan = lastTrackNumber - secondRangeFirstNumber + 1;

						// Move the existing range to the second half and add a new range before it.
						curRange.firstNumber = secondRangeFirstNumber;
						curRange.span = secondRangeSpan;

						newRange = new ImplicitTrackRange();
						newRange.firstNumber	= firstRangeFirstNumber;
						newRange.span			= firstRangeSpan;
						// Insert before the existing range.
						this.implicitTrackRanges.splice(i, 0, newRange);
					}
					break;
				}
			}
		},
		ensureFirstTrackExists: function ( firstTrackNumber )
		{
			// Ensure an actual track object exists for the first track.
			this.makeRoomForExplicitTrack(firstTrackNumber);

			var 
			i					= 0,
			len					= this.tracks.length,
			newTrack			= new Track();
			newTrack.number		= firstTrackNumber;
			newTrack.sizingType = sizingTypeEnum.keyword;
			newTrack.size		= gridTrackValueEnum.auto;
			newTrack.implicit	= TRUE;

			if ( len === 0 ||
				 firstTrackNumber > this.tracks[len-1].number )
			{
				// No tracks OR it doesn't exist
				// add to the end.
				this.addTrack(newTrack);
			}
			else if ( firstTrackNumber === this.tracks[len-1].number )
			{
				// Already exists at the end.
			}
			else
			{
				// Doesn't belong at the end. Determine if it exists and, if not, create one and insert it.
				for ( i = 0; i < len; i++ )
				{
					if ( firstTrackNumber === this.tracks[i].number )
					{
						break; // Already exists.
					}
					else if ( firstTrackNumber < this.tracks[i].number )
					{
						this.tracks.splice(i, 0, newTrack);
						break;
					}
				}
			}
		},
		ensureTracksExist: function ( firstTrackNumber, lastTrackNumber )
		{
			var
			newRangeFirstNumber = firstTrackNumber,
			newRangeLastNumber	= lastTrackNumber,
			trackLength			= this.tracks.length,
			mathMin				= Math.min,
			mathMax				= Math.max,
			rangesToCreate, curFirstTrackNumber, curLastTrackNumber, nonRangeTrackIndex,
			existingRangeIndex, newRangeIndex, rangesToCreateLength, implicitTrackRangesLength,
			rangeToCreate, rangeToCreateFirstNumber, rangeToCreateLastNumber, needToCreateRange,
			existingRange, existingRangeFirstNumber, existingRangeLastNumber,
			firstRangeFirstNumber, firstRangeSpan,
			secondRangeFirstNumber, secondRangeSpan,
			thirdRangeFirstNumber, thirdRangeSpan,		
			newRange;

			this.ensureFirstTrackExists(firstTrackNumber);

			// First track now exists; insert one or more ranges into the set of implicit track ranges.
			firstTrackNumber++;

			if ( firstTrackNumber <= lastTrackNumber )
			{
				rangesToCreate		= [];
				curFirstTrackNumber = firstTrackNumber;
				curLastTrackNumber	= lastTrackNumber;
				// Iterate over the non-range track objects and split up our range into multiple ones if necessary.
				if ( trackLength === 0 )
				{
					// TODO: throw instead of pushing here; at least one track should have been created by ensureFirstTrackExists.
					rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
				}
				for ( nonRangeTrackIndex = 0; nonRangeTrackIndex < trackLength; nonRangeTrackIndex++ )
				{
					if ( curFirstTrackNumber > curLastTrackNumber ||
						 this.tracks[nonRangeTrackIndex].number > curLastTrackNumber )
					{
						break;
					}

					// This track sits inside our range.
					if ( this.tracks[nonRangeTrackIndex].number >= curFirstTrackNumber &&
						 this.tracks[nonRangeTrackIndex].number <= curLastTrackNumber)
					{
						if ( curFirstTrackNumber === this.tracks[nonRangeTrackIndex].number )
						{
							// No need to create a new range; just move out of the way.
							curFirstTrackNumber++;
						}
						else if ( curLastTrackNumber === this.tracks[nonRangeTrackIndex].number )
						{
							// No need to create a new range; just move out of the way.
							curLastTrackNumber--;
						}
						else
						{
							// Split the range
							// add the first half to the list of ranges to create,
							// and continue through the loop with the second half, searching
							// for more intersections with non-range tracks.
							rangesToCreate.push({ first: curFirstTrackNumber, last: this.tracks[nonRangeTrackIndex].number - 1 });
							curFirstTrackNumber = this.tracks[nonRangeTrackIndex].number + 1;
						}
					}
				}
				if ( curFirstTrackNumber <= curLastTrackNumber )
				{
					rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
				}
				existingRangeIndex		= 0;
				rangesToCreateLength	= rangesToCreate.length;
				for ( newRangeIndex = 0; newRangeIndex < rangesToCreateLength; newRangeIndex++ )
				{
					rangeToCreate				= rangesToCreate[newRangeIndex];
					rangeToCreateFirstNumber	= rangeToCreate.first;
					rangeToCreateLastNumber		= rangeToCreate.last;
					needToCreateRange			= TRUE;
					implicitTrackRangesLength	= this.implicitTrackRanges.length;
					for ( ; existingRangeIndex < implicitTrackRangesLength; existingRangeIndex++ )
					{
						// Find any ranges that might intersect.
						existingRange				= this.implicitTrackRanges[existingRangeIndex];
						existingRangeFirstNumber	= existingRange.firstNumber;
						existingRangeLastNumber		= getRangeLastTrackNumber(existingRange);

						if ( rangeToCreateLastNumber < existingRangeFirstNumber )
						{
							// We are past the existing range.
							break;
						}
						else if ( rangeToCreateFirstNumber > existingRangeLastNumber )
						{
							// Keep searching.
							continue;
						}
						// Check if this same range already exists.
						else if ( rangeToCreateFirstNumber == existingRangeFirstNumber &&
									rangeToCreateLastNumber == existingRangeLastNumber )
						{
							needToCreateRange = FALSE;
							break;
						}
						// We have some intersection. 
						// Split into up to three ranges to cover the existing range and our new one.else
						else
						{
							firstRangeFirstNumber	= mathMin(rangeToCreateFirstNumber, existingRangeFirstNumber);
							firstRangeSpan			= mathMax(rangeToCreateFirstNumber, existingRangeFirstNumber) - firstRangeFirstNumber;
							secondRangeFirstNumber	= firstRangeFirstNumber + firstRangeSpan;
							secondRangeSpan			= mathMin(rangeToCreateLastNumber, existingRangeLastNumber) - secondRangeFirstNumber;
							thirdRangeFirstNumber	= secondRangeFirstNumber + secondRangeSpan;
							thirdRangeSpan			= mathMax(rangeToCreateLastNumber, existingRangeLastNumber) - thirdRangeFirstNumber + 1;

							// Insert the new ranges in front of the existing one.
							if ( firstRangeSpan > 0 )
							{
								newRange = new ImplicitTrackRange();
								newRange.firstNumber = firstRangeFirstNumber;
								newRange.span = firstRangeSpan;
								this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
								existingRangeIndex++;
							}
							if (secondRangeSpan > 0) {
								newRange = new ImplicitTrackRange();
								newRange.firstNumber = secondRangeFirstNumber;
								newRange.span = secondRangeSpan;
								this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
								existingRangeIndex++;
							}
							if (thirdRangeSpan > 0) {
								newRange = new ImplicitTrackRange();
								newRange.firstNumber = thirdRangeFirstNumber;
								newRange.span = thirdRangeSpan;
								this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
								existingRangeIndex++;
							}
							// Remove the old range.
							this.implicitTrackRanges.splice(existingRangeIndex, 1);
							needToCreateRange = FALSE;
							break;
						}
					}
					if ( needToCreateRange )
					{
						newRange				= new ImplicitTrackRange();
						newRange.firstNumber	= rangeToCreateFirstNumber;
						newRange.span			= rangeToCreateLastNumber - rangeToCreateFirstNumber + 1;

						if ( existingRangeIndex >= this.implicitTrackRanges.length )
						{
							// Add to the end.
							this.implicitTrackRanges.push(newRange);
						}
						else
						{
							// Add before the existing one.
							this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
						}
					}
				}
			}
		},
		getIterator: function()
		{
			return new TrackIterator(this);
		},
		getTrack: function ( trackNumber )
		{
			var
			i, len = this.tracks.length, curRangeLastNumber;
			while ( len-- )
			{
				if ( this.tracks[len].number < trackNumber )
				{
					break;
				}
				if ( trackNumber == this.tracks[len].number )
				{
					return this.tracks[len];
				}
			}
			len = this.implicitTrackRanges.length;
			for ( i = 0; i < len; i++) {
				curRangeLastNumber = this.implicitTrackRanges[i].firstNumber + this.implicitTrackRanges[i].span - 1;
				if ( trackNumber >= this.implicitTrackRanges[i].firstNumber &&
					 trackNumber <= curRangeLastNumber )
				{
					return this.implicitTrackRanges[i];
				}
			}
			// console.log("getTrack: invalid track number " + trackNumber);
		},
		getTracks: function ( firstTrackNumber, lastTrackNumber )
		{
			var
			collection			= [],
			tracks				= this.tracks,
			implicitTrackRanges = this.implicitTrackRanges,
			number, i, len, curRangeLastNumber;
			for ( i=0, len=tracks.length; i < len; i++ )
			{
				number = tracks[i].number;
				if ( number > lastTrackNumber )
				{
					break;
				}
				if ( number >= firstTrackNumber &&
					 number <= lastTrackNumber )
				{
					collection.push( tracks[i] );
				}
			}
			for ( i=0, len=implicitTrackRanges.length; i < len; i++ )
			{
				curRangeLastNumber = implicitTrackRanges[i].firstNumber + implicitTrackRanges[i].span - 1;
				if ( firstTrackNumber >= implicitTrackRanges[i].firstNumber &&
					 lastTrackNumber <= curRangeLastNumber )
				{
					collection.push( implicitTrackRanges[i] );
				}
				if ( curRangeLastNumber >= lastTrackNumber )
				{
					break;
				}
			}
			if ( collection.length === 0 )
			{
				// console.log("getTracks: a track in the range " + firstTrackNumber + " - " + lastTrackNumber + " doesn't exist");
			}
			return collection;
		},
		spanIsInFractionalTrack: function ( firstTrackNum, numSpanned )
		{
			// Fractional tracks are always represented by actual track objects.
			for ( var i = firstTrackNum-1, len=this.tracks.length; i < len && i < (firstTrackNum + numSpanned - 1); i++ )
			{
				if ( this.trackIsFractionSized( this.tracks[i] ) )
				{
					return TRUE;
				}
			}
			return FALSE;
		}
	};
	
	function TrackIterator ( trackManager )
	{
		this.trackManager					= trackManager;
		this.iteratingtracks				= TRUE;
		this.currentTrackIndex				= 0;
		this.currentImplicitTrackRangeIndex = 0;
	}
	TrackIterator.prototype = {
		reset: function()
		{
			this.iteratingtracks = TRUE;
			this.currentTrackIndex = 0;
			this.currentImplicitTrackRangeIndex = 0;
		},
		next: function()
		{
			var
			next 							= NULL,
			returnNextTrackRange			= FALSE,
			trackManager					= this.trackManager,
			tracks							= trackManager.tracks,
			tracksLength					= tracks.length,
			implicitTrackRanges				= trackManager.implicitTrackRanges,
			implicitTrackRangesLength		= implicitTrackRanges.length,
			currentTrackIndex				= this.currentTrackIndex,
			currentImplicitTrackRangeIndex	= this.currentImplicitTrackRangeIndex;
			if ( currentTrackIndex >= tracksLength )
			{
				returnNextTrackRange = TRUE;
			}
			else if ( currentImplicitTrackRangeIndex < implicitTrackRangesLength )
			{
				// We have both a non-range track and a range track-- check to see if we should return the track range first.
				if ( implicitTrackRanges[currentImplicitTrackRangeIndex].firstNumber < tracks[currentTrackIndex].number )
				{
					returnNextTrackRange = TRUE;
				}
			}
			if ( returnNextTrackRange &&
				 currentImplicitTrackRangeIndex < implicitTrackRangesLength )
			{
				next = implicitTrackRanges[currentImplicitTrackRangeIndex];
				this.currentImplicitTrackRangeIndex++;
			}
			else if ( currentTrackIndex < tracksLength )
			{
				next = tracks[currentTrackIndex];
				this.currentTrackIndex++;
			}
			return next;
		}
	};
	
})(eCSStender);