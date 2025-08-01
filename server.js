import express from "express";
import cors from "cors";
import path from "path";
import 'dotenv/config';
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 5000;

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(path.join(__dirname, 'src'));
app.use(cors());
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

var router = express.Router();
// simple logger for this router's requests
// all requests to this router will first hit this middleware
router.use(function(req, res, next) {
  if(req.url !== "/status"){
    console.log('%s %s', req.method, req.url);
  }
  next();
});

let returnUrl = process.env.BASE_URL + '/xml';//?device=#DEVICENAME#
let accessToken;

function returnXML(pagePrompt, defaultBadge){
  if(!pagePrompt){
    pagePrompt = "Enter Badge Number";
  }
  if(!defaultBadge){
    defaultBadge = "";
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <CiscoIPPhoneInput>
        <Title>${process.env.APP_TITLE}</Title>
        <Prompt>${pagePrompt}</Prompt>
        <URL>${returnUrl}/default</URL>
        <InputItem>
            <DisplayName>Badge</DisplayName>
            <QueryStringParam>badge</QueryStringParam>
            <DefaultValue>${defaultBadge}</DefaultValue>
            <InputFlags>N</InputFlags>
        </InputItem>
    </CiscoIPPhoneInput>
  `;
}

function returnText(responseText, prompt){
  let softKeyName = "Exit";
  let softKey = 'Init:Services'
  if(prompt){
    softKeyName = "Back";
    softKey = 'SoftKey:Exit';
  } else {
    prompt = '';
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <CiscoIPPhoneText>
        <Title>${process.env.APP_TITLE}</Title>
        <Prompt>${prompt}</Prompt>
        <Text>${responseText}</Text>
        <SoftKeyItem>
          <Name>${softKeyName}</Name>
          <URL>${softKey}</URL>
          <Position>4</Position>
        </SoftKeyItem>
      </CiscoIPPhoneText>
  `
}

function confirmXML(badge, name){
  if(name){
    name = name.replace(",","")
  }
  //<URL>${returnUrl}/punch?badge=${badge}</URL>
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <CiscoIPPhoneText>
        <Title>${process.env.APP_TITLE}</Title>
        <Prompt>Press Submit to confirm that you are</Prompt>
        <Text>${name}</Text>
      </CiscoIPPhoneText>
  `
}

async function authenticate(){
  let username = process.env.MY_USERNAME || process.env.USERNAME;
  let body = new URLSearchParams({
      'client_id':process.env.CLIENT_ID,
      'client_secret':process.env.CLIENT_SECRET,
      'username':username,
      'password':process.env.PASSWORD,
      'grant_type':process.env.GRANT_TYPE,
      'realm':process.env.REALM,
      'audience':process.env.AUDIENCE
  });
  console.log(body);
  let resp = await fetch(process.env.ROPCURL,{
    method: "POST",
    headers:{'Content-Type': 'application/x-www-form-urlencoded'},
    body: body
  });
  
  let json = await resp.json();
  if(json.access_token){
    console.log(`authenticate succeeded. expires_in:${json.expires_in}`);
    return json;
  } else {
    console.log('authenticate failed:', json);
    return null;
  }
}

async function getPerson(badge){
  let returnVal = {success:false, message:"Error"};
  try{
    let resp = await fetch(`${process.env.POST_URL}/api/v1/commons/persons/employee?person_number=${badge}`,{
      method: "GET",
      headers:{"Authorization":accessToken, "Content-Type":"application/json"}
    });
    console.log('getPerson response status:', resp.status);
    console.log('getPerson response statusText:', resp.statusText);
    returnVal.message = resp.statusText;
    let json = await resp.json();
    console.log('getPerson response json:', json);
    if(json.errorCode && json.message){
      returnVal.message = json.message;
      if(json.details){
        console.log(JSON.stringify(json.details, null, 2));
      }
    }
    if(resp.status >= 200 && resp.status < 300){
      returnVal.success = true;
      returnVal.message = json.employeeExtension?.fullName;
    }
  }catch(e){
    console.error("getPerson error:");
    console.error(e);
  }
  return returnVal
}

async function punch(badge){
  let returnVal = {success:false, message:"Error"};
  try{
    let now = new Date().toISOString();
    now = now.slice(0,19);
    let payload = {
        "punches": [{
                "punchDtm": now,
                "employee": {
                    "qualifier": badge
                }
            }]
    }
    console.log('accessToken', accessToken);
    console.log('punch payload:');
    console.log(JSON.stringify(payload, null, 2));
    let resp = await fetch(`${process.env.POST_URL}/api/v1/timekeeping/punches/import`,{
      method: "POST",
      headers:{"Authorization":accessToken, "Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    console.log('punch response status:', resp.status);
    console.log('punch response statusText:', resp.statusText);
    returnVal.message = resp.statusText;
    let json = await resp.json();
    console.log('punch response json:', JSON.stringify(json, null, 2));
    if(json.errorCode && json.message){
      returnVal.message = json.message;
      if(json.details){
        console.log(JSON.stringify(json.details, null, 2));
      }
    }
    if(resp.status >= 200 && resp.status < 300){
      returnVal.success = true;
    }
  }catch(e){
    console.error("punch error:");
    console.error(e);
  }
  return returnVal;
}

router.get('/', (req, res) => {
  console.log(req.headers);
  res.setHeader('Content-Type',"text/xml");
  let xmlResponse = returnXML();
  console.log(xmlResponse);
  res.send(xmlResponse);
});

router.get('/xml/:command', async (req, res) => {
  console.log(req.headers);
  let xmlResponse;
  console.log(req.path);
  console.log(req.query);
  if(req.query.badge){
    //let result = await punch(req.query.badge);
    if(req.params.command === "punch"){
      let result = await punch(req.query.badge);
      if(result['success']){
        if(true){
          xmlResponse = returnText(`Punch recorded for ${req.query.badge}`);
        } else {
          xmlResponse = returnText(`Punch recorded for ${req.query.badge}`);
        }
        
      } else {
        xmlResponse = returnText(result["message"], 'Error');
      }
    } else {
      let result = await getPerson(req.query.badge);
      if(result['success']){
        console.log(result);
        xmlResponse = confirmXML(req.query.badge, result["message"]);
      } else {
        xmlResponse = returnText(result["message"], 'Error');
      }
    }
  } else {
     xmlResponse = returnXML("ERROR: Badge number required.", req.query.badge);
  }
  console.log(xmlResponse);
  res.setHeader('Content-Type',"text/xml");
  res.send(xmlResponse);
});


app.use(`/`, router);
app.listen(port, async () => {
  let authentication = await authenticate();
  accessToken = authentication.access_token;
  let intervalTime = authentication.expires_in - 300; // refresh 5 minutes sooner than we need to (300 seconds)
  setInterval(async function(){
    let authentication = await authenticate();
    accessToken = authentication.access_token;
  },  intervalTime * 1000);//convert interval to miliseconds (* 1000)
  console.log(`listening on ${port}`);
});
