

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
