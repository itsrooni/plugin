

function Submit( formName ) {

		var theForm = document.forms[formName];
		
		if (theForm != null) {
			theForm.submit();
		}
}

function SubmitForm( formName, submitValue ) {

		var theForm = document.forms[formName];
		if (theForm != null) {
			theForm.submit();
		}
}

function SwapImage( image, newImageSrc ) 
{
 if (document.images) {
	eval("document."+image+".src = newImageSrc;");
 }
	
}

function popUp( URL, width, height ) 
{
	day = new Date();
	id = day.getTime();
	//eval("page" + id + " = window.open(URL, '" + id + "', 'toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=" +width+ ","height=" +height+ ",left = 480,top = 392');");
	eval("page" + id + " = window.open(URL, '" + id + "', 'toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=" +width+ ",height=" +height+ "');");
}

function popUpWithScrollBars( URL, width, height ) 
{
	day = new Date();
	id = day.getTime();
	//eval("page" + id + " = window.open(URL, '" + id + "', 'toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=" +width+ ","height=" +height+ ",left = 480,top = 392');");
	eval("page" + id + " = window.open(URL, '" + id + "', 'toolbar=1,scrollbars=1,location=0,statusbar=0,menubar=1,resizable=1,width=" +width+ ",height=" +height+ "');");
	//window.open(URL, '" + id + "', 'toolbar=1,scrollbars=1,location=0,statusbar=0,menubar=1,resizable=1,width=" +width+ ",height=" +height+ "');
	//window.open(URL,'toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=' +width+ ',height=' +height+ '');
	//window.open('http://www.google.com','toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=' +width+ ',height=' +height+ '');

}

function CloseWindowAndRedirectParent( parentURL )
{	
	// Redirect the parent
	if (opener) {
		opener.location = parentURL;
	}

	// Close ourselves
	if (self) {
		self.close();
	}
}


function DoControlAnimation( theObject, open ) 
{
	var imageName = document.images[theObject +"_image"].src;
	var active = (imageName.indexOf("active") > 0);
	
	if (imageName.indexOf("bullet") <= 0) {
		if (open) {
			if (active) {
				document.images[theObject +"_image"].src = "images/menu_arrow2_active.gif";
			}
			else {
				document.images[theObject +"_image"].src = "images/menu_arrow2.gif";
			}
		}
		else {
			if (active) {
				document.images[theObject +"_image"].src = "images/menu_arrow1_active.gif";
			}
			else {
				document.images[theObject +"_image"].src = "images/menu_arrow1.gif";
			}
		}
	}
}





//
// Data Sheet Expand collapse support
//

function ToggleDIVOpenState( theObject1ID, theObject2ID )
{
	ToggleDIVOpenCloseState( theObject1ID );	
	//ToggleDIVOpenCloseState( theObject2ID );	
}

function ToggleDIVOpenCloseState( theObjectID ) {
        
	var theLayer = null;
	if (document.getElementById) {
	
 		// Level 1 DOM code
		theLayer = document.getElementById( theObjectID ).style;
 		if (theLayer) {
			if (theLayer.display=='none') {
 				theLayer.display = '';
				DoControlAnimation( theObjectID, true ); // expand animation
			}
			else {
				theLayer.display = 'none';
				DoControlAnimation( theObjectID, false ); // collapse animation
			}
		}
	}
	else if (document.all) {
	
		// Microsoft DOM code
		theLayer = eval("document.all." +theObjectID+ ".style" );
		if (theLayer) {
			if (theLayer.display=='none') {
				theLayer.display = '';
				DoControlAnimation( theObjectID, true ); // expand animation
			}
			else {
				theLayer.display = 'none';
				DoControlAnimation( theObjectID, false ); // collapse animation
			}
		}
	}
	else if (document.layers) {
	
		// Netscape DOM code
		theLayer = document.layers[ theObjectID ];
		
		if (theLayer) {
			if ( theLayer.visibility == 'hide' ) {
				theLayer.visibility = 'show';
				DoControlAnimation( theObjectID, true ); // expand animation
			}
			else {
				theLayer.visibility = 'hide';
				DoControlAnimation( theObjectID, false ); // collapse animation
			}
		}
	}
}

function SetVisibility( theObjectID, showit ) {
        
	var theLayer = null;
	if (document.getElementById) {
	
 		// Level 1 DOM code
		theLayer = document.getElementById( theObjectID ).style;
 		if (theLayer) {
 		                            
			if (showit) {
 				theLayer.display = '';
			}
			else {
 				theLayer.display = 'none';
			}
		}
	}
	else if (document.all) {
	
		// Microsoft DOM code
		theLayer = eval("document.all." +theObjectID+ ".style" );
		if (theLayer) {
			if (showit) {
				theLayer.display = '';
			}
			else {
				theLayer.display = 'none';
			}
		}
	}
	else if (document.layers) {
	
		// Netscape DOM code
		theLayer = document.layers[ theObjectID ];
		
		if (theLayer) {
			if ( showit ) {
				theLayer.visibility = 'show';
			}
			else {
				theLayer.visibility = 'hide';
			}
		}
	}
}

//
// Reset sizes when Manufacturer, Frame, Type, or SubType changes
//
function ResetSizesRefresh( fieldName ) {
	try {
		// Set the ResetSizes hidden field to indicate sizes should be reset
		var resetSizesField = document.forms['windowbuilder'].elements['ResetSizes'];
		if (resetSizesField) {
			resetSizesField.value = '1';
		}
		
		// Reset the ROSize dropdown to default "Select Size" option
		var roSizeField = document.forms['windowbuilder'].elements['ROSize'];
		if (roSizeField) {
			roSizeField.value = '';
			// Update Selectric if it's being used
			var $ = (typeof jQuery !== 'undefined') ? jQuery : null;
			if ($ && $.fn.selectric) {
				$(roSizeField).selectric('refresh');
			}
		}
		
		// Call RefreshForm to handle any additional refresh logic
		RefreshForm(fieldName);
	} catch (e) {
		console.error('Error in ResetSizesRefresh:', e);
	}
}

//
// General form refresh function
//
function RefreshForm( fieldName ) {
	try {
		// This function can be extended to handle specific refresh logic per field
		// For now, it's a placeholder that prevents errors
		// You can add auto-calculation or other logic here if needed
		
		// If jQuery and Selectric are available, refresh the select if needed
		if (fieldName) {
			var $ = (typeof jQuery !== 'undefined') ? jQuery : null;
			if ($ && $.fn.selectric) {
				var field = document.forms['windowbuilder'].elements[fieldName];
				if (field && field.tagName === 'SELECT') {
					$(field).selectric('refresh');
				}
			}
		}
	} catch (e) {
		console.error('Error in RefreshForm:', e);
	}
}

//
// Update size input fields based on NFS or RO selection
//
function UpdateSizeInput( type ) {
	try {
		var form = document.forms['windowbuilder'];
		if (!form) return;
		
		// Get the size input fields
		var widthField = form.elements['Width'];
		var widthSixteenthField = form.elements['WidthSixteenth'];
		var heightField = form.elements['Height'];
		var heightSixteenthField = form.elements['HeightSixteenth'];
		var roSizeField = form.elements['ROSize'];
		
		// Check if jQuery is available
		var $ = (typeof jQuery !== 'undefined') ? jQuery : null;
		
		if (type === 'NFS') {
			// Enable NFS (custom size) fields
			if (widthField) {
				widthField.disabled = false;
				widthField.removeAttribute('disabled');
			}
			if (widthSixteenthField) {
				widthSixteenthField.disabled = false;
				if ($ && $.fn.selectric) {
					$(widthSixteenthField).closest('.selectric-wrapper').removeClass('selectric-disabled');
					$(widthSixteenthField).selectric('refresh');
				}
			}
			if (heightField) {
				heightField.disabled = false;
				heightField.removeAttribute('disabled');
			}
			if (heightSixteenthField) {
				heightSixteenthField.disabled = false;
				if ($ && $.fn.selectric) {
					$(heightSixteenthField).closest('.selectric-wrapper').removeClass('selectric-disabled');
					$(heightSixteenthField).selectric('refresh');
				}
			}
			// Disable RO size dropdown
			if (roSizeField) {
				roSizeField.disabled = true;
				if ($ && $.fn.selectric) {
					$(roSizeField).selectric('refresh');
				}
			}
		} else if (type === 'RO') {
			// Disable NFS (custom size) fields
			if (widthField) {
				widthField.disabled = true;
				widthField.setAttribute('disabled', 'disabled');
			}
			if (widthSixteenthField) {
				widthSixteenthField.disabled = true;
				if ($ && $.fn.selectric) {
					$(widthSixteenthField).closest('.selectric-wrapper').addClass('selectric-disabled');
					$(widthSixteenthField).selectric('refresh');
				}
			}
			if (heightField) {
				heightField.disabled = true;
				heightField.setAttribute('disabled', 'disabled');
			}
			if (heightSixteenthField) {
				heightSixteenthField.disabled = true;
				if ($ && $.fn.selectric) {
					$(heightSixteenthField).closest('.selectric-wrapper').addClass('selectric-disabled');
					$(heightSixteenthField).selectric('refresh');
				}
			}
			// Enable RO size dropdown
			if (roSizeField) {
				roSizeField.disabled = false;
				roSizeField.removeAttribute('disabled');
				if ($ && $.fn.selectric) {
					$(roSizeField).selectric('refresh');
				}
			}
		}
	} catch (e) {
		console.error('Error in UpdateSizeInput:', e);
	}
}
