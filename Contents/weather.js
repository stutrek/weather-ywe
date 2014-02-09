/*
	mini Weather
	Code & Images: Arlo Rose

	This Widget grabs the latest current weather data from weather.com and builds
	it into a nice little iconic representation.
	
	For more information about the services weather.com offers, visit their
	website at: <http://www.weather.com>

	
	(c) 2003 - 2004 Pixoria
*/

eval(runCommand("cat xmldom.js"));
function xmlError(str) { alert(str); };

function finish_fade() {
	now = Number( runCommand( "date +'%s'" ) );
	seconds = now - last_fetched;
	print( seconds );
	if( seconds > 600 ) {
		getMap();
	}
	main_window.shadow = 1;
	main_window.recalcShadow();
};
map_frame = new Frame();
map_frame.zOrder = 10;
map_frame.addSubview( map );
print( map_frame );
var fade_in = new FadeAnimation( map_frame, 255, 300, animator.kEaseIn, finish_fade );
var fade_out = new FadeAnimation( map_frame, 0, 300, animator.kEaseOut );


animator.start( fade_out );
/*	The partnerID and licenseID MUST NOT be used in 3rd party Widgets.
	If you make your own Weather Widget, please visit The Weather Channel at:
	http://www.weather.com/services/xmloap.html
	
	You'll need to sign up for an account, and make sure you abide by their
	license agreement.
*/

var partnerID = "1003725713";
var licenseID = "1729016d019d4a7d";

var urlData = "";
var url = new URL();
var oldUserCity;
var linkBackground = new Array();
var linkText = new Array();
hPlace = preferences.hPlacePref.value;
vPlace = preferences.vPlacePref.value;
var weatherConditions = null;


var globalWeather = "";
var showToolTips = preferences.showToolTips.value;


/*	The chooseCity function will look at changed preference data and if there are multiple
    options for the entered information, suggest which the user can choose from.
*/

function adjustBackground(){

	updateNow();
	
	//if (theCity.width > 35) {
	//	baseAddition = theCity.width - 35;	
	//} else {
	//	baseAddition = 0;
	//}
	
	//degreeSymShadow.hOffset = 45 //94 + baseAddition;
	//degreeSym.hOffset = 44 //93 + baseAddition;
	//theTempShadow.hOffset = 40 //89 + baseAddition;
	//theTemp.hOffset = hPlace + 9 //88 + baseAddition;
	//theCityShadow.hOffset = 92 + baseAddition;
	//theCity.hOffset = 91 + baseAddition;
	//backMiddle.width = 2 + baseAddition;
	//backRight.hOffset = 62 + baseAddition;
	//main_window.width = 101 + baseAddition;
}

function chooseCity(){

	var cityCheck = preferences.userDisplayPref.value;
	var idArray = new Array();
	var cityArray = new Array();
	var locationCount = 0;
	
	showToolTips = preferences.showToolTips.value;
	
	if (oldUserCity != cityCheck) {
	
		var searchResultsData = url.fetch("http://xoap.weather.com/search/search?where=" + escape(cityCheck));
	
		if (searchResultsData.length == "276"){
			alert("We were unable to find the city you entered.\n\nIf your city can't be found, try a entering a larger neighboring city.");
			preferences.userDisplayPref.value = oldUserCity;
			return;
		}
	
		if (urlData.length == 0 || urlData == "Could not load URL") {
			alert("We are unable to choose your city because we can't connect to The Weather Channel.\n\nPlease check your network connection or try again later.");
			preferences.userDisplayPref.value = oldUserCity;
			return;
		}
	
		var resultsXML = new XMLDoc(searchResultsData, xmlError);
		var resultsNode = resultsXML.docNode;
	
		if (resultsNode == null) {
			alert("There was a problem parsing search results.");
		} else {
			for (n = 0; n < resultsNode.children.length; n++) {
				if (resultsNode.children[n].tagName == "loc") {
					cityArray[locationCount] = resultsNode.children[n].getText();
					idArray[resultsNode.children[n].getText()] = resultsNode.children[n].getAttribute("id");
					++locationCount;
				}
			}
		}
	
		if (locationCount > 1) {		  
			var formFields = new Array();
			
			formFields[0] = new FormField();
			formFields[0].name = 'city_popup';
			formFields[0].title = 'Location:';
			formFields[0].type = 'popup';
			formFields[0].option = new Array();
	
			for (n = 0; n < locationCount; n++) {
				formFields[0].option[n] =  cityArray[n];
			}
				
			formFields[0].defaultValue = formFields[0].option[0];
			formFields[0].description = "Please choose the city closest to where you live.";
			
			formResults = form(formFields, 'Choose a City', 'Choose');
								
			if ( formResults != null ) {
				preferences.userDisplayPref.value = formResults[0].split(" (")[0];
				preferences.cityValPref.value = idArray[String(formResults[0])];
			}
		} else if (locationCount == 1) {
			preferences.userDisplayPref.value = cityArray[0].split(" (")[0];
			preferences.cityValPref.value = idArray[cityArray[0]];
		} else {
			alert("No results (problem with search data?)");
		}
		
		savePreferences();
	}
	updateWeather();

}

/*	The updateWeather function will look at the city and location XML blocks
	and display the temperature, an icon, and the city name that the data is
	associated with.	
*/
function updateWeather(){

	//getMap();
	var userCity = preferences.cityValPref.value;
	unitValue = (preferences.unitsPref.value == 1) ? "m" : "s";
	// licenseID expired after ~9 years. 11/13/11
	//urlData = url.fetch("http://xoap.weather.com/weather/local/" + userCity + "?cc=*&link=xoap&par=" + partnerID + "&key=" + licenseID + "&unit=" + unitValue);
	urlData = url.fetch("http://yahoowidget.weather.com/weather/local/" + userCity + "?cc=*&unit=" + unitValue);
	if (urlData.length == 0 || urlData == "Could not load URL") return;			
	urlData = urlData.replace(/[\r]*\n/g,"");
	globalWeather = "<weather> " + urlData.match(/<loc id(.*?)<\/loc>/g) + urlData.match(/<cc>(.*?)<\/cc>/g) + " </weather>";


	var xml = new XMLDoc(globalWeather, xmlError);

	var xmlFetchedTemp = xml.selectNode("/cc/tmp");
	var xmlFeelsTemp = xml.selectNode("/cc/flik");
	var xmlFetchedCity = xml.selectNode("/loc/dnam");
	var xmlFetchedConditions = xml.selectNode("/cc/icon");
	
	var xmlFetchedTextConditions = xml.selectNode("/cc/t");
	var xmlFetchedTime = xml.selectNode("/loc/tm");
	var xmlFetchedPresChange = xml.selectNode("/cc/bar/d");
	var xmlFetchedPressure = xml.selectNode("/cc/bar/r");
	var xmlFetchedVis = xml.selectNode("/cc/vis");
	var xmlFetchedDew = xml.selectNode("/cc/dewp");
	var xmlFetchedHmid = xml.selectNode("/cc/hmid");

	var xmlFetchedWindSpeed = xml.selectNode("/cc/wind/s");
	var xmlFetchedWindGust = xml.selectNode("/cc/wind/gust");
	var xmlFetchedWindDir = xml.selectNode("/cc/wind/t");

	var fetchedTemp = xmlFetchedTemp.getText();
	
	weatherConditions = xmlFetchedConditions.getText();
	displayIcons(xmlFetchedConditions.getText());			
						
	if (fetchedTemp == "N/A") fetchedTemp = "?";
	theTemp.data = theTempShadow.data = fetchedTemp;
	
	fetchedCity = xmlFetchedCity.getText();
	fetchedCity = fetchedCity.match(/([^,\/]*).*/);
	//theCity.data = theCityShadow.data = fetchedCity[1];
	
	unitTemp = (preferences.unitsPref.value == 1) ? "C" : "F";
	unitDistance = (preferences.unitsPref.value == 1) ? "Kilometers" : "Miles";
	unitSpeed = (preferences.unitsPref.value == 1) ? "km/h" : "mph";
	unitPres = (preferences.unitsPref.value == 1) ? "Millibars" : "Inches";
	unitMeasure = (preferences.unitsPref.value == 1) ? "Millimeters" : "Inches";	
	
	if ( xmlFetchedTextConditions.getText() == "N/A" ) {
		theCondition = "Unknown Weather Condition";
	} else {
		theCondition = xmlFetchedTextConditions.getText();
	}
	
	if ( xmlFeelsTemp.getText() == "N/A" ) {
		theFeelsLike = "";
	} else {
		theFeelsLike = "It feels like " + xmlFeelsTemp.getText() + "¡" + unitTemp + " outside.\n";
	}

	if ( xmlFetchedDew.getText() == "N/A" ) {
		theDewPoint = "Dew Point is Unknown";
	} else {
		theDewPoint = "Dew Point is " + xmlFetchedDew.getText() + "¡" + unitTemp;
	}

	if ( xmlFetchedHmid.getText() == "N/A" ) {
		theHumidity = "Humidity is Unknown";
	} else {
		theHumidity = "Humidity is " + xmlFetchedHmid.getText() + "%";
	}
	
	if (xmlFetchedVis.getText() == "Unlimited") {
		visData = "Unlimited Visibility";
	} else if (xmlFetchedVis.getText() == "N/A") {
		visData = "Visibility is Unknown";
	} else {
		visData = "Visibility is " + xmlFetchedVis.getText() + " " + unitDistance;
	}

	if (xmlFetchedPresChange.getText() == "steady" || xmlFetchedPresChange.getText() == "N/A") {
		presChange = "";
	} else {
		presChange = " and " + xmlFetchedPresChange.getText();
	}

	if ( xmlFetchedPressure.getText() == "N/A" ) {
		thePressure = "Pressure is Unknown";
	} else {
		thePressure = "Pressure is " + xmlFetchedPressure.getText() + " " + unitPres + presChange;
	}

	if (xmlFetchedWindDir.getText() == "CALM") {
		windData = "Calm Winds";
	} else {

		if 	(xmlFetchedWindDir.getText() == "VAR") {
		
			windData = "Variable winds ";
			
		} else {

			windData = "Wind from the ";
					
			if (xmlFetchedWindDir.getText().length == 1 || xmlFetchedWindDir.getText().length == 2) {
				dirArray = [xmlFetchedWindDir.getText()];
			} else {
				dirArray = [xmlFetchedWindDir.getText().substr(0,1), xmlFetchedWindDir.getText().substr(1,2)];
			}
			
			for (item in dirArray) {
				switch (dirArray[item]) {
					case "N":
						windData = windData + "North ";
						break;			
					case "S":
						windData = windData + "South ";
						break;			
					case "E":
						windData = windData + "East ";
						break;			
					case "W":
						windData = windData + "West ";
						break;			
					case "NE":
						windData = windData + "Northeast ";
						break;			
					case "SE":
						windData = windData + "Southeast ";
						break;			
					case "NW":
						windData = windData + "Northwest ";
						break;			
					case "SW":
						windData = windData + "Southwest ";
						break;			
				}
			
			}
			
		}
		
		windData = windData + "at " + xmlFetchedWindSpeed.getText() + " " + unitSpeed;
		
		if (xmlFetchedWindGust.getText() != "N/A"){
			windData = windData + "\nwith gusts up to " + xmlFetchedWindGust.getText() + " " + unitSpeed;
		}

	}	

	toolTipData =	theCondition + "\n" +
					theFeelsLike +
					"\n" +
					theDewPoint + "\n" +
					theHumidity + "\n" +
					visData + "\n" +
					thePressure + "\n" +
					windData + "\n" +
					"\n" +
					"Last update was at " + xmlFetchedTime.getText();
	
	if (showToolTips == 1) {
		Sun.tooltip = waterObject.tooltip = Cloud.tooltip = toolTipData;
	} else {
		Sun.tooltip = waterObject.tooltip = Cloud.tooltip = "";
	}
	adjustBackground();
}




function displayIcons(fetchedConditions){

	hPlace = Number(hPlace);
	vPlace = Number(vPlace);

	// Get everyone back to normal
	Sun.src = "Resources/Sun.png";
	Sun.opacity = 255;
	Sun.hOffset = hPlace;
	Sun.vOffset = vPlace;
        Sun.zOrder = 3;
	Cloud.opacity = 255;
	Cloud.src = "Resources/Smaller Clouds.png";
	Cloud.hOffset = hPlace + 13;
	Cloud.vOffset = vPlace + 17;
        Cloud.zOrder = 4;
	waterObject.opacity = 0;
	waterObject.hOffset = hPlace + 8;
	waterObject.vOffset = vPlace + 23;
        waterObject.zOrder = 5;

	switch (fetchedConditions){

		case "-":  // Unknown Weather
			Sun.src = "Resources/Unknown.png";
			Cloud.opacity = 0;
			break
			
		case "0":
		case "3":
		case "4":
		case "17":
		case "35": // Thunder Storms
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Thunder.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 6;
			waterObject.vOffset = vPlace + 25;
			break
			
		case "1":
		case "2":  // Windy Showers
			Sun.src = "Resources/Windy Rain.png";
			Cloud.opacity = 0;
			break
			
		case "5":
		case "7":  // Icy Snowy Rain
			Sun.opacity = 0;
			Cloud.src = "Resources/Clouds.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Icy Frozen Snow.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 1;
			waterObject.vOffset = vPlace + 27;
			break
			
		case "6":
		case "18": // Sleet
			Sun.opacity = 0;
			Cloud.src = "Resources/Clouds.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Sleet.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 8;
			waterObject.vOffset = vPlace + 28;
			break
		case "8":  // Icy Drizzle
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Icy Drizzle.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break
			
		case "9":  // Drizzle
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Drizzle.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break
		case "10": // Icy Rain
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Icy Rain.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 6;
			waterObject.vOffset = vPlace + 26;
			break
			
		case "11":
		case "40": // Showers
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Light Rain.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break
		case "12": // Rain
			Sun.opacity = 0;
			Cloud.src = "Resources/Rain Cloud.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Rain.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 6;
			waterObject.vOffset = vPlace + 26;
			break
			
		case "13": // Light Snow Flurries
			Sun.opacity = 0;
			Cloud.src = "Resources/Clouds.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Light Snow.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 3;
			waterObject.vOffset = vPlace + 28;
			break
			
		case "14": // Med Snow
			Sun.opacity = 0;
			Cloud.src = "Resources/Clouds.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Med Snow.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 28;
			break
			
		case "15":
		case "25": // Friged (Very Cold) (change?)
		case "43": // Blowing/Windy Snow
			Sun.src = "Resources/Windy Snow.png";
			Cloud.opacity = 0;
			break
			
		case "16":
		case "41":
		case "42": // Normal Snow
			Sun.opacity = 0;
			Cloud.src = "Resources/Clouds.png";
			Cloud.hOffset = hPlace + 3;
			Cloud.vOffset = vPlace + 6;
			waterObject.src = "Resources/Snow.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 2;
			waterObject.vOffset = vPlace + 26;
			break
			
		case "19": // Dust
			waterObject.src = "Resources/Dust.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 10;
			Sun.opacity = 0;
			Cloud.opacity = 0;
			break
			
		case "20": // Fog
			waterObject.src = "Resources/Fog.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 10;
			Sun.opacity = 0;
			Cloud.opacity = 0;
			break
			
		case "21": // Hazy
			waterObject.src = "Resources/Haze.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 10;
			Sun.opacity = 0;
			Cloud.opacity = 0;
			break
		case "22": // Smoke
			waterObject.src = "Resources/Smoke.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 10;
			Sun.opacity = 0;
			Cloud.opacity = 0;
			break
			
		case "23":
		case "24": // Windy
			Sun.src = "Resources/Wind.png";
			Cloud.opacity = 0;
			break
			
		case "26": // Cloudy (no sun/moon)
			Sun.opacity = 0;
			Cloud.opacity = 255;
			Cloud.hOffset = hPlace + 21;
			Cloud.vOffset = vPlace + 11;
			waterObject.src = "Resources/Clouds.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 12;
			break
			
		case "27": // Mostly Cloudy Night
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.opacity = 255;
			Cloud.hOffset = hPlace + 21;
			Cloud.vOffset = vPlace + 11;
			waterObject.src = "Resources/Clouds.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 12;
			break
			
		case "28": // Mostly Cloudy Day
			Cloud.opacity = 255;
			Cloud.hOffset = hPlace + 21;
			Cloud.vOffset = vPlace + 11;
			waterObject.src = "Resources/Clouds.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace;
			waterObject.vOffset = vPlace + 12;
			break
			
		case "29": // Partially Cloudy Night
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			break
			
		case "30": // Partially Cloudy Day
			// Looks like the default Widget state, no change.
			break
			
		case "31": // Clear Night
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.opacity = 0;
			break
			
		case "32": // Clear Day
			Sun.src = "Resources/Sun.png";
			Cloud.opacity = 0;
			break
			
		case "33": // Tiny bit of clouds at night
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.opacity = 100;
			break
			
		case "34": // Tiny bit of clouds during the day
			Sun.src = "Resources/Sun.png";
			Cloud.opacity = 100;
			Cloud.hOffset = hPlace + 13;
			Cloud.vOffset = vPlace + 17;
			break
			
		case "36": // Hot
			Sun.src = "Resources/Sun.png";
			Cloud.opacity = 0;
			break
			
		case "37":
		case "38": // Sunny Thunder Storm
			Cloud.src = "Resources/Smaller Rain Cloud.png";
			Cloud.hOffset = hPlace + 9;
			Cloud.vOffset = vPlace + 13;
			waterObject.src = "Resources/Thunder.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 9;
			waterObject.vOffset = vPlace + 25;
			break
			
		case "39": // Sunny Showers
			Cloud.src = "Resources/Smaller Rain Cloud.png";
			Cloud.hOffset = hPlace + 10;
			Cloud.vOffset = vPlace + 14;
			waterObject.src = "Resources/Light Rain.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break
			
		case "44": // Partially Cloudy Day
			// Looks like the default Widget state, no change.
			break
		
		case "45": // Night Rain
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.src = "Resources/Smaller Rain Cloud.png";
			Cloud.hOffset = hPlace + 10;
			Cloud.vOffset = vPlace + 14;
			waterObject.src = "Resources/Light Rain.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break

		case "46": // Night Snow
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.src = "Resources/Smaller Clouds.png";
			Cloud.hOffset = hPlace + 10;
			Cloud.vOffset = vPlace + 14;
			waterObject.src = "Resources/Light Snow.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 10;
			waterObject.vOffset = vPlace + 28;
			break
			
		case "47": // Night Thunder Storm
			Sun.src = "Resources/Moon.png";
			Sun.hOffset = hPlace + 1;
			Sun.vOffset = vPlace + 1;
			Cloud.src = "Resources/Smaller Rain Cloud.png";
			Cloud.hOffset = hPlace + 9;
			Cloud.vOffset = vPlace + 13;
			waterObject.src = "Resources/Thunder.png";
			waterObject.opacity = 255;
			waterObject.hOffset = hPlace + 9;
			waterObject.vOffset = vPlace + 25;
			break
			
		default:
			Sun.src = "Resources/Unknown.png";
			Cloud.opacity = 0;
			break
		
			}
			
	degreeSym.hOffset = hPlace + 44;
	degreeSym.vOffset = vPlace + 29;
	theTemp.hOffset = hPlace + 37;
	theTemp.vOffset = vPlace + 34;
	
	print("Sun hOffset =  " + Sun.hOffset);
	print("Sun vOffset =  " + Sun.vOffset);
	print("Cloud hOffset =  " + Cloud.hOffset);
	print("Cloud vOffset =  " + Cloud.vOffset);


}


// First time launch window positioning
if (main_window.hOffset == -1){
	main_window.hOffset = screen.availWidth - 190 + screen.availLeft;
	main_window.vOffset = screen.availHeight - 179;
}

function getMap()
{
	print( 'Getting Map' );
    var getImage = "curl " + preferences.mapURL.value + " --output Resources/Map.jpg";
    runCommand(getImage);
    map.reload();
	last_fetched = Number( runCommand( "date +'%s'" ) );
}

//the value of the preferences is 10 times what it should be.  I don't know why.
function moveIcon()
{
	if( hPlace != preferences.hPlacePref.value || vPlace != preferences.vPlacePref.value )
	{	
		print("hOffset = " + preferences.hPlacePref.value);
		print("vOffset = " + preferences.vPlacePref.value);
		hPlace = Number(preferences.hPlacePref.value);
		vPlace = Number(preferences.vPlacePref.value);
		displayIcons(weatherConditions);
	}
}
updateWeather();
main_window.visible = true;
last_fetched = 0;