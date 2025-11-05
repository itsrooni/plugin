var glb_numOfAttributeSets = 0;
var glb_attributeSets = new Array();
var glb_numOfAttributesInSet = new Array();
var glb_attributeSetDefaultValues = new Array();
var glb_firstUpdate = true;

var glb_windowImageName = "spacer.gif";


// ======== Attribute Object ========
//
function Attribute( name, value, fvalue, min, max, step, description, image ) {

	// Member variables
	this.m_name			= name;
	this.m_value		= value;
	this.m_fvalue		= fvalue;
	this.m_min			= min;
	this.m_max			= max;
	this.m_step			= step;
	this.m_description	= description;
	this.m_image		= image;
	
	
	// Array of Rules
	this.m_rules			= new Array();
	this.m_numOfRules		= 0;
}

// ======== Rule Object ========
//
function AttributeRule( datafield, operator, value, conjunction ) {

	// MEmber variables
	this.m_datafield	= datafield;
	this.m_operator		= operator;
	this.m_value		= value;
	this.m_conjunction	= conjunction;
}


//
// Suport Operations
//
function CreateAttributeSet( datafield, initValue ) 
{
	glb_attributeSets[datafield]				= new Array();
	glb_numOfAttributesInSet[datafield]			= 0;
	glb_attributeSetDefaultValues[datafield]	= initValue;
}

function AddAttribute( datafield, attribute )
{
	glb_attributeSets[datafield][glb_numOfAttributesInSet[datafield]++] = attribute;	
}

function AddRuleToAttribute( attribute, datafield, operator, value, conjunction ) {
	
	// Just add it to the rules list for the input attribute object
	attribute.m_rules[attribute.m_numOfRules++] = new AttributeRule( datafield, operator, value, conjunction );
}

function CheckRules ( attribute )
{
	if (attribute.m_numOfRules == 0) {
		return true; // On by default
	}

	//alert("CheckRules( " +attribute.m_name+ ", " +attribute.m_numOfRules+ " );");
	//return true;
	var result = true;
	var lastRuleField = "";
	var conjunct = "AND";	// Doesn't matter
	
	for (j=0; j<attribute.m_numOfRules; j++) {
	
		// Evaluate each rule
		var curResult = false;
		var curRule = attribute.m_rules[j];
		
		// Get value of the datafield
		var datafieldObj = eval( "document.windowbuilder." + curRule.m_datafield );
		
		if (!datafieldObj) {
			alert("Dang!..failed on " + curRule.m_datafield);
			return false;
		}
		var fieldValue = datafieldObj.value;
		
		// Fix the Last value if it's the first time thru
		if (lastRuleField == "") {
			lastRuleField = curRule.m_datafield;
		}
	
			
	
		// Dispatch on the Operator
		curResult = false;
		if (curRule.m_operator == "=") {
		
			if (fieldValue == curRule.m_value) {
				//alert(attribute.m_name + " failed on " +curRule.m_datafield+ curRule.m_operator + curRule.m_value);
				curResult = true;
			}
		}
		else if (curRule.m_operator == "!=") {
		
			if (fieldValue != curRule.m_value) {
				//alert(attribute.m_name + " failed on " +curRule.m_datafield+ curRule.m_operator + curRule.m_value);
				curResult = true;
			}
		}
		else if (curRule.m_operator == "<") {
		
			if (fieldValue < curRule.m_value) {
				curResult = true;
			}
		}
		else if (curRule.m_operator == "<=") {
		
			if (fieldValue <= curRule.m_value) {
				curResult = true;
			}
		}
		else if (curRule.m_operator == ">") {
		
			if (fieldValue > curRule.m_value) {
				curResult = true;
			}
		}
		else if (curRule.m_operator == ">=") {
		
			if (fieldValue >= curRule.m_value) {
				curResult = true;
			}
		}
		else {
		
			// invalid operator..it's a no go
			//return false;
		}
		
		// Update the End Result
		if (j == 0) {
			// First time
			result = curResult;		// It is what it is
		}
		else if (conjunct == "AND") {			
			result = result && curResult;
		}
		else if (conjunct == "OR") {
			result = result || curResult; 
		}
		
		conjunct		= curRule.m_conjunction;
		lastRuleField = curRule.m_datafield;
		
	}
	
	// Return whatever we got
	return !result;
}

function GetFieldValue( datafield ) 
{
	var datafieldObj = eval( "document.windowbuilder." + datafield );
	
	if (!datafieldObj) {
		return "";
	}
	
	// OK, return the value
	return datafieldObj.value;
}

function UpdateDataFieldOptions( datafield ) 
{
	//alert("UpdateDataFieldOptions( "+datafield+ " );");
	
	// First get the current Value
	var datafieldObj = eval( "document.windowbuilder." + datafield );
	
	if (!datafieldObj) {
		alert("An Error has occurred finding the " +datafield+ " form input object\n");
		return;
	}
	var curValue = datafieldObj.value;
	//alert (curValue );
	
	// OK to set value
	var okToSetValue = false;
	
	
	// Remove everything from the list
	/*
	var len = glb_numOfAttributesInSet[datafield];
	for (i=0; i<len; i++) {
		datafieldObj.options[i] = null;
	}
	*/
	datafieldObj.options.length = 0;
	//datafieldObj.options = null;
	
	
	// Now let's insert what should be inserted
	var numOfAttributes = glb_numOfAttributesInSet[datafield];
	var addCount = 0;
	//alert(datafield + " - inserting " + numOfAttributes);
	for (i=0; i<numOfAttributes; i++) {
	
		// Add it to the datafieldObj
		var curAttribute = glb_attributeSets[datafield][i];	
		
		// Check Rules
		if (CheckRules( curAttribute )) {
		
			//alert( "adding to select object" );
			// Add it to the <select> object
			datafieldObj.options[addCount++] =  new Option( curAttribute.m_name, curAttribute.m_value );
			//alert( "check" );
			//datafieldObj.add( newOption )		
			
			//alert ( "it got added" );	
			
			// Check if the last value still exists in there
			//if ((curAttribute.m_value == curValue) || (i==0) { // or 1st one by default
			if ((curAttribute.m_value == curValue)) { 
				okToSetValue = true;
			}
		}
	
	}	
	
	//alert(" done adding things ");
	
	// Set the value back to what it was, if that's ok to do so
	if (glb_firstUpdate) {
		if (glb_attributeSetDefaultValues[datafield] != "") {
			datafieldObj.value = glb_attributeSetDefaultValues[datafield];
		}
	}
	else if (okToSetValue) {
		datafieldObj.value = curValue;
	}
}

function UpdateCheckBox( datafield ) 
{
	
	// First get the current Value
	var datafieldObj = eval( "document.windowbuilder." + datafield );
	
	if (!datafieldObj) {
		alert("An Error has occurred finding the " +datafield+ " form input object\n");
		return;
	}
	var curValue = datafieldObj.value;
	
	var forceDisable = false;
	
	
	// Now let's insert what should be inserted
	var validRuleCount = 0;
	var numOfAttributes = glb_numOfAttributesInSet[datafield];
	for (i=0; i<numOfAttributes; i++) {
	
		// Add it to the datafieldObj
		var curAttribute = glb_attributeSets[datafield][i];	
		
		
		// Check Rules
		if (CheckRules( curAttribute )) {
		
			// We may need to force an option
			if (curAttribute.m_description == "disabled_on") {
				datafieldObj.checked  = true;
				datafieldObj.disabled = true;
				forceDisable = true;
			}
			else if (curAttribute.m_description == "disabled_off") {
				datafieldObj.checked  = false;
				datafieldObj.disabled = true;
				forceDisable = true;
			}
		
			// Add it to the <select> object
			validRuleCount++;			
		}
	
	}	
	
	
	// Disable if we only have one option
	if (validRuleCount <= 0) {
		datafieldObj.disabled = true;
	}
	else if (forceDisable == false) {
	
		if (datafieldObj.disabled == true) {
		
			datafieldObj.checked	= false; // make sure we uncheck it if it was forced on
			datafieldObj.disabled	= false;
		}
	}
}

function UpdateWindowImage()
{

	// Create the new image path
	var subType = GetFieldValue("sub_type");
	
	if ((subType == null) || (subType == ""))
	{
		imgPath = "images/spacer.gif";
	}

	// swap the image
	document.images["windowimage"].src = "Images/attrib_images/" + glb_windowImageName;
}

function UpdateAllOptions() {
	
	/*
	// Update Select Options
	//UpdateDataFieldOptions("job");
	//UpdateDataFieldOptions("order");
	UpdateDataFieldOptions("frame");
	UpdateDataFieldOptions("glaze");
	UpdateDataFieldOptions("finish");
	UpdateDataFieldOptions("type");
	UpdateDataFieldOptions("sub_type");
	UpdateDataFieldOptions("size");
	//UpdateDataFieldOptions("grid");
	UpdateDataFieldOptions("glass");
	*/
	
	UpdateWindowImage();
	UpdateWidthAndHeight();
	
	/*
	// Update all the Checkboxes
	UpdateCheckBox("glass_tempered");
	UpdateCheckBox("glass_dualseal");
	UpdateCheckBox("glass_low_e");
	UpdateCheckBox("glass_arg");
	UpdateCheckBox("other_zbar");
	UpdateCheckBox("other_nonailfin");
	UpdateCheckBox("other_slopedsilladapter");
	UpdateCheckBox("other_brickmold");
	
	// Hide the total, if this isn't first init, because it's no longer valid since something changed
	if (!glb_firstUpdate) {
		SetVisibility( "total1", false );
		SetVisibility( "total2", false );
		SetVisibility( "save_estimate1", false );
		SetVisibility( "save_estimate2", false );
	}
	
	// Hide or show the Custom size input fields as appropriate
	if (GetFieldValue("size") == "CUSTOM") {
		SetVisibility( "custom_size_inputfields", true );
	}
	else {
		SetVisibility( "custom_size_inputfields", false );
	}
	
	
	// MAke sure we note that it's not the first time anymore
	glb_firstUpdate = false;
	
	
	*/
	
	// Temp
	/***
	alert("Frame is " + GetFieldValue("frame"));
	alert("Type is " + GetFieldValue("type"));
	alert("Sub-Type is " + GetFieldValue("sub_type"));
	***/
	
	
	
}

function UpdateWidthAndHeight() {

	var setsize = glb_numOfAttributesInSet["size"];
	
	for (var k=0; k<setsize; k++) {
	
		var curAttribute = glb_attributeSets["size"][k];
		if (curAttribute.m_value == document.windowbuilder.size.value) {
		
			// Found it
			document.windowbuilder.width.value = curAttribute.m_min;
			document.windowbuilder.height.value = curAttribute.m_max;
			document.windowbuilder.width_sixteenth.value = 0;
			document.windowbuilder.height_sixteenth.value = 0;
			return;
		}
	}
	
	// I guess we didn't find the right one, let's just set to zero
	document.windowbuilder.width.value = "0";
	document.windowbuilder.height.value = "0";

}

