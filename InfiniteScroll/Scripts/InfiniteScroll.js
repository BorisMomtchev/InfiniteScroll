/*
Blog Entry:
Creating A Bidirectional Infinite Scroll Page With jQuery And ColdFusion
		
Author:
Ben Nadel / Kinky Solutions
	
Link:
http://www.bennadel.com/index.cfm?event=blog.view&id=1803
	
Date Posted:
Jan 6, 2010 at 8:45 PM
*/ 

// I get more list items and either prepend them or append
// them to the list depending on the target area.
function getMoreListItems(
	container,
	targetArea,
	onComplete
	){
	// Check to see if there is any existing AJAX call
	// for the list data items. If there is, we want to
	// return out of this method - no reason to overload
	// the server with extraneous requests (more so than
	// an infinite scroll effect already does!!).
	if (container.data( "xhr" )){
 
		// Let the active AJAX request complete.
		return;
 
	}
 
	// Get the min and max offsets of the current
	// container.
	var minOffset = (container.data( "minOffset" ) || 0);
	var maxOffset = (container.data( "maxOffset" ) || 0);
 
	// The count of list items to load per AJAX request.
	// We are calling it a "chunk" size because each
	// list chunk will be stored in its own sub-container
	// to make DOM manipulation easier.
	var chunkSize = 3;
 
	// Check our target area to see what our next offset
	// for loading should be.
	if (targetArea == "top"){
 
		// We are prepending list items.
		var nextOffset = (minOffset - 1 - chunkSize);
 
	} else {
 
		// We are appending list items.
		var nextOffset = (maxOffset + 1);
 
	}
 
	// Launch AJAX request for next set of results and
	// store the resultant XHR request with the container.
	container.data(
		"xhr",
		$.ajax({
			type: "get",
			url: "Home/GetScollData",
			data: {
				offset: nextOffset,
				count: chunkSize
			},
			dataType: "json",
			success: function (response) {
				// Apply the response to the container
				// for the given target area.
				console.log(response);
				applyListItems(container, targetArea, response);
			},
			complete: function () {
				// Remove the stored AJAX request. This
				// will allow subsequent AJAX requests
				// to execute.
				container.removeData("xhr");

				// Call the onComplete callback.
				onComplete();
			}
		})
	);
}
 
 
// I apply the given AJAX response to the container.
function applyListItems( container, targetArea, items ){
	// Get a reference to our HTML template for a new
	// list item.
	var template = $( "#list-item-template" );
 
	// Create an array to hold our HTML buffer - this will
	// be faster than creating individual DOM elements and
	// appending them piece-wise.
	var htmlBuffer = [];
 
	// Loop over the array to create each list element.
	$.each(
		items,
		function( index, item ){
 
			// Modify the template and append the result
			// to the HTML buffer.
			htmlBuffer.push(
				template.html().replace(
					new RegExp( "\\$\\{(src|offset)\\}", "g" ),
					function( $0, $1 ){
						// Return property.
						return( item[ $1.toUpperCase() ] );
					}
				)
			);
 
		}
	);
 
	// Create a list chunk which will hold our data.
	var chunk = $( "<div class='list-chunk'></div>" );
 
	// Append the list item html buffer to the chunk.
	chunk.append( htmlBuffer.join( "" ) );
 
	// Create the min and max offset of the chunk.
	chunk.data( "minOffset", items[ 0 ].OFFSET );
	chunk.data( "maxOffset", items[ items.length - 1 ].OFFSET );
 
	// Check to see which target area we are adding the
	// list items to (top vs. bottom).
	if (targetArea == "top"){
 
		// Get the current window scroll before we update
		// the list contente.
		var viewTop = $( window ).scrollTop();
 
		// Prepend list items.
		container.prepend( chunk );
 
		// Now that the chunk has been added to the page,
		// it should have a height that can be calculated.
		var chunkHeight = chunk.height();
 
		// Re-adjust the scroll of the window to make sure
		// the user doesn't suddenly jump to a crazy place.
		$( window ).scrollTop( viewTop + chunkHeight );
 
		// Now that we moved the list up, let's remove
		// the last chunk from the list.
		container.find( "> div.list-chunk:last" ).remove();
 
	} else {
 
		// Append list items.
		container.append( chunk );
 
		// Check to see if we have more chunks than we
		// want (an arbitrary number, but enough to make
		// sure we can comfortable fill the page).
		if (container.children().size() > 3){
 
			// We want to remove the first chunk in the
			// list to free up some browser memory.
 
			// Get the current window scroll before we
			// remove a chunk.
			var viewTop = $( window ).scrollTop();
 
			// Get the chunk that we are going to remove.
			var oldChunk = container.children( ":first" );
 
			// Get the height of the chunk we are about
			// to remove.
			var oldChunkHeight = oldChunk.height();
 
			// Remove the hunk.
			oldChunk.remove();
 
			// Now, we need to ajust the scroll offset
			// of the window so the user is not jumped
			// around to a crazy place.
			$( window ).scrollTop( viewTop - oldChunkHeight );
 
		}
 
	}
 
	// Now that we have updated the chunks in the
	// container, let's update the min / max offsets of
	// the container (which will be used on subsequent
	// AJAX requests).
	container.data(
		"minOffset",
		container.children( ":first" ).data( "minOffset" )
	);
 
	container.data(
		"maxOffset",
		container.children( ":last" ).data( "maxOffset" )
	);
}
 
 
// I check to see if more list items are needed based on
// the scroll offset of the window and the position of
// the container. I return a complex result that not only
// determines IF more list items are needed, but on what
// end of the list.
//
// NOTE: These calculate are based ONLY on the offset of
// the list container in the context of the view frame.
// This does not take anything else into account (more
// business logic might be required to see if loading
// truly needs to take place).
function isMoreListItemsNeeded( container ){
	// Create a default return. This return value contains
	// requirements for both the top and bottom of the
	// content list.
	var result = {
		top: false,
		bottom: false
	};
 
	// Get the view frame for the window - this is the
	// top and bottom coordinates of the visible slice of
	// the document.
	var viewTop = $( window ).scrollTop();
	var viewBottom = (viewTop + $( window ).height());
 
	// Get the offset of the top of the list container.
	var containerTop = container.offset().top;
 
	// Get the offset of the bottom of the list container.
	var containerBottom = Math.floor(
		containerTop + container.height()
	);
 
	// I am the scroll buffers for the top and the bottom;
	// this is the amount of pre-top and pre-bottom space
	// we want to take into account before we start
	// loading the next items.
	//
	// NOTE: The top buffer is a bit bigger only to make
	// the transition feel a bit *safer*.
	var topScrollBuffer = 500;
	var bottomScrollBuffer = 200;
 
	// Check to see if the container top is close enough
	// (with buffer) to the top scroll of the view frame
	// to trigger loading more items (at the top).
	if ((containerTop + topScrollBuffer) >= viewTop){
 
		// Flag requirement at top.
		result.top = true;
 
	}
 
	// Check to see if the container bottom is close
	// enought (with buffer) to the scroll of the view
	// frame to trigger loading more items (at the
	// bottom).
	if ((containerBottom - bottomScrollBuffer) <= viewBottom){
 
		// Flag requirement at bottom.
		result.bottom = true;
 
	}
 
	// Return the requirments for the loading.
	return( result );
}
 
 
// I check to see if more list items are needed, and, if
// they are, I load them.
function checkListItemContents( container ){
	// Check to see if more items need to be loaded at
	// the top or the bottom (based purely on position).
	// Returns: { top: boolean, bottom: boolean }.
	var isMoreLoading = isMoreListItemsNeeded( container );
 
	// Define an onComplete method for the AJAX load that
	// will call this method again to make sure there is
	// always enough data loaded on the page.
	var onComplete = function(){
		checkListItemContents( container );
	};
 
	// Check to see if more list items are needed at the
	// top. If so, we will check to offsets to see if the
	// load needs to take place.
	//
	// NOTE: Position is only *part* of how we determine
	// if additional content is needed at the top.
	if (
		isMoreLoading.top &&
		container.data( "minOffset" ) &&
		(container.data( "minOffset" ) > 1)
		){
 
		// Load and prepend more list items.
		getMoreListItems(
			container,
			"top",
			onComplete
		);
 
	// Check to see if more list items are needed at the
	// bottom. For this, all we are going to rely on is
	// the offset of the container (since we can load
	// ad-infinitum in the bottom direction).
	} else if (isMoreLoading.bottom){
 
		// Load and append more list items.
		getMoreListItems(
			container,
			"bottom",
			onComplete
		);
 
	}
}
 
// -------------------------------------------------- //
 
// When the DOM is ready, initialize document.
jQuery(function( $ ){
 
	// Get a reference to the list container.
	var container = $( "#container" );
 
	// Bind the scroll and resize events to the window.
	// Whenever the user scrolls or resizes the window,
	// we will need to check to see if more list items
	// need to be loaded.
	$( window ).bind(
		"scroll resize",
		function( event ){
			// Hand the control-flow off to the method
			// that worries about the list content.
			checkListItemContents( container );
		}
	);
 
	// Now that the page is loaded, trigger the "Get"
	// method to populate the list with data.
	checkListItemContents( container );
 
});
 
