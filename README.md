# PhoneOS XML to JSON Gateway

Hosts a web based application to receive XML GET requests from Cisco phones using their PSKs, and passed the data as an HTTPS POST.

<!--## Demo-->
<!--[![Vidcast Overview](https://github.com/wxsd-sales/custom-pmr-pin/assets/19175490/4861e7cd-7478-49cf-bada-223b30810691)](https://app.vidcast.io/share/3f264756-563a-4294-82f7-193643932fb3)-->


## Getting Started

- Clone this repository:
- ```git clone https://github.com/wxsd-sales/phone-xml-json.git```

The web app can be hosted locally for testing.  However, you may want to deploy this to a webserver with an SSL certificate when going live.

## Installation

###  1. Set up the .env file
- a. Inside this project's root folder, rename the file ```.env.example``` to ```.env```
- b. In a text editor, open the ```.env```
- c. Choose a ```PORT``` or use the default port if you are not sure what to use.
- d. Change the ```APP_TITLE``` if you wish.  This will be displayed in the Application on the PhoneOS.
- e. Paste your base url for your server between the double quotes of ```BASE_URL=""```. If using an IP address, then this should include the port.  Examples:  
    - ```BASE_URL="https://subdomain.domain.com"```
    - ```BASE_URL="http://192.168.1.101:5000"```
- f. The current solution will also require values for the following variables, which are also listed in the ```.env.example```  
```
POST_URL=""
CLIENT_ID=""
CLIENT_SECRET=""
USERNAME=""
PASSWORD=""

ROPCURL=""
GRANT_TYPE=""
REALM=""
AUDIENCE=""
```
### 2.a. Run the widget webserver as a container (Docker) (recommended)

- If you prefer to run this through ```npm```, skip this step and proceed to 2.b.
- Otherwise, run the following commands from the terminal inside your project's root directory:
- `docker build -t phone-xml-json .`
- `docker run -p 5000:5000 -i -t phone-xml-json`
  - replace `5000` in both places with the ```PORT``` used in your `.env` file.  

### 2.b. Run the widget webserver (npm)
_Node.js version >= 21.5 must be installed on the system in order to run this through npm._

- It is recommended that you run this as a container (step 2.a.).
- If you do not wish to run the webserver as a container (Docker), proceed with this step:
- Inside this project on your terminal type: `npm install`
- Then inside this project on your terminal type: `npm run build`
- Then inside this project on your terminal type: `npm run dev`
- This should run the app on your ```PORT``` (from .env file)

### 3. Set the Programmable Softkeys (PSK) on the Phones

- a. I recommend testing that your ```BASE_URL``` returns XML before applying to your phones.  
- b. You can modify the ```nme``` in the string below so that the button label says something other than ```MyApp```.  
- c. Set the PSK for each phone to the following, where the ```url``` matches what you entered as the ```BASE_URL``` in your .env file.  
- Examples:  
    - ```fnc=xml;url=https://subdomain.domain.com/;nme=MyApp```
    - ```fnc=xml;url=http://192.168.1.101:5000/;nme=MyApp```
- Below are screenshot examples of how to set the PSKs for devices in Control Hub (Device Configuration):  
Cisco 8845:  
![Image](https://github.com/user-attachments/assets/f702030f-a6cb-4de6-8a2b-10dc02330395)
Cisco 9861:  
![Image](https://github.com/user-attachments/assets/9998ea5b-7efe-4b8a-bc83-dd5b88388398)  
**NOTE: PSK must be set to 'Enable: Yes' if the configuration option exists for that model**

**Additional Improvements:**

- You will almost certainly want to adjust the data that is being converted into your POST request.
- This will require changing the code in the function ```makePost()``` within the file [server.js](server.js)

  
## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.

## Disclaimer

<!-- Keep the following here -->  
Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex usecases, but are not Official Cisco Webex Branded demos.
 
 
## Support

Please contact the Webex SD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=PhoneXMLJSON) for questions. Or for Cisco internal, reach out to us on Webex App via our bot globalexpert@webex.bot & choose "Engagement Type: API/SDK Proof of Concept Integration Development". 
